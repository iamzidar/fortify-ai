import { config } from '../config'

const internalHeaders = (sessionName: string) => ({
  'Content-Type': 'application/json',
  'X-Internal-Token': config.internalSecret,
  'X-SSC-Session': sessionName,
})

async function sscGet<T>(path: string, sessionName: string): Promise<T> {
  const res = await fetch(`${config.sscServiceUrl}${path}`, {
    headers: internalHeaders(sessionName),
  })
  if (!res.ok) throw new Error(`SSC service error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export async function listApplications(sessionName: string): Promise<unknown[]> {
  return sscGet<unknown[]>('/applications', sessionName)
}

export async function listVersions(appName: string, sessionName: string): Promise<unknown[]> {
  return sscGet<unknown[]>(`/applications/${encodeURIComponent(appName)}/versions`, sessionName)
}

export async function getIssueCount(
  versionId: string,
  sessionName: string,
): Promise<Record<string, number>> {
  return sscGet<Record<string, number>>(
    `/issues/count?av=${versionId}&groupBy=friority`,
    sessionName,
  )
}

export async function getRecentArtifacts(
  versionId: string,
  sessionName: string,
): Promise<unknown[]> {
  return sscGet<unknown[]>(`/artifacts?av=${versionId}&maxResults=5`, sessionName)
}
