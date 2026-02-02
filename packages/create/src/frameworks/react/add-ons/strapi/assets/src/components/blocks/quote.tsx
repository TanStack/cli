export interface IQuote {
  __component: "shared.quote";
  id: number;
  body: string;
  title?: string;
}

export function Quote({ body, title }: Readonly<IQuote>) {
  return (
    <blockquote className="border-l-4 border-cyan-400 pl-6 py-4 my-6 bg-slate-800/30 rounded-r-lg">
      <p className="text-xl italic text-gray-300 leading-relaxed">{body}</p>
      {title && (
        <cite className="block mt-4 text-cyan-400 not-italic font-medium">
          — {title}
        </cite>
      )}
    </blockquote>
  );
}
