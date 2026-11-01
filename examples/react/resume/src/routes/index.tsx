import { createFileRoute } from '@tanstack/react-router'
import { allEducations, allJobs } from 'content-collections'
import { marked } from 'marked'
import { useMemo, useState } from 'react'

export const Route = createFileRoute('/')({
  component: ResumePage,
})

function ResumePage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    const tags = new Set<string>()

    for (const job of allJobs) {
      for (const tag of job.tags) tags.add(tag)
    }

    for (const education of allEducations) {
      for (const tag of education.tags) tags.add(tag)
    }

    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  }, [])

  const filteredJobs = useMemo(() => {
    const jobs =
      selectedTags.length === 0
        ? [...allJobs]
        : allJobs.filter((job) => selectedTags.some((tag) => job.tags.includes(tag)))

    const getSortValue = (job: (typeof allJobs)[number]) => {
      if (!job.endDate) {
        return Number.POSITIVE_INFINITY
      }

      const endTime = Date.parse(job.endDate)
      if (Number.isFinite(endTime)) {
        return endTime
      }

      const startTime = Date.parse(job.startDate)
      return Number.isFinite(startTime) ? startTime : 0
    }

    return jobs.sort((a, b) => getSortValue(b) - getSortValue(a))
  }, [selectedTags])

  return (
    <main className="resume-shell">
      <section className="resume-hero rise-in" style={{ animationDelay: '50ms' }}>
        <div className="resume-hero-copy">
          <p className="resume-kicker">Product-minded frontend engineer</p>
          <h1>
            Hi, I&apos;m <span>Jane Smith</span>.
          </h1>
          <p className="resume-summary">
            I design and ship interfaces that feel calm, fast, and obvious to use. I work best on teams that care about
            systems, product craft, and measurable outcomes.
          </p>
          <ul className="resume-meta" aria-label="Profile details">
            <li>Remote-first</li>
            <li>Staff / Lead roles</li>
            <li>React + TypeScript + TanStack</li>
          </ul>

          <dl className="resume-fact-row" aria-label="Quick profile facts">
            <div>
              <dt>Experience</dt>
              <dd>8+ years</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>Remote</dd>
            </div>
            <div>
              <dt>Specialty</dt>
              <dd>Design Systems</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>GMT-6</dd>
            </div>
          </dl>
        </div>

        <aside className="resume-identity-card" aria-label="Candidate portrait">
          <img src="/headshot-on-white.jpg" alt="Portrait of Jane Smith" className="resume-portrait" />
        </aside>
      </section>

      <section className="resume-filter rise-in" style={{ animationDelay: '120ms' }}>
        <div className="resume-filter-label">Filter by skill</div>
        <div className="resume-tags" role="list" aria-label="Skill filters">
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag)

            return (
              <button
                key={tag}
                type="button"
                role="listitem"
                aria-pressed={active}
                className="resume-tag"
                data-active={active ? 'true' : 'false'}
                onClick={() => {
                  setSelectedTags((prev) =>
                    prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
                  )
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </section>

      <section className="resume-grid">
        <aside className="resume-aside rise-in" style={{ animationDelay: '170ms' }}>
          <article className="resume-panel">
            <h2>Approach</h2>
            <p>
              I turn broad product goals into usable, maintainable frontend systems. I care about clarity, accessibility,
              and helping teams move faster over time.
            </p>
          </article>

          <article className="resume-panel">
            <h2>Core stack</h2>
            <ul>
              <li>React, TypeScript, TanStack Router + Query</li>
              <li>Design systems with Tailwind and Radix</li>
              <li>SSR and API-driven product surfaces</li>
              <li>Testing with Vitest and Testing Library</li>
            </ul>
          </article>
        </aside>

        <div className="resume-mainline">
          <section className="rise-in" style={{ animationDelay: '220ms' }}>
            <header className="section-head">
              <h2>Experience</h2>
              <p>{filteredJobs.length} roles shown</p>
            </header>

            <ol className="timeline" aria-label="Work experience timeline">
              {filteredJobs.map((job, index) => (
                <li
                  key={`${job.company}-${job.jobTitle}`}
                  className="timeline-item rise-in"
                  style={{ animationDelay: `${280 + index * 65}ms` }}
                >
                  <article className="timeline-card">
                    <div className="timeline-top">
                      <h3>{job.jobTitle}</h3>
                      <span>
                        {job.startDate} - {job.endDate || 'Present'}
                      </span>
                    </div>
                    <p className="timeline-company">
                      {job.company} - {job.location}
                    </p>
                    <p>{job.summary}</p>

                    {job.content ? (
                      <details>
                        <summary>Highlights</summary>
                        <div
                          className="markdown"
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(job.content) as string,
                          }}
                        />
                      </details>
                    ) : null}

                    <ul className="chip-row" aria-label={`${job.jobTitle} technologies`}>
                      {job.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  </article>
                </li>
              ))}
            </ol>
          </section>

          <section className="rise-in" style={{ animationDelay: '360ms' }}>
            <header className="section-head">
              <h2>Education</h2>
            </header>

            <div className="edu-grid">
              {allEducations.map((education, index) => (
                <article
                  key={education.school}
                  className="edu-card rise-in"
                  style={{ animationDelay: `${420 + index * 70}ms` }}
                >
                  <div className="timeline-top">
                    <h3>{education.school}</h3>
                    <span>
                      {education.startDate} - {education.endDate || 'Present'}
                    </span>
                  </div>
                  <p>{education.summary}</p>
                  {education.content ? (
                    <div
                      className="markdown"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(education.content) as string,
                      }}
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
