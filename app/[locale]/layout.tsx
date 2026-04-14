import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Sovereign',
  description: 'Pay to reign. The last one to pay has their name displayed for the world to see.',
  openGraph: {
    title: 'Sovereign',
    description: 'Pay to reign.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const validLocales = ['en', 'pt']
  if (!validLocales.includes(locale)) notFound()

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
