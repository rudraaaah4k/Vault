import type { Metadata, Viewport } from 'next'
import React from 'react'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import './vault.css'

export const metadata: Metadata = {
  title: 'Vault — Fault-Tolerant Distributed Object Store',
  description:
    'Persistent distributed object storage with configurable replication, verified reads, resumable uploads, consensus metadata and automatic replica repair.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#15181e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
