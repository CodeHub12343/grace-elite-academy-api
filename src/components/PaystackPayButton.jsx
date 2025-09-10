import { useState } from 'react'
import { Button } from './ui/Button'
import { PAYSTACK_PUBLIC_KEY } from '../config'
import { paymentsApi } from '../lib/api'

export default function PaystackPayButton({ studentId, feeId, amount, onInitiated, className = '', children }) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!studentId || !feeId || !amount) {
      try { window?.toast?.error?.('Missing payment details') } catch {}
      return
    }
    setLoading(true)
    try {
      const init = await paymentsApi.initiate({ studentId, feeId, amount })
      // Optionally call callback
      onInitiated && onInitiated(init)

      const authUrl = init?.data?.authorization_url || init?.authorization_url
      if (!authUrl) {
        throw new Error('Failed to get authorization URL')
      }

      // Redirect to Paystack hosted page
      window.location.href = authUrl
    } catch (e) {
      try { window?.toast?.error?.(e.message) } catch {}
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Redirecting...' : (children || 'Pay with Paystack')}
    </Button>
  )
}














