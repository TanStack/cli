import { ThemeProvider } from '@lonik/themer'
import type { ReactNode } from 'react'
import type { ThemeStorage } from '@lonik/themer'

function normalizeTheme(value: string | null) {
  return value === 'light' || value === 'dark' ? value : 'system'
}

// Keep the scaffold's existing storage format, including older open tabs.
const storage: ThemeStorage = {
  getItem(key) {
    try {
      return normalizeTheme(window.localStorage.getItem(key))
    } catch {
      return 'system'
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value === 'system' ? 'auto' : value)
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  },
  subscribe(key, callback) {
    const handleStorage = (event: StorageEvent) => {
      let localStorageArea: Storage
      try {
        localStorageArea = window.localStorage
      } catch {
        // Storage access can be revoked while this tab remains open.
        return
      }
      if (
        event.storageArea === localStorageArea &&
        (event.key === key || event.key === null)
      ) {
        callback(normalizeTheme(event.newValue))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  },
}

export default function ThemerProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      storage={storage}
      attribute={['class', 'data-theme']}
      defaultTheme="system"
    >
      {children}
    </ThemeProvider>
  )
}
