import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'
import { initiateMobilePayment, checkPaymentStatus } from '../services/campay.js'

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  seeker_pro:   { monthly: 2500,  yearly: 25000  },
  employer_pro: { monthly: 15000, yearly: 150000 },
}

export async function subscriptionRoutes(app: FastifyInstance) {

  // POST /subscriptions/initiate
  app.post('/subscriptions/initiate', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { plan_id, billing, payment_method, phone } = request.body as any

    if (!PLAN_PRICES[plan_id]) return reply.status(400).send({ error: 'Invalid plan' })

    const price = PLAN_PRICES[plan_id][billing as 'monthly' | 'yearly']

    // Create pending subscription record
    const { data: sub, error } = await supabase.from('subscriptions').insert({
      user_id: id, plan_id, billing_cycle: billing,
      payment_method, phone: phone || null,
      amount: price, currency: 'XAF', status: 'pending'
    }).select().single()

    if (error) return reply.status(500).send({ error: error.message })

    // === MOBILE MONEY (Orange / MTN via Campay) ===
    if (payment_method === 'orange' || payment_method === 'mtn') {
      if (!phone) return reply.status(400).send({ error: 'Phone number required for mobile payment' })

      try {
        const result = await initiateMobilePayment({
          amount: price,
          phone,
          description: `NexaWork ${plan_id} - ${billing}`,
          externalReference: sub.id,
          redirectUrl: `${process.env.FRONTEND_URL}/subscription/success?sub=${sub.id}`
        })

        // Save Campay reference
        await supabase.from('subscriptions')
          .update({ campay_reference: result.reference })
          .eq('id', sub.id)

        return reply.send({
          success: true,
          subscription_id: sub.id,
          reference: result.reference,
          ussd_code: result.ussd_code,
          pending: true,
          message: `Payment request sent to ${phone}. ${result.ussd_code ? `USSD: ${result.ussd_code}` : 'Approve on your phone.'}`
        })
      } catch (e: any) {
        console.error('[Campay] Error:', e.message)
        // Fall through to manual flow if Campay not configured
        return reply.send({
          success: true,
          subscription_id: sub.id,
          pending: true,
          manual: true,
          message: `We'll process your ${payment_method === 'orange' ? 'Orange Money' : 'MTN MoMo'} payment manually. You'll receive a confirmation within 1 hour.`,
          instructions: payment_method === 'orange'
            ? `Send ${price.toLocaleString()} XAF to Orange Money: *144*1*${phone}#`
            : `Send ${price.toLocaleString()} XAF to MTN MoMo: *126*amount*number#`
        })
      }
    }

    // === STRIPE (Card) ===
    if (payment_method === 'card') {
      const stripeKey = process.env.STRIPE_SECRET_KEY
      if (!stripeKey) {
        return reply.send({
          pending: true, subscription_id: sub.id,
          message: 'Card payments coming soon. Please use Orange Money or MTN MoMo for now.'
        })
      }
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeKey)
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{ price_data: {
            currency: 'xaf',
            product_data: { name: `NexaWork ${plan_id} - ${billing}` },
            unit_amount: price
          }, quantity: 1 }],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/subscription/success?sub=${sub.id}`,
          cancel_url: `${process.env.FRONTEND_URL}/pricing`,
          metadata: { subscription_id: sub.id, user_id: id, plan_id }
        })
        return reply.send({ checkout_url: session.url, subscription_id: sub.id })
      } catch (e: any) {
        return reply.status(500).send({ error: 'Card payment failed: ' + e.message })
      }
    }

    return reply.status(400).send({ error: 'Unknown payment method' })
  })

  // GET /subscriptions/status/:reference — poll payment status
  app.get('/subscriptions/status/:reference', { preHandler: authenticate }, async (request, reply) => {
    const { reference } = request.params as { reference: string }
    try {
      const status = await checkPaymentStatus(reference)
      if (status === 'SUCCESSFUL') {
        // Activate subscription
        const { data: sub } = await supabase.from('subscriptions')
          .update({ status: 'active' }).eq('campay_reference', reference)
          .select().single()
        if (sub) await supabase.from('users').update({ plan: sub.plan_id }).eq('id', sub.user_id)
      }
      return reply.send({ status })
    } catch (e: any) {
      return reply.status(500).send({ error: e.message })
    }
  })

  // GET /subscriptions/my
  app.get('/subscriptions/my', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase.from('subscriptions').select('*')
      .eq('user_id', id).in('status', ['active', 'pending'])
      .order('created_at', { ascending: false }).limit(1)
    return reply.send({ subscription: data?.[0] || null })
  })

  // POST /subscriptions/webhook/campay
  app.post('/subscriptions/webhook/campay', async (request, reply) => {
    const { reference, status } = request.body as any
    console.log('[Campay Webhook]', { reference, status })
    if (status === 'SUCCESSFUL') {
      const { data: sub } = await supabase.from('subscriptions')
        .update({ status: 'active' }).eq('campay_reference', reference)
        .select().single()
      if (sub) await supabase.from('users').update({ plan: sub.plan_id }).eq('id', sub.user_id)
    }
    return reply.send({ received: true })
  })
}
