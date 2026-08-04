"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient"; // tu cliente de Supabase

export default function POS() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar productos desde Supabase
  async function fetchProducts() {
    let { data, error } = await supabase.from("productos").select("*");
    if (error) console.error(error);
    else setProducts(data);
  }

  // Agregar producto al carrito
  function addToCart(product) {
    setCart([...cart, product]);
  }

  // Confirmar venta
  async function confirmSale() {
    setLoading(true);

    // Registrar venta en tabla "ventas"
    const { error } = await supabase.from("ventas").insert([
      {
        items: cart,
        total: cart.reduce((acc, p) => acc + p.precio, 0),
        fecha: new Date(),
      },
    ]);

    if (error) console.error(error);
    else {
      alert("Venta registrada!");
      setCart([]);
    }
    setLoading(false);
  }

  return (
    <div>
      <h1>Punto de Venta</h1>
      <button onClick={fetchProducts}>Cargar productos</button>

      <div>
        <h2>Productos</h2>
        {products.map((p) => (
          <div key={p.id}>
            {p.nombre} - ${p.precio}
            <button onClick={() => addToCart(p)}>Agregar</button>
          </div>
        ))}
      </div>

      <div>
        <h2>Carrito</h2>
        {cart.map((p, i) => (
          <div key={i}>{p.nombre} - ${p.precio}</div>
        ))}
        <p>Total: ${cart.reduce((acc, p) => acc + p.precio, 0)}</p>
        <button onClick={confirmSale} disabled={loading}>
          Confirmar Venta
        </button>
      </div>
    </div>
  );
}
