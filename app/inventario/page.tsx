import { supabase } from '@/lib/supabaseClient'
import AgregarProductoModal from '@/components/AgregarProductoModal'
import EditarProductoModal from '@/components/EditarProductoModal'

// forzando rebuild
export const dynamic = 'force-dynamic'

const STOCK_BAJO_LIMITE = 15

function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
}

export default async function Inventario() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    return <div className="text-red-400">Error al traer productos: {error.message}</div>
  }

  const listaProductos = productos ?? []
  const categorias = Array.from(new Set(listaProductos.map((p) => p.categoria).filter(Boolean)))
  const valorTotal = listaProductos.reduce((acc, p) => acc + p.precio * p.stock, 0)

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">📦 Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">
            {listaProductos.length} productos en {categorias.length} categorías
          </p>
        </div>
        <AgregarProductoModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#161922] border-t-4 border-blue-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">📦 Total Productos</p>
          <p className="text-3xl font-bold text-white mt-1">{listaProductos.length}</p>
        </div>
        <div className="bg-[#161922] border-t-4 border-green-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">💰 Valor Total</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{formatearMoneda(valorTotal)}</p>
        </div>
        <div className="bg-[#161922] border-t-4 border-red-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">⚠️ Stock Bajo</p>
          <p className="text-3xl font-bold text-red-400 mt-1">
            {listaProductos.filter((p) => p.stock < STOCK_BAJO_LIMITE).length}
          </p>
        </div>
      </div>

      <div className="bg-[#161922] rounded-lg p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Categoría</th>
              <th className="pb-2">Código de barras</th>
              <th className="pb-2 text-right">Precio</th>
              <th className="pb-2 text-right">Stock</th>
              <th className="pb-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaProductos.map((p) => {
              const bajo = p.stock < STOCK_BAJO_LIMITE
              return (
                <tr key={p.id} className="border-b border-gray-800">
                  <td className="py-3 text-gray-200 font-medium">{p.nombre}</td>
                  <td className="py-3 text-gray-400">{p.categoria}</td>
                  <td className="py-3 text-gray-500">{p.codigo_barras}</td>
                  <td className="py-3 text-right text-gray-200">{formatearMoneda(p.precio)}</td>
                  <td className="py-3 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        bajo ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <EditarProductoModal producto={p} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
