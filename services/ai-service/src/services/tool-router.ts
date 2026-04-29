import { sscClient } from './ssc.client'

interface ToolInput {
  query?: string
  appId?: string
  versionId?: string
  maxResults?: number
  args?: string[]
}

export async function dispatchTool(
  toolName: string,
  input: ToolInput,
  sessionName: string,
): Promise<unknown> {
  switch (toolName) {
    case 'list_applications':
      return sscClient.listApplications(sessionName, input.query)

    case 'list_versions':
      if (!input.appId) throw new Error('appId required')
      return sscClient.listVersions(input.appId, sessionName, input.query)

    case 'get_vulnerabilities':
      if (!input.versionId) throw new Error('versionId required')
      return sscClient.getVulnerabilities(input.versionId, sessionName, input.query, input.maxResults)

    case 'get_issue_counts':
      if (!input.versionId) throw new Error('versionId required')
      return sscClient.getIssueCounts(input.versionId, sessionName)

    case 'get_scan_status':
      if (!input.versionId) throw new Error('versionId required')
      return sscClient.getScanStatus(input.versionId, sessionName)

    case 'execute_fcli_command':
      if (!Array.isArray(input.args) || input.args.length === 0) throw new Error('args required')
      return sscClient.executeFcliCommand(input.args, sessionName)

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}
