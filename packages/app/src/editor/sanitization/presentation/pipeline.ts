import {
  PresentationTransformer,
  TransformResult,
  PresentationContext,
} from '../types'
import { visualIndentTransformer } from './transformers'

class PresentationTransformPipeline {
  private transformers: PresentationTransformer[] = []

  constructor(transformers: PresentationTransformer[]) {
    this.transformers = transformers
  }

  transform(text: string, context: PresentationContext): TransformResult {
    let result: TransformResult = {
      text,
      cursorPos: context.cursorPos,
    }

    // Apply each transformer in sequence
    for (const transformer of this.transformers) {
      const transformerContext: PresentationContext = {
        ...context,
        text: result.text,
        cursorPos: result.cursorPos,
      }

      result = transformer.transform(result.text, transformerContext)
    }

    return result
  }

  addTransformer(transformer: PresentationTransformer): void {
    this.transformers.push(transformer)
  }

  removeTransformer(name: string): void {
    this.transformers = this.transformers.filter((t) => t.name !== name)
  }

  getTransformers(): readonly PresentationTransformer[] {
    return [...this.transformers]
  }
}

// Default pipeline with visual indent transformer
export const presentationPipeline = new PresentationTransformPipeline([
  visualIndentTransformer,
])

export { PresentationTransformPipeline }
