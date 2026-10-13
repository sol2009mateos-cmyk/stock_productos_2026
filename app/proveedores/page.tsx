import { createClient } from '@/lib/supabase/server'
import ProveedoresView from '@/components/ProveedoresView'
import { obtenerRol } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export default async function ProveedoresPage() {
  const rol = await obtenerRol()

  if (rol !== 'admin' && rol !== 'supervisor') {
    return <div className="text-gray-400">No tenés acceso a esta sección.</div>
  }

  const supabase = createClient()
  const { data: proveedores, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    return <div className="text-red-400">Error al traer proveedores: {error.message}</div>
  }

  const { data: catalogo } = await supabase
    .from('proveedor_productos')
    .select('id, proveedor_id, nombre, codigo, precio, precio_actualizado, producto_id')
    .order('nombre', { ascending: true })

  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre')
    .order('nombre', { ascending: true })

  return (
    <ProveedoresView
      proveedores={proveedores ?? []}
      puedeEliminar={rol === 'admin'}
      catalogo={catalogo ?? []}
      productos={productos ?? []}
    />
  )
}
