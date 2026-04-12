import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getTelemetryStatus, setTelemetryEnabled } from '../src/telemetry-config.js'
import {
  createTelemetryClient,
  resetTelemetryStateForTests,
} from '../src/telemetry.js'
import { createUIEnvironment } from '../src/ui-environment.js'

const TELEMETRY_NUMERIC_PREFIX = 'epn.'
const TELEMETRY_STRING_PREFIX = 'ep.'
const TELEMETRY_TRANSPORT_PATH = '/g/collect'

function getCapturedEvent(index: number) {
  const mockedFetch = <typeof fetch & {
    mock: { calls: Array<Array<unknown>> }
  }>fetch
  const requestUrl = String(mockedFetch.mock.calls[index]?.[0])
  const requestInit = <RequestInit | undefined>mockedFetch.mock.calls[index]?.[1]
  const params = new URLSearchParams(String(requestInit?.body || ''))

  const properties: Record<string, string | number> = {}
  for (const [key, value] of params.entries()) {
    if (key.startsWith(TELEMETRY_NUMERIC_PREFIX)) {
      properties[key.slice(TELEMETRY_NUMERIC_PREFIX.length)] = Number(value)
      continue
    }

    if (key.startsWith(TELEMETRY_STRING_PREFIX)) {
      properties[key.slice(TELEMETRY_STRING_PREFIX.length)] = value
    }
  }

  return {
    event: params.get('en'),
    properties,
    url: requestUrl,
  }
}

