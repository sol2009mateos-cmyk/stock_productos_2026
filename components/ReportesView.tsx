'use client'

import { useMemo, useState } from 'react'
import { formatearMoneda } from '@/lib/utils'
import ReciboModal from '@/components/ReciboModal'

type VentaItem = {
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto_id: string
  productos: { nombre: string } | null
}

type Venta = {
  id: string
  numero_recibo: number
  fecha: string
  metodo_pago: string
  subtotal: number
  iva: number
  total: number
  venta_items: VentaItem[]
}

type Periodo = 'hoy' | 'semana' | 'mes' | 'todo'

function inicioDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function ReportesView({ ventas }: { ventas: Venta[] }) {
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [ventaParaTicket, setVentaParaTicket] = useState<Venta | null>(null)

  const ventasFiltradas = useMemo(() => {
    if (periodo === 'todo') return ventas

    const ahora = new Date()
    let desde: Date

    if (periodo === 'hoy') {
      desde = inicioDia(ahora)
    } else if (periodo === 'semana') {
      desde = inicioDia(ahora)
      desde.setDate(desde.getDate() - 6)
    } else {
      desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    }

    return ventas.filter((v) => new Date(v.fecha) >= desde)
  }, [ventas, periodo])

  const totalVentas = ventasFiltradas.length
  const montoTotal = ventasFiltradas.reduce((acc, v) => acc + Number(v.total), 0)

  const porMetodo = useMemo(() => {
    const mapa: Record<string, number> = { efectivo: 0, tarjeta: 0, transferencia: 0 }
    for (const v of ventasFiltradas) {
      mapa[v.metodo_pago] = (mapa[v.metodo_pago] ?? 0) + Number(v.total)
    }
    return mapa
  }, [ventasFiltradas])

  const topProductos = useMemo(() => {
    const mapa: Record<string, { nombre: string; cantidad: number; total: number }> = {}
    for (const v of ventasFiltradas) {
      for (const item of v.venta_items ?? []) {
        const nombre = item.productos?.nombre ?? 'Producto eliminado'
        if (!mapa[item.producto_id]) {
          mapa[item.producto_id] = { nombre, cantidad: 0, total: 0 }
        }
        mapa[item.producto_id].cantidad += item.cantidad
        mapa[item.producto_id].total += Number(item.subtotal)
      }
    }
    return Object.values(mapa)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)
  }, [ventasFiltradas])

  function exportarCSV() {
    const filas = [
      ['N. Recibo', 'Fecha', 'Metodo de pago', 'Subtotal', 'IVA', 'Total'],
      ...ventasFiltradas.map((v) => [
        v.numero_recibo,
        new Date(v.fecha).toLocaleString('es-AR'),
        v.metodo_pago,
        v.subtotal,
        v.iva,
        v.total,
      ]),
    ]
    const csv = filas.map((fila) => fila.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-ventas-${periodo}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const periodos: { valor: Periodo; label: string }[] = [
    { valor: 'hoy', label: 'Hoy' },
    { valor: 'semana', label: 'Últimos 7 días' },
    { valor: 'mes', label: 'Este mes' },
    { valor: 'todo', label: 'Todo' },
  ]

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-white">📈 Reportes</h1>
        <button
          onClick={exportarCSV}
          disabled={ventasFiltradas.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {periodos.map((p) => (
          <button
            key={p.valor}
            onClick={() => setPeriodo(p.valor)}
            className={`text-sm font-medium px-4 py-2 rounded-lg ${
              periodo === p.valor
                ? 'bg-blue-600 text-white'
                : 'bg-[#161922] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#161922] border-t-4 border-blue-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">🧾 Cantidad de ventas</p>
          <p className="text-3xl font-bold text-white mt-1">{totalVentas}</p>
        </div>
        <div className="bg-[#161922] border-t-4 border-green-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">💰 Monto total</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{formatearMoneda(montoTotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#161922] rounded-lg p-4">
          <h2 className="text-white font-semibold mb-4">Ventas por método de pago</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(porMetodo).map(([metodo, monto]) => (
              <div key={metodo} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm capitalize">{metodo}</span>
                <span className="text-gray-200 font-medium">{formatearMoneda(monto)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161922] rounded-lg p-4">
          <h2 className="text-white font-semibold mb-4">🏆 Top 5 productos más vendidos</h2>
          {topProductos.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin ventas en este período.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {topProductos.map((p, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-gray-800 pb-2">
                  <span className="text-gray-300">{p.nombre}</span>
                  <span className="text-gray-400">{p.cantidad} u. — {formatearMoneda(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#161922] rounded-lg p-4">
        <h2 className="text-white font-semibold mb-4">Detalle de ventas</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">N.º Recibo</th>
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Método</th>
              <th className="pb-2 text-right">Subtotal</th>
              <th className="pb-2 text-right">IVA</th>
              <th className="pb-2 text-right">Total</th>
              <th className="pb-2 text-right">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.map((v) => (
              <tr key={v.id} className="border-b border-gray-800">
                <td className="py-2 text-gray-300">{v.numero_recibo}</td>
                <td className="py-2 text-gray-300">
                  {new Date(v.fecha).toLocaleString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="py-2 text-gray-300 capitalize">{v.metodo_pago}</td>
                <td className="py-2 text-right text-gray-300">{formatearMoneda(v.subtotal)}</td>
                <td className="py-2 text-right text-gray-300">{formatearMoneda(v.iva)}</td>
                <td className="py-2 text-right text-green-400 font-medium">{formatearMoneda(v.total)}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => setVentaParaTicket(v)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                  >
                    🧾 Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ventaParaTicket && (
        <ReciboModal
          recibo={{
            numeroRecibo: ventaParaTicket.numero_recibo,
            fecha: new Date(ventaParaTicket.fecha),
            metodoPago: ventaParaTicket.metodo_pago,
            items: (ventaParaTicket.venta_items ?? []).map((i) => ({
              nombre: i.productos?.nombre ?? 'Producto eliminado',
              cantidad: i.cantidad,
              precioUnitario: i.precio_unitario,
              subtotal: i.subtotal,
            })),
            subtotal: ventaParaTicket.subtotal,
            iva: ventaParaTicket.iva,
            total: ventaParaTicket.total,
          }}
          config={null}
          onCerrar={() => setVentaParaTicket(null)}
        />
      )}
    </div>
  )
}
