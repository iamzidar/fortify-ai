import { spawn } from 'child_process'
import { config } from '../config'

export class FcliError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly stderr: string,
  ) {
    super(message)
    this.name = 'FcliError'
  }
}

// Allowlist of safe top-level subcommand paths
const ALLOWED_SUBCOMMANDS = ['ssc']

export function validateArgs(args: string[]): void {
  if (args.length === 0) throw new FcliError('No arguments provided', 400, '')
  if (!ALLOWED_SUBCOMMANDS.includes(args[0])) {
    throw new FcliError(`Subcommand '${args[0]}' is not allowed`, 403, '')
  }
}

export async function runFcli(
  args: string[],
  sessionName?: string,
): Promise<unknown> {
  validateArgs(args)

  // Inject session flag if a named session is provided
  const fullArgs =
    sessionName && !args.includes('--ssc-session')
      ? [...args, `--ssc-session=${sessionName}`]
      : args

  return new Promise((resolve, reject) => {
    const proc = spawn('fcli', fullArgs, {
      shell: false,
      env: {
        ...process.env,
        FCLI_HOME: config.fcliHome,
        FCLI_DEFAULT_SSC_URL: config.sscUrl,
        // Reduce JVM heap to keep memory usage predictable
        JAVA_TOOL_OPTIONS: '-Djava.awt.headless=true -Xmx128m',
      },
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new FcliError(`fcli exited with code ${code}`, code ?? 1, stderr))
      }
      try {
        resolve(stdout.trim() ? JSON.parse(stdout) : null)
      } catch {
        // fcli sometimes returns non-JSON for session operations; return raw string
        resolve(stdout.trim() || null)
      }
    })

    proc.on('error', (err) => {
      reject(new FcliError(`Failed to spawn fcli: ${err.message}`, 500, ''))
    })
  })
}

// Convenience: run fcli ssc with -o json appended (unless already present)
export async function runSscCommand(
  subArgs: string[],
  sessionName: string,
): Promise<unknown> {
  const withJson = subArgs.includes('-o') || subArgs.includes('--output')
    ? subArgs
    : [...subArgs, '-o', 'json']
  return runFcli(['ssc', ...withJson], sessionName)
}
