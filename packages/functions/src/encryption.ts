/**
 * Encryption utilities for API key storage
 *
 * Uses envelope encryption with:
 * - HKDF for per-user key derivation from master key
 * - AES-256-GCM for authenticated encryption
 */

import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits for AES-256

export interface EncryptedData {
  encrypted: string // base64 encoded ciphertext
  iv: string // base64 encoded IV
  authTag: string // base64 encoded authentication tag
  version: number // key version for future rotation support
}

/**
 * Derives a unique encryption key for a user from the master key using HKDF
 *
 * @param masterKey - The master encryption key (from Firebase secrets)
 * @param userId - The user's Firebase UID
 * @returns A 32-byte derived key unique to this user
 */
export function deriveUserKey(masterKey: string, userId: string): Buffer {
  // Use HKDF (HMAC-based Key Derivation Function)
  // - Salt: userId (ensures unique keys per user)
  // - Info: application-specific context string
  const derivedKey = crypto.hkdfSync(
    'sha256',
    Buffer.from(masterKey, 'utf8'),
    Buffer.from(userId, 'utf8'), // salt
    'doppelpunkt-api-key-encryption', // info
    KEY_LENGTH,
  )
  // hkdfSync returns ArrayBuffer in Bun, convert to Buffer
  return Buffer.from(derivedKey)
}

/**
 * Encrypts an API key using AES-256-GCM with a user-derived key
 *
 * @param apiKey - The plaintext API key to encrypt
 * @param masterKey - The master encryption key
 * @param userId - The user's Firebase UID
 * @returns Encrypted data with IV and auth tag
 */
export function encryptApiKey(
  apiKey: string,
  masterKey: string,
  userId: string,
): EncryptedData {
  const userKey = deriveUserKey(masterKey, userId)
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  // Use userId as additional authenticated data (AAD)
  // This binds the ciphertext to this specific user
  cipher.setAAD(Buffer.from(userId, 'utf8'))

  let encrypted = cipher.update(apiKey, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    version: 1, // Current key version
  }
}

/**
 * Decrypts an API key using AES-256-GCM with a user-derived key
 *
 * @param encryptedData - The encrypted data object
 * @param masterKey - The master encryption key
 * @param userId - The user's Firebase UID
 * @returns The decrypted API key
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decryptApiKey(
  encryptedData: EncryptedData,
  masterKey: string,
  userId: string,
): string {
  const userKey = deriveUserKey(masterKey, userId)
  const iv = Buffer.from(encryptedData.iv, 'base64')
  const authTag = Buffer.from(encryptedData.authTag, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, userKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })

  decipher.setAuthTag(authTag)

  // Use userId as additional authenticated data (AAD)
  // Must match the AAD used during encryption
  decipher.setAAD(Buffer.from(userId, 'utf8'))

  let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
