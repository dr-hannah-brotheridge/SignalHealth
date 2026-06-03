'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // Change this path if your client is located elsewhere
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    // 1. Update the password using the active recovery session
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setMessage(`Error: ${updateError.message}`)
      setLoading(false)
      return
    }

    setMessage('Password updated successfully! Clearing session...')

    // 2. Immediately sign them out so they don't stay logged in
    await supabase.auth.signOut()

    // 3. Send them directly back to your sign-in page
    setTimeout(() => {
      router.push('/') // If your main login page is your homepage, keep this as '/' or change to '/login'
    }, 2000)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 absolute inset-0 z-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-950 mb-2">Create New Password</h2>
        <p className="text-sm text-gray-500 mb-6">Please enter a secure new password for your SignalHealth account.</p>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-black"
            required
            minLength={6}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 text-white py-2 rounded-lg font-semibold hover:bg-emerald-600 disabled:bg-emerald-300"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        
        {message && <p className="mt-4 text-sm text-center font-medium text-emerald-600">{message}</p>}
      </div>
    </div>
  )
}