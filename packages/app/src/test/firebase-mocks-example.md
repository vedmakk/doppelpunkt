# Using Global Firebase Mocks

The Firebase mocks are now set up globally for all tests. Here's how to use them:

## Basic Usage

```typescript
import { describe, it, expect, beforeEach } from 'bun:test'
import {
  // Import the mock functions you need
  mockGetFirebase,
  mockDoc,
  mockGetDoc,
  mockSetDoc,
  mockDeleteDoc,
  mockOnSnapshot,
  mockServerTimestamp,
  mockRunTransaction,
  // Auth mocks
  mockAuth,
  mockOnAuthStateChanged,
  mockSignOut,
  mockSignInWithPopup,
  mockDeleteUser,
  mockGoogleAuthProvider,
  // Utility function to clear all mocks
  clearAllFirebaseMocks,
} from './firebase-mocks'

describe('My Component', () => {
  beforeEach(() => {
    // Clear all Firebase mocks before each test
    clearAllFirebaseMocks()
  })

  it('should work with Firebase', async () => {
    // Configure mock behavior for this specific test
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ text: 'test data', rev: 1 }),
    })

    // Your test code here...
    // The Firebase modules are already mocked globally
  })
})
```

## Available Mocks

### Firestore Mocks

- `mockGetFirebase` - Returns a mock Firebase app with db and auth
- `mockDoc` - Mock document reference
- `mockGetDoc` - Mock document getter
- `mockSetDoc` - Mock document setter
- `mockDeleteDoc` - Mock document deleter
- `mockOnSnapshot` - Mock snapshot listener
- `mockServerTimestamp` - Mock server timestamp
- `mockRunTransaction` - Mock transaction runner

### Auth Mocks

- `mockAuth` - Mock auth instance
- `mockOnAuthStateChanged` - Mock auth state listener
- `mockSignOut` - Mock sign out function
- `mockSignInWithPopup` - Mock sign in with popup
- `mockDeleteUser` - Mock user deletion
- `mockGoogleAuthProvider` - Mock Google auth provider

### Utility Functions

- `clearAllFirebaseMocks()` - Clears all Firebase mocks (use in beforeEach)

## Module Paths Covered

The global mocks cover these module paths:

- `./firebase` and `../firebase` (relative imports)
- `./cloudsync/firebase` and `../cloudsync/firebase`
- `./firestore` and `../firestore`
- `./cloudsync/firestore` and `../cloudsync/firestore`
- `firebase/firestore`
- `firebase/auth`

This means you don't need to call `mock.module()` for Firebase-related modules in your tests anymore!
