import { ConvexError } from 'convex/values'

/**
 * User-facing message for a failed Convex call. Validation errors thrown with
 * `new ConvexError('...')` carry their message; anything else is generic
 * (Convex redacts unexpected server errors in production anyway).
 */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ConvexError && typeof err.data === 'string') return err.data
  return fallback
}
