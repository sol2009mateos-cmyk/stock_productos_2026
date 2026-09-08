import { supabase } from '@/lib/supabaseClient'
import HistorialStockView from '@/components/HistorialStockView'

export const dynamic = 'force-dynamic'

export default async function HistorialPage() {
  const { data: movimientos } = await supabase
    .from('movimientos_stock')
    .select('*, productos(nombre)')
    .order('creado_en', { ascending: false })
    .limit(200)

  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre')
    .order('nombre', { ascending: true })

  return <HistorialStockView movimientos={movimientos ?? []} productos={productos ?? []} />
}
