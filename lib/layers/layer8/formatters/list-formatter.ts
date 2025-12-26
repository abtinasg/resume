/**
 * Layer 8 - AI Coach Interface
 * List Formatter
 *
 * Provides utilities for formatting lists in Coach responses.
 */

import { bold } from './markdown-formatter';

// ==================== List Types ====================

/**
 * Item in a formatted list
 */
export interface ListItem {
  /** Main text content */
  text: string;
  /** Optional sublabel or detail */
  detail?: string;
  /** Optional emphasis marker */
  emphasis?: 'none' | 'highlight' | 'important';
}

/**
 * Options for list formatting
 */
export interface ListOptions {
  /** List style */
  style?: 'bullet' | 'numbered' | 'checkbox' | 'none';
  /** Indentation level */
  indent?: number;
  /** Whether to add spacing between items */
  spaced?: boolean;
  /** Max items before truncation */
  maxItems?: number;
  /** Text to show when list is truncated */
  truncationText?: string;
}

/**
 * Column in a comparison table
 */
export interface TableColumn {
  /** Column header */
  header: string;
  /** Column key in data objects */
  key: string;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
  /** Column width hint */
  width?: number;
}

// ==================== Bullet Lists ====================

/**
 * Format an array of strings as a bullet list
 */
export function formatBulletList(
  items: (string | ListItem)[],
  options: ListOptions = {}
): string {
  const {
    indent = 0,
    spaced = false,
    maxItems,
    truncationText = '...and more',
  } = options;

  if (!items || items.length === 0) {
    return '';
  }

  let displayItems = items;
  let wasTruncated = false;

  if (maxItems && items.length > maxItems) {
    displayItems = items.slice(0, maxItems);
    wasTruncated = true;
  }

  const indentation = '  '.repeat(indent);
  const separator = spaced ? '\n\n' : '\n';

  const formatted = displayItems.map(item => {
    const text = typeof item === 'string' ? item : item.text;
    const detail = typeof item === 'string' ? undefined : item.detail;
    const emphasis = typeof item === 'string' ? 'none' : (item.emphasis || 'none');

    let line = text;
    if (detail) {
      line = `${line} — ${detail}`;
    }
    if (emphasis === 'highlight') {
      line = bold(line);
    } else if (emphasis === 'important') {
      line = `⚠️ ${bold(line)}`;
    }

    return `${indentation}- ${line}`;
  }).join(separator);

  if (wasTruncated) {
    return `${formatted}${separator}${indentation}- ${truncationText}`;
  }

  return formatted;
}

// ==================== Numbered Lists ====================

/**
 * Format an array of strings as a numbered list
 */
export function formatNumberedList(
  items: (string | ListItem)[],
  options: ListOptions = {}
): string {
  const {
    indent = 0,
    spaced = false,
    maxItems,
    truncationText = '...and more',
  } = options;

  if (!items || items.length === 0) {
    return '';
  }

  let displayItems = items;
  let wasTruncated = false;

  if (maxItems && items.length > maxItems) {
    displayItems = items.slice(0, maxItems);
    wasTruncated = true;
  }

  const indentation = '  '.repeat(indent);
  const separator = spaced ? '\n\n' : '\n';

  const formatted = displayItems.map((item, index) => {
    const text = typeof item === 'string' ? item : item.text;
    const detail = typeof item === 'string' ? undefined : item.detail;
    const emphasis = typeof item === 'string' ? 'none' : (item.emphasis || 'none');

    let line = text;
    if (detail) {
      line = `${line} — ${detail}`;
    }
    if (emphasis === 'highlight') {
      line = bold(line);
    } else if (emphasis === 'important') {
      line = `⚠️ ${bold(line)}`;
    }

    return `${indentation}${index + 1}. ${line}`;
  }).join(separator);

  if (wasTruncated) {
    const nextNum = displayItems.length + 1;
    return `${formatted}${separator}${indentation}${nextNum}. ${truncationText}`;
  }

  return formatted;
}

// ==================== Checkbox Lists ====================

/**
 * Format an array as a checkbox list
 */
export function formatCheckboxList(
  items: Array<{ text: string; checked: boolean; detail?: string }>,
  options: ListOptions = {}
): string {
  const { indent = 0, spaced = false, maxItems, truncationText = '...and more' } = options;

  if (!items || items.length === 0) {
    return '';
  }

  let displayItems = items;
  let wasTruncated = false;

  if (maxItems && items.length > maxItems) {
    displayItems = items.slice(0, maxItems);
    wasTruncated = true;
  }

  const indentation = '  '.repeat(indent);
  const separator = spaced ? '\n\n' : '\n';

  const formatted = displayItems.map(item => {
    const checkbox = item.checked ? '[x]' : '[ ]';
    let line = item.text;
    if (item.detail) {
      line = `${line} — ${item.detail}`;
    }
    return `${indentation}- ${checkbox} ${line}`;
  }).join(separator);

  if (wasTruncated) {
    return `${formatted}${separator}${indentation}- [ ] ${truncationText}`;
  }

  return formatted;
}

