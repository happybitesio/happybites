declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

const SCRIPT_ID = "hb-recaptcha-v3"

export function loadRecaptcha(siteKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve()
      return
    }

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      const waitForReady = () => {
        if (window.grecaptcha) {
          resolve()
          return
        }
        window.setTimeout(waitForReady, 50)
      }
      waitForReady()
      return
    }

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("reCAPTCHA yüklenemedi"))
    document.head.appendChild(script)
  })
}

export async function executeRecaptcha(siteKey: string, action: string): Promise<string> {
  await loadRecaptcha(siteKey)

  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error("reCAPTCHA kullanılamıyor"))
      return
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha!
        .execute(siteKey, { action })
        .then(resolve)
        .catch(reject)
    })
  })
}
