'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ReciboModal from '@/components/ReciboModal'
import Favoritos from '@/components/Favoritos'

type Producto = {
  id: string
  nombre: string
  categoria: string | null
  precio: number
  stock: number
  codigo_barras: string | null
}

type Config = {
  id: number
  nombre_negocio: string
  cuit: string | null
  direccion: string | null
  porcentaje_iva: number
  siguiente_numero_recibo: number
}

type Favorito = {
  id: number
  producto_id: string | null
  productos: { id: string; nombre: string; precio: number; stock: number } | null
}

type ItemCarrito = {
  producto: Producto
  cantidad: number
}

type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'

type DatosRecibo = {
  numeroRecibo: number
  fecha: Date
  metodoPago: string
  items: { nombre: string; cantidad: number; precioUnitario: number; subtotal: number }[]
  subtotal: number
  iva: number
  total: number
}

function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
}

export default function POS({
  productosIniciales,
  config,
  favoritosIniciales,
}: {
  productosIniciales: Producto[]
  config: Config | null
  favoritosIniciales: Favorito[]
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [metodoPago, setMetodoPago] = useState<MetodoPago | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [reciboActivo, setReciboActivo] = useState<DatosRecibo | null>(null)

  const porcentajeIva = config?.porcentaje_iva ?? 21

  const productosFiltrados = productosIniciales.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase())
  )

  function agregarAlCarrito(producto: Producto) {
    setErrorMsg('')
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id)
      if (existente) {
        if (existente.cantidad >= producto.stock) return prev
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      if (producto.stock <= 0) return prev
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  function agregarFavoritoAlCarrito(productoFavorito: { id: string; nombre: string; precio: number; stock: number }) {
    const productoCompleto = productosIniciales.find((p) => p.id === productoFavorito.id)
    if (productoCompleto) {
      agregarAlCarrito(productoCompleto)
    }
  }

  function cambiarCantidad(productoId: string, delta: number) {
    setCarrito((prev) =>
      prev
        .map((i) => {
          if (i.producto.id !== productoId) return i
          const nuevaCantidad = i.cantidad + delta
          if (nuevaCantidad > i.producto.stock) return i
          return { ...i, cantidad: nuevaCantidad }
        })
        .filter((i) => i.cantidad > 0)
    )
  }

  function quitarDelCarrito(productoId: string) {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId))
  }

  const subtotal = carrito.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0)
  const iva = subtotal * (porcentajeIva / 100)
  const total = subtotal + iva

  async function confirmarVenta() {
    setErrorMsg('')

    if (carrito.length === 0) {
      setErrorMsg('El carrito está vacío.')
      return
    }
    if (!metodoPago) {
      setErrorMsg('Elegí un método de pago.')
      return
    }
    if (!config) {
      setErrorMsg('No se pudo leer la configuración del negocio.')
      return
    }

    setProcesando(true)

    const numeroRecibo = config.siguiente_numero_recibo

    const { data: ventaCreada, error: errorVenta } = await supabase
      .from('ventas')
      .insert({
        numero_recibo: numeroRecibo,
        metodo_pago: metodoPago,
        subtotal,
        iva,
        total,
      })
      .select()
      .single()

    if (errorVenta || !ventaCreada) {
      setErrorMsg(errorVenta?.message || 'Error al crear la venta.')
      setProcesando(false)
      return
    }

    const items = carrito.map((i) => ({
      venta_id: ventaCreada.id,
      producto_id: i.producto.id,
      cantidad: i.cantidad,
      precio_unitario: i.producto.precio,
      subtotal: i.producto.precio * i.cantidad,
    }))

    const { error: errorItems } = await supabase.from('venta_items').insert(items)

    if (errorItems) {
      setErrorMsg(errorItems.message)
      setProcesando(false)
      return
    }

    for (const i of carrito) {
      await supabase
        .from('productos')
        .update({ stock: i.producto.stock - i.cantidad })
        .eq('id', i.producto.id)
    }

    await supabase
      .from('config')
      .update({ siguiente_numero_recibo: numeroRecibo + 1 })
      .eq('id', 1)

    setReciboActivo({
      numeroRecibo,
      fecha: new Date(),
      metodoPago,
      items: carrito.map((i) => ({
        nombre: i.producto.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.producto.precio,
        subtotal: i.producto.precio * i.cantidad,
      })),
      subtotal,
      iva,
      total,
    })

    setCarrito([])
    setMetodoPago(null)
    setProcesando(false)
    router.refresh()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">🛒 Punto de Venta</h1>

      <Favoritos
        favoritosIniciales={favoritosIniciales}
        productos={productosIniciales}
        onAgregarAlCarrito={agregarFavoritoAlCarrito}
      />

      <input
        type="text"
        placeholder="🔍 Buscar producto por nombre o código..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full bg-[#161922] border border-gray-700 rounded-lg px-4 py-3 mb-6 text-white text-sm focus:outline-none focus:border-blue-500"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161922] rounded-lg p-4">
          <h2 className="text-white font-semibold mb-4">Productos</h2>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {productosFiltrados.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-[#0f1117] rounded-lg p-3"
              >
                <div>
                  <p className="text-gray-200 font-medium text-sm">{p.nombre}</p>
                  <p className="text-blue-400 text-sm">{formatearMoneda(p.precio)}</p>
                  <p className="text-gray-500 text-xs">Stock: {p.stock}</p>
                </div>
                <button
                  onClick={() => agregarAlCarrito(p)}
                  disabled={p.stock <= 0}
                  className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 rounded-lg"
                >
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161922] rounded-lg p-4 flex flex-col">
          <h2 className="text-white font-semibold mb-4">Carrito</h2>

          <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4 flex-1">
            {carrito.length === 0 && (
              <p className="text-gray-500 text-sm">No hay productos en el carrito.</p>
            )}
            {carrito.map((i) => (
              <div
                key={i.producto.id}
                className="flex justify-between items-center border-b border-gray-800 pb-2"
              >
                <div>
                  <p className="text-gray-200 text-sm">{i.producto.nombre}</p>
                  <p className="text-gray-500 text-xs">{formatearMoneda(i.producto.precio)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarCantidad(i.producto.id, -1)}
                    className="bg-gray-800 hover:bg-gray-700 text-white w-6 h-6 rounded"
                  >
                    -
                  </button>
                  <span className="text-white text-sm w-5 text-center">{i.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(i.producto.id, 1)}
                    className="bg-gray-800 hover:bg-gray-700 text-white w-6 h-6 rounded"
                  >
                    +
                  </button>
                  <button
                    onClick={() => quitarDelCarrito(i.producto.id)}
                    className="text-red-400 hover:text-red-300 text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-3 space-y-1 mb-4">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>{formatearMoneda(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>IVA ({porcentajeIva}%)</span>
              <span>{formatearMoneda(iva)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span>{formatearMoneda(total)}</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-400 text-xs mb-2">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {(['efectivo', 'tarjeta', 'transferencia'] as MetodoPago[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodoPago(m)}
                  className={`text-xs font-medium py-2 rounded-lg capitalize ${
                    metodoPago === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#0f1117] text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && <p className="text-red-400 text-sm mb-2">{errorMsg}</p>}

          <button
            onClick={confirmarVenta}
            disabled={procesando}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg w-full"
          >
            {procesando ? 'Procesando...' : 'Confirmar Venta'}
          </button>
        </div>
      </div>

      {reciboActivo && (
        <ReciboModal
          recibo={reciboActivo}
          config={config}
          onCerrar={() => setReciboActivo(null)}
        />
      )}
    </div>
  )
}
