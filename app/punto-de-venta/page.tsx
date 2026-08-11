import { supabase } from '@/lib/supabaseClient'
import POS from '@/components/POS'

export const dynamic = 'force-dynamic'

export default async function PuntoDeVentaPage() {
  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })

  const { data: config } = await supabase
    .from('config')
    .select('*')
    .eq('id', 1)
    .single()

  return <POS productosIniciales={productos ?? []} config={config} />
}
