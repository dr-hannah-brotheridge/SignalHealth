'use client'
import { useState } from 'react'
import { usePushNotifications } from '../../hooks/usePushNotifications'

export default function CheckInOnboardingModal({ onClose }) {
  const [isEnabling, setIsEnabling] = useState(false)
  const { subscribeToPush } = usePushNotifications()

  const handleSetupCheckIns = async () => {
    setIsEnabling(true)
    
    try {
      const result = await subscribeToPush()
      
      if (result.success) {
        // Mark modal as accepted
        localStorage.setItem('checkinModalAccepted', 'true')
        
        // Navigate to settings
        window.location.href = '/settings'
      } else {
        // Show error but still allow dismissal
        alert(result.error || 'Failed to enable notifications. You can try again in Settings.')
        handleMaybeLater()
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      alert('Failed to enable notifications. You can try again in Settings.')
      handleMaybeLater()
    } finally {
      setIsEnabling(false)
    }
  }

  const handleMaybeLater = () => {
    // Mark modal as dismissed
    localStorage.setItem('checkinModalDismissed', 'true')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Keep your profile growing
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Want SignalHealth to check in with you regularly? Regular check-ins make your health profile more accurate and your GP Summary more useful.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handleSetupCheckIns}
            disabled={isEnabling}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold text-base rounded-xl py-3.5 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isEnabling ? 'Setting up...' : 'Set up check-ins'}
          </button>
          
          <button
            onClick={handleMaybeLater}
            disabled={isEnabling}
            className="w-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-base rounded-xl py-3.5 transition-colors disabled:opacity-50"
          >
            Maybe later
          </button>
        </div>

        {/* Info text */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-400 text-center">
            You can adjust your check-in schedule anytime in Settings
          </p>
        </div>
      </div>
    </div>
  )
}