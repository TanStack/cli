import { version as nodeVersion } from 'node:process'

import {
  getTelemetryStatus,
  markTelemetryNoticeSeen,
  TELEMETRY_NOTICE_VERSION,
} from './telemetry-config.js'

import type { StatusEvent, StatusStepType } from '@tanstack/create'

type TelemetryProperties = Record<string, unknown>

interface TelemetryStepSummary {
  durationMs: number
  id: string
  type: StatusStepType
}

interface PendingStep {
  startedAt: number
  type: StatusStepType
}

const TELEMETRY_TRANSPORT_ENDPOINT = 'https://www.google-analytics.com/g/collect'
const TELEMETRY_PROPERTY_ID = 'G-JMT1Z50SPS'
const TELEMETRY_NOTICE =
  'TanStack CLI sends anonymous usage telemetry by default. It never sends project names, paths, raw search text, template URLs, add-on config values, or raw error messages. Disable it with `tanstack telemetry disable` or `TANSTACK_CLI_TELEMETRY_DISABLED=1`.'
const TELEMETRY_TIMEOUT_MS = 1200
const TELEMETRY_VALUE_MAX_LENGTH = 500
const TELEMETRY_NUMERIC_PREFIX = 'epn.'
const TELEMETRY_STRING_PREFIX = 'ep.'

let telemetryStatusPromise: Promise<Awaited<ReturnType<typeof getTelemetryStatus>>> | undefined

function getNodeMajorVersion() {
  return Number.parseInt(nodeVersion.replace(/^v/, '').split('.')[0] || '0', 10)
}

function cleanProperties(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((entry) => cleanProperties(entry))
      .filter((entry) => entry !== undefined)
  }

  if (value && typeof value === 'object') {
    const cleanedEntries = Object.entries(<Record<string, unknown>>value)
      .map(([key, entry]) => [key, cleanProperties(entry)] as const)
      .filter(([, entry]) => entry !== undefined)

    return Object.fromEntries(cleanedEntries)
  }

  if (value === undefined) {
    return undefined
  }

  return value
}

function truncateValue(value: string) {
  return value.length > TELEMETRY_VALUE_MAX_LENGTH
    ? `${value.slice(0, TELEMETRY_VALUE_MAX_LENGTH - 1)}…`
    : value
}

function normalizeParamKey(key: string) {
  const normalized = key.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+/, '')
  const prefixed = /^[a-zA-Z]/.test(normalized)
    ? normalized
    : `p_${normalized || 'value'}`

  return prefixed.slice(0, 40)
}

function normalizeParamValue(value: unknown): number | string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string') {
    return truncateValue(value)
  }

  const cleaned = cleanProperties(value)
  if (cleaned === undefined) {
    return undefined
  }

  return truncateValue(JSON.stringify(cleaned))
}

function createTelemetryRequestBody(
  event: string,
  distinctId: string,
  properties: TelemetryProperties,
) {
  const params = new URLSearchParams({
    cid: distinctId,
    en: event,
    tid: TELEMETRY_PROPERTY_ID,
    v: '2',
  })

  for (const [key, value] of Object.entries(properties)) {
    const normalizedValue = normalizeParamValue(value)
    if (normalizedValue === undefined) {
      continue
    }

    const normalizedKey = normalizeParamKey(key)
    const paramName =
      typeof normalizedValue === 'number'
        ? `${TELEMETRY_NUMERIC_PREFIX}${normalizedKey}`
        : `${TELEMETRY_STRING_PREFIX}${normalizedKey}`
    params.append(paramName, String(normalizedValue))
  }

  return params.toString()
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'unknown_error'
  }

  const message = String((<Record<string, unknown>>error).message || '').toLowerCase()

  if (message.includes('cancel')) {
    return 'cancelled'
  }

  if (message.includes('invalid')) {
    return 'invalid_input'
  }

  if (message.includes('not found')) {
    return 'not_found'
  }

  if (message.includes('timed out')) {
    return 'timeout'
  }

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('econn')
  ) {
    return 'network_error'
  }

  if (message.includes('permission') || message.includes('eacces')) {
    return 'permission_error'
  }

  return 'unknown_error'
}

