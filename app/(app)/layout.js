'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AppLayout({ children }) {
  const pathname = usePathname()

  const tabs = [
    { href: '/chat', label: 'Chat', icon: '💬' },
    { href: '/profile', label: 'Profile', icon: '👤' },
    { href: '/summary', label: 'Summary', icon: '📋' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          {tabs.map(tab => {
            const active = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                  active ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span className={`text-xs font-medium ${active ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}