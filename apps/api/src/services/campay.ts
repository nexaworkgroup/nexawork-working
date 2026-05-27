// Campay Mobile Money Service
// Docs: https://documenter.getpostman.com/view/2391374/T1LV8PVA

const CAMPAY_BASE = process.env.CAMPAY_BASE_URL || 'https://demo.campay.net/api'
const CAMPAY_USERNAME = process.env.CAMPAY_USERNAME || ''
const CAMPAY_PASSWORD = process.env.CAMPAY_PASSWORD || ''

let cachedToken: { token: string; expires: number } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token

  const res = await fetch(`${CAMPAY_BASE}/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: CAMPAY_USERNAME, password: CAMPAY_PASSWORD })
  })

  if (!res.ok) throw new Error('Campay auth failed: ' + res.status)
  const data = await res.json()
  cachedToken = { token: data.token, expires: Date.now() + 55 * 60 * 1000 }
  return data.token
}

export async function initiateMobilePayment({
  amount, currency = 'XAF', phone, description, externalReference, redirectUrl
}: {
  amount: number; currency?: string; phone: string
  description: string; externalReference: string; redirectUrl?: string
}) {
  if (!CAMPAY_USERNAME || !CAMPAY_PASSWORD) {
    throw new Error('Campay not configured. Add CAMPAY_USERNAME + CAMPAY_PASSWORD to env vars.')
  }

  // Normalise phone to 237XXXXXXXXX format
  const clean = phone.replace(/^\+237/, '').replace(/^0/, '').replace(/\s|-/g, '')
  const fullPhone = `237${clean}`

  const token = await getToken()
  const res = await fetch(`${CAMPAY_BASE}/collect/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
    body: JSON.stringify({
      amount: String(amount), currency, from: fullPhone,
      description, external_reference: externalReference,
      redirect_url: redirectUrl || `${process.env.FRONTEND_URL}/subscription/success`
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || err.message || 'Payment initiation failed')
  }

  const data = await res.json()
  console.log('[Campay] Initiated:', data)
  return data
}

export async function checkPaymentStatus(reference: string): Promise<string> {
  const token = await getToken()
  const res = await fetch(`${CAMPAY_BASE}/transaction/${reference}/`, {
    headers: { 'Authorization': `Token ${token}` }
  })
  if (!res.ok) throw new Error('Failed to check status')
  const data = await res.json()
  return data.status // SUCCESSFUL | FAILED | PENDING
}
