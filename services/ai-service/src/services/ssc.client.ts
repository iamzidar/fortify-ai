import { config } from '../config'

function headers(sessionName: string) {
  return {
    'Content-Type': 'application/json',
    'X-Internal-Token': config.internalSecret,
    'X-SSC-Session': sessionName,
  }
}

async function get<T>(path: string, sessionName: string): Promise<T> {
  const res = await fetch(`${config.sscServiceUrl}${path}`, { headers: headers(sessionName) })
  if (!res.ok) throw new Error(`SSC ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown, sessionName: string): Promise<T> {
  const res = await fetch(`${config.sscServiceUrl}${path}`, {
    method: 'POST',
    headers: headers(sessionName),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`SSC ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export const sscClient = {
  listApplications: (sessionName: string, query?: string) =>
    get(`/applications${query ? `?q=${encodeURIComponent(query)}` : ''}`, sessionName),

  listVersions: (appId: string, sessionName: string, query?: string) =>
    get(`/applications/${appId}/versions${query ? `?q=${encodeURIComponent(query)}` : ''}`, sessionName),

  getVulnerabilities: (versionId: string, sessionName: string, query?: string, maxResults?: number) => {
    const params = new URLSearchParams({ av: versionId })
    if (query) params.set('q', query)
    if (maxResults) params.set('maxResults', String(maxResults))
    return get(`/issues?${params}`, sessionName)
  },

  getIssueCounts: (versionId: string, sessionName: string) =>
    get(`/issues/count?av=${versionId}&groupBy=friority`, sessionName),

  getScanStatus: (versionId: string, sessionName: string) =>
    get(`/artifacts?av=${versionId}&maxResults=5`, sessionName),

  executeFcliCommand: (args: string[], sessionName: string) =>
    post('/execute', { args }, sessionName),
}
