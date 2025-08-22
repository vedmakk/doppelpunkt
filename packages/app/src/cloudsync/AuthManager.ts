// Authentication state management for cloud sync
// Handles Firebase Auth operations and user state management

import { getFirebase, type FirebaseUser } from './firebase'
import { setCloudUser, setCloudStatus } from './cloudSlice'

export class AuthManager {
  private authUnsubscribe: (() => void) | null = null

  async attachAuthListener(dispatch: (action: any) => void): Promise<void> {
    const { auth } = await getFirebase()
    const { onAuthStateChanged } = await import('firebase/auth')

    this.detachAuthListener()

    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(setCloudUser(this.serializeUser(user)))
        dispatch(setCloudStatus('connected'))
      } else {
        dispatch(setCloudUser(null))
        dispatch(setCloudStatus('idle'))
      }
    })
  }

  detachAuthListener(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe()
      this.authUnsubscribe = null
    }
  }

  async signOut(): Promise<void> {
    const { auth } = await getFirebase()
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
  }

  async signInWithGoogle(): Promise<void> {
    const { auth } = await getFirebase()
    const { GoogleAuthProvider, signInWithPopup } = await import(
      'firebase/auth'
    )

    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  async deleteCurrentUser(): Promise<void> {
    const { auth } = await getFirebase()
    const { deleteUser, signOut } = await import('firebase/auth')

    if (!auth.currentUser) {
      throw new Error('No signed-in user to delete')
    }

    // Store user ID for potential cleanup, though Firebase handles this automatically

    try {
      await deleteUser(auth.currentUser)
    } catch (error: any) {
      if (error?.code === 'auth/requires-recent-login') {
        await signOut(auth)
        throw new Error('Please sign in again to delete your account')
      }
      throw error
    }
  }

  isListenerAttached(): boolean {
    return this.authUnsubscribe !== null
  }

  private serializeUser(user: FirebaseUser) {
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    }
  }
}
