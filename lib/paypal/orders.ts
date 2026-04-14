import { getPayPalAccessToken } from './auth'

type CreateOrderResult = { approvalUrl: string; orderId: string }

export async function createPayPalOrder(
  handle: string,
  network: string,
  priceInCents: number
): Promise<CreateOrderResult> {
  const accessToken = await getPayPalAccessToken()
  const priceInDollars = (priceInCents / 100).toFixed(2)

  const res = await fetch(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: priceInDollars },
          custom_id: `${handle}|${network}`,
          description: 'Sovereign — Claim the Throne',
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
        brand_name: 'Sovereign',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayPal order creation failed: ${err}`)
  }

  const order = await res.json()
  const approvalUrl = order.links.find((l: { rel: string; href: string }) => l.rel === 'approve')?.href

  if (!approvalUrl) throw new Error('No approval URL in PayPal response')

  return { approvalUrl, orderId: order.id }
}
