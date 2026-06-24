// Firebase Auth 상태를 구독하고 유저 정보를 반환하는 훅
import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth, googleProvider } from '@/services/firebase'

interface AuthState {
  user: User | null
  loading: boolean
}

export function useAuth(): AuthState & {
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
} {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false })
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOutUser() {
    await signOut(auth)
  }

  return { ...state, signInWithGoogle, signOutUser }
}
