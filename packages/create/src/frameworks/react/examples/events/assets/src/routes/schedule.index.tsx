import { createFileRoute, Link } from '@tanstack/react-router'
import { Clock, Calendar, MapPin, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { allTalks, allSpeakers } from 'content-collections'

import RemyAssistant from '#/components/RemyAssistant'

export const Route = createFileRoute('/schedule/')({
  component: SchedulePage,
})

// Helper to get speaker data by name
function getSpeakerByName(name: string) {
  return allSpeakers.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  )
}

// Define the conference schedule with time slots
const scheduleData = [
  {
    day: 1,
    date: 'March 15, 2026',
    dayName: 'Day One',
    theme: 'French Foundations',
    sessions: [
      { time: '9:00 AM', talkSlug: 'french-macaron-mastery' },
      { time: '11:30 AM', talkSlug: 'croissant-lamination-secrets' },
      { time: '3:00 PM', talkSlug: 'the-science-of-sugar' },
    ],
  },
  {
    day: 2,
    date: 'March 16, 2026',
    dayName: 'Day Two',
    theme: 'Global Traditions',
    sessions: [
      { time: '9:00 AM', talkSlug: 'sourdough-from-starter-to-masterpiece' },
      { time: '11:30 AM', talkSlug: 'umami-in-pastry-east-meets-west' },
      { time: '2:30 PM', talkSlug: 'savory-breads-of-the-mediterranean' },
    ],
  },
  {
    day: 3,
    date: 'March 17, 2026',
    dayName: 'Day Three',
    theme: 'Artisan Mastery',
    sessions: [
      { time: '9:00 AM', talkSlug: 'the-art-of-the-perfect-tart' },
      { time: '11:00 AM', talkSlug: 'neapolitan-pizza-tradition-meets-innovation' },
    ],
  },
]

function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(1)

  const currentDayData = scheduleData.find((d) => d.day === selectedDay)!

  return (
    <>
      <RemyAssistant />
      <div className="min-h-screen">
        {/* Hero section */}
        <div className="relative py-16 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-copper/10 border border-copper/30 text-copper-light text-sm font-medium">
              <Calendar className="w-4 h-4" />
              <span>March 15-17, 2026</span>
              <span className="mx-2 text-copper/40">•</span>
              <MapPin className="w-4 h-4" />
              <span>Paris, France</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-cream mb-4">
              Conference <span className="text-gold italic">Schedule</span>
            </h1>
            <p className="text-xl text-cream/70 max-w-2xl mx-auto font-body">
              Three days of masterclasses, demonstrations, and culinary inspiration from the world's finest pastry artisans.
            </p>
          </div>
        </div>

        {/* Day selector tabs */}
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex justify-center">
            <div className="inline-flex bg-card/50 rounded-2xl p-2 border border-border/50">
              {scheduleData.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`relative px-8 py-4 rounded-xl font-display font-semibold transition-all duration-300 ${
                    selectedDay === day.day
                      ? 'bg-gradient-to-br from-copper to-copper-dark text-charcoal shadow-lg shadow-copper/20'
                      : 'text-cream/70 hover:text-cream hover:bg-card'
                  }`}
                >
                  <span className="block text-xs uppercase tracking-wider opacity-75">
                    {day.dayName}
                  </span>
                  <span className="block text-lg">{day.date.split(',')[0].split(' ').slice(0, 2).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Day theme header */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-cream mb-2">
              {currentDayData.dayName}: <span className="text-gold italic">{currentDayData.theme}</span>
            </h2>
            <p className="text-cream/50 font-body">{currentDayData.date}</p>
          </div>
        </div>

        {/* Schedule timeline */}
        <div className="max-w-5xl mx-auto px-6 pb-20">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-12 top-0 bottom-0 w-px bg-gradient-to-b from-copper via-gold to-copper/30" />

            {/* Sessions */}
            <div className="space-y-8">
              {currentDayData.sessions.map((session, index) => {
                const talk = allTalks.find((t) => t.slug === session.talkSlug)
                if (!talk) return null

                const speaker = getSpeakerByName(talk.speaker)

                return (
                  <Link
                    key={session.talkSlug}
                    to={`/talks/${talk.slug}`}
                    className="group block"
                  >
                    <div className="relative flex gap-6 md:gap-10">
                      {/* Time marker */}
                      <div className="flex-shrink-0 w-16 md:w-24 pt-6">
                        <div className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -right-[13px] md:-right-[17px] top-0 w-6 h-6 rounded-full bg-charcoal border-2 border-gold flex items-center justify-center group-hover:border-copper group-hover:scale-110 transition-all">
                            <div className="w-2 h-2 rounded-full bg-gold group-hover:bg-copper transition-colors" />
                          </div>
                          <span className="block text-right text-sm md:text-base font-display font-semibold text-copper-light">
                            {session.time}
                          </span>
                        </div>
                      </div>

                      {/* Session card */}
                      <div
                        className="flex-1 relative overflow-hidden rounded-2xl bg-card border border-border/50 
                          group-hover:border-gold/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-gold/5
                          group-hover:-translate-y-1"
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        {/* Background image with overlay */}
                        <div className="absolute inset-0">
                          <img
                            src={`/${talk.image}`}
                            alt={talk.title}
                            className="w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/95 to-charcoal/80" />
                        </div>

                        {/* Content */}
                        <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
                          {/* Speaker image */}
                          {speaker && (
                            <div className="flex-shrink-0">
                              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border-2 border-gold/30 group-hover:border-gold/60 transition-colors shadow-lg">
                                <img
                                  src={`/${speaker.headshot}`}
                                  alt={speaker.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
                              </div>
                            </div>
                          )}

                          {/* Talk info */}
                          <div className="flex-1 min-w-0">
                            {/* Topics */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {talk.topics.slice(0, 3).map((topic) => (
                                <span
                                  key={topic}
                                  className="px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase bg-gold/10 text-gold border border-gold/20 rounded-full"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>

                            {/* Title */}
                            <h3 className="font-display text-xl md:text-2xl font-semibold text-cream group-hover:text-gold transition-colors mb-2 leading-tight">
                              {talk.title}
                            </h3>

                            {/* Speaker & Duration */}
                            <div className="flex flex-wrap items-center gap-4 text-cream/60 text-sm mb-3">
                              <span className="font-medium text-copper-light">
                                {talk.speaker}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{talk.duration}</span>
                              </div>
                            </div>

                            {/* Speaker title if available */}
                            {speaker && (
                              <p className="text-cream/50 text-sm font-body">
                                {speaker.title} at {speaker.restaurant}
                              </p>
                            )}
                          </div>

                          {/* Arrow indicator */}
                          <div className="flex-shrink-0 self-center">
                            <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 group-hover:border-gold/40 transition-all">
                              <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="max-w-4xl mx-auto px-6 pb-20">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-card to-charcoal border border-border/50 overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-copper/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />
            
            <div className="relative">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-cream mb-3">
                Don't Miss a Single Session
              </h3>
              <p className="text-cream/60 font-body mb-6 max-w-xl mx-auto">
                Each masterclass offers hands-on learning from the world's finest pastry artisans.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/talks"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-copper to-copper-dark text-charcoal font-semibold transition-all hover:shadow-lg hover:shadow-copper/30 hover:scale-[1.02]"
                >
                  Browse All Sessions
                </Link>
                <Link
                  to="/speakers"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gold/50 text-gold font-semibold transition-all hover:bg-gold/10 hover:border-gold"
                >
                  Meet the Speakers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
