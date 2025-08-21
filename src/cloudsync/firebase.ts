// Lazy Firebase initialization helpers. Importing this module does not load Firebase
// until one of the functions is called, keeping auth cookies out until cloud is enabled.

import type { User } from 'firebase/auth'

let _app: import('firebase/app').FirebaseApp | null = null
let _auth: import('firebase/auth').Auth | null = null
let _db: import('firebase/firestore').Firestore | null = null

export type FirebaseServices = {
  app: import('firebase/app').FirebaseApp
  auth: import('firebase/auth').Auth
  db: import('firebase/firestore').Firestore
}

export async function getFirebase(): Promise<FirebaseServices> {
  if (_app && _auth && _db) {
    return { app: _app, auth: _auth, db: _db }
  }

  const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
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

  _app = initializeApp(config)
  _auth = getAuth(_app)
  _db = getFirestore(_app)

  // Connect to emulators during development if configured
  try {
    if (
      import.meta.env.DEV &&
      import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
    ) {
      const { connectAuthEmulator } = await import('firebase/auth')
      const { connectFirestoreEmulator } = await import('firebase/firestore')
      connectAuthEmulator(_auth, 'http://localhost:9099', {
        disableWarnings: true,
      })
      connectFirestoreEmulator(_db, 'localhost', 8080)
    }
  } catch {
    // ignore emulator connection errors
  }

  return { app: _app, auth: _auth, db: _db }
}

export type FirebaseUser = User
