import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import FichaEmpleado from '@/components/FichaEmpleado'

export const dynamic = 'force-dynamic'

export default async function FichaEmpleadoPage({ params }: { params: { id: string } }) {
  const { data: empleado, error } = await supabase
    .from('empleados')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !empleado) {
    return (
      <div>
        <Link href="/empleados" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Volver a Empleados
        </Link>
        <p className="text-red-400 mt-4">No se encontró el empleado.</p>
      </div>
    )
  }

  const { data: responsabilidades } = await supabase
    .from('producto_responsables')
    .select('*')
    .eq('empleado_id', params.id)

  const { data: categoriasProductos } = await supabase
    .from('productos')
    .select('categoria')

  const todasLasCategorias = Array.from(
    new Set((categoriasProductos ?? []).map((p) => p.categoria).filter(Boolean) as string[])
  ).sort()

  return (
    <FichaEmpleado
      empleado={empleado}
      responsabilidades={responsabilidades ?? []}
      todasLasCategorias={todasLasCategorias}
    />
  )
}
