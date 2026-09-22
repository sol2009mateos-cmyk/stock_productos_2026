import { createClient } from '@/lib/supabase/server'
import ConfiguracionForm from '@/components/ConfiguracionForm'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const supabase = createClient()
  const { data: config } = await supabase
    .from('config')
    .select('*')
    .eq('id', 1)
    .single()

  return <ConfiguracionForm config={config} />
}
