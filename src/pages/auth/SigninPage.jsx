import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { api } from '../../lib/axios'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
})

export function SigninPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values) {
    setServerError('')
    try {
      const res = await api.post('/auth/login', values)
      const token = res.data?.tokens?.accessToken
      if (token) {
        localStorage.setItem('accessToken', token)
        // Also store as 'token' for backward compatibility
        localStorage.setItem('token', token)
      }
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      const role = (res.data?.user?.role || 'student').toLowerCase()
      if (role === 'teacher') navigate('/t')
      else if (role === 'student') navigate('/s')
      else navigate('/a/dashboard')
    } catch (e) {
      setServerError(e?.response?.data?.message || 'Sign in failed')
    }
  }

  const bannerUrl = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1920&auto=format&fit=crop'

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div
        className="relative hidden lg:block"
        style={{ backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="h-full w-full flex items=end p-12 relative z-10">
         
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-3">
              <img src="/WhatsApp_Image_2025-09-09_at_7.35.33_AM-removebg-preview.png" alt="Grace Elite Academy" className="h-10 w-10 object-contain" />
              <div className="text-lg font-bold">Grace Elite Academy</div>
            </div>
          </div>
          <div className="mb-6 text-center">
            <div className="text-2xl font-semibold">Log in</div>
            <div className="text-sm text-gray-500">Use your email and password.</div>
          </div>

          {serverError && <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md px-3 py-2" role="alert">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="text-sm" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" autoFocus required aria-invalid={!!errors.email} className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary" {...register('email')} />
              {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email.message}</div>}
            </div>

            <div>
              <label className="text-sm" htmlFor="password">Password</label>
              <div className="mt-1 relative">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required aria-invalid={!!errors.password} className="w-full pr-24 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary" {...register('password')} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded border">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password.message}</div>}
            </div>

            <div className="pt-2 space-y-2">
              <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </Button>
              <Button type="button" variant="outline" className="w-full h-10" onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </div>
          </form>

          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            Forgot your password? <Link to="/forgot-password" className="text-primary underline">Reset it</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
