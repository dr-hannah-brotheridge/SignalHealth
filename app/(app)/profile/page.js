'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    getProfile()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-400 text-lg">Loading your profile...</p>
    </div>
  )

  const fields = [
    { label: 'Name', value: profile?.name },
    { label: 'Age', value: profile?.age },
    { label: 'Gender', value: profile?.gender },
    { label: 'Ethnicity', value: profile?.ethnicity },
    { label: 'Medications', value: profile?.medications },
    { label: 'Known health problems', value: profile?.known_health_problems },
    { label: 'Family history', value: profile?.family_history },
    { label: 'Allergies', value: profile?.allergies },
    { label: 'Alcohol and smoking', value: profile?.alcohol_and_smoking },
    { label: 'Surgeries', value: profile?.surgeries },
  ]

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">My Health Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Built from your conversations with SignalHealth</p>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">

        {/* Helpful Tip Banner for changing profile data */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Need to make adjustments?</h3>
            <p className="text-sm text-amber-800 mt-0.5 leading-relaxed">
              To alter your profile, just let me know in that chat!
            </p>
          </div>
        </div>

        {/* Health Summary */}
        {profile?.health_summary && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <h2 className="text-base font-semibold text-emerald-800 mb-2">Health Summary</h2>
            <p className="text-sm text-emerald-700 leading-relaxed">{profile.health_summary}</p>
          </div>
        )}

        {/* Personal Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Personal Details</h2>
          </div>
          {fields.slice(0, 4).map((field, i) => (
            <div key={i} className={`px-4 py-3 flex justify-between items-start ${i !== 3 ? 'border-b border-gray-50' : ''}`}>
              <span className="text-sm text-gray-500 w-1/2">{field.label}</span>
              <span className="text-sm text-gray-800 font-medium text-right w-1/2">
                {field.value || <span className="text-gray-300">Not recorded</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Medical Information</h2>
          </div>
          {fields.slice(4).map((field, i) => (
            <div key={i} className={`px-4 py-3 flex justify-between items-start ${i !== 5 ? 'border-b border-gray-50' : ''}`}>
              <span className="text-sm text-gray-500 w-1/2">{field.label}</span>
              <span className="text-sm text-gray-800 font-medium text-right w-1/2">
                {field.value || <span className="text-gray-300">Not recorded</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Health Story */}
        {profile?.health_story && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-base font-semibold text-gray-800 mb-2">Health Story</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{profile.health_story}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pb-4">
          This profile is updated automatically as you chat with SignalHealth
        </p>
      </div>
    </div>
  )
}