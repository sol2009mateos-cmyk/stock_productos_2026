'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatearMoneda } from '@/lib/utils'

// Convierte "1.234,56", "$ 1234.56", "12.500", "850,5" en número. Devuelve null si no es un precio.
function parsearPrecio(texto: string): number | null {
  let t = texto.replace(/[^\d.,-]/g, '')
  if (!t || !/\d/.test(t)) return null

  const tieneComa = t.includes(',')
  const tienePunto = t.includes('.')

  if (tieneComa && tienePunto) {
    // El último separador es el decimal
    if (t.lastIndexOf(',') > t.lastIndexOf('.')) {
      t = t.replace(/\./g, '').replace(',', '.')
    } else {
      t = t.replace(/,/g, '')
    }
  } else if (tieneComa) {
    t = t.replace(/\./g, '').replace(',', '.')
  } else if (tienePunto) {
    // "12.500" o "1.234.567" = miles; "850.5" = decimal
    const partes = t.split('.')
    const esMiles = partes.length > 2 || (partes.length === 2 && partes[1].length === 3)
    if (esMiles) t = t.replace(/\./g, '')
  }

  const n = parseFloat(t)
  return isNaN(n) || n < 0 ? null : n
}

// Lee texto separado por tabulaciones, punto y coma o comas (lo que salga de Excel o de un CSV).
function leerTabla(texto: string): string[][] {
  const limpio = texto.replace(/^\uFEFF/, '')
  const primera = limpio.split(/\r?\n/).find((l) => l.trim() !== '') ?? ''
  const delimitador = primera.includes('\t') ? '\t' : primera.split(';').length > primera.split(',').length ? ';' : ','

  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let entreComillas = false

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i]
    if (entreComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        celda += '"'
        i++
      } else if (c === '"') {
        entreComillas = false
      } else {
        celda += c
      }
    } else if (c === '"') {
      entreComillas = true
    } else if (c === delimitador) {
      fila.push(celda)
      celda = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpio[i + 1] === '\n') i++
      fila.push(celda)
      celda = ''
      if (fila.some((x) => x.trim() !== '')) filas.push(fila.map((x) => x.trim()))
      fila = []
    } else {
      celda += c
    }
  }
  fila.push(celda)
  if (fila.some((x) => x.trim() !== '')) filas.push(fila.map((x) => x.trim()))

  return filas
}

function adivinarColumna(titulos: string[], patron: RegExp): number {
  return titulos.findIndex((t) => patron.test(t.toLowerCase()))
}

