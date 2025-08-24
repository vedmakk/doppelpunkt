// Lazy Firebase initialization helpers. Importing this module does not load Firebase
// until one of the functions is called, keeping auth cookies out until cloud is enabled.

import type { User } from 'firebase/auth'

export type FirebaseServices = {
  app: import('firebase/app').FirebaseApp
  auth: import('firebase/auth').Auth
  db: import('firebase/firestore').Firestore
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
    // Dynamically import Firebase modules to avoid loading them until needed
    const [firebaseApp, firebaseAuth, firebaseFirestore] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ])

    const app = this.initializeApp(firebaseApp)
    const auth = firebaseAuth.getAuth(app)
    const db = this.initializeFirestore(app, firebaseFirestore)

    await this.connectEmulatorsIfNeeded(auth, db)

    const services = { app, auth, db }
    this.services = services
    return services
  }

  private initializeApp(firebaseApp: typeof import('firebase/app')) {
    const { getApps, getApp, initializeApp } = firebaseApp

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

  private initializeFirestore(
    app: import('firebase/app').FirebaseApp,
    firebaseFirestore: typeof import('firebase/firestore'),
  ) {
    const {
      initializeFirestore,
      getFirestore,
      persistentLocalCache,
      persistentMultipleTabManager,
    } = firebaseFirestore

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

  private async connectEmulatorsIfNeeded(
    auth: import('firebase/auth').Auth,
    db: import('firebase/firestore').Firestore,
  ) {
    const shouldConnectEmulators =
      !this.emulatorsConnected &&
      import.meta.env.DEV &&
      import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

    if (!shouldConnectEmulators) {
      return
    }

    try {
      const [{ connectAuthEmulator }, { connectFirestoreEmulator }] =
        await Promise.all([
          import('firebase/auth'),
          import('firebase/firestore'),
        ])

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
