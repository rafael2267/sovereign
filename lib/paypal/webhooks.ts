import { getPayPalAccessToken } from './auth'

export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const accessToken = await getPayPalAccessToken()

  const res = await fetch(
    `${process.env.PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo:        headers.get('paypal-auth-algo'),
        cert_url:         headers.get('paypal-cert-url'),
        transmission_id:  headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id:       process.env.PAYPAL_WEBHOOK_ID,
        webhook_event:    JSON.parse(rawBody),
      }),
    }
  )

  if (!res.ok) return false
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}
