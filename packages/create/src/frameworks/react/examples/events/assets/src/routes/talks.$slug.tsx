import { createFileRoute, Link } from '@tanstack/react-router'
import { marked } from 'marked'
import { Clock, User, ArrowLeft, Tag } from 'lucide-react'

import { allTalks, allSpeakers } from 'content-collections'

import RemyAssistant from '#/components/RemyAssistant'

export const Route = createFileRoute('/talks/$slug')({
  loader: async ({ params }) => {
    const talk = allTalks.find((t) => t.slug === params.slug)
    if (!talk) {
      throw new Error('Talk not found')
    }
    const speaker = allSpeakers.find((s) => s.name === talk.speaker)
    return { talk, speaker }
  },
  component: TalkDetailPage,
})

function TalkDetailPage() {
  const { talk, speaker } = Route.useLoaderData()

  return (
    <div className="min-h-screen">
      <RemyAssistant />

      {/* Back navigation */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Link 
          to="/talks" 
          className="inline-flex items-center gap-2 text-cream/60 hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Sessions</span>
        </Link>
      </div>

      {/* Hero image */}
      <div className="relative h-[40vh] max-w-7xl mx-auto px-6 mb-8">
        <div className="w-full h-full rounded-2xl overflow-hidden border border-border/50">
          <img 
            src={`/${talk.image}`} 
            alt={talk.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-6 bg-gradient-to-t from-charcoal/60 to-transparent rounded-2xl pointer-events-none" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6">
        {/* Topics */}
        <div className="flex flex-wrap gap-2 mb-6">
          {talk.topics.map((topic) => (
            <span 
              key={topic}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium tracking-wide uppercase bg-gold/15 text-gold border border-gold/30 rounded-full"
            >
              <Tag className="w-3 h-3" />
              {topic}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl font-bold text-cream mb-6 leading-tight">
          {talk.title}
        </h1>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-6 mb-10 pb-10 border-b border-border/50">
          {/* Speaker link */}
          {speaker ? (
            <Link 
              to={`/speakers/${speaker.slug}`}
              className="flex items-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border border-border/50">
                <img 
                  src={`/${speaker.headshot}`} 
                  alt={speaker.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-cream group-hover:text-gold transition-colors font-medium">
                  {talk.speaker}
                </p>
                <p className="text-cream/50 text-sm">{speaker.restaurant}</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-cream/70">
              <User className="w-5 h-5 text-copper" />
              <span>{talk.speaker}</span>
            </div>
          )}

          {/* Duration */}
          <div className="flex items-center gap-2 text-cream/60">
            <Clock className="w-5 h-5 text-copper" />
            <span className="text-lg">{talk.duration}</span>
          </div>
        </div>

        {/* Description content */}
        <div className="prose prose-lg max-w-none prose-invert prose-p:text-cream/80 prose-headings:text-cream prose-headings:font-display prose-strong:text-cream prose-a:text-gold prose-li:text-cream/80 prose-ul:text-cream/80 font-body text-lg leading-relaxed pb-20">
          <div
            dangerouslySetInnerHTML={{ __html: marked(talk.content) }}
          />
        </div>
      </div>
    </div>
  )
}
