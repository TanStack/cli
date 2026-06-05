import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string | undefined | null
  className?: string
}

const styles = {
  h1: 'mb-6 text-3xl font-bold text-[var(--sea-ink)]',
  h2: 'mb-4 text-2xl font-bold text-[var(--sea-ink)]',
  h3: 'mb-3 text-xl font-bold text-[var(--sea-ink)]',
  p: 'demo-muted mb-4 leading-relaxed',
  a: 'hover:underline',
  ul: 'demo-muted mb-4 list-disc space-y-2 pl-6',
  ol: 'demo-muted mb-4 list-decimal space-y-2 pl-6',
  li: 'leading-relaxed',
  blockquote:
    'demo-card my-4 border-l-4 border-l-[var(--lagoon-deep)] pl-4 italic',
  code: 'text-sm font-mono',
  pre: 'demo-code-block mb-4 overflow-x-auto',
  table: 'w-full border-collapse mb-4',
  th: 'border border-[var(--line)] bg-[var(--chip-bg)] p-2 text-left text-[var(--sea-ink)]',
  td: 'demo-muted border border-[var(--line)] p-2',
  img: 'max-w-full h-auto rounded-lg my-4',
  hr: 'my-8 border-[var(--line)]',
  strong: 'font-semibold text-[var(--sea-ink)]',
}

export function MarkdownContent({
  content,
  className = '',
}: MarkdownContentProps) {
  if (!content) return null

  return (
    <div className={`max-w-none ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
          p: ({ children }) => <p className={styles.p}>{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              className={styles.a}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
          li: ({ children }) => <li className={styles.li}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className={styles.blockquote}>{children}</blockquote>
          ),
          code: ({ className, children }) => {
            const isCodeBlock = className?.includes('language-')
            if (isCodeBlock) {
              return (
                <pre className={styles.pre}>
                  <code className="text-sm font-mono">{children}</code>
                </pre>
              )
            }
            return <code className={styles.code}>{children}</code>
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <table className={styles.table}>{children}</table>
          ),
          th: ({ children }) => <th className={styles.th}>{children}</th>,
          td: ({ children }) => <td className={styles.td}>{children}</td>,
          img: ({ src, alt }) => (
            <img src={src} alt={alt || ''} className={styles.img} />
          ),
          hr: () => <hr className={styles.hr} />,
          strong: ({ children }) => (
            <strong className={styles.strong}>{children}</strong>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
