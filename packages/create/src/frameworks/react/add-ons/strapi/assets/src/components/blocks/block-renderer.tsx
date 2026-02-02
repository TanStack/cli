import { RichText } from "./rich-text";
import { Quote } from "./quote";
import { Media } from "./media";
import { Slider } from "./slider";

import type { IRichText } from "./rich-text";
import type { IQuote } from "./quote";
import type { IMedia } from "./media";
import type { ISlider } from "./slider";

// Union type of all block types
export type Block = IRichText | IQuote | IMedia | ISlider;

interface BlockRendererProps {
  blocks: Array<Block>;
}

/**
 * BlockRenderer - Renders dynamic content blocks from Strapi
 *
 * Usage:
 * ```tsx
 * <BlockRenderer blocks={article.blocks} />
 * ```
 */
export function BlockRenderer({ blocks }: Readonly<BlockRendererProps>) {
  if (!blocks || blocks.length === 0) return null;

  const renderBlock = (block: Block) => {
    switch (block.__component) {
      case "shared.rich-text":
        return <RichText {...block} />;
      case "shared.quote":
        return <Quote {...block} />;
      case "shared.media":
        return <Media {...block} />;
      case "shared.slider":
        return <Slider {...block} />;
      default:
        // Log unknown block types in development
        console.warn("Unknown block type:", (block as any).__component);
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <div key={`${block.__component}-${block.id}-${index}`}>
          {renderBlock(block)}
        </div>
      ))}
    </div>
  );
}
