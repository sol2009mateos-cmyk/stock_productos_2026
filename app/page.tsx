import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Stock Productos 2026</h1>
        <p style={{ color: 'red' }}>Error al traer productos: {error.message}</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Stock Productos 2026</h1>
      <p>Productos cargados: {productos?.length ?? 0}</p>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
            <th style={{ padding: '8px' }}>Nombre</th>
            <th style={{ padding: '8px' }}>Categoría</th>
            <th style={{ padding: '8px' }}>Precio</th>
            <th style={{ padding: '8px' }}>Stock</th>
          </tr>
        </thead>
        <tbody>
          {productos?.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px' }}>{p.nombre}</td>
              <td style={{ padding: '8px' }}>{p.categoria}</td>
              <td style={{ padding: '8px' }}>${p.precio}</td>
              <td style={{ padding: '8px' }}>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
