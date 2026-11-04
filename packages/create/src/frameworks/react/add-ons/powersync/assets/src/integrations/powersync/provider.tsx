import type { ReactNode } from 'react'
import { PowerSyncContext } from '@powersync/react'
import { PowerSyncDatabase, WASQLiteOpenFactory } from '@powersync/web'

import { AppSchema } from '#/lib/powersync/AppSchema'
import { BackendConnector } from '#/lib/powersync/BackendConnector'

const db = new PowerSyncDatabase({
  database: new WASQLiteOpenFactory({
    dbFilename: 'powersync.db',
  }),
  schema: AppSchema,
  flags: {
    disableSSRWarning: true,
  },
})

void db.connect(new BackendConnector())

export default function PowerSyncProvider({
  children,
}: {
  children: ReactNode
}) {
  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
}
