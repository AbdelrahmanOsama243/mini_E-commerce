// ─── User ─────────────────────────────────────────────────────────────────────
// Mirrors User.Model.js (only the fields the API ever exposes — password excluded)

export interface User {
  _id: string;       // _id aliased to id in controller responses
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
}

// Full user object returned by GET /me and PUT /me (uses _id, not id)
export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

// ─── API responses ────────────────────────────────────────────────────────────

/** POST /api/users/register  →  201 */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/** POST /api/users/login  →  200 */
export type LoginResponse = AuthResponse;

/** POST /api/users/logout  →  200 */
export interface LogoutResponse {
  message: string;
}

/** GET /api/users/me  →  200 */
export type GetMeResponse = UserProfile;

/** PUT /api/users/me  →  200 */
export type UpdateProfileResponse = UserProfile;

/** Error shape returned on 4xx / 5xx */
export interface AuthErrorResponse {
  message: string;
}