async function fetchTelemetryStatus() {
  telemetryStatusPromise ??= getTelemetryStatus()
  return telemetryStatusPromise
}

async function postEvent(event: string, distinctId: string, properties: TelemetryProperties) {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, TELEMETRY_TIMEOUT_MS)

  try {
    await fetch(TELEMETRY_TRANSPORT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
      body: createTelemetryRequestBody(event, distinctId, properties),
      signal: controller.signal,
    })
  } catch {
    // Telemetry must never affect CLI behavior.
  } finally {
    clearTimeout(timeout)
  }
}

export class TelemetryClient {
  private commandProperties: TelemetryProperties = {}
  private pendingSteps = new Map<string, PendingStep>()
  private completedSteps: Array<TelemetryStepSummary> = []
  private readonly disabledBy?: 'ci' | 'config' | 'env'
  private readonly distinctId?: string
  readonly enabled: boolean

  constructor(status: Awaited<ReturnType<typeof getTelemetryStatus>>) {
    this.disabledBy = status.disabledBy
    this.distinctId = status.distinctId
    this.enabled = status.enabled && Boolean(status.distinctId)
  }

  mergeProperties(properties: TelemetryProperties) {
    this.commandProperties = {
      ...this.commandProperties,
      ...properties,
    }
  }

  startStep(info: StatusEvent) {
    if (!this.enabled) {
      return
    }

    this.pendingSteps.set(info.id, {
      startedAt: Date.now(),
      type: info.type,
    })
  }

  finishStep(id: string) {
    if (!this.enabled) {
      return
    }

    const step = this.pendingSteps.get(id)
    if (!step) {
      return
    }

    this.pendingSteps.delete(id)
    this.completedSteps.push({
      durationMs: Math.max(Date.now() - step.startedAt, 0),
      id,
      type: step.type,
    })
  }

  async captureCommandStarted(command: string, properties: TelemetryProperties) {
    this.mergeProperties(properties)

    if (!this.enabled || !this.distinctId) {
      return
    }

    void postEvent('command_started', this.distinctId, <TelemetryProperties>cleanProperties({
      ...this.baseProperties(),
      ...this.commandProperties,
      command,
    }))
  }

  async captureCommandCompleted(command: string, durationMs: number) {
    if (!this.enabled || !this.distinctId) {
      return
    }

    await postEvent('command_completed', this.distinctId, <TelemetryProperties>cleanProperties({
      ...this.baseProperties(),
      ...this.commandProperties,
      command,
      duration_ms: durationMs,
      result: 'success',
      steps: this.completedSteps.map((step) => ({
        duration_ms: step.durationMs,
        id: step.id,
        type: step.type,
      })),
    }))
  }

  async captureCommandFailed(
    command: string,
    durationMs: number,
    error: unknown,
  ) {
    if (!this.enabled || !this.distinctId) {
      return
    }

    await postEvent('command_failed', this.distinctId, <TelemetryProperties>cleanProperties({
      ...this.baseProperties(),
      ...this.commandProperties,
      command,
      duration_ms: durationMs,
      error_code: getErrorCode(error),
      result: 'failed',
      steps: this.completedSteps.map((step) => ({
        duration_ms: step.durationMs,
        id: step.id,
        type: step.type,
      })),
    }))
  }

  private baseProperties() {
    return {
      client_lib: 'tanstack-cli',
      disabled_by: this.disabledBy,
      node_major: getNodeMajorVersion(),
      os_arch: process.arch,
      os_platform: process.platform,
    }
  }
}

export async function createTelemetryClient(opts?: { json?: boolean }) {
  const status = await fetchTelemetryStatus()
  if (
    status.enabled &&
    status.noticeVersion < TELEMETRY_NOTICE_VERSION &&
    !opts?.json
  ) {
    console.error(TELEMETRY_NOTICE)
    await markTelemetryNoticeSeen()
    telemetryStatusPromise = undefined
  }

  return new TelemetryClient(await fetchTelemetryStatus())
}

export function resetTelemetryStateForTests() {
  telemetryStatusPromise = undefined
}
