'use client'

import { useState } from 'react'

type Movimiento = {
  id: string
  producto_id: string
  cambio: number
  stock_anterior: number
  stock_nuevo: number
  motivo: 'venta' | 'ajuste_manual'
  creado_en: string
  productos: { nombre: string } | null
}

type Producto = {
  id: string
  nombre: string
}

function etiquetaMotivo(motivo: string) {
  return motivo === 'venta' ? '🛒 Venta' : '✏️ Ajuste manual'
}

export default function HistorialStockView({
  movimientos,
  productos,
}: {
  movimientos: Movimiento[]
  productos: Producto[]
}) {
  const [productoFiltro, setProductoFiltro] = useState<string>('todos')

  const movimientosFiltrados =
    productoFiltro === 'todos'
      ? movimientos
      : movimientos.filter((m) => m.producto_id === productoFiltro)

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">📜 Historial de Stock</h1>

      <div className="mb-6">
        <label className="text-xs text-gray-400 block mb-1">Filtrar por producto</label>
        <select
          value={productoFiltro}
          onChange={(e) => setProductoFiltro(e.target.value)}
          className="bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-full max-w-sm"
        >
          <option value="todos">Todos los productos</option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#161922] rounded-lg p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Producto</th>
              <th className="pb-2">Motivo</th>
              <th className="pb-2 text-right">Cambio</th>
              <th className="pb-2 text-right">Stock anterior</th>
              <th className="pb-2 text-right">Stock nuevo</th>
            </tr>
          </thead>
          <tbody>
            {movimientosFiltrados.map((m) => (
              <tr key={m.id} className="border-b border-gray-800">
                <td className="py-2 text-gray-300">
                  {new Date(m.creado_en).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="py-2 text-gray-300">{m.productos?.nombre ?? 'Producto eliminado'}</td>
                <td className="py-2 text-gray-400">{etiquetaMotivo(m.motivo)}</td>
                <td className={`py-2 text-right font-medium ${m.cambio < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {m.cambio > 0 ? `+${m.cambio}` : m.cambio}
                </td>
                <td className="py-2 text-right text-gray-400">{m.stock_anterior}</td>
                <td className="py-2 text-right text-gray-200">{m.stock_nuevo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {movimientosFiltrados.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            Todavía no hay movimientos registrados.
          </p>
        )}
      </div>
    </div>
  )
}
