import { postgres } from 'vite-plugin-neon-new'

export default postgres({
  seed: {
    type: 'sql-script',
    path: 'db/init.sql',
  },
  referrer: 'create-tanstack',
  dotEnvKey: 'DATABASE_URL',
})
