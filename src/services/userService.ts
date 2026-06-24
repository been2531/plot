import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

export interface UpdateProfileInput {
  displayName?: string
  bio?: string
}

export async function updateUserProfile(uid: string, data: UpdateProfileInput): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  )
}
