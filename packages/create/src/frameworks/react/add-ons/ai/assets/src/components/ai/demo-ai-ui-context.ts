import { createChatHookContexts } from '@tanstack/ai-react/ui'

// Scoped contexts so the registered chrome/part/tool widgets can read the
// chat instance even though they live in separate files from the hook.
export const { chatContext, partContext, interruptContext } =
  createChatHookContexts()