// ==================== Inline Lists ====================

/**
 * Format an array as an inline comma-separated list
 */
export function formatInlineList(
  items: string[],
  options: {
    separator?: string;
    lastSeparator?: string;
    maxItems?: number;
    truncationText?: string;
  } = {}
): string {
  const {
    separator = ', ',
    lastSeparator = ', and ',
    maxItems,
    truncationText = 'more',
  } = options;

  if (!items || items.length === 0) {
    return '';
  }

  let displayItems = [...items];
  let remainingCount = 0;

  if (maxItems && items.length > maxItems) {
    displayItems = items.slice(0, maxItems);
    remainingCount = items.length - maxItems;
  }

  if (displayItems.length === 1) {
    return displayItems[0];
  }

  if (remainingCount > 0) {
    const allButLast = displayItems.slice(0, -1).join(separator);
    const last = displayItems[displayItems.length - 1];
    return `${allButLast}${separator}${last}${separator}and ${remainingCount} ${truncationText}`;
  }

  const allButLast = displayItems.slice(0, -1).join(separator);
  const last = displayItems[displayItems.length - 1];
  return `${allButLast}${lastSeparator}${last}`;
}

// ==================== Comparison Tables ====================

/**
 * Format data as a simple comparison table
 */
export function formatComparisonTable(
  data: Record<string, string | number | boolean>[],
  columns: TableColumn[]
): string {
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    return '';
  }

  // Calculate column widths
  const widths = columns.map(col => {
    const headerLen = col.header.length;
    const maxDataLen = Math.max(
      ...data.map(row => String(row[col.key] ?? '').length)
    );
    return Math.max(headerLen, maxDataLen, col.width || 0);
  });

  // Build header row
  const headerRow = columns.map((col, i) => 
    col.header.padEnd(widths[i])
  ).join(' | ');

  // Build separator row
  const separatorRow = columns.map((col, i) => {
    const width = widths[i];
    if (col.align === 'center') {
      return `:${'-'.repeat(width - 2)}:`;
    } else if (col.align === 'right') {
      return `${'-'.repeat(width - 1)}:`;
    }
    return '-'.repeat(width);
  }).join(' | ');

  // Build data rows
  const dataRows = data.map(row => 
    columns.map((col, i) => {
      const value = String(row[col.key] ?? '');
      if (col.align === 'right') {
        return value.padStart(widths[i]);
      }
      return value.padEnd(widths[i]);
    }).join(' | ')
  ).join('\n');

  return `| ${headerRow} |\n| ${separatorRow} |\n| ${dataRows.split('\n').join(' |\n| ')} |`;
}

// ==================== Key-Value Lists ====================

/**
 * Format key-value pairs as a list
 */
export function formatKeyValueList(
  pairs: Array<{ key: string; value: string | number | boolean }>,
  options: {
    separator?: string;
    style?: 'bullet' | 'none';
  } = {}
): string {
  const { separator = ': ', style = 'bullet' } = options;

  if (!pairs || pairs.length === 0) {
    return '';
  }

  const prefix = style === 'bullet' ? '- ' : '';

  return pairs.map(pair => 
    `${prefix}${bold(pair.key)}${separator}${pair.value}`
  ).join('\n');
}

// ==================== Summary Lists ====================

/**
 * Format a summary list with title
 */
export function formatSummaryList(
  title: string,
  items: (string | ListItem)[],
  options: ListOptions & { headingLevel?: 2 | 3 | 4 } = {}
): string {
  const { headingLevel = 3, ...listOptions } = options;

  if (!items || items.length === 0) {
    return '';
  }

  const heading = '#'.repeat(headingLevel);
  const list = formatBulletList(items, listOptions);

  return `${heading} ${title}\n\n${list}`;
}

// ==================== Priority Lists ====================

/**
 * Format items with priority indicators
 */
export function formatPriorityList(
  items: Array<{ text: string; priority: 'high' | 'medium' | 'low'; detail?: string }>,
  options: ListOptions = {}
): string {
  const priorityEmoji: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };

  const formattedItems = items.map(item => ({
    text: `${priorityEmoji[item.priority]} ${item.text}`,
    detail: item.detail,
    emphasis: item.priority === 'high' ? 'highlight' as const : 'none' as const,
  }));

  return formatBulletList(formattedItems, options);
}
