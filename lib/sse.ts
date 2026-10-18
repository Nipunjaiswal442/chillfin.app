/**
 * Incremental parser for OpenAI-style chat streams (`data: {...}` lines).
 *
 * Network chunks don't line up with SSE events, so a partial trailing line is
 * buffered until the next chunk arrives instead of being dropped (which used
 * to lose words from AI replies).
 */
export function createSSEParser(onDelta: (text: string) => void) {
  let buffer = ''
  return (chunk: string) => {
    buffer += chunk
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content
        if (delta) onDelta(delta)
      } catch {
        // ignore keep-alives and malformed events
      }
    }
  }
}
