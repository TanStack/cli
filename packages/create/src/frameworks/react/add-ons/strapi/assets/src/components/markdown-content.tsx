import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string | undefined | null;
  className?: string;
}

const styles = {
  h1: "text-3xl font-bold mb-6 text-white",
  h2: "text-2xl font-bold mb-4 text-white",
  h3: "text-xl font-bold mb-3 text-white",
  p: "mb-4 leading-relaxed text-gray-300",
  a: "text-cyan-400 hover:underline",
  ul: "list-disc pl-6 mb-4 space-y-2 text-gray-300",
  ol: "list-decimal pl-6 mb-4 space-y-2 text-gray-300",
  li: "leading-relaxed",
  blockquote: "border-l-4 border-cyan-400 pl-4 italic text-gray-400 my-4",
  code: "bg-slate-800 px-2 py-1 rounded text-cyan-400 text-sm font-mono",
  pre: "bg-slate-800 p-4 rounded-lg overflow-x-auto mb-4",
  table: "w-full border-collapse mb-4",
  th: "border border-slate-700 p-2 bg-slate-800 text-left text-white",
  td: "border border-slate-700 p-2 text-gray-300",
  img: "max-w-full h-auto rounded-lg my-4",
  hr: "border-slate-700 my-8",
  strong: "text-white font-semibold",
};

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
          p: ({ children }) => <p className={styles.p}>{children}</p>,
          a: ({ href, children }) => (
            <a href={href} className={styles.a} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
          li: ({ children }) => <li className={styles.li}>{children}</li>,
          blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
          code: ({ className, children }) => {
            const isCodeBlock = className?.includes("language-");
            if (isCodeBlock) {
              return (
                <pre className={styles.pre}>
                  <code className="text-sm font-mono text-gray-300">{children}</code>
                </pre>
              );
            }
            return <code className={styles.code}>{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => <table className={styles.table}>{children}</table>,
          th: ({ children }) => <th className={styles.th}>{children}</th>,
          td: ({ children }) => <td className={styles.td}>{children}</td>,
          img: ({ src, alt }) => <img src={src} alt={alt || ""} className={styles.img} />,
          hr: () => <hr className={styles.hr} />,
          strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
