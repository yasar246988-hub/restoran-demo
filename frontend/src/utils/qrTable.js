export function parseTableFromQr(text) {
  const raw = (text || '').trim()
  if (!raw) return null

  try {
    if (raw.includes('table=')) {
      const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw
      const params = new URLSearchParams(query)
      const table = params.get('table')
      if (table && !isNaN(parseInt(table))) return parseInt(table)
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const url = new URL(raw)
      const table = url.searchParams.get('table')
      if (table && !isNaN(parseInt(table))) return parseInt(table)
    }
  } catch {
    /* ignore parse errors */
  }

  const num = parseInt(raw)
  return !isNaN(num) && num > 0 ? num : null
}
