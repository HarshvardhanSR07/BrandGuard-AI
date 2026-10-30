import React from 'react';

/**
 * Safely parses inline markdown tokens (bold, italic, code, quotes) into React nodes.
 * Strictly avoids dangerouslySetInnerHTML to prevent XSS.
 */
export const InlineFormattedText: React.FC<{ text: string }> = ({ text }) => {
  // Tokenize the string by inline markers:
  // 1. Code: `...`
  // 2. Bold+Italic: ***...***
  // 3. Bold: **...** or __...__
  // 4. Italic: *...* or _..._
  // 5. Links: [text](url)
  const regex = /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        // Inline Code: `...`
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
          return (
            <code
              key={index}
              className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/50 text-[#86efac] border border-[#2b3547]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Bold + Italic: ***...***
        if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
          const inner = part.slice(3, -3);
          return (
            <strong key={index} className="font-semibold text-white">
              <em className="italic text-[#86efac]">{inner}</em>
            </strong>
          );
        }

        // Bold: **...** or __...__
        if (
          (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
          (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
        ) {
          const inner = part.slice(2, -2);
          return (
            <strong key={index} className="font-semibold text-white">
              {inner}
            </strong>
          );
        }

        // Italic: *...* or _..._
        if (
          (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
          (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
        ) {
          const inner = part.slice(1, -1);
          return (
            <em key={index} className="italic text-[#a7f3d0]">
              {inner}
            </em>
          );
        }

        // Safe Link: [label](url)
        if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
          const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (match) {
            const [, label, url] = match;
            // Only allow http, https, or mailto protocols
            const isSafeUrl = /^https?:\/\//i.test(url) || /^mailto:/i.test(url);
            if (isSafeUrl) {
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#86efac] underline underline-offset-2 hover:text-[#4ade80] transition-colors"
                >
                  {label}
                </a>
              );
            }
            return <span key={index}>{label}</span>;
          }
        }

        // Plain text token
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

interface Block {
  type: 'paragraph' | 'ordered-list' | 'bullet-list';
  items?: string[];
  text?: string;
}

/**
 * Splits raw assistant message into structured blocks:
 * Detects numbered lists (both multiline "1. " and inline " 1. ... 2. ..."),
 * bullet lists ("• ", "- "), and paragraphs.
 */
function parseMessageBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  if (!content) return blocks;

  // Check if content has inline or multiline numbered list like " 1. ... 2. ..."
  // E.g. "✨ Here are two on-brand suggestions tailored for Alex Morgan: 1. *"...""* 2. **"..."** Both options are..."
  const numberedListPattern = /(?:^|\s)(?:1\.\s+[\s\S]+?)(?=(?:\s[1-9]\.\s+|$))/g;
  const hasNumberedList = /(?:^|\s)1\.\s+/.test(content) && /(?:^|\s)2\.\s+/.test(content);

  if (hasNumberedList) {
    // Extract preface before "1. "
    const firstNumIdx = content.search(/(?:^|\s)1\.\s+/);
    const prefix = content.substring(0, firstNumIdx).trim();
    if (prefix) {
      blocks.push({ type: 'paragraph', text: prefix });
    }

    const rest = content.substring(firstNumIdx).trim();

    // Regex to extract items: 1. ..., 2. ..., 3. ...
    // and whatever follows after the last numbered item
    const itemRegex = /(?:^|\s)([1-9]\d*)\.\s+([\s\S]*?)(?=(?:\s[1-9]\d*\.\s+|$))/g;
    const listItems: string[] = [];
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = itemRegex.exec(rest)) !== null) {
      listItems.push(match[2].trim());
      lastIndex = itemRegex.lastIndex;
    }

    if (listItems.length > 0) {
      // Check if the last item has trailing concluding text (e.g. "Both options are fully compliant...")
      const lastItem = listItems[listItems.length - 1];
      // Often sentences after closing quotes like: *"..."* Both options are...
      const trailingSentenceMatch = lastItem.match(/(.*?(?:["”'’]\s*\**|["”'’]\s*\**|\.\s*\**))\s+([A-Z][\s\S]*)$/);

      if (trailingSentenceMatch && trailingSentenceMatch[2]) {
        listItems[listItems.length - 1] = trailingSentenceMatch[1].trim();
        const trailingText = trailingSentenceMatch[2].trim();
        blocks.push({ type: 'ordered-list', items: listItems });
        if (trailingText) {
          blocks.push({ type: 'paragraph', text: trailingText });
        }
      } else {
        blocks.push({ type: 'ordered-list', items: listItems });
      }
      return blocks;
    }
  }

  // Multiline splitting for standard content (bullet lists, paragraphs)
  const rawParagraphs = content.split(/\n\s*\n/);

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);

    // Check if lines are all bullets (•, -, *)
    const isBulletList = lines.length > 1 && lines.every((l) => /^[•\-*]\s+/.test(l));
    if (isBulletList) {
      blocks.push({
        type: 'bullet-list',
        items: lines.map((l) => l.replace(/^[•\-*]\s+/, '')),
      });
      continue;
    }

    // Check if lines are ordered list (1., 2.)
    const isOrderedList = lines.length > 1 && lines.every((l) => /^\d+\.\s+/.test(l));
    if (isOrderedList) {
      blocks.push({
        type: 'ordered-list',
        items: lines.map((l) => l.replace(/^\d+\.\s+/, '')),
      });
      continue;
    }

    // Single or mixed paragraph
    blocks.push({ type: 'paragraph', text: trimmed });
  }

  return blocks;
}

/**
 * Clean helper to strip unnecessary leading/trailing quotes around suggestion copy
 * while preserving internal emphasis.
 */
function cleanSuggestionText(text: string): string {
  let cleaned = text.trim();
  // Strip outer quotes if enclosed: e.g. "Designed for longevity..." -> Designed for longevity...
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith('“') && cleaned.endsWith('”'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export interface LaxMessageRendererProps {
  content: string;
  sender: 'lax' | 'user';
}

export const LaxMessageRenderer: React.FC<LaxMessageRendererProps> = ({ content, sender }) => {
  if (sender === 'user') {
    return <span className="break-words font-medium">{content}</span>;
  }

  const blocks = parseMessageBlocks(content);

  if (blocks.length === 0) {
    return <InlineFormattedText text={content} />;
  }

  return (
    <div className="space-y-2.5 text-xs text-white/90 leading-relaxed font-sans break-words">
      {blocks.map((block, idx) => {
        if (block.type === 'ordered-list' && block.items) {
          return (
            <div key={idx} className="space-y-2 my-2.5">
              {block.items.map((item, itemIdx) => {
                const cleaned = cleanSuggestionText(item);
                return (
                  <div
                    key={itemIdx}
                    className="flex items-start gap-2.5 bg-[#0e121a]/90 border border-[#2b3547] hover:border-[#22c55e]/50 rounded-xl p-2.5 shadow-xs transition-colors group"
                  >
                    <span className="w-5 h-5 rounded-md bg-[#22c55e]/15 text-[#86efac] border border-[#22c55e]/30 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5 group-hover:bg-[#22c55e]/25 transition-colors">
                      {itemIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0 font-medium text-white/95 leading-relaxed">
                      <InlineFormattedText text={cleaned} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        if (block.type === 'bullet-list' && block.items) {
          return (
            <ul key={idx} className="space-y-1.5 my-2 pl-1 list-none">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2 text-white/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <InlineFormattedText text={item} />
                  </div>
                </li>
              ))}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} className="leading-relaxed">
            <InlineFormattedText text={block.text || ''} />
          </p>
        );
      })}
    </div>
  );
};
