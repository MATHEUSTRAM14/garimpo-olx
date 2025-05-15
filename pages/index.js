
import React, { useState } from "react";

export default function Home() {
  const [fipe, setFipe] = useState("");
  const [km, setKm] = useState("");

  // Exemplo de dados estáticos de carros (em app real viria da API)
  const carros = [
    {
      id: 1,
      titulo: "Ford Ka 2018",
      preco: 45000,
      km: 35000,
      margem: 4000,
      foto: "https://cdn.olx.com.br/images/76/765967088687247.jpg",
      linkOLX: "https://www.olx.com.br/veiculo/ford-ka-2018",
    },
    {
      id: 2,
      titulo: "Chevrolet Onix 2019",
      preco: 55000,
      km: 20000,
      margem: 5000,
      foto: "https://cdn.olx.com.br/images/76/765967088687248.jpg",
      linkOLX: "https://www.olx.com.br/veiculo/chevrolet-onix-2019",
    },
  ];

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
        {carros
          .filter(
            (carro) =>
              (fipe === "" || carro.preco <= Number(fipe)) &&
              (km === "" || carro.km <= Number(km))
          )
          .map((carro) => (
            <div
              key={carro.id}
              style={{
                display: "flex",
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: 10,
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <img
                src={carro.foto}
                alt={carro.titulo}
                style={{ width: 120, borderRadius: 6, marginRight: 20 }}
              />
              <div>
                <a
                  href={carro.linkOLX}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: "bold", fontSize: 18, color: "#0070f3" }}
                >
                  {carro.titulo}
                </a>
                <p>Preço FIPE: R$ {carro.preco.toLocaleString()}</p>
                <p>Quilometragem: {carro.km.toLocaleString()} km</p>
                <p>Margem de Revenda: R$ {carro.margem.toLocaleString()}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
