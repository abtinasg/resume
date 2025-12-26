/**
 * Layer 8 - AI Coach Interface
 * Formatters Module Exports
 */

// Markdown formatter exports
export {
  bold,
  italic,
  heading,
  link,
  inlineCode,
  codeBlock,
  blockquote,
  horizontalRule,
  bulletItem,
  numberedItem,
  joinParagraphs,
  joinLines,
  section,
  keyValue,
  score,
  percentage,
  progressIndicator,
  markdownToText,
  markdownToHtml,
  formatAsOutput,
  truncate,
  wordWrap,
  normalizeWhitespace,
} from './markdown-formatter';

// List formatter exports
export {
  formatBulletList,
  formatNumberedList,
  formatCheckboxList,
  formatInlineList,
  formatComparisonTable,
  formatKeyValueList,
  formatSummaryList,
  formatPriorityList,
} from './list-formatter';

// Type exports
export type { ListItem, ListOptions, TableColumn } from './list-formatter';
