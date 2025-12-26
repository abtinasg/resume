# Layer 7 - Learning Engine Foundation

**Version:** 1.0 (Foundation Only - No ML/AI)  
**Status:** Implementation Complete  
**Scope:** Analytics query helpers, metrics calculation, data export

## Overview

Layer 7 is the **Learning Engine Foundation** that provides analytics capabilities for the Career Agent system. This is the **Foundation ONLY** implementation - it focuses on:

- ✅ Analytics query helpers
- ✅ Basic metrics calculation
- ✅ Data export functions
- ✅ Simple aggregation queries
- ✅ Foundation for future ML

**NOT included in this foundation:**

- ❌ Machine learning models
- ❌ Causal inference
- ❌ Pattern recognition algorithms
- ❌ Automated optimization
- ❌ A/B testing framework
- ❌ Predictive modeling

## Quick Start

```typescript
import { getMetrics, exportData, getWeeklyReport } from '@/lib/layers/layer7';

// Get user metrics for the last 30 days
const metrics = await getMetrics('user_123', { lookbackDays: 30 });
console.log(metrics.applications.totalApplications);    // 15
console.log(metrics.applications.interviewRate);        // 0.13 (13%)
console.log(metrics.resume.improvementPercentage);      // 12.5
console.log(metrics.strategy.outcomesPerMode);          // [...]

// Export data as JSON
const jsonExport = await exportData('user_123', 'json', {
  lookbackDays: 30,
  includeRawEvents: true
});

// Export data as CSV
const csvExport = await exportData('user_123', 'csv', {
  lookbackDays: 90
});

// Get weekly report
const weeklyReport = await getWeeklyReport('user_123');
console.log(weeklyReport.summary);      // Markdown report
console.log(weeklyReport.highlights);   // Key achievements
```

## API Reference

### Main Functions

#### `getMetrics(userId, options?)`

Get all metrics for a user.

```typescript
const metrics = await getMetrics('user_123', {
  lookbackDays: 30  // or dateRange: { start, end }
});

// Returns:
{
  applications: {
    totalApplications: number,
    interviewsReceived: number,
    offersReceived: number,
    rejectionCount: number,
    ghostedCount: number,
    avgDaysToResponse: number | null,
    interviewRate: number,
    offerRate: number,
    overallConversionRate: number,
    period: { start: Date, end: Date }
  },
  resume: {
    initialScore: number | null,
    currentScore: number | null,
    improvementPercentage: number | null,
    rewritesApplied: number,
    scoreHistory: Array<{ date: Date, score: number }>,
    period: { start: Date, end: Date }
  },
  strategy: {
    outcomesPerMode: Array<ModeOutcome>,
    avgTimeInMode: Record<StrategyMode, number | null>,
    modeTransitions: Array<ModeTransition>,
    effectivenessScores: Record<StrategyMode, number | null>,
    period: { start: Date, end: Date }
  },
  period: { start: Date, end: Date },
  calculatedAt: Date
}
```

#### `getActivitySummary(userId, days?)`

Get comprehensive activity summary.

```typescript
const summary = await getActivitySummary('user_123', 30);

// Returns:
{
  userId: string,
  period: { start: Date, end: Date },
  totalEvents: number,
  eventsByType: Record<string, number>,
  applicationMetrics: ApplicationMetrics,
  resumeMetrics: ResumeMetrics,
  strategyMetrics: StrategyMetrics,
  generatedAt: Date
}
```

#### `exportData(userId, format, options?)`

Export data in JSON or CSV format.

```typescript
// JSON export with all data
const jsonResult = await exportData('user_123', 'json', {
  lookbackDays: 30,
  includeRawEvents: true,
  prettyPrint: true
});

// CSV export
const csvResult = await exportData('user_123', 'csv', {
  lookbackDays: 90
});

// Result:
{
  data: string,           // Formatted data
  format: 'json' | 'csv',
  recordCount: number,
  generatedAt: Date,
  period: { start: Date, end: Date }
}
```

#### `getWeeklyReport(userId, weekOffset?)`

Generate weekly summary report.

```typescript
const report = await getWeeklyReport('user_123', 0);  // Current week

// Returns:
{
  userId: string,
  weekStart: Date,
  weekEnd: Date,
  summary: string,        // Markdown formatted summary
  highlights: string[],   // Key achievements
  concerns: string[],     // Areas needing attention
  metrics: {
    applicationsSubmitted: number,
    interviewsReceived: number,
    currentResumeScore: number | null,
    targetsMet: boolean
  },
  generatedAt: Date
}
```

#### `getMonthlyReport(userId, monthOffset?)`

Generate monthly summary report.

```typescript
const report = await getMonthlyReport('user_123', 0);  // Current month

// Returns:
{
  userId: string,
  monthStart: Date,
  monthEnd: Date,
  summary: string,
  highlights: string[],
  trends: {
    applicationTrend: 'increasing' | 'decreasing' | 'stable',
    scoreTrend: 'improving' | 'declining' | 'stable',
    interviewRateTrend: 'improving' | 'declining' | 'stable'
  },
  metrics: ApplicationMetrics,
  generatedAt: Date
}
```

### Analytics Service Class

For object-oriented usage:

```typescript
import { createAnalyticsService } from '@/lib/layers/layer7';

const analytics = createAnalyticsService('user_123');

const metrics = await analytics.getMetrics({ lookbackDays: 30 });
const summary = await analytics.getActivitySummary(30);
const report = await analytics.getWeeklyReport();
const score = await analytics.getResumeScore();
```

### Query Functions

