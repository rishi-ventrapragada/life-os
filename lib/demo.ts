/**
 * The shared demo account's user id. Used to gate demo-only UI (e.g. the
 * "Reset demo data" button) so it never renders for a real user.
 */
export const DEMO_USER_ID = "5bb1bd9f-93a1-4e84-b076-f0c24f337fef";

/**
 * Shared demo account credentials, shown to visitors on the login page via
 * "Try the demo". This account and its password are meant to be public — it
 * is a shared, resettable, throwaway login, not a secret. TODO(owner): replace
 * DEMO_PASSWORD with the real password.
 */
export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "demo123";
