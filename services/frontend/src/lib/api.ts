// Empty string = relative path → browser resolves to same origin (/api/...)
// Set NEXT_PUBLIC_API_URL only if the API is on a different origin
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'Request failed' }))) as { error: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  login: (username: string, password: string) =>
    request<{ accessToken: string; user: { username: string; id: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request('/api/auth/logout', { method: 'DELETE' }),

  getDashboardOverview: () => request('/api/dashboard/overview'),
  getApplications: () => request('/api/dashboard/applications'),
  getAppPosture: (appId: string) => request(`/api/dashboard/applications/${appId}/posture`),
  getRecentScans: (av: string) => request(`/api/dashboard/scans/recent?av=${av}`),
}

export function chatStream(
  message: string,
  conversationId: string | null,
  onEvent: (type: string, data: string) => void,
  onDone: (convId: string) => void,
): () => void {
  const token = getToken()
  const controller = new AbortController()

  fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversationId }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      onEvent('error', 'Failed to connect to AI service')
      return
    }

    const convId = res.headers.get('X-Conversation-Id') ?? conversationId ?? ''
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        onDone(convId)
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const type = line.slice(7).trim()
          const dataLine = lines[lines.indexOf(line) + 1] ?? ''
          if (dataLine.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(dataLine.slice(6)) as { data: string }
              onEvent(type, parsed.data)
            } catch { /* ignore malformed events */ }
          }
        }
      }
    }
  }).catch((err: Error) => {
    if (err.name !== 'AbortError') onEvent('error', err.message)
  })

  return () => controller.abort()
}
