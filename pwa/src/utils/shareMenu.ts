export async function shareMenuPage(title: string, text?: string): Promise<"shared" | "copied" | "failed"> {
  const url = window.location.href

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text, url })
      return "shared"
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "failed"
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      return "copied"
    } catch {
      return "failed"
    }
  }

  return "failed"
}
