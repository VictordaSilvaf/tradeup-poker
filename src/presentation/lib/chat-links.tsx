import type { ReactNode } from 'react';

const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,:;!?)\]])/gi;

export function renderMessageText(text: string): ReactNode[] {
  if (!text) return [];
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(URL_PATTERN.source, URL_PATTERN.flags);
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const href = match[0];
    parts.push(
      <a
        key={`${match.index}-${href}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-current/40 underline-offset-2 hover:decoration-current"
      >
        {href}
      </a>,
    );
    lastIndex = match.index + href.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
