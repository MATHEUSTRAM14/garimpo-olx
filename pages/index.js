import React from "react";
import Head from "next/head";

// Código executado no servidor toda vez que a página for acessada
export async function getServerSideProps() {
  const response = await fetch(
    "https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-pr",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36",
      },
    }
  );

  const html = await response.text();
  const carros = [];

  const cheerio = require("cheerio");
  const $ = cheerio.load(html);

  $("li.sc-1fcmfeb-2").each((_, el) => {
    const titulo = $(el).find("h2").text().trim();
    const preco = $(el).find("p.sc-ifAKCX.eoKYee").text().trim();
    const link = $(el).find("a").attr("href");
    const imagem = $(el).find("img").attr("src") || $(el).find("img").attr("data-src");

    if (titulo && preco && link && imagem) {
      carros.push({
        titulo,
        preco,
        linkOLX: "https://www.olx.com.br" + link,
        foto: imagem,
        localizacao: "PR",
      });
    }
  });

  return {
    props: { carros },
  };
}

// Componente principal
export default function Home({ carros }) {
  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <Head>
        <title>Garimpo OLX</title>
      </Head>
      <h1>Carros no Paraná (OLX)</h1>

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
            }}
          >
            <a href={carro.linkOLX} target="_blank" rel="noreferrer">
              <img
                src={carro.foto}
                width={200}
                style={{ float: "left", marginRight: 20 }}
                alt={carro.titulo}
              />
              <h2>{carro.titulo}</h2>
              <p>{carro.preco}</p>
              <p>{carro.localizacao}</p>
            </a>
            <div style={{ clear: "both" }}></div>
          </div>
        ))
      )}
    </div>
  );
}
