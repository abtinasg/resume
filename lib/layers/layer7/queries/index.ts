/**
 * Layer 7 - Learning Engine Foundation
 * Queries Module Exports
 */

export {
  getEventsByUser,
  getEventsByType,
  getEventsByDateRange,
  getRecentEvents,
  countEventsByUser,
  type MappedEvent,
} from './event-queries';

export {
  countEventsByType,
  countEventsByDate,
  groupEventsByStrategy,
  getTotalEventCount,
  getEventCountsRecord,
} from './aggregations';
