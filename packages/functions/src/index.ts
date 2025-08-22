import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import * as admin from 'firebase-admin'
//import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'

// OpenAI SDK
import OpenAI from 'openai'

// Ensure admin is initialized exactly once
if (!admin.apps.length) {
  admin.initializeApp()
}

// Optional: allow setting a default API key from env for local testing, but we prefer per-user keys
//const DEFAULT_OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')

type StructuredTodo = {
  description: string
  due: string | null // ISO 8601 date string or null
}

/**
 * Firestore trigger: when user's todo document changes, attempt to extract structured todos
 * Path: users/{userId}/doc/todo
 */
export const generateStructuredTodos = onDocumentWritten(
  {
    document: 'users/{userId}/doc/todo',
    //secrets: [DEFAULT_OPENAI_API_KEY],
    region: 'europe-west1',
    retry: false,
  },
  async (event) => {
    const { userId } = event.params as { userId: string }

    const afterSnap = event.data?.after
    const beforeSnap = event.data?.before
    if (!afterSnap?.exists) {
      return
    }

    const after = afterSnap.data() as { text?: string; structuredTodos?: any }
    const before = beforeSnap?.data() as
      | { text?: string; structuredTodos?: any }
      | undefined

    // Avoid infinite loops: only run when text changed
    if (before && before.text === after.text) {
      return
    }

    const rawText = after.text ?? ''
    const db = admin.firestore()

    // Read per-user config
    const configRef = db.doc(`users/${userId}/meta/config`)
    const configSnap = await configRef.get()
    const config = (configSnap.exists ? configSnap.data() : {}) as {
      structuredEnabled?: boolean
      openaiApiKey?: string
    }

    if (!config.structuredEnabled) {
      logger.debug('Structured todos disabled for user', { userId })
      return
    }

    //const apiKey = config.openaiApiKey || DEFAULT_OPENAI_API_KEY.value()
    const apiKey = config.openaiApiKey
    if (!apiKey) {
      logger.warn('No OpenAI API key configured for user; skipping', { userId })
      return
    }

    const client = new OpenAI({ apiKey })

    // Short-circuit: empty text → clear structuredTodos
    if (!rawText.trim()) {
      await afterSnap.ref.set(
        {
          structuredTodos: [],
          // TODO: use serverTimestamp?
          structuredUpdatedAt: Date.now(),
        },
        { merge: true },
      )
      return
    }

    // Use OpenAI structured output with a JSON schema
    const schema = {
      type: 'json_schema',
      name: 'structured_todos_schema',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          todos: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['description', 'due'],
              properties: {
                description: { type: 'string', minLength: 1 },
                due: {
                  type: ['string', 'null'],
                  description:
                    'ISO 8601 date string (YYYY-MM-DD or full ISO) or null if absent',
                },
              },
            },
          },
        },
        required: ['todos'],
      },
    } as const

    const system = [
      'You extract a concise list of todos from freeform text.',
      'Return only actionable tasks; remove filler. For each task:',
      '- description: short imperative phrase (e.g., "Wash clothes", "Buy groceries").',
      '- due: ISO date if a due date is implied (e.g., "today", "next Saturday"), else null.',
      'Use the current date based on Europe/Zurich timezone when interpreting relative dates.',
      'Prefer YYYY-MM-DD when only a date is needed.',
    ].join('\n')

    const model = 'gpt-5-nano-2025-08-07'

    let todos: StructuredTodo[] = []
    try {
      const resp = await client.responses.create({
        model,
        input: [
          { role: 'system', content: system },
          { role: 'user', content: rawText },
        ],
        // Structured output
        text: {
          format: schema,
        },
      } as any)

      console.log('resp', resp)

      const outputText = resp.output_text || ''
      const parsed = JSON.parse(outputText) as { todos?: StructuredTodo[] }
      todos = Array.isArray(parsed?.todos) ? parsed.todos : []
    } catch (error) {
      logger.error('OpenAI request failed', { userId, error })
      return
    }

    // Normalize todos and convert due to Firestore Timestamp
    const structured = todos
      .filter(
        (t) =>
          t &&
          typeof t.description === 'string' &&
          t.description.trim().length > 0,
      )
      .map((t) => {
        let dueTs: number | null = null
        if (t.due && typeof t.due === 'string') {
          const date = new Date(t.due)
          dueTs = date.getTime()
        }
        return { description: t.description.trim(), due: dueTs }
      })

    await afterSnap.ref.set(
      {
        structuredTodos: structured,
        // TODO: use serverTimestamp?
        structuredUpdatedAt: Date.now(),
      },
      { merge: true },
    )
  },
)
