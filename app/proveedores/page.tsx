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

  return <ProveedoresView proveedores={proveedores ?? []} puedeEliminar={rol === 'admin'} />
}
