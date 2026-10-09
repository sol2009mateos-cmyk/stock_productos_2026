'use client'

import { useState } from 'react'
import EditarProductoModal from '@/components/EditarProductoModal'
import LotesModal, { Lote } from '@/components/LotesModal'
import { formatearMoneda, calcularMargen, formatearVencimiento, estaVencido } from '@/lib/utils'

type Producto = {
  id: string
  nombre: string
  categoria: string | null
  precio: number
  stock: number
  codigo_barras: string | null
  costo: number | null
  lotes: Lote[]
}

export default function InventarioTabla({
  productos,
  stockBajoLimite,
  puedeEditar,
}: {
  productos: Producto[]
  stockBajoLimite: number
  puedeEditar: boolean
}) {
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todas')
  const [busqueda, setBusqueda] = useState('')

  const categorias = ['Todas', ...Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])).sort()]

  const productosFiltrados = productos.filter((p) => {
    const coincideCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase())
    return coincideCategoria && coincideBusqueda
  })

  return (
    <div>
      <input
        type="text"
        placeholder="🔍 Buscar producto por nombre o código..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full bg-[#161922] border border-gray-700 rounded-lg px-4 py-3 mb-4 text-white text-sm focus:outline-none focus:border-blue-500"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={`text-sm font-medium px-4 py-2 rounded-lg ${
              categoriaActiva === cat
                ? 'bg-blue-600 text-white'
                : 'bg-[#161922] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-[#161922] rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-400 text-sm">
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Categoría</th>
              <th className="pb-2">Código de barras</th>
              {puedeEditar && <th className="pb-2 text-right">Costo</th>}
              <th className="pb-2 text-right">Precio</th>
              {puedeEditar && <th className="pb-2 text-right">Margen</th>}
              <th className="pb-2 text-right">Stock</th>
              {puedeEditar && <th className="pb-2">Vencimientos</th>}
              {puedeEditar && <th className="pb-2 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => {
              const bajo = p.stock < stockBajoLimite
              const margen = calcularMargen(p.precio, p.costo)
              return (
                <tr key={p.id} className="border-b border-gray-800">
                  <td className="py-3 text-gray-200 font-medium">{p.nombre}</td>
                  <td className="py-3 text-gray-400">{p.categoria}</td>
                  <td className="py-3 text-gray-500">{p.codigo_barras}</td>
                  {puedeEditar && (
                    <td className="py-3 text-right text-gray-400">
                      {p.costo !== null && p.costo !== undefined ? formatearMoneda(Number(p.costo)) : '—'}
                    </td>
                  )}
                  <td className="py-3 text-right text-gray-200">{formatearMoneda(p.precio)}</td>
                  {puedeEditar && (
                    <td className="py-3 text-right">
                      {margen ? (
                        <span className={margen.ganancia >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {formatearMoneda(margen.ganancia)}{' '}
                          <span className="text-xs opacity-80">({margen.porcentaje.toFixed(1)}%)</span>
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        bajo ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  {puedeEditar && (
                    <td className="py-3">
                      {p.lotes.length === 0 ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {[...p.lotes]
                            .sort((a, b) => {
                              if (a.vencimiento === b.vencimiento) return 0
                              if (a.vencimiento === null) return 1
                              if (b.vencimiento === null) return -1
                              return a.vencimiento < b.vencimiento ? -1 : 1
                            })
                            .map((l) => (
                              <span
                                key={l.id}
                                className={`text-xs ${estaVencido(l.vencimiento) ? 'text-red-400 font-medium' : 'text-gray-400'}`}
                              >
                                {l.vencimiento ? formatearVencimiento(l.vencimiento) : 'Sin venc.'} · {l.cantidad} u.
                              </span>
                            ))}
                        </div>
                      )}
                    </td>
                  )}
                  {puedeEditar && (
                    <td className="py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
       <LotesModal
  producto={{ id: p.id, nombre: p.nombre, stock: p.stock }}
  lotes={p.lotes}
  proveedores={proveedores}
/>
                        <EditarProductoModal producto={p} />
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
