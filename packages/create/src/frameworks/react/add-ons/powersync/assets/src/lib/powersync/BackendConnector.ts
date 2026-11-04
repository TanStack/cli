import {
  type AbstractPowerSyncDatabase,
  type PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/web'

export class BackendConnector implements PowerSyncBackendConnector {
  private readonly powersyncUrl = import.meta.env.VITE_POWERSYNC_URL
  private readonly powersyncToken = import.meta.env.VITE_POWERSYNC_TOKEN

  async fetchCredentials() {
    if (!this.powersyncUrl || !this.powersyncToken) {
      return null
    }

    return {
      endpoint: this.powersyncUrl,
      token: this.powersyncToken,
    }
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction()

    if (!transaction) {
      return
    }

    try {
      for (const op of transaction.crud) {
        const record = { ...op.opData, id: op.id }

        switch (op.op) {
          case UpdateType.PUT:
            console.info('TODO: create record remotely', record)
            break
          case UpdateType.PATCH:
            console.info('TODO: patch record remotely', record)
            break
          case UpdateType.DELETE:
            console.info('TODO: delete record remotely', record)
            break
        }
      }

      await transaction.complete()
    } catch (error) {
      console.error('PowerSync uploadData failed', error)
      throw error
    }
  }
}
