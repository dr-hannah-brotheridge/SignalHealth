'use client'
import { useState, useEffect } from 'react'

const TESTIMONIALS = [
  {
    type: 'memory',
    icon: '🧠',
    text: 'Your health story, remembered',
    subtext: 'Every conversation builds a more complete picture'
  },
  {
    type: 'doctor',
    icon: '👨‍⚕️',
    text: 'Make every 15-minute appointment count',
    subtext: 'Arrive prepared with a complete health history'
  },
  {
    type: 'pattern',
    icon: '🔍',
    text: 'Connect the dots',
    subtext: 'Identify patterns you might have missed between appointments'
  },
  {
    type: 'proactive',
    icon: '📊',
    text: 'Health tracking that works',
    subtext: 'No journals to maintain, just natural conversation'
  },
  {
    type: 'clinical',
    icon: '✅',
    text: 'Built by clinicians, for better care',
    subtext: 'Safe escalation without playing doctor'
  },
  {
    type: 'empowerment',
    icon: '💪',
    text: 'Never forget a symptom again',
    subtext: 'Your health timeline, always accessible'
  },
  {
    type: 'prepared',
    icon: '📋',
    text: 'Speak confidently with your doctor',
    subtext: 'Arrive organized, not overwhelmed'
  },
  {
    type: 'longitudinal',
    icon: '📈',
    text: 'Unlike symptom checkers that forget',
    subtext: 'SignalHealth remembers your entire health journey'
  }
]

export default function SocialProofBanner({ variant = 'default' }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
        setIsVisible(true)
      }, 300)
    }, 8000) // Change every 8 seconds

    return () => clearInterval(interval)
  }, [])

  const current = TESTIMONIALS[currentIndex]

  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100/50 rounded-2xl p-3 shadow-sm">
        <div 
          className={`flex items-center gap-3 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-2xl flex-shrink-0">{current.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {current.text}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {current.subtext}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 border border-teal-100/50 rounded-2xl p-4 shadow-sm">
      <div 
        className={`flex items-start gap-4 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
          <span className="text-2xl">{current.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {current.text}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {current.subtext}
          </p>
        </div>
      </div>
      
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {TESTIMONIALS.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => {
                setCurrentIndex(index)
                setIsVisible(true)
              }, 300)
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-6 bg-teal-600'
                : 'w-1.5 bg-teal-200 hover:bg-teal-300'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}