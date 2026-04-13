import * as admin from 'firebase-admin'

// ─── Singleton init ────────────────────────────────────────────────────────────

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.app()

  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error(
      'FIREBASE_ADMIN_SERVICE_ACCOUNT environment variable is not set. ' +
        'Go to Firebase Console → Project Settings → Service Accounts → Generate new private key, ' +
        'copy the JSON and set it as this env var (as a single-line JSON string).'
    )
  }

  const credential = JSON.parse(raw)
  return admin.initializeApp({ credential: admin.credential.cert(credential) })
}

// ─── Token verification ────────────────────────────────────────────────────────

/**
 * Verifies a Firebase ID token and returns the decoded payload (includes uid).
 * Call this at the top of every authenticated API route.
 *
 * Usage:
 *   const token = request.headers.get('Authorization')?.replace('Bearer ', '')
 *   const decoded = await verifyIdToken(token)
 */
export async function verifyIdToken(token: string | null | undefined): Promise<admin.auth.DecodedIdToken> {
  if (!token) throw new Error('No token provided')
  const app = getAdminApp()
  return admin.auth(app).verifyIdToken(token)
}
