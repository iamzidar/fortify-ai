import { config } from '../config'

const headers = {
  'Content-Type': 'application/json',
  'X-Internal-Token': config.internalSecret,
}

export async function createSscSession(
  username: string,
  password: string,
  sessionName: string,
): Promise<void> {
  const res = await fetch(`${config.sscServiceUrl}/session/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ username, password, sessionName }),
  })
  if (!res.ok) {
    const body = (await res.json()) as { error?: string; detail?: string }
    throw new Error(body.detail ?? body.error ?? 'SSC login failed')
  }
}

export async function deleteSscSession(sessionName: string): Promise<void> {
  await fetch(`${config.sscServiceUrl}/session/${encodeURIComponent(sessionName)}`, {
    method: 'DELETE',
    headers,
  })
}
