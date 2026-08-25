import { supabase } from '@/lib/supabaseClient'
import ReportesView from '@/components/ReportesView'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const { data: ventas } = await supabase
    .from('ventas')
    .select('*, venta_items(cantidad, precio_unitario, subtotal, producto_id, productos(nombre))')
    .order('fecha', { ascending: false })

  const { data: config } = await supabase
    .from('config')
    .select('*')
    .eq('id', 1)
    .single()

  return <ReportesView ventas={ventas ?? []} config={config} />
}
