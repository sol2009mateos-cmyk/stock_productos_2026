import { createClient } from '@/lib/supabase/server'
import ReportesView from '@/components/ReportesView'
import { obtenerRol } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const supabase = createClient()

  const { data: ventas } = await supabase
    .from('ventas')
    .select(
      '*, venta_items(cantidad, precio_unitario, subtotal, costo_unitario, producto_id, productos(nombre))'
    )
    .order('fecha', { ascending: false })

  const { data: config } = await supabase
    .from('config')
    .select('*')
    .eq('id', 1)
    .single()

  const rol = await obtenerRol()

  // El costo solo viaja al navegador para admin y supervisor.
  // Para el cajero se saca de cada ítem antes de pasarlo a la vista.
  const ventasParaVista = (ventas ?? []).map((v) =>
    rol === 'cajero'
      ? {
          ...v,
          venta_items: (v.venta_items ?? []).map((item) => {
            const { costo_unitario: _costo, ...resto } = item
            return resto
          }),
        }
      : v
  )

  return <ReportesView ventas={ventasParaVista} config={config} rol={rol} />
}
