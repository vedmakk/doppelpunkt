// Text conflict resolution using diff-match-patch algorithm
// Handles three-way merging when concurrent edits occur

import DiffMatchPatch from 'diff-match-patch'

export interface ConflictResolution {
  mergedText: string
  wasConflicted: boolean
  mergeSuccessful: boolean
}

/**
 * Resolves conflicts between local and remote text using a common base
 * Uses diff-match-patch for intelligent three-way merging
 */
export function resolveTextConflict(
  baseText: string,
  localText: string,
  remoteText: string,
): ConflictResolution {
  // If no conflict (local and remote are the same), return early
  if (localText === remoteText) {
    return {
      mergedText: localText,
      wasConflicted: false,
      mergeSuccessful: true,
    }
  }

  // If only one side changed, use that version
  if (localText === baseText) {
    return {
      mergedText: remoteText,
      wasConflicted: false,
      mergeSuccessful: true,
    }
  }

  if (remoteText === baseText) {
    return {
      mergedText: localText,
      wasConflicted: false,
      mergeSuccessful: true,
    }
  }

  // Both sides changed - perform three-way merge
  const dmp = new DiffMatchPatch()

  // Create patches from base to local
  const diffs = dmp.diff_main(baseText, localText)
  dmp.diff_cleanupSemantic(diffs)
  const patches = dmp.patch_make(baseText, diffs)

  // Apply local changes to remote text
  const applyResult = dmp.patch_apply(patches, remoteText)
  const mergedText: string = applyResult[0]
  const results: boolean[] = applyResult[1]

  // Calculate success ratio
  const successRatio =
    results.length > 0 ? results.filter(Boolean).length / results.length : 1

  // If merge was mostly successful, use merged text
  // Otherwise, fall back to local text (user's work takes precedence)
  const mergeSuccessful = successRatio >= 0.5

  return {
    mergedText: mergeSuccessful ? mergedText : localText,
    wasConflicted: true,
    mergeSuccessful,
  }
}
