import { Link } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'

import { type Speaker } from 'content-collections'

import { Card, CardContent } from '#/components/ui/card'

interface SpeakerCardProps {
  speaker: Speaker
  featured?: boolean
}

export default function SpeakerCard({ speaker, featured = false }: SpeakerCardProps) {
  return (
    <Link
      to={`/speakers/${speaker.slug}`}
      className="group relative block"
    >
      <Card
        className={`relative overflow-hidden bg-card border-border/50 card-hover
          ${featured ? 'aspect-square' : 'aspect-square'}
          hover:border-copper/50`}
      >
        {/* Headshot */}
        <div className="absolute inset-0">
          <img 
            src={`/${speaker.headshot}`} 
            alt={speaker.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent" />
        </div>

        {/* Content overlay */}
        <CardContent className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="space-y-2">
            {/* Specialty tag */}
            <span className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase bg-copper/20 text-copper-light rounded-full border border-copper/30">
              {speaker.specialty}
            </span>
            
            {/* Name */}
            <h3 className="font-display text-2xl font-semibold text-cream group-hover:text-gold transition-colors">
              {speaker.name}
            </h3>
            
            {/* Title & Restaurant */}
            <p className="text-cream/70 font-body text-lg">
              {speaker.title}
            </p>
            
            {/* Location */}
            <div className="flex items-center gap-2 text-cream/50 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{speaker.restaurant}, {speaker.location}</span>
            </div>
          </div>
        </CardContent>

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-copper/20 to-transparent transform rotate-45 translate-x-14 -translate-y-14" />
        </div>
      </Card>
    </Link>
  )
}
