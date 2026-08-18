'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { formatearMoneda } from '@/lib/utils'

type ItemRecibo = {
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

type DatosRecibo = {
  numeroRecibo: number
  fecha: Date
  metodoPago: string
  items: ItemRecibo[]
  subtotal: number
  iva: number
  total: number
}

type Config = {
  nombre_negocio: string
  cuit: string | null
  direccion: string | null
  porcentaje_iva: number
}

export default function ReciboModal({
  recibo,
  config,
  onCerrar,
}: {
  recibo: DatosRecibo
  config: Config | null
  onCerrar: () => void
}) {
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  function imprimir() {
    window.print()
  }

  if (!montado) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        id="recibo-imprimible"
        className="bg-white text-black rounded-lg p-8 w-full max-w-lg font-mono text-base"
      >
        <div className="text-center mb-5">
          <p className="font-bold text-xl">{config?.nombre_negocio ?? 'Mi Negocio'}</p>
          {config?.cuit && <p className="text-sm">CUIT: {config.cuit}</p>}
          {config?.direccion && <p className="text-sm">{config.direccion}</p>}
        </div>

        <div className="border-t border-b border-dashed border-gray-400 py-3 mb-3 text-sm">
          <p>Recibo N.º: {String(recibo.numeroRecibo).padStart(6, '0')}</p>
          <p>
            Fecha: {recibo.fecha.toLocaleString('es-AR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          <p className="capitalize">Pago: {recibo.metodoPago}</p>
        </div>

        <div className="mb-3">
          {recibo.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm mb-2">
              <span className="flex-1">
                {item.cantidad} x {item.nombre}
              </span>
              <span>{formatearMoneda(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatearMoneda(recibo.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA ({config?.porcentaje_iva ?? 21}%)</span>
            <span>{formatearMoneda(recibo.iva)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span>TOTAL</span>
            <span>{formatearMoneda(recibo.total)}</span>
          </div>
        </div>

        <p className="text-center text-sm mt-6">¡Gracias por su compra!</p>

        <div className="flex gap-2 mt-6 print:hidden">
          <button
            onClick={imprimir}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
