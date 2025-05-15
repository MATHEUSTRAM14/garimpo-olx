import React, { useState, useEffect } from "react";
import Head from "next/head";
import cheerio from "cheerio";

// Função para pegar preço FIPE no anúncio individual
async function pegarPrecoFipeDoAnuncio(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Seleciona o preço FIPE — confirme o seletor pois pode mudar
    const precoFipeTexto = $('[data-testid="price-fipe-value"]').text() || "";
    const precoFipe = parseInt(precoFipeTexto.replace(/[^\d]/g, ""), 10);

    return precoFipe || null;
  } catch {
    return null;
  }
}

async function linkValido(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

// Convert string preço "R$ 45.000" para número 45000
function parsePreco(precoStr) {
  if (!precoStr) return null;
  const precoNum = parseInt(precoStr.replace(/[^\d]/g, ""), 10);
  return isNaN(precoNum) ? null : precoNum;
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

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const rawCarros = [];

    $("li.sc-1fcmfeb-2").each((_, el) => {
      const titulo = $(el).find("h2").text().trim();
      const preco = $(el).find("p.sc-ifAKCX.eoKYee").text().trim();
      const link = $(el).find("a").attr("href");
      const imagem =
        $(el).find("img").attr("src") || $(el).find("img").attr("data-src");

      if (titulo && preco && link && imagem) {
        const linkOLX = link.startsWith("http")
          ? link
          : "https://www.olx.com.br" + link;
        rawCarros.push({
          titulo,
          preco,
          linkOLX,
          foto: imagem,
          localizacao: "PR",
          precoNum: parsePreco(preco),
        });
      }
    });

    // Valida links e pega preco FIPE de cada anúncio
    const carrosComFipe = await Promise.all(
      rawCarros.map(async (carro) => {
        const valido = await linkValido(carro.linkOLX);
        if (!valido) return null;
        const precoFipe = await pegarPrecoFipeDoAnuncio(carro.linkOLX);
        if (!precoFipe) return null;
        return { ...carro, precoFipe };
      })
    );

    const carros = carrosComFipe.filter(Boolean);

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

  // Filtra carros com margem mínima abaixo da FIPE
  const carrosFiltrados = carros.filter(
    (carro) =>
      carro.precoNum !== null &&
      carro.precoFipe !== null &&
      carro.precoFipe - carro.precoNum >= margem
  );

  return (
    <>
      <Head>
        <title>Garimpo OLX - Carros PR</title>
      </Head>
      <main style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
        <h1>Carros à venda no Paraná (OLX)</h1>

        <label>
          Margem mínima abaixo da FIPE:{" "}
          <select
            value={margem}
            onChange={(e) => setMargem(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 29 }, (_, i) => (i + 2) * 1000).map((v) => (
              <option key={v} value={v}>
                R$ {v.toLocaleString("pt-BR")}
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
                  {carro.precoNum.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                <p>
                  <strong>Preço FIPE:</strong>{" "}
                  {carro.precoFipe.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                <p>
                  <strong>Margem:</strong>{" "}
                  {(carro.precoFipe - carro.precoNum).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
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
