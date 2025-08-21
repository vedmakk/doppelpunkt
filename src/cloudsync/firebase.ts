// Lazy Firebase initialization helpers. Importing this module does not load Firebase
// until one of the functions is called, keeping auth cookies out until cloud is enabled.

import type { User } from 'firebase/auth'

let _app: import('firebase/app').FirebaseApp | null = null
let _auth: import('firebase/auth').Auth | null = null
let _db: import('firebase/firestore').Firestore | null = null
let _initPromise: Promise<FirebaseServices> | null = null
let _emulatorsConnected = false

export type FirebaseServices = {
  app: import('firebase/app').FirebaseApp
  auth: import('firebase/auth').Auth
  db: import('firebase/firestore').Firestore
}

export async function getFirebase(): Promise<FirebaseServices> {
  if (_app && _auth && _db) {
    return { app: _app, auth: _auth, db: _db }
  }

  if (_initPromise) return _initPromise

  _initPromise = (async (): Promise<FirebaseServices> => {
    const [
      { initializeApp, getApp, getApps },
      { getAuth },
      {
        initializeFirestore,
        getFirestore,
        persistentLocalCache,
        persistentMultipleTabManager,
      },
    ] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ])

    // Expect config via Vite env. Documented in README.
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(config)
    const auth = getAuth(app)

    let db: import('firebase/firestore').Firestore
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
    } catch {
      // Firestore already initialized (possibly with same or different options).
      // Reuse existing instance to avoid duplicate initialization errors.
      db = getFirestore(app)
    }

    // Connect to emulators during development if configured
    try {
      if (
        !_emulatorsConnected &&
        import.meta.env.DEV &&
        import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
      ) {
        const { connectAuthEmulator } = await import('firebase/auth')
        const { connectFirestoreEmulator } = await import('firebase/firestore')
        connectAuthEmulator(auth, 'http://localhost:9099', {
          disableWarnings: true,
        })
        connectFirestoreEmulator(db, 'localhost', 8080)
        _emulatorsConnected = true
      }
    } catch {
      // ignore emulator connection errors
    }

    _app = app
    _auth = auth
    _db = db
    return { app, auth, db }
  })()

  return _initPromise
}

export type FirebaseUser = User
