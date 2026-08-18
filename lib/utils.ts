export const STOCK_BAJO_LIMITE = 15

export function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
}
