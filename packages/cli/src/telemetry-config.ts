import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export interface TelemetryConfig {
  distinctId: string
  enabled: boolean
  noticeVersion: number
}

export interface TelemetryStatus {
  configPath: string
  disabledBy?: 'ci' | 'config' | 'env'
  distinctId?: string
  enabled: boolean
  noticeVersion: number
}

export const TELEMETRY_NOTICE_VERSION = 1

function createDefaultTelemetryConfig(): TelemetryConfig {
  return {
    distinctId: randomUUID(),
    enabled: true,
    noticeVersion: 0,
  }
}

function getHomeDirectory() {
  return process.env.HOME || homedir()
}

function isTelemetryConfig(value: unknown): value is TelemetryConfig {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = <Record<string, unknown>>value

  return (
    typeof record.distinctId === 'string' &&
    typeof record.enabled === 'boolean' &&
    typeof record.noticeVersion === 'number'
  )
}

function getDisabledByEnvironment(): 'ci' | 'env' | undefined {
  if (process.env.DO_NOT_TRACK === '1') {
    return 'env'
  }

  if (process.env.TANSTACK_CLI_TELEMETRY_DISABLED === '1') {
    return 'env'
  }

  if (process.env.CI) {
    return 'ci'
  }

  return undefined
}

export function getTelemetryConfigPath() {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME?.trim()
  if (xdgConfigHome) {
    return join(xdgConfigHome, 'tanstack', 'cli.json')
  }

  const homeDirectory = getHomeDirectory().trim()
  if (homeDirectory) {
    return join(homeDirectory, '.config', 'tanstack', 'cli.json')
  }

  return join(process.cwd(), '.tanstack', 'cli.json')
}

async function readTelemetryConfigFile(configPath: string) {
  if (!existsSync(configPath)) {
    return undefined
  }

  try {
    const raw = await readFile(configPath, 'utf8')
    const parsed = JSON.parse(raw)
    if (!isTelemetryConfig(parsed)) {
      return undefined
    }

    return parsed
  } catch {
    return undefined
  }
}

async function writeTelemetryConfigFile(
  configPath: string,
  config: TelemetryConfig,
) {
  await mkdir(dirname(configPath), { recursive: true })
  await writeFile(configPath, JSON.stringify(config, null, 2))
}

async function readOrCreateTelemetryConfig(createIfMissing: boolean) {
  const configPath = getTelemetryConfigPath()
  const existingConfig = await readTelemetryConfigFile(configPath)

  if (existingConfig || !createIfMissing) {
    return {
      config: existingConfig,
      configPath,
    }
  }

  const createdConfig = createDefaultTelemetryConfig()
  await writeTelemetryConfigFile(configPath, createdConfig)

  return {
    config: createdConfig,
    configPath,
  }
}

export async function getTelemetryStatus(opts?: { createIfMissing?: boolean }) {
  const disabledBy = getDisabledByEnvironment()
  const { config, configPath } = await readOrCreateTelemetryConfig(
    opts?.createIfMissing ?? !disabledBy,
  )

  if (!config) {
    return {
      configPath,
      disabledBy,
      distinctId: undefined,
      enabled: false,
      noticeVersion: 0,
    } satisfies TelemetryStatus
  }

  if (disabledBy) {
    return {
      configPath,
      disabledBy,
      distinctId: config.distinctId,
      enabled: false,
      noticeVersion: config.noticeVersion,
    } satisfies TelemetryStatus
  }

  if (!config.enabled) {
    return {
      configPath,
      disabledBy: 'config',
      distinctId: config.distinctId,
      enabled: false,
      noticeVersion: config.noticeVersion,
    } satisfies TelemetryStatus
  }

  return {
    configPath,
    distinctId: config.distinctId,
    enabled: true,
    noticeVersion: config.noticeVersion,
  } satisfies TelemetryStatus
}

export async function markTelemetryNoticeSeen() {
  const { config, configPath } = await readOrCreateTelemetryConfig(true)
  if (!config || config.noticeVersion >= TELEMETRY_NOTICE_VERSION) {
    return
  }

  await writeTelemetryConfigFile(configPath, {
    ...config,
    noticeVersion: TELEMETRY_NOTICE_VERSION,
  })
}

export async function setTelemetryEnabled(enabled: boolean) {
  const { config, configPath } = await readOrCreateTelemetryConfig(true)
  const nextConfig = {
    ...(config || createDefaultTelemetryConfig()),
    enabled,
  }

  await writeTelemetryConfigFile(configPath, nextConfig)

  return nextConfig
}
