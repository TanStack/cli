import { createFileRoute } from '@tanstack/react-router'

import ChatArea from '#/components/demo.chat-area'

export const Route = createFileRoute('/demo/db-chat')({
  component: App,
})

function App() {
  return (
    <main className="demo-page demo-center">
      <section className="demo-panel flex h-[70vh] w-full max-w-3xl flex-col overflow-hidden p-0">
        <ChatArea />
      </section>
    </main>
  )
}
