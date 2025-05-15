import React, { useState } from "react";
import Head from "next/head";
import cheerio from "cheerio";

// Função para pegar o preço FIPE a partir da página do anúncio OLX
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

    // Pegar o JSON embutido na página
    const jsonText = $('script[type="application/ld+json"]').html();

    if (!jsonText) return null;

    // Parse do JSON
    const jsonData = JSON.parse(jsonText);

    // A FIPE pode estar em "offers.priceSpecification" ou "priceSpecification" em outros locais
    // Vamos procurar por priceSpecification com tipo PriceSpecification e atributo "name" contendo "FIPE"
    let precoFipe = null;

    // Tentar acessar o campo direto
    if (jsonData.offers && jsonData.offers.priceSpecification) {
      const ps = jsonData.offers.priceSpecification;
      if (Array.isArray(ps)) {
        for (const p of ps) {
          if (
            p.name &&
            p.name.toLowerCase().includes("fipe") &&
            p.price
          ) {
            precoFipe = parseInt(p.price, 10);
            break;
          }
        }
      } else {
        if (
          ps.name &&
          ps.name.toLowerCase().includes("fipe") &&
          ps.price
        ) {
          precoFipe = parseInt(ps.price, 10);
        }
      }
    }

    // Caso não tenha encontrado, tentar preço da FIPE em outras propriedades do JSON
    if (!precoFipe && jsonData.fipePrice) {
      precoFipe = parseInt(jsonData.fipePrice, 10);
    }

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

    // Validar links e pegar preço FIPE em paralelo
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
  const [margem, setMargem] = React.useState(4000);

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
