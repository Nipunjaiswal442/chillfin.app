/**
 * Convex validates Firebase ID tokens directly — no Firebase Admin SDK or
 * service-account secret needed.
 *
 * Set the project id on each Convex deployment (dev, preview, prod):
 *   npx convex env set FIREBASE_PROJECT_ID <your-firebase-project-id>
 */
const projectId = process.env.FIREBASE_PROJECT_ID

export default {
  providers: [
    {
      type: 'customJwt',
      applicationID: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      jwks: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
      algorithm: 'RS256',
    },
  ],
}