export default function ImportarCatalogoModal({ proveedor }: { proveedor: { id: string; nombre: string } }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [filas, setFilas] = useState<string[][]>([])
  const [conTitulos, setConTitulos] = useState(true)
  const [colNombre, setColNombre] = useState(0)
  const [colCodigo, setColCodigo] = useState(-1)
  const [colPrecio, setColPrecio] = useState(-1)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultado, setResultado] = useState('')

  function abrir() {
    setTexto('')
    setFilas([])
    setErrorMsg('')
    setResultado('')
    setAbierto(true)
  }

  function procesar(t: string) {
    setTexto(t)
    setResultado('')
    setErrorMsg('')
    const tabla = leerTabla(t)
    setFilas(tabla)
    if (tabla.length === 0) return

    const primera = tabla[0]
    const hayNumeroEnPrimera = primera.some((c) => /^\s*[$]?\s*\d[\d.,]*\s*$/.test(c))
    const titulos = !hayNumeroEnPrimera
    setConTitulos(titulos)

    if (titulos) {
      const n = adivinarColumna(primera, /(descr|nombre|producto|art[ií]culo|detalle)/)
      const c = adivinarColumna(primera, /(c[oó]d|sku|ean|\bid\b|art\.?$)/)
      const p = adivinarColumna(primera, /(precio|price|lista|costo|importe)/)
      setColNombre(n >= 0 ? n : 0)
      setColCodigo(c >= 0 && c !== (n >= 0 ? n : 0) ? c : -1)
      setColPrecio(p >= 0 ? p : -1)
    } else {
      setColNombre(0)
      setColCodigo(-1)
      setColPrecio(primera.length > 1 ? primera.length - 1 : -1)
    }
  }

  async function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    const buffer = await archivo.arrayBuffer()
    let t = new TextDecoder('utf-8').decode(buffer)
    // Los CSV de Excel en español suelen venir en Windows-1252
    if (t.includes('\uFFFD')) t = new TextDecoder('windows-1252').decode(buffer)
    procesar(t)
    e.target.value = ''
  }

  const datos = conTitulos ? filas.slice(1) : filas
  const columnas = filas.reduce((max, f) => Math.max(max, f.length), 0)
  const opcionesColumna = Array.from({ length: columnas }, (_, i) => ({
    valor: i,
    etiqueta: conTitulos && filas[0]?.[i] ? `${i + 1} · ${filas[0][i]}` : `Columna ${i + 1}`,
  }))

  const items = datos
    .map((f) => ({
      nombre: (f[colNombre] ?? '').trim(),
      codigo: colCodigo >= 0 ? (f[colCodigo] ?? '').trim() : '',
      precio: colPrecio >= 0 ? parsearPrecio(f[colPrecio] ?? '') : null,
    }))
    .filter((it) => it.nombre !== '')

  async function handleImportar() {
    setErrorMsg('')
    setResultado('')

    if (items.length === 0) {
      setErrorMsg('No hay filas con nombre para importar. Revisá qué columna es el nombre.')
      return
    }
    if (items.length > 5000) {
      setErrorMsg('La lista tiene más de 5000 filas. Dividila en partes.')
      return
    }

    setGuardando(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('importar_catalogo', {
      p_proveedor_id: proveedor.id,
      p_items: items.map((it) => ({
        nombre: it.nombre,
        codigo: it.codigo || null,
        precio: it.precio,
      })),
    })
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    const r = data as { nuevos: number; actualizados: number } | null
    setResultado(`Listo: ${r?.nuevos ?? 0} productos nuevos y ${r?.actualizados ?? 0} actualizados.`)
    setTexto('')
    setFilas([])
    router.refresh()
  }

  const selectClase =
    'w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm'

  return (
    <>
      <button
        onClick={abrir}
        className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-2 rounded-lg"
      >
        📥 Importar lista
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-white font-semibold text-lg">Importar lista de {proveedor.nombre}</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              Subí un archivo CSV, o copiá las celdas desde Excel (o desde la lista de precios del proveedor) y
              pegalas abajo. Si un producto ya está (mismo código o mismo nombre) se le actualiza el precio; si no
              está, se agrega.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <label className="bg-[#0f1117] border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 text-gray-300 text-sm cursor-pointer">
                📄 Elegir archivo (.csv / .txt)
                <input type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" onChange={handleArchivo} className="hidden" />
              </label>
              <span className="text-gray-600 text-xs">o pegá acá abajo</span>
            </div>

            <textarea
              rows={5}
              value={texto}
              onChange={(e) => procesar(e.target.value)}
              placeholder={'Código\tDescripción\tPrecio\nA100\tAlfajor Cofler 40g\t850,50'}
              className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-xs font-mono mb-3"
            />

            {filas.length > 0 && (
              <>
                <label className="flex items-center gap-2 text-gray-300 text-sm mb-3">
                  <input
                    type="checkbox"
                    checked={conTitulos}
                    onChange={(e) => setConTitulos(e.target.checked)}
                  />
                  La primera fila son los títulos de las columnas
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-400">Columna del nombre</label>
                    <select value={colNombre} onChange={(e) => setColNombre(parseInt(e.target.value, 10))} className={selectClase}>
                      {opcionesColumna.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Columna del código</label>
                    <select value={colCodigo} onChange={(e) => setColCodigo(parseInt(e.target.value, 10))} className={selectClase}>
                      <option value={-1}>No importar</option>
                      {opcionesColumna.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Columna del precio</label>
                    <select value={colPrecio} onChange={(e) => setColPrecio(parseInt(e.target.value, 10))} className={selectClase}>
                      <option value={-1}>No importar</option>
                      {opcionesColumna.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-gray-400 text-xs mb-2">
                  Se van a importar <span className="text-white font-medium">{items.length}</span> productos. Así se
                  leen las primeras filas:
                </p>
                <div className="bg-[#0f1117] border border-gray-800 rounded-lg overflow-x-auto mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-800">
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Código</th>
                        <th className="p-2 text-right">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.slice(0, 6).map((it, i) => (
                        <tr key={i} className="border-b border-gray-800">
                          <td className="p-2 text-gray-200">{it.nombre}</td>
                          <td className="p-2 text-gray-400">{it.codigo || '—'}</td>
                          <td className="p-2 text-right text-gray-300">
                            {it.precio !== null ? formatearMoneda(it.precio) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-gray-500 text-xs mb-3">
                  Si los precios se ven mal (por ejemplo, con un cero de más), revisá que sea la columna correcta
                  antes de importar.
                </p>

                <button
                  onClick={handleImportar}
                  disabled={guardando || items.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
                >
                  {guardando ? 'Importando...' : `Importar ${items.length} productos`}
                </button>
              </>
            )}

            {resultado && <p className="text-emerald-400 text-sm mt-3">{resultado}</p>}
            {errorMsg && <p className="text-red-400 text-sm mt-3">{errorMsg}</p>}
          </div>
        </div>
      )}
    </>
  )
}
