import { createFileRoute } from '@tanstack/react-router'

import { allSpeakers } from 'content-collections'

import SpeakerCard from '#/components/SpeakerCard'
import RemyAssistant from '#/components/RemyAssistant'

export const Route = createFileRoute('/speakers/')({
  component: SpeakersPage,
})

function SpeakersPage() {
  return (
    <>
      <RemyAssistant />
      <div className="min-h-screen">
        {/* Hero section */}
        <div className="relative py-16 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-cream mb-4">
              Our <span className="text-gold italic">Distinguished</span> Speakers
            </h1>
            <p className="text-xl text-cream/70 max-w-2xl mx-auto font-body">
              Meet the world-renowned pastry chefs and master bakers who will share their expertise at Haute Pâtisserie 2026.
            </p>
          </div>
        </div>

        {/* Speakers grid */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allSpeakers.map((speaker) => (
              <SpeakerCard key={speaker.slug} speaker={speaker} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
