import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

const locales = ['en', 'pt'] as const

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as (typeof locales)[number])) notFound()
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
