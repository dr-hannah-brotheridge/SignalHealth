'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleChangePassword = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.auth.resetPasswordForEmail(user.email)
    if (error) {
      setMessage('Something went wrong. Please try again.')
    } else {
      setMessage('Password reset email sent! Check your inbox.')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Account</h2>
          </div>
          <button onClick={handleChangePassword} disabled={loading} className="w-full px-4 py-4 flex justify-between items-center border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <span className="text-base text-gray-700">Change Password</span>
            <span className="text-gray-300">›</span>
          </button>
          <button onClick={handleLogout} className="w-full px-4 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <span className="text-base text-red-500">Sign Out</span>
            <span className="text-gray-300">›</span>
          </button>
        </div>

        {message && (
          <p className="text-sm text-emerald-600 text-center">{message}</p>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Information</h2>
          </div>
          <button className="w-full px-4 py-4 flex justify-between items-center border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <span className="text-base text-gray-700">About SignalHealth</span>
            <span className="text-gray-300">›</span>
          </button>
          <button className="w-full px-4 py-4 flex justify-between items-center border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <span className="text-base text-gray-700">Medical Disclaimer</span>
            <span className="text-gray-300">›</span>
          </button>
          <button className="w-full px-4 py-4 flex justify-between items-center border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <span className="text-base text-gray-700">Privacy Policy</span>
            <span className="text-gray-300">›</span>
          </button>
          <button className="w-full px-4 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <span className="text-base text-gray-700">Terms of Service</span>
            <span className="text-gray-300">›</span>
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">SignalHealth v1.0 — Built with care</p>

      </div>
    </div>
  )
}