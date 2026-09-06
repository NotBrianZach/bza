'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { auth } from '@/lib/supabase'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'

const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetForm) => {
    try {
      setError(null)
      setIsLoading(true)

      await auth.resetPassword(data.email)
      
      setSuccess(true)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full card text-center">
          <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We've sent you a password reset link. Click the link in the email to reset your password.
          </p>
          <Link href="/auth/login" className="btn btn-primary">
            Return to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter your email to receive a reset link</p>
        </div>

        {/* Reset Form */}
        <div className="card">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="text-red-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner mr-2"></span>
                  Sending reset link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm text-primary-600 hover:text-primary-700">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
