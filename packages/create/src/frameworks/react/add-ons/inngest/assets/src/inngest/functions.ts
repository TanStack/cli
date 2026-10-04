import { eventType, staticSchema } from 'inngest'
import { inngest } from './client'

export const helloWorld = eventType('demo/hello.world', {
  schema: staticSchema<{ name: string }>(),
})

export const helloWorldFn = inngest.createFunction(
  { id: 'hello-world', triggers: [helloWorld] },
  async ({ event, step }) => {
    await step.sleep('wait-a-moment', '1s')
    return { message: `Hello ${event.data.name}!` }
  },
)
