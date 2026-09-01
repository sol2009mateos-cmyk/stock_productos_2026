'use client'

import { useState } from 'react'

export type MetodoPago = 'efectivo' | 'debito' | 'credito' | 'transferencia' | 'billetera_virtual'

export type DatosPago = {
  metodoPago: MetodoPago
  marcaPago: string | null
  cuotas: number | null
}

const MARCAS_DEBITO = ['Visa Débito', 'Maestro', 'Cabal Débito']

const CUOTAS_POR_MARCA_CREDITO: Record<string, number[]> = {
  Visa: [1, 3, 6, 12],
  Mastercard: [1, 3, 6],
  'American Express': [1, 3],
  Cabal: [1, 3, 6],
}

const BILLETERAS = ['Mercado Pago', 'Ualá', 'MODO', 'Cuenta DNI']

export default function SelectorPago({
  onCambiar,
}: {
  onCambiar: (datos: DatosPago | null) => void
}) {
  const [metodo, setMetodo] = useState<MetodoPago | null>(null)
  const [marca, setMarca] = useState<string | null>(null)
  const [cuotas, setCuotas] = useState<number | null>(null)

  function elegirMetodo(m: MetodoPago) {
    setMetodo(m)
    setMarca(null)
    setCuotas(null)
    onCambiar(null)

    if (m === 'efectivo' || m === 'transferencia') {
      onCambiar({ metodoPago: m, marcaPago: null, cuotas: null })
    }
  }

  function elegirMarcaDebito(m: string) {
    setMarca(m)
    onCambiar({ metodoPago: 'debito', marcaPago: m, cuotas: 1 })
  }

  function elegirMarcaCredito(m: string) {
    setMarca(m)
    setCuotas(null)
    onCambiar(null)
  }

  function elegirCuotas(c: number) {
    setCuotas(c)
    onCambiar({ metodoPago: 'credito', marcaPago: marca, cuotas: c })
  }

  function elegirBilletera(b: string) {
    setMarca(b)
    onCambiar({ metodoPago: 'billetera_virtual', marcaPago: b, cuotas: null })
  }

  const metodos: { valor: MetodoPago; label: string }[] = [
    { valor: 'efectivo', label: 'Efectivo' },
    { valor: 'debito', label: 'Débito' },
    { valor: 'credito', label: 'Crédito' },
    { valor: 'transferencia', label: 'Transferencia' },
    { valor: 'billetera_virtual', label: 'Billetera Virtual' },
  ]

  return (
    <div className="mb-4">
      <p className="text-gray-400 text-xs mb-2">Método de pago</p>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {metodos.map((m) => (
          <button
            key={m.valor}
            onClick={() => elegirMetodo(m.valor)}
            className={`text-xs font-medium py-2 rounded-lg ${
              metodo === m.valor
                ? 'bg-blue-600 text-white'
                : 'bg-[#0f1117] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {metodo === 'debito' && (
        <div className="flex flex-wrap gap-2 mt-2">
          {MARCAS_DEBITO.map((m) => (
            <button
              key={m}
              onClick={() => elegirMarcaDebito(m)}
              className={`text-xs px-3 py-1.5 rounded-lg ${
                marca === m ? 'bg-blue-700 text-white' : 'bg-[#0f1117] text-gray-400 hover:bg-gray-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {metodo === 'credito' && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-2 mb-2">
            {Object.keys(CUOTAS_POR_MARCA_CREDITO).map((m) => (
              <button
                key={m}
                onClick={() => elegirMarcaCredito(m)}
                className={`text-xs px-3 py-1.5 rounded-lg ${
                  marca === m ? 'bg-blue-700 text-white' : 'bg-[#0f1117] text-gray-400 hover:bg-gray-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {marca && (
            <div className="flex flex-wrap gap-2">
              {CUOTAS_POR_MARCA_CREDITO[marca].map((c) => (
                <button
                  key={c}
                  onClick={() => elegirCuotas(c)}
                  className={`text-xs px-3 py-1.5 rounded-lg ${
                    cuotas === c ? 'bg-green-700 text-white' : 'bg-[#0f1117] text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {c === 1 ? '1 pago' : `${c} cuotas`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {metodo === 'billetera_virtual' && (
        <div className="flex flex-wrap gap-2 mt-2">
          {BILLETERAS.map((b) => (
            <button
              key={b}
              onClick={() => elegirBilletera(b)}
              className={`text-xs px-3 py-1.5 rounded-lg ${
                marca === b ? 'bg-blue-700 text-white' : 'bg-[#0f1117] text-gray-400 hover:bg-gray-800'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
