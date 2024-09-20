import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "./components/ui/toaster"
import ClientLayout from './ClientLayout'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MilkTrack',
  description: 'Gestión eficiente de ganado lechero',
  icons: {
    icon: '/images/vaca (13).png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>
          <ClientLayout>
            {children}
          </ClientLayout>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}