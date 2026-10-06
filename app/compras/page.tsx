import { createClient } from '@/lib/supabase/server'
import ComprasView from '@/components/ComprasView'
import { obtenerRol } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export default async function ComprasPage() {
  const rol = await obtenerRol()

  if (rol !== 'admin' && rol !== 'supervisor') {
    return <div className="text-gray-400">No tenés acceso a esta sección.</div>
  }

  const supabase = createClient()

  const { data: compras, error } = await supabase
    .from('compras')
    .select(
      '*, proveedores(nombre), compra_items(cantidad, costo_unitario, subtotal, productos(nombre))'
    )
    .order('fecha', { ascending: false })
    .limit(100)

  if (error) {
    return <div className="text-red-400">Error al traer compras: {error.message}</div>
  }

  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre, stock, costo')
    .order('nombre', { ascending: true })

  const { data: proveedores } = await supabase
    .from('proveedores')
    .select('id, nombre')
    .order('nombre', { ascending: true })

  return (
    <ComprasView
      compras={compras ?? []}
      productos={productos ?? []}
      proveedores={proveedores ?? []}
    />
  )
}
