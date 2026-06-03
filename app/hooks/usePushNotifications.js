import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Helper function to convert your VAPID public key string into a format the browser requires
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const supabase = createClientComponentClient()

  const subscribeToPush = async () => {
    try {
      // 1. Verify that the browser actually supports push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications are not supported on this browser/device.')
        return null
      }

      // 2. Wait for the service worker we created to be ready
      const registration = await navigator.serviceWorker.ready

      // 3. Request permission from the user's phone OS
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied by user.')
      }

      // 4. Generate the unique device subscription token using your VAPID Public Key
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      }

      let subscription = await registration.pushManager.getSubscription()
      
      // If the device isn't subscribed yet, create a new subscription token
      if (!subscription) {
        subscription = await registration.pushManager.subscribe(subscribeOptions)
      }

      // 5. Save this token straight to your Supabase table
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User must be logged in to subscribe.')

      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          subscription: subscription.toJSON(),
        })

      if (error && error.code !== '23505') { // Ignore duplicate keys error if they subscribe twice
        throw error
      }

      return true
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err)
      return false
    }
  }

  return { subscribeToPush }
}