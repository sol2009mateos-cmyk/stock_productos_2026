import { createClient } from '@/lib/supabase/server'
import { obtenerRol } from '@/lib/roles'
import UsuariosView from '@/components/UsuariosView'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const rol = await obtenerRol()

  if (rol !== 'admin') {
    return (
      <div className="text-red-400">
        No tenés permiso para ver esta página.
      </div>
    )
  }

  const supabase = createClient()
  const { data: usuarios, error } = await supabase.rpc('listar_usuarios')

  if (error) {
    return <div className="text-red-400">Error al traer usuarios: {error.message}</div>
  }

  return <UsuariosView usuarios={usuarios ?? []} />
}
