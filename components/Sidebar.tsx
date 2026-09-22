'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/inventario', label: 'Inventario', icon: '📦' },
  { href: '/punto-de-venta', label: 'Punto de Venta', icon: '🛒' },
  { href: '/reportes', label: 'Reportes', icon: '📈' },
  { href: '/historial', label: 'Historial de Stock', icon: '📜' },
  { href: '/empleados', label: 'Empleados', icon: '👥' },
  { href: '/configuracion', label: 'Configuración', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  async function cerrarSesion() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
       <aside className="w-64 h-screen sticky top-0 bg-[#161922] border-r border-gray-800 flex flex-col p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">🏪</span>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Stock Productos</h1>
          <p className="text-xs text-gray-500">2026</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-800 pt-3 mt-3">
        {email && (
          <p className="text-gray-500 text-xs px-2 mb-2 truncate" title={email}>
            {email}
          </p>
        )}
        <button
          onClick={cerrarSesion}
          className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
