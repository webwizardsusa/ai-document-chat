import { type ReactNode } from 'react';

/** Turn `**bold**` into <strong>; keep the rest as plain text. */
export const formatMessageText = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};
