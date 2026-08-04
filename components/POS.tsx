"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function POS() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    let { data, error } = await supabase.from("productos").select("*");
    if (error) console.error(error);
    else setProducts(data);
  }

  function addToCart(product) {
    setCart([...cart, product]);
  }

  const filteredProducts = products.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_barras?.toString().includes(search)
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Punto de Venta</h1>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar producto por nombre o código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <div className="grid grid-cols-2 gap-6">
        {/* Productos */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Productos</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <span>{p.nombre} - ${p.precio}</span>
                <button
                  onClick={() => addToCart(p)}
                  className="bg-green-500 text-white px-2 py-1 rounded"
                >
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Carrito</h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {cart.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span>{p.nombre}</span>
                <span>${p.precio}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-bold">
            Total: ${cart.reduce((acc, p) => acc + p.precio, 0)}
          </p>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded mt-4 w-full"
          >
            Confirmar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
