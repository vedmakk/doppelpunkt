import { WritingMode } from '../../mode/modeSlice'

export interface SanitizationResult {
  text: string
  cursorPos: number
}

export interface SanitizationContext {
  originalText: string
  originalCursorPos: number
  mode: WritingMode
}

export type StorageContext = SanitizationContext

export interface PresentationContext {
  text: string
  cursorPos: number
  // Additional context specific to presentation
  maxCharsPerLine?: number
}

export interface TransformResult {
  text: string
  cursorPos: number
}

export interface StorageSanitizer {
  name: string
  sanitize(text: string, context: StorageContext): SanitizationResult
}

export interface PresentationTransformer {
  name: string
  transform(text: string, context: PresentationContext): TransformResult
}
