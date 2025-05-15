import React, { useState } from "react";
import Head from "next/head";
import cheerio from "cheerio";

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

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const carros = [];

    $("li.sc-1fcmfeb-2").each((_, el) => {
      const titulo = $(el).find("h2").text().trim();
      const precoTexto = $(el).find("p.sc-ifAKCX.eoKYee").text().trim();
      const link = $(el).find("a").attr("href");
      const imagem =
        $(el).find("img").attr("src") || $(el).find("img").attr("data-src");

      // Exemplo de seletor para preço FIPE — ajustar se precisar
      // Geralmente a OLX mostra preço FIPE em um span ou div com algum texto "Preço FIPE"
      // Vou tentar pegar um texto que contenha "FIPE" e extrair o valor numérico
      let precoFipeTexto = "";

      // Procura qualquer texto dentro do anúncio que contenha "FIPE"
      $(el)
        .find("*")
        .each((_, elem) => {
          const text = $(elem).text();
          if (text.toLowerCase().includes("fipe")) {
            precoFipeTexto = text.replace(/[^\d]/g, "");
            return false; // para o each
          }
        });

      const preco = parseInt(precoTexto.replace(/[^\d]/g, ""), 10);
      const precoFipe = precoFipeTexto ? parseInt(precoFipeTexto, 10) : null;

      if (titulo && preco && link && imagem && precoFipe) {
        carros.push({
          titulo,
          preco,
          precoFipe,
          linkOLX: link.startsWith("http") ? link : "https://www.olx.com.br" + link,
          foto: imagem,
          localizacao: "PR",
        });
      }
    });

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

  const margensDisponiveis = [];
  for (let i = 2000; i <= 30000; i += 1000) {
    margensDisponiveis.push(i);
  }

  const carrosFiltrados = carros.filter(
    (carro) => carro.precoFipe - carro.preco >= margem
  );

  return (
    <>
      <Head>
        <title>Garimpo OLX - Carros PR</title>
      </Head>
      <main style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
        <h1>Carros à venda no Paraná (OLX)</h1>

        <label htmlFor="margem">
          Margem mínima abaixo da FIPE:{" "}
          <select
            id="margem"
            value={margem}
            onChange={(e) => setMargem(Number(e.target.value))}
          >
            {margensDisponiveis.map((val) => (
              <option key={val} value={val}>
                R$ {val.toLocaleString("pt-BR")}
              </option>
            ))}
          </select>
        </label>

        {carrosFiltrados.length === 0 ? (
          <p>Nenhum carro encontrado com essa margem.</p>
        ) : (
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
              <a
                href={carro.linkOLX}
                target="_blank"
                rel="noreferrer"
                style={{ flexShrink: 0 }}
              >
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
                  <strong>Preço anúncio:</strong>{" "}
                  R$ {carro.preco.toLocaleString("pt-BR")}
                </p>
                <p>
                  <strong>Preço FIPE:</strong>{" "}
                  R$ {carro.precoFipe.toLocaleString("pt-BR")}
                </p>
                <p>
                  <strong>Margem:</strong>{" "}
                  R$ {(carro.precoFipe - carro.preco).toLocaleString("pt-BR")}
                </p>
                <p>
                  <strong>Localização:</strong> {carro.localizacao}
                </p>
              </div>
            </div>
          ))
        )}
      </main>
    </>
  );
}
