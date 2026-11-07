import { describe, it, expect } from 'vitest';
import { highlightText } from './highlight-text.pure';

describe('highlightText', () => {
  it('returns single non-matching segment when query is empty', () => {
    expect(highlightText('Hello World', '')).toEqual([
      { text: 'Hello World', isMatch: false },
    ]);
    expect(highlightText('Hello World', '   ')).toEqual([
      { text: 'Hello World', isMatch: false },
    ]);
  });

  it('splits text into matching and non-matching segments case-insensitively', () => {
    expect(highlightText('Buy almond milk for breakfast', 'milk')).toEqual([
      { text: 'Buy almond ', isMatch: false },
      { text: 'milk', isMatch: true },
      { text: ' for breakfast', isMatch: false },
    ]);
  });

  it('handles multiple occurrences of query', () => {
    expect(highlightText('apple and apple', 'apple')).toEqual([
      { text: 'apple', isMatch: true },
      { text: ' and ', isMatch: false },
      { text: 'apple', isMatch: true },
    ]);
  });

  it('preserves original casing in matched segments', () => {
    expect(highlightText('TypeScript and javascript', 'script')).toEqual([
      { text: 'Type', isMatch: false },
      { text: 'Script', isMatch: true },
      { text: ' and java', isMatch: false },
      { text: 'script', isMatch: true },
    ]);
  });

  it('safely escapes regex special characters', () => {
    expect(highlightText('Price is $100 (usd)', '$100')).toEqual([
      { text: 'Price is ', isMatch: false },
      { text: '$100', isMatch: true },
      { text: ' (usd)', isMatch: false },
    ]);
  });
});
