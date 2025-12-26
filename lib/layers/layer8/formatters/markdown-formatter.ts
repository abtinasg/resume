/**
 * Layer 8 - AI Coach Interface
 * Markdown Formatter
 *
 * Provides utilities for formatting Coach responses as markdown.
 */

import type { OutputFormat } from '../types';

// ==================== Markdown Formatting ====================

/**
 * Format text with bold styling
 */
export function bold(text: string): string {
  if (!text) return '';
  return `**${text}**`;
}

/**
 * Format text with italic styling
 */
export function italic(text: string): string {
  if (!text) return '';
  return `*${text}*`;
}

/**
 * Format text as a heading
 */
export function heading(text: string, level: 1 | 2 | 3 | 4 = 2): string {
  if (!text) return '';
  const hashes = '#'.repeat(level);
  return `${hashes} ${text}`;
}

/**
 * Format text as a link
 */
export function link(text: string, url: string): string {
  if (!text || !url) return text || '';
  return `[${text}](${url})`;
}

/**
 * Format text as inline code
 */
export function inlineCode(text: string): string {
  if (!text) return '';
  return `\`${text}\``;
}

/**
 * Format text as a code block
 */
export function codeBlock(code: string, language: string = ''): string {
  if (!code) return '';
  return `\`\`\`${language}\n${code}\n\`\`\``;
}

/**
 * Format text as a blockquote
 */
export function blockquote(text: string): string {
  if (!text) return '';
  return text.split('\n').map(line => `> ${line}`).join('\n');
}

/**
 * Format text as a horizontal rule
 */
export function horizontalRule(): string {
  return '---';
}

/**
 * Format a bullet list item
 */
export function bulletItem(text: string, indent: number = 0): string {
  if (!text) return '';
  const indentation = '  '.repeat(indent);
  return `${indentation}- ${text}`;
}

/**
 * Format a numbered list item
 */
export function numberedItem(text: string, number: number, indent: number = 0): string {
  if (!text) return '';
  const indentation = '  '.repeat(indent);
  return `${indentation}${number}. ${text}`;
}

// ==================== Paragraph Formatting ====================

/**
 * Join paragraphs with proper spacing
 */
export function joinParagraphs(...paragraphs: (string | undefined | null)[]): string {
  return paragraphs
    .filter((p): p is string => Boolean(p && p.trim()))
    .join('\n\n');
}

/**
 * Join lines within a paragraph
 */
export function joinLines(...lines: (string | undefined | null)[]): string {
  return lines
    .filter((l): l is string => Boolean(l && l.trim()))
    .join('\n');
}

// ==================== Content Formatters ====================

/**
 * Format a section with a heading and content
 */
export function section(title: string, content: string, headingLevel: 1 | 2 | 3 | 4 = 3): string {
  if (!content) return '';
  return joinParagraphs(heading(title, headingLevel), content);
}

/**
 * Format a key-value pair for display
 */
export function keyValue(key: string, value: string | number | boolean): string {
  return `${bold(key)}: ${value}`;
}

/**
 * Format a score display
 */
export function score(label: string, value: number, max: number = 100): string {
  return `${bold(label)}: ${value}/${max}`;
}

/**
 * Format a percentage
 */
export function percentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a progress indicator
 */
export function progressIndicator(
  current: number,
  total: number,
  label?: string
): string {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const text = label ? `${label}: ` : '';
  return `${text}${current}/${total} (${pct}%)`;
}

// ==================== Format Conversion ====================

/**
 * Convert markdown to plain text
 */
export function markdownToText(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code markers
    .replace(/`([^`]+)`/g, '$1')
    // Remove headings markers
    .replace(/^#+\s*/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove blockquote markers
    .replace(/^>\s*/gm, '')
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Convert markdown to simple HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    // Escape HTML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold/Italic
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bullet lists (simple)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Numbered lists (simple)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');

  // Wrap in paragraph tags
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

/**
 * Format content for the specified output format
 */
export function formatAsOutput(content: string, format: OutputFormat): string {
  switch (format) {
    case 'text':
      return markdownToText(content);
    case 'html':
      return markdownToHtml(content);
    case 'markdown':
    default:
      return content;
  }
}

// ==================== Utilities ====================

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Wrap text to a specific line length
 */
export function wordWrap(text: string, maxLineLength: number = 80): string {
  if (!text) return '';

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxLineLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

/**
 * Remove extra whitespace and normalize text
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return '';
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
