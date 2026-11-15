// Revoking right after the click can cancel the download in some browsers.
const REVOKE_AFTER_MS = 60_000

/** Saves a blob through a temporary `<a download>`, without leaving the app. */
export function downloadFile(file: Blob, name: string) {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.hidden = true
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS)
}
