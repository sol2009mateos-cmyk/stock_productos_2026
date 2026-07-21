export const metadata = {
  title: 'Stock Productos 2026',
  description: 'Sistema de stock y punto de venta',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
