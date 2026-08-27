/**
 * Neutral analytics event bus.
 *
 * The free PWA only dispatches DOM events; it never talks to any analytics
 * vendor. HappyBites Pro (when installed and configured) listens for these
 * events and forwards them to Google Tag Manager.
 */
export function track(event: string, params: Record<string, unknown> = {}): void {
  document.dispatchEvent(new CustomEvent("hb:track", { detail: { event, params } }))
}
