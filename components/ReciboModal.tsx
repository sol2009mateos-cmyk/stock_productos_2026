'use client'

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

function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
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
  function imprimir() {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 print:bg-white print:relative print:inset-auto">
      <div
        id="recibo-imprimible"
        className="bg-white text-black rounded-lg p-6 w-full max-w-sm font-mono text-sm print:shadow-none print:max-w-full"
      >
        <div className="text-center mb-4">
          <p className="font-bold text-base">{config?.nombre_negocio ?? 'Mi Negocio'}</p>
          {config?.cuit && <p className="text-xs">CUIT: {config.cuit}</p>}
          {config?.direccion && <p className="text-xs">{config.direccion}</p>}
        </div>

        <div className="border-t border-b border-dashed border-gray-400 py-2 mb-2 text-xs">
          <p>Recibo N.º: {String(recibo.numeroRecibo).padStart(6, '0')}</p>
          <p>
            Fecha: {recibo.fecha.toLocaleString('es-AR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          <p className="capitalize">Pago: {recibo.metodoPago}</p>
        </div>

        <div className="mb-2">
          {recibo.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs mb-1">
              <span className="flex-1">
                {item.cantidad} x {item.nombre}
              </span>
              <span>{formatearMoneda(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 pt-2 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatearMoneda(recibo.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA ({config?.porcentaje_iva ?? 21}%)</span>
            <span>{formatearMoneda(recibo.iva)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL</span>
            <span>{formatearMoneda(recibo.total)}</span>
          </div>
        </div>

        <p className="text-center text-xs mt-4">¡Gracias por su compra!</p>

        <div className="flex gap-2 mt-4 print:hidden">
          <button
            onClick={imprimir}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
