export const STOCK_BAJO_LIMITE = 15

export function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
}

// Margen de ganancia de un producto.
// El precio de venta es neto (el IVA se suma aparte en el POS), por eso
// la ganancia es simplemente precio - costo.
// Devuelve null si el producto no tiene costo cargado.
export function calcularMargen(precio: number, costo: number | null | undefined) {
  if (costo === null || costo === undefined || isNaN(Number(costo))) return null
  const ganancia = Number(precio) - Number(costo)
  const porcentaje = Number(precio) > 0 ? (ganancia / Number(precio)) * 100 : 0
  return { ganancia, porcentaje }
}

// Vencimientos: se guardan como fecha "AAAA-MM-01" y se muestran como "MM/AAAA".
// Sin vencimiento = null.
export function formatearVencimiento(venc: string | null | undefined) {
  if (!venc) return 'Sin vencimiento'
  return `${venc.slice(5, 7)}/${venc.slice(0, 4)}`
}

// Un lote está vencido cuando su mes ya pasó (durante el mes de vencimiento todavía vale).
export function estaVencido(venc: string | null | undefined) {
  if (!venc) return false
  const ahora = new Date()
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
  return venc.slice(0, 7) < mesActual
}