describe('telemetry', () => {
  const originalCI = process.env.CI
  const originalDnt = process.env.DO_NOT_TRACK
  const originalTelemetryDisabled = process.env.TANSTACK_CLI_TELEMETRY_DISABLED
  const originalXdgConfigHome = process.env.XDG_CONFIG_HOME

  let tempDir = ''

  const mockedFetch = <typeof fetch & {
    mock: { calls: Array<Array<unknown>> }
    mockReset: () => void
  }>fetch

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'tanstack-cli-telemetry-'))
    process.env.CI = ''
    process.env.DO_NOT_TRACK = ''
    process.env.TANSTACK_CLI_TELEMETRY_DISABLED = ''
    process.env.XDG_CONFIG_HOME = tempDir
    mockedFetch.mockReset()
    vi.restoreAllMocks()
    resetTelemetryStateForTests()
  })

  afterEach(async () => {
    process.env.CI = originalCI
    process.env.DO_NOT_TRACK = originalDnt
    process.env.TANSTACK_CLI_TELEMETRY_DISABLED = originalTelemetryDisabled
    process.env.XDG_CONFIG_HOME = originalXdgConfigHome
    resetTelemetryStateForTests()
    vi.useRealTimers()
    await rm(tempDir, { force: true, recursive: true })
  })

  it('creates enabled telemetry config by default', async () => {
    const status = await getTelemetryStatus()

    expect(status.enabled).toBe(true)
    expect(status.configPath).toContain(tempDir)

    const persisted = JSON.parse(await readFile(status.configPath, 'utf8'))
    expect(persisted.enabled).toBe(true)
    expect(persisted.noticeVersion).toBe(0)
    expect(typeof persisted.distinctId).toBe('string')
  })

  it('shows the first-run notice once and marks it seen', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const telemetry = await createTelemetryClient()
    await telemetry.captureCommandCompleted('libraries', 42)

    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledTimes(1)

    const status = await getTelemetryStatus({ createIfMissing: false })
    expect(status.noticeVersion).toBe(1)

    resetTelemetryStateForTests()
    await createTelemetryClient()
    expect(consoleError).toHaveBeenCalledTimes(1)
  })

  it('captures the key command lifecycle events', async () => {
    const telemetry = await createTelemetryClient({ json: true })

    await telemetry.captureCommandStarted('create', {
      cli_version: '0.62.3',
      framework: 'react',
      install: true,
      invoked_by_agent: true,
    })
    await telemetry.captureCommandCompleted('create', 125)

    const startedEvent = getCapturedEvent(0)
    const completedEvent = getCapturedEvent(1)

    expect(startedEvent.event).toBe('command_started')
    expect(startedEvent.url).toContain(TELEMETRY_TRANSPORT_PATH)
    expect(startedEvent.properties.command).toBe('create')
    expect(startedEvent.properties.framework).toBe('react')
    expect(startedEvent.properties.install).toBe(1)
    expect(startedEvent.properties.invoked_by_agent).toBe(1)
    expect(startedEvent.properties.cli_version).toBe('0.62.3')

    expect(completedEvent.event).toBe('command_completed')
    expect(completedEvent.properties.command).toBe('create')
    expect(completedEvent.properties.duration_ms).toBe(125)
    expect(completedEvent.properties.invoked_by_agent).toBe(1)
    expect(completedEvent.properties.result).toBe('success')
  })

  it('captures failure events with a coarse error code', async () => {
    const telemetry = await createTelemetryClient({ json: true })

    await telemetry.captureCommandStarted('search-docs', {
      cli_version: '0.62.3',
      library: 'router',
    })
    await telemetry.captureCommandFailed(
      'search-docs',
      250,
      new Error('Network fetch failed hard'),
    )

    const failedEvent = getCapturedEvent(1)

    expect(failedEvent.event).toBe('command_failed')
    expect(failedEvent.properties.command).toBe('search-docs')
    expect(failedEvent.properties.duration_ms).toBe(250)
    expect(failedEvent.properties.error_code).toBe('network_error')
    expect(failedEvent.properties.result).toBe('failed')
  })

  it('does not send telemetry when disabled by environment', async () => {
    process.env.TANSTACK_CLI_TELEMETRY_DISABLED = '1'
    resetTelemetryStateForTests()

    const telemetry = await createTelemetryClient()
    await telemetry.captureCommandCompleted('libraries', 42)

    expect(telemetry.enabled).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not send telemetry when disabled by do-not-track', async () => {
    process.env.DO_NOT_TRACK = '1'
    resetTelemetryStateForTests()

    const telemetry = await createTelemetryClient()
    await telemetry.captureCommandCompleted('libraries', 42)

    expect(telemetry.enabled).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not send telemetry in CI', async () => {
    process.env.CI = 'true'
    resetTelemetryStateForTests()

    const telemetry = await createTelemetryClient()
    await telemetry.captureCommandCompleted('libraries', 42)

    expect(telemetry.enabled).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not send telemetry when disabled in config', async () => {
    await getTelemetryStatus()
    await setTelemetryEnabled(false)
    resetTelemetryStateForTests()

    const telemetry = await createTelemetryClient()
    await telemetry.captureCommandCompleted('libraries', 42)

    expect(telemetry.enabled).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('captures step timing summaries through the UI environment', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-03T12:00:00.000Z'))

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const telemetry = await createTelemetryClient({ json: true })
    const environment = createUIEnvironment('TanStack', true, () => telemetry)

    telemetry.captureCommandStarted('create', { cli_version: '0.62.3' })
    environment.startStep({
      id: 'install-dependencies',
      message: 'Installing dependencies...',
      type: 'package-manager',
    })
    vi.advanceTimersByTime(250)
    environment.finishStep('install-dependencies', 'Dependencies installed')
    await telemetry.captureCommandCompleted('create', 500)

    const lastCall = mockedFetch.mock.calls.at(-1)
    expect(lastCall).toBeDefined()

    const requestInit = <RequestInit | undefined>lastCall?.[1]
    const params = new URLSearchParams(String(requestInit?.body || ''))
    expect(params.get('en')).toBe('command_completed')
    expect(params.get(`${TELEMETRY_STRING_PREFIX}steps`)).toBe(
      JSON.stringify([
        {
          duration_ms: 250,
          id: 'install-dependencies',
          type: 'package-manager',
        },
      ]),
    )
    expect(consoleError).not.toHaveBeenCalled()
  })
})
