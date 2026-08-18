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

  const { data: favoritos } = await supabase
    .from('favoritos')
    .select('*, productos(id, nombre, precio, stock)')
    .order('id', { ascending: true })

  return (
    <POS
      productosIniciales={productos ?? []}
      config={config}
      favoritosIniciales={favoritos ?? []}
    />
  )
}
