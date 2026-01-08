import './globals.css'

export const metadata = {
  title: 'Shopify Cart Recovery',
  description: 'Cart abandonment recovery with Vapi integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}