```typescript
import {
  getEventsByUser,
  getEventsByType,
  getRecentEvents,
  countEventsByType,
  groupEventsByStrategy
} from '@/lib/layers/layer7';

// Get user events
const events = await getEventsByUser('user_123', {
  lookbackDays: 7,
  limit: 100
});

// Get events by type
const applicationEvents = await getEventsByType('APPLICATION_SUBMITTED', {
  userId: 'user_123',
  lookbackDays: 30
});

// Get recent events
const recent = await getRecentEvents('user_123', 7, 50);

// Count events by type
const counts = await countEventsByType('user_123', dateRange);

// Group by strategy mode
const byStrategy = await groupEventsByStrategy('user_123', dateRange);
```

### Metrics Functions

```typescript
import {
  calculateApplicationMetrics,
  calculateResumeMetrics,
  calculateStrategyMetrics,
  getCurrentResumeScore,
  getScoreHistory
} from '@/lib/layers/layer7';

// Application metrics
const appMetrics = await calculateApplicationMetrics('user_123', {
  lookbackDays: 30
});

// Resume metrics
const resumeMetrics = await calculateResumeMetrics('user_123', {
  lookbackDays: 30
});

// Strategy metrics
const strategyMetrics = await calculateStrategyMetrics('user_123', {
  lookbackDays: 30
});

// Current score
const score = await getCurrentResumeScore('user_123');

// Score history
const history = await getScoreHistory('user_123', 50);
```

### Export Functions

```typescript
import {
  exportUserActivity,
  exportMetrics,
  exportApplicationsCSV,
  exportMetricsCSV,
  generateWeeklySummary,
  generateMonthlySummary
} from '@/lib/layers/layer7';

// JSON exports
const activityJson = await exportUserActivity('user_123', options);
const metricsJson = await exportMetrics('user_123', options);

// CSV exports
const applicationsCSV = await exportApplicationsCSV('user_123', options);
const metricsCSV = await exportMetricsCSV('user_123', options);

// Reports
const weekly = await generateWeeklySummary('user_123', 0);
const monthly = await generateMonthlySummary('user_123', 0);
```

## Error Handling

```typescript
import { AnalyticsError, AnalyticsErrorCode, isAnalyticsError } from '@/lib/layers/layer7';

try {
  const metrics = await getMetrics('invalid_user');
} catch (error) {
  if (isAnalyticsError(error)) {
    console.log(error.code);        // 'INVALID_USER_ID'
    console.log(error.title);       // 'Invalid User ID'
    console.log(error.message);     // Detailed message
    console.log(error.suggestion);  // Helpful suggestion
  }
}
```

### Error Codes

- `QUERY_FAILED` - Database query failed
- `INVALID_DATE_RANGE` - Invalid date range provided
- `INVALID_USER_ID` - User ID is invalid or missing
- `NO_DATA_FOUND` - No data found for criteria
- `METRICS_CALCULATION_FAILED` - Error calculating metrics
- `INSUFFICIENT_DATA` - Not enough data for meaningful metrics
- `EXPORT_FAILED` - Export operation failed
- `EXPORT_TOO_LARGE` - Export exceeds size limit
- `INVALID_FORMAT` - Unsupported export format
- `REPORT_GENERATION_FAILED` - Failed to generate report
- `CONFIG_LOAD_FAILED` - Configuration loading error
- `INVALID_CONFIG` - Invalid configuration
- `INTERNAL_ERROR` - Unexpected internal error
- `DATABASE_ERROR` - Database connectivity error

## Configuration

Configuration is loaded from `config/analytics_config.json`:

```json
{
  "version": "1.0",
  "metrics": {
    "defaultLookbackDays": 30,
    "aggregationBuckets": ["daily", "weekly", "monthly"]
  },
  "exports": {
    "maxEventsPerExport": 10000,
    "defaultFormat": "json"
  }
}
```

Access configuration values:

```typescript
import { getDefaultLookbackDays, getMaxEventsPerExport } from '@/lib/layers/layer7';

const days = getDefaultLookbackDays();    // 30
const maxEvents = getMaxEventsPerExport(); // 10000
```

## Architecture

```
lib/layers/layer7/
├── index.ts                     # Public exports
├── types.ts                     # Analytics-specific types
├── analytics.ts                 # Main facade
├── errors.ts                    # Error handling
├── queries/
│   ├── event-queries.ts        # Query Layer 4 events
│   ├── aggregations.ts         # Aggregate event data
│   └── index.ts
├── metrics/
│   ├── application-metrics.ts   # Application outcome metrics
│   ├── resume-metrics.ts        # Resume improvement metrics
│   ├── strategy-metrics.ts      # Strategy effectiveness metrics
│   └── index.ts
├── exports/
│   ├── json-exporter.ts        # Export to JSON
│   ├── csv-exporter.ts         # Export to CSV
│   ├── report-generator.ts     # Generate summary reports
│   └── index.ts
├── config/
│   ├── analytics_config.json
│   ├── loader.ts
│   └── index.ts
└── __tests__/
    ├── queries.test.ts
    ├── metrics.test.ts
    ├── exports.test.ts
    └── integration.test.ts
```

## Integration with Other Layers

Layer 7 queries data from Layer 4 (Event Log) and provides analytics that can be used by:

- **Layer 5 (Orchestrator)**: For decision-making based on user performance
- **Layer 8 (UI)**: For dashboards and reports
- **Future ML features**: As foundation for learning algorithms

## Future Extensibility

This foundation is designed to support future ML capabilities:

- Interfaces can be extended with additional metrics
- Query helpers can be enhanced with more filters
- Export formats can be added
- Pattern detection algorithms can be built on top
- A/B testing framework can use existing metrics

## Testing

Run tests with:

```bash
npm test -- lib/layers/layer7
```

## Dependencies

- `@prisma/client` - Database queries (existing)
- Native JavaScript - CSV generation (no external deps)
- Native JavaScript - JSON formatting (no external deps)

No new dependencies were added for this layer.
