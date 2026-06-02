'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SummaryPage() {
  const [profile, setProfile] = useState(null)
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUser(user)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
      if (data?.gp_summary) {
        setSummary(data.gp_summary)
        setGenerated(true)
      }
    }
    getProfile()
  }, [])

  const generateSummary = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ profile, userId: user.id })
    })
    const data = await res.json()
    setSummary(data.summary)
    setGenerated(true)
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      
      {/* Branded Header Banner */}
      <div className="bg-emerald-50 border-b border-emerald-100/30 px-4 py-4">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-base font-bold">♥</span>
            </div>
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-gray-950">
                Signal<span className="text-emerald-600">Health</span>
              </span>
              <p className="text-xs text-gray-500 font-medium">GP Clinical Summary</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            SignalHealth can generate a structured summary of your health profile and recent concerns that you can share with your GP or specialist.
          </p>
        </div>

        {!generated && (
          <button
            onClick={generateSummary}
            disabled={loading || !profile}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 text-base font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Generating your summary...' : 'Generate GP Summary'}
          </button>
        )}

        {generated && summary && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="border-b border-gray-50 pb-2">
              <h2 className="text-base font-semibold text-gray-800">Your GP Summary</h2>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50/50 p-4 rounded-xl border border-gray-100 font-sans">
              {summary}
            </div>
            
            <div className="space-y-2 pt-2">
              <button
                onClick={() => { navigator.clipboard.writeText(summary); alert('Copied to clipboard!') }}
                className="w-full border border-emerald-500 text-emerald-600 rounded-2xl py-3 text-base font-medium hover:bg-emerald-50 transition-colors shadow-sm"
              >
                Copy to clipboard
              </button>
              <button
                onClick={generateSummary}
                disabled={loading}
                className="w-full border border-gray-200 text-gray-500 rounded-2xl py-3 text-base font-medium hover:bg-gray-50 transition-colors"
              >
                {loading ? 'Regenerating...' : 'Update Summary'}
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center italic">
          This summary is generated from your health profile and conversations. Always review before sharing with a healthcare provider.
        </p>

      </div>
    </div>
  )
}