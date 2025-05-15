import React, { useState, useEffect } from "react";
import Head from "next/head";
import cheerio from "cheerio";

// Parse preco em número
function parsePreco(precoStr) {
  return parseInt(precoStr.replace(/[^\d]/g, "")) || 0;
}

// Função simples para extrair marca, modelo e ano do título (exemplo básico)
function extrairDadosTitulo(titulo) {
  // EXEMPLO SIMPLIFICADO, você pode melhorar depois
  // Exemplo: "Ford Ka 2015" -> { marca: "ford", modelo: "ka", ano: "2015" }
  const regex = /(\d{4})/; // pega o ano
  const ano = titulo.match(regex)?.[0] || "";
  const palavras = titulo.toLowerCase().split(" ");
  // Marca: primeira palavra
  const marca = palavras[0] || "";
  // Modelo: segunda palavra (se existir)
  const modelo = palavras[1] || "";

  return { marca, modelo, ano };
}

// Consulta API FIPE para preço do carro
async function consultarPrecoFipe(marca, modelo, ano) {
  try {
    // Buscar código da marca
    let res = await fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas");
    const marcas = await res.json();
    const marcaObj = marcas.find((m) => m.nome.toLowerCase() === marca.toLowerCase());
    if (!marcaObj) return null;

    // Buscar modelos da marca
    res = await fetch(
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaObj.codigo}/modelos`
    );
    const modelosData = await res.json();
    const modeloObj = modelosData.modelos.find(
      (m) => m.nome.toLowerCase() === modelo.toLowerCase()
    );
    if (!modeloObj) return null;

    // Buscar anos do modelo
    res = await fetch(
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaObj.codigo}/modelos/${modeloObj.codigo}/anos`
    );
    const anos = await res.json();
    // O código do ano pode ser ex: "2015-1"
    // Vamos buscar o que contenha o ano exato
    const anoObj = anos.find((a) => a.nome.includes(ano));
    if (!anoObj) return null;

    // Buscar preço do veículo
    res = await fetch(
      `https://parallelum.com.br/fipe/api/v1/carros/marcas/${marcaObj.codigo}/modelos/${modeloObj.codigo}/anos/${anoObj.codigo}`
    );
    const dados = await res.json();

    // Valor vem com R$ e vírgula, exemplo: "R$ 45.000,00"
    const valorNum = parsePreco(dados.Valor);

    return valorNum;
  } catch {
    return null;
  }
}

// Verifica se o link está no ar (HEAD)
async function linkValido(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getServerSideProps() {
  try {
    const response = await fetch(
      "https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-pr",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36",
        },
      }
    );

    if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    const rawCarros = [];

    $("li.sc-1fcmfeb-2").each((_, el) => {
      const titulo = $(el).find("h2").text().trim();
      const preco = $(el).find("p.sc-ifAKCX.eoKYee").text().trim();
      const link = $(el).find("a").attr("href");
      const imagem = $(el).find("img").attr("src") || $(el).find("img").attr("data-src");

      if (titulo && preco && link && imagem) {
        const linkOLX = link.startsWith("http") ? link : "https://www.olx.com.br" + link;
        rawCarros.push({
          titulo,
          preco,
          precoNum: parsePreco(preco),
          linkOLX,
          foto: imagem,
          localizacao: "PR",
        });
      }
    });

    // Valida links com status 200
    const carrosValidados = await Promise.all(
      rawCarros.map(async (carro) => (await linkValido(carro.linkOLX)) ? carro : null)
    );

    const carros = carrosValidados.filter(Boolean);

    return {
      props: { carros },
    };
  } catch (error) {
    console.error("Erro ao buscar dados da OLX:", error);
    return {
      props: { carros: [] },
    };
  }
}

export default function Home({ carros }) {
  const [margem, setMargem] = useState(4000);
  const [carrosFiltrados, setCarrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function filtrarComFipe() {
      setLoading(true);
      const listaFiltrada = [];

      for (const carro of carros) {
        const { marca, modelo, ano } = extrairDadosTitulo(carro.titulo);

        if (!marca || !modelo || !ano) continue;

        const precoFipe = await consultarPrecoFipe(marca, modelo, ano);
        if (!precoFipe) continue;

        const margemFipe = precoFipe - carro.precoNum;

        if (margemFipe >= margem) {
          listaFiltrada.push({ ...carro, precoFipe, margemFipe });
        }
      }

      setCarrosFiltrados(listaFiltrada);
      setLoading(false);
    }

    filtrarComFipe();
  }, [margem, carros]);

  return (
    <>
      <Head>
        <title>Garimpo OLX - Carros PR</title>
      </Head>
      <main style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
        <h1>Carros à venda no Paraná (OLX)</h1>

        <label>
          Margem mínima abaixo da FIPE:
          <select
            value={margem}
            onChange={(e) => setMargem(Number(e.target.value))}
            style={{ marginLeft: 10, marginBottom: 20 }}
          >
            {[...Array(29)].map((_, i) => {
              const val = (i + 2) * 1000;
              return (
                <option key={val} value={val}>
                  R$ {val.toLocaleString()}
                </option>
              );
            })}
          </select>
        </label>

        {loading && <p>Carregando dados FIPE e filtrando...</p>}

        {!loading && carrosFiltrados.length === 0 && (
          <p>Nenhum carro encontrado com essa margem.</p>
        )}

        {!loading &&
          carrosFiltrados.map((carro, index) => (
            <div
              key={index}
              style={{
                marginBottom: 20,
                borderBottom: "1px solid #ccc",
                paddingBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <a href={carro.linkOLX} target="_blank" rel="noreferrer">
                <img
                  src={carro.foto}
                  alt={carro.titulo}
                  width={150}
                  height={100}
                  style={{ objectFit: "cover" }}
                />
              </a>
              <div>
                <a
                  href={carro.linkOLX}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none", color: "#0070f3" }}
                >
                  <h2>{carro.titulo}</h2>
                </a>
                <p>
                  <strong>Preço:</strong> R$ {carro.precoNum.toLocaleString()}
                </p>
                <p>
                  <strong>Preço FIPE:</strong> R$ {carro.precoFipe.toLocaleString()}
                </p>
                <p>
                  <strong>Margem:</strong> R$ {carro.margemFipe.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
      </main>
    </>
  );
}
