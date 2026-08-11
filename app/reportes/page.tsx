import { supabase } from '@/lib/supabaseClient'
import ReportesView from '@/components/ReportesView'

export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const { data: ventas } = await supabase
    .from('ventas')
    .select('*, venta_items(cantidad, subtotal, producto_id, productos(nombre))')
    .order('fecha', { ascending: false })

  return <ReportesView ventas={ventas ?? []} />
}
