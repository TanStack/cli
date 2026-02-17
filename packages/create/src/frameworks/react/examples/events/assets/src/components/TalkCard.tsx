import { Link } from '@tanstack/react-router'
import { Clock, User } from 'lucide-react'

import { type Talk } from 'content-collections'

import { Card, CardContent } from '#/components/ui/card'

interface TalkCardProps {
  talk: Talk
  featured?: boolean
}

export default function TalkCard({ talk, featured = false }: TalkCardProps) {
  return (
    <Link
      to={`/talks/${talk.slug}`}
      className="group relative block"
    >
      <Card
        className={`relative overflow-hidden bg-card border-border/50 card-hover
          ${featured ? 'aspect-[16/10]' : 'aspect-[16/9]'}
          hover:border-gold/50`}
      >
        {/* Image */}
        <div className="absolute inset-0">
          <img 
            src={`/${talk.image}`} 
            alt={talk.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
        </div>

        {/* Content overlay */}
        <CardContent className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="space-y-3">
            {/* Topics */}
            <div className="flex flex-wrap gap-2">
              {talk.topics.slice(0, 2).map((topic) => (
                <span 
                  key={topic}
                  className="px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase bg-gold/15 text-gold border border-gold/30 rounded-full"
                >
                  {topic}
                </span>
              ))}
            </div>
            
            {/* Title */}
            <h3 className="font-display text-xl font-semibold text-cream group-hover:text-gold transition-colors leading-tight">
              {talk.title}
            </h3>
            
            {/* Speaker & Duration */}
            <div className="flex items-center gap-4 text-cream/60 text-sm">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{talk.speaker}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{talk.duration}</span>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Decorative accent */}
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <span className="text-gold/60 text-xs font-display">✦</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
