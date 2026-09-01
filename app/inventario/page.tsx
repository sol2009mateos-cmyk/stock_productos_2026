import { supabase } from '@/lib/supabaseClient'
import AgregarProductoModal from '@/components/AgregarProductoModal'
import InventarioTabla from '@/components/InventarioTabla'
import { STOCK_BAJO_LIMITE, formatearMoneda } from '@/lib/utils'

export const dynamic = 'force-dynamic'

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

      <InventarioTabla productos={listaProductos} />
    </div>
  )
}
