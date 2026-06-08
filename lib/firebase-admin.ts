import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// Handle both literal and escaped newlines, and strip accidental quotes
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ?.split(String.raw`\n`).join('\n')
  ?.replace(/"/g, '')
  ?.trim();

let adminAuth: ReturnType<typeof getAuth>;

try {
  if (!getApps().length && projectId && clientEmail && privateKey) {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    adminAuth = getAuth(app);
  } else {
    // If we're here, we're either already initialized OR missing credentials (build time)
    if (getApps().length) {
      adminAuth = getAuth();
    } else {
      adminAuth = {} as any;
      console.warn('Firebase Admin: Missing credentials. AdminAuth is a placeholder.');
    }
  }
} catch (error) {
  // If the secret is malformed, we still want the build to succeed.
  // The features using adminAuth will simply fail at runtime until the key is fixed.
  adminAuth = {} as any;
  console.warn('Firebase Admin: Initialization failed (likely malformed key). AdminAuth is a placeholder.');
}

export { adminAuth };
