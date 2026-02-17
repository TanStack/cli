import { createFileRoute } from '@tanstack/react-router'
import { marked } from 'marked'
import { MapPin, Award, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { allSpeakers, allTalks } from 'content-collections'

import RemyAssistant from '#/components/RemyAssistant'
import TalkCard from '#/components/TalkCard'

export const Route = createFileRoute('/speakers/$slug')({
  loader: async ({ params }) => {
    const speaker = allSpeakers.find((s) => s.slug === params.slug)
    if (!speaker) {
      throw new Error('Speaker not found')
    }
    const speakerTalks = allTalks.filter((t) => t.speaker === speaker.name)
    return { speaker, speakerTalks }
  },
  component: SpeakerDetailPage,
})

function SpeakerDetailPage() {
  const { speaker, speakerTalks } = Route.useLoaderData()

  return (
    <div className="min-h-screen">
      <RemyAssistant />

      {/* Back navigation */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link 
          to="/speakers" 
          className="inline-flex items-center gap-2 text-cream/60 hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Speakers</span>
        </Link>
      </div>

      {/* Hero section */}
      <div className="relative py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Photo */}
            <div className="lg:col-span-1">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border/50">
                <img 
                  src={`/${speaker.headshot}`} 
                  alt={speaker.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-2 flex flex-col justify-center">
              {/* Specialty tag */}
              <span className="inline-block w-fit px-4 py-1.5 text-sm font-medium tracking-wider uppercase bg-copper/20 text-copper-light rounded-full border border-copper/30 mb-4">
                {speaker.specialty}
              </span>

              <h1 className="font-display text-5xl md:text-6xl font-bold text-cream mb-3">
                {speaker.name}
              </h1>

              <p className="text-2xl text-gold font-display italic mb-4">
                {speaker.title}
              </p>

              <div className="flex items-center gap-2 text-cream/60 text-lg mb-8">
                <MapPin className="w-5 h-5 text-copper" />
                <span>{speaker.restaurant}, {speaker.location}</span>
              </div>

              {/* Awards */}
              {speaker.awards && speaker.awards.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium tracking-wider uppercase text-cream/50">Awards & Recognition</h3>
                  <div className="flex flex-wrap gap-2">
                    {speaker.awards.map((award) => (
                      <span 
                        key={award}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gold/10 text-gold/90 rounded-lg border border-gold/20"
                      >
                        <Award className="w-3.5 h-3.5" />
                        {award}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none prose-invert prose-p:text-cream/80 prose-headings:text-cream prose-headings:font-display prose-strong:text-cream prose-a:text-gold font-body text-lg leading-relaxed">
          <div
            dangerouslySetInnerHTML={{ __html: marked(speaker.content) }}
          />
        </div>
      </div>

      {/* Speaker's talks */}
      {speakerTalks.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="font-display text-3xl font-bold text-cream mb-8">
            Sessions by {speaker.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {speakerTalks.map((talk) => (
              <TalkCard key={talk.slug} talk={talk} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
