import { createFileRoute } from '@tanstack/react-router'

import { allTalks } from 'content-collections'

import TalkCard from '#/components/TalkCard'
import RemyAssistant from '#/components/RemyAssistant'

export const Route = createFileRoute('/talks/')({
  component: TalksPage,
})

function TalksPage() {
  return (
    <>
      <RemyAssistant />
      <div className="min-h-screen">
        {/* Hero section */}
        <div className="relative py-16 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-cream mb-4">
              Conference <span className="text-gold italic">Sessions</span>
            </h1>
            <p className="text-xl text-cream/70 max-w-2xl mx-auto font-body">
              Immerse yourself in masterclasses and demonstrations covering every aspect of artisan baking and pastry.
            </p>
          </div>
        </div>

        {/* Talks grid */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {allTalks.map((talk) => (
              <TalkCard key={talk.slug} talk={talk} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
