import { stripe } from './client'

type CreateSessionResult = { url: string }

export async function createCheckoutSession(
  handle: string,
  network: string,
  priceInCents: number
): Promise<CreateSessionResult> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Sovereign — Claim the Throne',
            description: `@${handle} on ${network}`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/en?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/en`,
    metadata: { handle, network },
  })

  if (!session.url) throw new Error('No URL in Stripe session')
  return { url: session.url }
}
