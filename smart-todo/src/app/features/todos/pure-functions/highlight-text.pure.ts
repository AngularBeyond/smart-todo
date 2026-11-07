export interface TextSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Splits text into segments marking matches of query case-insensitively.
 */
export function highlightText(text: string, query: string): TextSegment[] {
  const trimmed = query.trim();
  if (!trimmed || !text) {
    return [{ text, isMatch: false }];
  }

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: part.toLowerCase() === trimmed.toLowerCase(),
    }));
}
