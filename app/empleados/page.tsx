import { supabase } from '@/lib/supabaseClient'
import AgregarEmpleadoModal from '@/components/AgregarEmpleadoModal'
import EmpleadosTabla from '@/components/EmpleadosTabla'

export const dynamic = 'force-dynamic'

export default async function EmpleadosPage() {
  const { data: empleados, error } = await supabase
    .from('empleados')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    return <div className="text-red-400">Error al traer empleados: {error.message}</div>
  }

  const lista = empleados ?? []
  const activos = lista.filter((e) => !e.fecha_baja)
  const inactivos = lista.filter((e) => e.fecha_baja)

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">👥 Empleados</h1>
          <p className="text-gray-500 text-sm mt-1">
            {lista.length} empleados — {activos.length} activos, {inactivos.length} inactivos
          </p>
        </div>
        <AgregarEmpleadoModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#161922] border-t-4 border-blue-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">👥 Total</p>
          <p className="text-3xl font-bold text-white mt-1">{lista.length}</p>
        </div>
        <div className="bg-[#161922] border-t-4 border-green-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">🟢 Activos</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{activos.length}</p>
        </div>
        <div className="bg-[#161922] border-t-4 border-red-500 rounded-lg p-4">
          <p className="text-gray-400 text-sm">🔴 Inactivos</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{inactivos.length}</p>
        </div>
      </div>

      <EmpleadosTabla empleados={lista} />
    </div>
  )
}
