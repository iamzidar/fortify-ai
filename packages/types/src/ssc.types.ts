export type FortifyPriority = 'Critical' | 'High' | 'Medium' | 'Low'

export type ScanType = 'SCA' | 'WebInspect' | 'Rulepack'

export type ArtifactStatus =
  | 'SCHED_PROCESSING'
  | 'PROCESSING'
  | 'PROCESS_COMPLETE'
  | 'REQUIRE_AUTH'
  | 'ERROR_PROCESSING'
  | 'PURGED'

export interface SSCApplication {
  id: number
  name: string
  description?: string
  creationDate: string
}

export interface SSCApplicationVersion {
  id: number
  name: string
  description?: string
  active: boolean
  committed: boolean
  project: {
    id: number
    name: string
  }
  issueTemplateId: string
  attributesLocked: boolean
  analysisResultsExist: boolean
  analysisUploadEnabled: boolean
  criticalPriorityIssueCountDelta: number
  highPriorityIssueCountDelta: number
  creationDate: string
  serverVersion: number
}

export interface SSCIssue {
  id: number
  issueInstanceId: string
  issueName: string
  friority: FortifyPriority
  analyzer: string
  kingdom: string
  primaryLocation?: string
  primaryRuleGuid?: string
  engineCategory?: string
  suppressed: boolean
  hidden: boolean
  removed: boolean
  hasComments: boolean
  foundDate: string
  removedDate?: string
  lastScanId?: number
  displayStatus?: string
}

export interface SSCIssueCount {
  Critical: number
  High: number
  Medium: number
  Low: number
  total: number
}

export interface SSCArtifact {
  id: number
  name: string
  status: ArtifactStatus
  uploadDate: string
  approvalDate?: string
  approvalUsername?: string
  purgeDate?: string
  scaStatus?: string
  webInspectStatus?: string
  auditStatus?: string
  messageCount?: number
  messages?: string
}

export interface DashboardOverview {
  totalApplications: number
  totalVersions: number
  issueCounts: SSCIssueCount
  recentScans: SSCArtifact[]
  lastUpdated: string
}

export interface ApplicationPosture {
  application: SSCApplication
  version: SSCApplicationVersion
  issueCounts: SSCIssueCount
  recentArtifact?: SSCArtifact
}
