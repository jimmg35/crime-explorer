import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

const inter = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Tallahassee Crime Explorer',
  description:
    'Interactive map, time slider, and charts for Tallahassee crime incidents'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
