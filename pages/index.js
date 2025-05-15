import React, { useState } from "react";

export default function Home() {
  const [fipe, setFipe] = useState("");
  const [km, setKm] = useState("");

  const carros = [
    {
      id: 1,
      titulo: "Ford Ka 2018",
      preco: 45000,
      km: 35000,
      margem: 4000,
      localizacao: "Curitiba - PR",
      foto: "https://img.olx.com.br/images/96/963193611884188.jpg",
      linkOLX: "https://www.olx.com.br/d/anuncio/ford-ka-2018-curitiba-ID12345678",
    },
    {
      id: 2,
      titulo: "Chevrolet Onix 2019",
      preco: 55000,
      km: 20000,
      margem: 5000,
      localizacao: "Londrina - PR",
      foto: "https://img.olx.com.br/images/03/039107317560624.jpg",
      linkOLX: "https://www.olx.com.br/d/anuncio/onix-2019-londrina-ID87654321",
    },
    {
      id: 3,
      titulo: "Hyundai HB20 2017",
      preco: 48000,
      km: 42000,
      margem: 3000,
      localizacao: "Maringá - PR",
      foto: "https://img.olx.com.br/images/04/041054701860331.jpg",
      linkOLX: "https://www.olx.com.br/d/anuncio/hb20-2017-maringa-ID99887766",
    }
  ];

  const carrosFiltrados = carros.filter(
    (carro) =>
      carro.localizacao.includes("PR") &&
      (fipe === "" || carro.preco <= Number(fipe)) &&
      (km === "" || carro.km <= Number(km))
  );

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <h1>Garimpo OLX</h1>
      <input
        placeholder="Preço FIPE"
        value={fipe}
        onChange={(e) => setFipe(e.target.value)}
        style={{ marginRight: 10 }}
        type="number"
      />
      <input
        placeholder="Quilometragem Máx."
        value={km}
        onChange={(e) => setKm(e.target.value)}
        type="number"
      />

      <div style={{ marginTop: 20 }}>
        {carrosFiltrados.map((carro) => (
          <div
            key={carro.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <img
              src={carro.foto}
              alt={carro.titulo}
              style={{ width: 150, height: "auto", float: "left", marginRight: 20 }}
            />
            <div>
              <a href={carro.linkOLX} target="_blank" rel="noopener noreferrer">
                <h2>{carro.titulo}</h2>
              </a>
              <p>Localização: {carro.localizacao}</p>
              <p>Preço FIPE: R$ {carro.preco.toLocaleString()}</p>
              <p>Quilometragem: {carro.km.toLocaleString()} km</p>
              <p>Margem de Revenda: R$ {carro.margem.toLocaleString()}</p>
            </div>
            <div style={{ clear: "both" }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}

