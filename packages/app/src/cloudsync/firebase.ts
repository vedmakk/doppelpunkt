// Lazy Firebase initialization helpers. While Firebase modules are imported statically,
// Firebase services are only initialized when getFirebase() is called, keeping auth cookies out until cloud is enabled.

import { getApps, getApp, initializeApp, type FirebaseApp } from 'firebase/app'
import type { User, Auth } from 'firebase/auth'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore'
import { connectAuthEmulator } from 'firebase/auth'

export type FirebaseServices = {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

export type FirebaseUser = User

// Singleton state for lazy initialization
class FirebaseManager {
  private services: FirebaseServices | null = null
  private initPromise: Promise<FirebaseServices> | null = null
  private emulatorsConnected = false

  async getServices(): Promise<FirebaseServices> {
    if (this.services) {
      return this.services
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.initializeServices()
    return this.initPromise
  }

  private async initializeServices(): Promise<FirebaseServices> {
    // Use static imports for Firebase modules
    const app = this.initializeApp()
    const auth = getAuth(app)
    const db = this.initializeFirestore(app)

    await this.connectEmulatorsIfNeeded(auth, db)

    const services = { app, auth, db }
    this.services = services
    return services
  }

  private initializeApp() {
    if (getApps().length > 0) {
      return getApp()
    }

    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

    return initializeApp(config)
  }

  private initializeFirestore(app: FirebaseApp) {
    try {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
    } catch {
      // Firestore already initialized - reuse existing instance
      return getFirestore(app)
    }
  }

  private async connectEmulatorsIfNeeded(auth: Auth, db: Firestore) {
    const shouldConnectEmulators =
      !this.emulatorsConnected &&
      import.meta.env.DEV &&
      import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

    if (!shouldConnectEmulators) {
      return
    }

    try {
      connectAuthEmulator(auth, 'http://localhost:9099', {
        disableWarnings: true,
      })
      connectFirestoreEmulator(db, 'localhost', 8080)
      this.emulatorsConnected = true
    } catch {
      // Silently ignore emulator connection errors
    }
  }
}

// Create singleton instance
const firebaseManager = new FirebaseManager()

// Public API - maintains the same interface as before
export async function getFirebase(): Promise<FirebaseServices> {
  return firebaseManager.getServices()
}
