import { StorageSanitizer, SanitizationResult, StorageContext } from '../types'
import { characterSanitizer } from './sanitizers'

class StorageSanitizationPipeline {
  private sanitizers: StorageSanitizer[] = []

  constructor(sanitizers: StorageSanitizer[]) {
    this.sanitizers = sanitizers
  }

  sanitize(text: string, context: StorageContext): SanitizationResult {
    let result: SanitizationResult = {
      text,
      cursorPos: context.originalCursorPos,
    }

    // Apply each sanitizer in sequence
    for (const sanitizer of this.sanitizers) {
      const sanitizerContext: StorageContext = {
        ...context,
        originalText: result.text,
        originalCursorPos: result.cursorPos,
      }

      result = sanitizer.sanitize(result.text, sanitizerContext)
    }

    return result
  }

  addSanitizer(sanitizer: StorageSanitizer): void {
    this.sanitizers.push(sanitizer)
  }

  removeSanitizer(name: string): void {
    this.sanitizers = this.sanitizers.filter((s) => s.name !== name)
  }

  getSanitizers(): readonly StorageSanitizer[] {
    return [...this.sanitizers]
  }
}

// Default pipeline with the character sanitizer
export const storagePipeline = new StorageSanitizationPipeline([
  characterSanitizer,
])

export { StorageSanitizationPipeline }
