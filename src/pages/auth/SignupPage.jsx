import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { api } from '../../lib/axios'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  role: z.enum(['teacher','student']).default('student'),
})

export function SignupPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', role: 'student' },
  })

  async function onSubmit(values) {
    setServerError('')
    try {
      const res = await api.post('/auth/register', values)
      const token = res.data?.tokens?.accessToken
      if (token) localStorage.setItem('token', token)
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
      const role = (res.data?.user?.role || 'student').toLowerCase()
      if (role === 'admin') navigate('/a/dashboard')
      else if (role === 'teacher') navigate('/t')
      else navigate('/s')
    } catch (e) {
      setServerError(e?.response?.data?.message || 'Signup failed')
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
        <div className="h-full w-full flex items-end p-12 relative z-10">
          
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
            <div className="text-2xl font-semibold">Create account</div>
            <div className="text-sm text-gray-500">Join as a student or teacher.</div>
          </div>

          {serverError && <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md px-3 py-2" role="alert">{serverError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="text-sm" htmlFor="name">Full name</label>
              <input id="name" className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary" {...register('name')} />
              {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name.message}</div>}
            </div>

            <div>
              <label className="text-sm" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary" {...register('email')} />
              {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email.message}</div>}
            </div>

            <div>
              <label className="text-sm" htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="new-password" className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline:none focus:ring-2 focus:ring-primary" {...register('password')} />
              {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password.message}</div>}
            </div>

            <div>
              <label className="text-sm">Role</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {['student','teacher'].map((r) => (
                  <label key={r} className="cursor-pointer">
                    <input type="radio" value={r} {...register('role')} className="peer hidden" />
                    <div className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 text-center text-sm transition-colors peer-checked:border-primary-600 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 peer-checked:text-primary-700 dark:peer-checked:text-primary-300 peer-checked:ring-2 peer-checked:ring-primary-400">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
              <Button type="button" variant="outline" className="w-full h-10" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            By signing up you agree to our <span className="underline">Terms</span> and <span className="underline">Privacy</span>.
          </div>
        </div>
      </div>
    </div>
  )
}
