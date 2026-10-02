import { createClient } from '@/lib/supabase/server'
import POS from '@/components/POS'

export const dynamic = 'force-dynamic'

export default async function PuntoDeVentaPage() {
  const supabase = createClient()
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
    .select(
      '*, productos(id, nombre, precio, stock), combos(id, nombre, combo_items(producto_id, cantidad, productos(id, nombre, precio, stock)))'
    )
    .order('id', { ascending: true })

  // El POS no necesita el costo: se saca antes de mandar los productos al navegador.
  const productosSinCosto = (productos ?? []).map((p) => {
    const { costo: _costo, ...resto } = p
    return resto
  })

  return (
    <POS
      productosIniciales={productosSinCosto}
      config={config}
      favoritosIniciales={favoritos ?? []}
    />
  )
}
