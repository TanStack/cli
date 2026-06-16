export interface IQuote {
  __component: 'shared.quote'
  id: number
  body: string
  title?: string
}

export function Quote({ body, title }: Readonly<IQuote>) {
  return (
    <blockquote className="demo-card my-6 border-l-4 border-l-[var(--lagoon-deep)] py-4 pl-6">
      <p className="demo-muted text-xl italic leading-relaxed">{body}</p>
      {title && (
        <cite className="mt-4 block font-medium not-italic text-[var(--sea-ink)]">
          — {title}
        </cite>
      )}
    </blockquote>
  )
}
