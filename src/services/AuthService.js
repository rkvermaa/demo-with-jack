/**
 * AuthService
 *
 * Thin service module responsible for credential submission and session
 * management. The backend MUST return an identical HTTP 401 response body
 * for both "wrong password" and "email not registered" cases so that the
 * client can never differentiate between them (prevents email enumeration).
 */

const AUTH_ENDPOINT = '/api/auth/login';

/**
 * @typedef {{ success: true, redirectUrl: string } | { success: false, error: 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' }} AuthResult
 */

/**
 * Submits credentials to the auth endpoint.
 *
 * @param {string} email
 * @param {string} password
 * @param {boolean} rememberMe  Controls session persistence (persistent cookie vs. session cookie).
 * @returns {Promise<AuthResult>}
 */
export async function login(email, password, rememberMe) {
  try {
    const response = await fetch(AUTH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Credentials included so the browser sends/receives HttpOnly session cookies.
      credentials: 'include',
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (response.ok) {
      const data = await response.json();
      // redirectUrl must be a path, never containing credentials.
      const redirectUrl = data.redirectUrl || '/dashboard';
      return { success: true, redirectUrl };
    }

    // Both 401 cases (wrong password AND email not found) return the same
    // INVALID_CREDENTIALS error so the client cannot enumerate accounts.
    return { success: false, error: 'INVALID_CREDENTIALS' };
  } catch {
    // Network or server error — do not expose details.
    return { success: false, error: 'NETWORK_ERROR' };
  }
}

export default { login };
