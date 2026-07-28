import { supabase } from '@/lib/supabaseClient'
import AgregarProductoModal from '@/components/AgregarProductoModal'

export const dynamic = 'force-dynamic'

const STOCK_BAJO_LIMITE = 15

function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

export default async function Dashboard() {
  const { data: productos, error: errorProductos } = await supabase
    .from('productos')
    .select('*')

  const { data: ventas, error: errorVentas } = await supabase
    .from('ventas')
    .select('*, venta_items(cantidad)')
    .order('fecha', { ascending: false })

  if (errorProductos || errorVentas) {
    return (
      <div className="text-red-400">
        Error al traer datos: {errorProductos?.message || errorVentas?.message}
      </div>
    )
  }

  const listaProductos = productos ?? []
  const listaVentas = ventas ?? []

  const totalProductos = listaProductos.length
  const valorInventario = listaProductos.reduce((acc, p) => acc + p.precio * p.stock, 0)
  const productosStockBajo = listaProductos.filter((p) => p.stock < STOCK_BAJO_LIMITE)

  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const ventasHoy = listaVentas.filter((v) => new Date(v.fecha) >= inicioHoy)
  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0)

  const dias: { fecha: string; total: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(inicioHoy)
    d.setDate(d.getDate() - i)
    const siguienteDia = new Date(d)
    siguienteDia.setDate(d.getDate() + 1)
    const totalDia = listaVentas
      .filter((v) => new Date(v.fecha) >= d && new Date(v.fecha) < siguienteDia)
      .reduce((acc, v) => acc + Number(v.total), 0)
    dias.push({
      fecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      total: totalDia,
    })
  }
  const maxDia = Math.max(...dias.map((d) => d.total), 1)

  const ultimasVentas = listaVentas.slice(0, 10)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">📊 Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenido de vuelta — {hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#161922] border-t-4 border-blue-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">📦 Productos</p>
          <p className="text-3xl font-bold text-white mt-1">{totalProductos}</p>
          <p className="text-gray-500 text-xs mt-1">Total en inventario</p>
        </div>
        <div className="bg-[#161922] border-t-4 border-green-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">💰 Valor Inventario</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{formatearMoneda(valorInventario)}</p>
          <p className="text-gray-500 text-xs mt-1">Precio × cantidad</p>
        </div>
        <div className="bg-[#161922] border-t-4 border-purple-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">🛒 Ventas Hoy</p>
          <p className="text-3xl font-bold text-purple-400 mt-1">{formatearMoneda(totalVentasHoy)}</p>
          <p className="text-gray-500 text-xs mt-1">Ingresos del día</p>
        </div>
        <div className="bg-[#161922] border-t-4 border-red-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">⚠️ Stock Bajo</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{productosStockBajo.length}</p>
          <p className="text-gray-500 text-xs mt-1">Requieren reposición</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2 bg-[#161922] rounded-lg p-4">
          <h2 className="text-white font-semibold mb-4">📈 Ventas — últimos 7 días</h2>
          <div className="flex items-end gap-2 h-40">
            {dias.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${Math.max((d.total / maxDia) * 100, 2)}%` }}
                  title={formatearMoneda(d.total)}
                />
                <span className="text-xs text-gray-500">{d.fecha}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161922] rounded-lg p-4">
          <h2 className="text-red-400 font-semibold mb-4">🔴 Stock Bajo</h2>
          {productosStockBajo.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin alertas de stock.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {productosStockBajo.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-sm border-b border-gray-800 pb-2">
                  <span className="text-gray-300">{p.nombre}</span>
                  <span className="text-red-400 font-medium">{p.stock}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#161922] rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-semibold">🕐 Últimas Ventas</h2>
          <span className="text-gray-500 text-sm">Hoy: {ventasHoy.length} ventas</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">Fecha y hora</th>
              <th className="pb-2">Método</th>
              <th className="pb-2">Productos</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ultimasVentas.map((v) => {
              const cantidadItems = (v.venta_items ?? []).reduce(
                (acc: number, item: { cantidad: number }) => acc + item.cantidad,
                0
              )
              return (
                <tr key={v.id} className="border-b border-gray-800">
                  <td className="py-2 text-gray-300">
                    {new Date(v.fecha).toLocaleString('es-AR', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="py-2 text-gray-300 capitalize">{v.metodo_pago}</td>
                  <td className="py-2 text-gray-300">{cantidadItems} u.</td>
                  <td className="py-2 text-green-400 text-right font-medium">{formatearMoneda(Number(v.total))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
