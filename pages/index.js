import React, { useEffect, useState } from 'react';
export default function Home() {
  const [data, setData] = useState([]);
  const [maxPrice, setMaxPrice] = useState('60000');
  const [minMargem, setMinMargem] = useState('4000');

  useEffect(() => {
    fetch('/api/carros.json')
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  const filtered = data
    .filter(car => parseInt(car.preco) <= parseInt(maxPrice))
    .filter(car => (car.fipe - car.preco) >= parseInt(minMargem))
    .sort((a, b) => (b.fipe - b.preco) - (a.fipe - a.preco));

  return (
    <div>
      <h1>Garimpo OLX</h1>
      <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      <input value={minMargem} onChange={(e) => setMinMargem(e.target.value)} />
      <ul>
        {filtered.map((car, idx) => (
          <li key={idx}>
            <strong>{car.titulo}</strong> - Preço: R$ {car.preco} - FIPE: R$ {car.fipe} - Dif: R$ {car.fipe - car.preco}
          </li>
        ))}
      </ul>
    </div>
  );
}
