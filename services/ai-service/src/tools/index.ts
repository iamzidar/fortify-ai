import type Anthropic from '@anthropic-ai/sdk'

export const fortifyTools: Anthropic.Tool[] = [
  {
    name: 'list_applications',
    description: 'List all applications in Fortify SSC. Optionally filter with a SpEL query.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Optional SpEL filter, e.g. "name matches \'(?i).*payment.*\'"',
        },
      },
    },
  },
  {
    name: 'list_versions',
    description: 'List all application versions (branches/environments) for a given application. Pass numeric app ID or the app name string.',
    input_schema: {
      type: 'object',
      properties: {
        appId: { type: 'string', description: 'Numeric application ID or application name string (e.g. "AndroGoat" or "2083")' },
        query: { type: 'string', description: 'Optional SpEL filter' },
      },
      required: ['appId'],
    },
  },
  {
    name: 'get_vulnerabilities',
    description:
      'List vulnerabilities/issues for a specific application version. Filter by severity, category, analyzer, etc.',
    input_schema: {
      type: 'object',
      properties: {
        versionId: { type: 'string', description: 'The numeric application version ID' },
        query: {
          type: 'string',
          description:
            'Optional SpEL filter, e.g. "friority==\'Critical\'" or "issueName matches \'(?i).*sql.*\'"',
        },
        maxResults: { type: 'number', description: 'Max number of results (default: 25)' },
      },
      required: ['versionId'],
    },
  },
  {
    name: 'get_issue_counts',
    description:
      'Get vulnerability counts grouped by severity (Critical/High/Medium/Low) for a version. Faster than listing all issues.',
    input_schema: {
      type: 'object',
      properties: {
        versionId: { type: 'string', description: 'The numeric application version ID' },
      },
      required: ['versionId'],
    },
  },
  {
    name: 'get_scan_status',
    description: 'Get recent scan artifacts and their processing status for an application version.',
    input_schema: {
      type: 'object',
      properties: {
        versionId: { type: 'string', description: 'The numeric application version ID' },
      },
      required: ['versionId'],
    },
  },
  {
    name: 'execute_fcli_command',
    description:
      'Execute an arbitrary fcli ssc command. Use this for advanced operations not covered by other tools. Args must start with "ssc".',
    input_schema: {
      type: 'object',
      properties: {
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'fcli arguments starting with "ssc", e.g. ["ssc", "appversion", "get", "--av", "123"]',
        },
      },
      required: ['args'],
    },
  },
]
