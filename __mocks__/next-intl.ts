const messages: Record<string, Record<string, string>> = {
  hero: {
    currentlyReigning: 'currently reigning',
    noKing: 'No one reigns yet. Be the first.',
    claim: 'Claim the Throne — {price}',
    priceNote: 'price increases $1 with every purchase',
  },
  modal: {
    title: 'Claim the Throne',
    handleLabel: 'Your @ handle',
    handlePlaceholder: 'your handle',
    networkLabel: 'Social Network',
    pay: 'Pay {price} with Card',
    paying: 'Redirecting...',
    redirectNote: 'You will be redirected to a secure checkout page',
    moreNetworks: 'More',
    lessNetworks: 'Less',
  },
}

export const useTranslations = (ns: string) => (key: string, params?: Record<string, string>) => {
  const value = messages[ns]?.[key] ?? key
  if (!params) return value
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(`{${k}}`, String(v)),
    value
  )
}

export const useLocale = () => 'en'
