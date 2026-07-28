'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/inventario', label: 'Inventario', icon: '📦' },
  { href: '/punto-de-venta', label: 'Punto de Venta', icon: '🛒' },
  { href: '/reportes', label: 'Reportes', icon: '📈' },
  { href: '/configuracion', label: 'Configuración', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-[#161922] border-r border-gray-800 flex flex-col p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">🏪</span>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Stock Productos</h1>
          <p className="text-xs text-gray-500">2026</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
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
    </aside>
  )
}
