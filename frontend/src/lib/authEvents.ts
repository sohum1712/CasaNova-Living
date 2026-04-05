/** Dispatched when the API returns 401 so React Router can navigate without a full page load (preserves history). */
export const AUTH_REQUIRED_EVENT = 'casanova:auth-required';

export function dispatchAuthRequired() {
  window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
}
