import * as admin from 'firebase-admin';

/**
 * Sets the RBAC role in a user's Firebase Custom Claims.
 * Note: This function uses firebase-admin and must be run in a Node.js environment,
 * NOT on Cloudflare Workers edge runtime.
 * 
 * @param uid Firebase User ID
 * @param role The role to assign (e.g., 'ADMIN', 'STAFF', 'CUSTOMER')
 */
export async function setCustomUserRole(uid: string, role: string) {
  // Ensure firebase admin is initialized
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  
  await admin.auth().setCustomUserClaims(uid, { role });
  console.log(`Successfully set role '${role}' for user ${uid}`);
}
