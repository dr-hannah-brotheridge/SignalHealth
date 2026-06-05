'use client'
import { useEffect } from 'react'
import { logEnvironmentStatus } from '../lib/env'

export default function ClientLayout({ children }) {
  useEffect(() => {
    // Log environment status on startup
    logEnvironmentStatus()

    // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered successfully:', registration.scope)
            
            // Wait for service worker to be ready
            if (registration.waiting) {
              console.log('Service Worker is waiting, activating...')
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }
            
            // Check if service worker is already active
            if (registration.active) {
              console.log('Service Worker is already active')
            }
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
              console.log('New Service Worker found, installing...')
              const newWorker = registration.installing
              newWorker.addEventListener('statechange', () => {
                console.log('Service Worker state:', newWorker.state)
              })
            })
          })
          .catch((err) => {
            console.error('Service Worker registration failed:', err)
          })
      } else {
        console.warn('Service Workers are not supported in this browser')
      }
    }, [])

    return <>{children}</>
  }
