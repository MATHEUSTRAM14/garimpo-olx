
import React from "react";
import Head from "next/head";
import cheerio from "cheerio";

// Função para testar se o link ainda está no ar
async function linkValido(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
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
        });
      }
    });

    // Valida links com status 200
    const carrosValidados = await Promise.all(
      rawCarros.map(async (carro) => {
        const valido = await linkValido(carro.linkOLX);
        return valido ? carro : null;
      })
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
  return (
    <>
      <Head>
        <title>Garimpo OLX - Carros PR</title>
      </Head>
      <main style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
        <h1>Carros à venda no Paraná (OLX)</h1>
        {carros.length === 0 ? (
          <p>Nenhum carro encontrado no momento.</p>
        ) : (
          carros.map((carro, index) => (
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
                  <strong>Preço:</strong> {carro.preco}
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
