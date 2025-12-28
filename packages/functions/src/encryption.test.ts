import { describe, it, expect } from 'bun:test'
import { deriveUserKey, encryptApiKey, decryptApiKey } from './encryption'

describe('encryption', () => {
  const masterKey = 'test-master-key-for-encryption-purposes'
  const userId = 'user-123-abc'
  const apiKey = 'sk-test-api-key-12345678901234567890'

  describe('deriveUserKey', () => {
    it('should derive a 32-byte key', () => {
      const key = deriveUserKey(masterKey, userId)
      expect(key).toBeInstanceOf(Buffer)
      expect(key.length).toBe(32)
    })

    it('should derive same key for same inputs', () => {
      const key1 = deriveUserKey(masterKey, userId)
      const key2 = deriveUserKey(masterKey, userId)
      expect(key1.equals(key2)).toBe(true)
    })

    it('should derive different keys for different users', () => {
      const key1 = deriveUserKey(masterKey, 'user-1')
      const key2 = deriveUserKey(masterKey, 'user-2')
      expect(key1.equals(key2)).toBe(false)
    })

    it('should derive different keys for different master keys', () => {
      const key1 = deriveUserKey('master-key-1', userId)
      const key2 = deriveUserKey('master-key-2', userId)
      expect(key1.equals(key2)).toBe(false)
    })
  })

  describe('encryptApiKey', () => {
    it('should return encrypted data with all required fields', () => {
      const result = encryptApiKey(apiKey, masterKey, userId)

      expect(result).toHaveProperty('encrypted')
      expect(result).toHaveProperty('iv')
      expect(result).toHaveProperty('authTag')
      expect(result).toHaveProperty('version')

      expect(typeof result.encrypted).toBe('string')
      expect(typeof result.iv).toBe('string')
      expect(typeof result.authTag).toBe('string')
      expect(result.version).toBe(1)
    })

    it('should produce different ciphertext each time (due to random IV)', () => {
      const result1 = encryptApiKey(apiKey, masterKey, userId)
      const result2 = encryptApiKey(apiKey, masterKey, userId)

      expect(result1.encrypted).not.toBe(result2.encrypted)
      expect(result1.iv).not.toBe(result2.iv)
    })

    it('should produce valid base64 encoded strings', () => {
      const result = encryptApiKey(apiKey, masterKey, userId)

      // Should not throw when decoding base64
      expect(() => Buffer.from(result.encrypted, 'base64')).not.toThrow()
      expect(() => Buffer.from(result.iv, 'base64')).not.toThrow()
      expect(() => Buffer.from(result.authTag, 'base64')).not.toThrow()
    })

    it('should produce a 12-byte IV (96 bits)', () => {
      const result = encryptApiKey(apiKey, masterKey, userId)
      const iv = Buffer.from(result.iv, 'base64')
      expect(iv.length).toBe(12)
    })

    it('should produce a 16-byte auth tag (128 bits)', () => {
      const result = encryptApiKey(apiKey, masterKey, userId)
      const authTag = Buffer.from(result.authTag, 'base64')
      expect(authTag.length).toBe(16)
    })
  })

  describe('decryptApiKey', () => {
    it('should decrypt to the original plaintext', () => {
      const encrypted = encryptApiKey(apiKey, masterKey, userId)
      const decrypted = decryptApiKey(encrypted, masterKey, userId)

      expect(decrypted).toBe(apiKey)
    })

    it('should handle empty strings', () => {
      const encrypted = encryptApiKey('', masterKey, userId)
      const decrypted = decryptApiKey(encrypted, masterKey, userId)

      expect(decrypted).toBe('')
    })

    it('should handle long API keys', () => {
      const longApiKey = 'sk-' + 'a'.repeat(1000)
      const encrypted = encryptApiKey(longApiKey, masterKey, userId)
      const decrypted = decryptApiKey(encrypted, masterKey, userId)

      expect(decrypted).toBe(longApiKey)
    })

    it('should handle special characters', () => {
      const specialApiKey = 'sk-test_key.with/special+chars=123!@#$%'
      const encrypted = encryptApiKey(specialApiKey, masterKey, userId)
      const decrypted = decryptApiKey(encrypted, masterKey, userId)

      expect(decrypted).toBe(specialApiKey)
    })

    it('should fail with wrong master key', () => {
      const encrypted = encryptApiKey(apiKey, masterKey, userId)

      expect(() =>
        decryptApiKey(encrypted, 'wrong-master-key', userId),
      ).toThrow()
    })

    it('should fail with wrong userId', () => {
      const encrypted = encryptApiKey(apiKey, masterKey, userId)

      expect(() =>
        decryptApiKey(encrypted, masterKey, 'wrong-user-id'),
      ).toThrow()
    })

    it('should fail with tampered ciphertext', () => {
      const encrypted = encryptApiKey(apiKey, masterKey, userId)
      const tamperedEncrypted = {
        ...encrypted,
        encrypted: 'tampered' + encrypted.encrypted.slice(8),
      }

      expect(() =>
        decryptApiKey(tamperedEncrypted, masterKey, userId),
      ).toThrow()
    })

    it('should fail with tampered auth tag', () => {
      const encrypted = encryptApiKey(apiKey, masterKey, userId)
      const tamperedEncrypted = {
        ...encrypted,
        authTag: Buffer.from('0'.repeat(16)).toString('base64'),
      }

      expect(() =>
        decryptApiKey(tamperedEncrypted, masterKey, userId),
      ).toThrow()
    })

    it('should fail with tampered IV', () => {
      const encrypted = encryptApiKey(apiKey, masterKey, userId)
      const tamperedEncrypted = {
        ...encrypted,
        iv: Buffer.from('0'.repeat(12)).toString('base64'),
      }

      expect(() =>
        decryptApiKey(tamperedEncrypted, masterKey, userId),
      ).toThrow()
    })
  })

  describe('roundtrip', () => {
    it('should handle multiple encrypt/decrypt cycles', () => {
      for (let i = 0; i < 10; i++) {
        const testKey = `sk-test-key-${i}-${Date.now()}`
        const encrypted = encryptApiKey(testKey, masterKey, userId)
        const decrypted = decryptApiKey(encrypted, masterKey, userId)
        expect(decrypted).toBe(testKey)
      }
    })

    it('should work with different users', () => {
      const users = ['user-1', 'user-2', 'user-3']

      for (const user of users) {
        const encrypted = encryptApiKey(apiKey, masterKey, user)
        const decrypted = decryptApiKey(encrypted, masterKey, user)
        expect(decrypted).toBe(apiKey)
      }
    })
  })
})
