"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function POS() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function confirmSale() {
    setLoading(true);
    const total = cart.reduce((acc, p) => acc + p.precio, 0);

    const { error } = await supabase.from("ventas").insert([
      {
        items: cart,
        total,
        fecha: new Date(),
      },
    ]);

    if (error) console.error(error);
    else {
      alert("✅ Venta registrada!");
      setCart([]);
    }
    setLoading(false);
  }

  const filteredProducts = products.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_barras?.toString().includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Punto de Venta</h1>

      {/* Buscador */}
      <input
        type="text"
        placeholder="🔍 Buscar producto por nombre o código..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-blue-400 rounded px-3 py-2 mb-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="grid grid-cols-2 gap-6">
        {/* Productos */}
        <div className="bg-white shadow-lg rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Productos</h2>
          <div className="space-y-3 max-h-[450px] overflow-y-auto">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-gray-50 rounded p-3 shadow-sm hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-800">{p.nombre}</p>
                  <p className="text-sm text-blue-600">${p.precio}</p>
                </div>
                <button
                  onClick={() => addToCart(p)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium"
                >
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-white shadow-lg rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Carrito</h2>
          <div className="space-y-2 max-h-[450px] overflow-y-auto">
            {cart.map((p, i) => (
              <div
                key={i}
                className="flex justify-between border-b pb-2 text-gray-700"
              >
                <span>{p.nombre}</span>
                <span className="font-medium">${p.precio}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-red-600 font-bold text-xl">
            Total: ${cart.reduce((acc, p) => acc + p.precio, 0)}
          </p>
          <button
            onClick={confirmSale}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-4 w-full font-semibold"
          >
            Confirmar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
