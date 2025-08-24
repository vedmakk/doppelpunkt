// Bun on Linux can crash when mocking deep ESM subpaths or
// mixing dynamic imports and mocks.
// Mocking a local wrapper avoids that.
// Therefore we replaced dynamic Firestore imports with static and
// routed through this local wrapper
export {
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
