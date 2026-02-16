/**
 * PRO Resume Scoring System - Adaptive Logic Tuner
 *
 * This module implements the adaptive learning system that:
 * - Collects user feedback on scoring accuracy
 * - Analyzes feedback patterns to identify scoring improvements
 * - Automatically adjusts component weights based on aggregated data
 * - Maintains historical weight configurations
 *
 * The system learns from user feedback to improve scoring accuracy over time.
 */

// ==================== Type Definitions ====================

/**
 * User feedback on a specific resume scoring result
 */
export interface UserFeedback {
  /** Unique resume identifier */
  resume_id: string;

  /** Job role for which resume was scored */
  job_role: string;

  /** Calculated overall score */
  score: number;

  /** Component scores at time of feedback */
  component_scores: {
    content_quality: number;
    ats_compatibility: number;
    format_structure: number;
    impact_metrics: number;
  };

  /** User's rating of the scoring accuracy (1-5) */
  rating: number;

  /** Whether user found the analysis helpful */
  helpful: boolean;

  /** User's comment about the scoring */
  comment?: string;

  /** Specific component user felt was inaccurate */
  inaccurate_component?: 'content' | 'ats' | 'format' | 'impact' | null;

  /** User's expected score (if provided) */
  expected_score?: number;

  /** Timestamp of feedback */
  timestamp: Date;
}

/**
 * Weight configuration for scoring components
 */
export interface WeightConfiguration {
  /** Configuration ID */
  id: string;

  /** Configuration name */
  name: string;

  /** Component weights (must sum to 100) */
  weights: {
    content_quality: number;
    ats_compatibility: number;
    format_structure: number;
    impact_metrics: number;
  };

  /** Role-specific weight overrides */
  role_overrides?: Record<string, {
    content_quality: number;
    ats_compatibility: number;
    format_structure: number;
    impact_metrics: number;
  }>;

  /** When this configuration was created */
  created_at: Date;

  /** Whether this is the active configuration */
  is_active: boolean;

  /** Performance metrics */
  performance?: {
    avg_user_rating: number;
    total_feedback_count: number;
    accuracy_score: number;
  };
}

/**
 * Aggregated feedback analytics
 */
export interface FeedbackAnalytics {
  /** Time period for analytics */
  period: {
    start_date: Date;
    end_date: Date;
  };

  /** Total feedback received */
  total_feedback: number;

  /** Average user rating */
  avg_rating: number;

  /** Percentage of users who found it helpful */
  helpful_percentage: number;

  /** Component-specific accuracy */
  component_accuracy: {
    content_quality: { avg_rating: number; complaint_rate: number };
    ats_compatibility: { avg_rating: number; complaint_rate: number };
    format_structure: { avg_rating: number; complaint_rate: number };
    impact_metrics: { avg_rating: number; complaint_rate: number };
  };

  /** Score accuracy analysis */
  score_accuracy: {
    avg_score_diff: number; // Average difference between expected and actual
    overestimation_rate: number;
    underestimation_rate: number;
  };

  /** Most common feedback themes */
  common_themes: Array<{
    theme: string;
    count: number;
  }>;
}

// ==================== In-Memory Storage ====================

/**
 * In-memory feedback storage (in production, use database)
 */
const feedbackStore: UserFeedback[] = [];

/**
 * In-memory weight configuration storage
 */
const weightConfigStore: WeightConfiguration[] = [
  // Default configuration
  {
    id: 'default_v1',
    name: 'Default Weights V1',
    weights: {
      content_quality: 40,
      ats_compatibility: 35,
      format_structure: 15,
      impact_metrics: 10,
    },
    created_at: new Date('2025-01-01'),
    is_active: true,
  },
];

// ==================== Feedback Collection ====================

/**
 * Store user feedback for a resume scoring result
 *
 * @param feedback - User feedback object
 * @returns Success confirmation
 *
 * @example
 * ```typescript
 * await storeFeedback({
 *   resume_id: 'uuid-123',
 *   job_role: 'Product Manager',
 *   score: 74,
 *   rating: 4,
 *   helpful: true,
 *   comment: 'Accurate scoring'
 * });
 * ```
 */
export async function storeFeedback(feedback: Omit<UserFeedback, 'timestamp'>): Promise<void> {
  const feedbackWithTimestamp: UserFeedback = {
    ...feedback,
    timestamp: new Date(),
  };

  // Validate feedback
  if (feedback.rating < 1 || feedback.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Store feedback (in production, save to database)
  feedbackStore.push(feedbackWithTimestamp);

  // Log for monitoring
  console.log(`[Logic Tuner] Feedback stored for resume ${feedback.resume_id}, rating: ${feedback.rating}`);

  // Check if we should trigger weight update
  if (feedbackStore.length % 100 === 0) {
    console.log(`[Logic Tuner] 100 feedback entries reached, consider updating weights`);
  }
}

/**
 * Retrieve feedback for a specific time period
 *
 * @param startDate - Start of period
 * @param endDate - End of period
 * @returns Array of feedback entries
 */
export async function getFeedback(
  startDate: Date,
  endDate: Date
): Promise<UserFeedback[]> {
  return feedbackStore.filter(
    fb => fb.timestamp >= startDate && fb.timestamp <= endDate
  );
}

/**
 * Get feedback aggregated by job role
 *
 * @param jobRole - Job role to filter by
 * @param limit - Maximum number of entries to return
 * @returns Array of feedback for the role
 */
export async function getFeedbackByRole(
  jobRole: string,
  limit: number = 50
): Promise<UserFeedback[]> {
  return feedbackStore
    .filter(fb => fb.job_role === jobRole)
    .slice(-limit); // Get most recent
}

// ==================== Feedback Analytics ====================

/**
 * Generate analytics from collected feedback
 *
 * @param startDate - Start of analysis period
 * @param endDate - End of analysis period
 * @returns Comprehensive feedback analytics
 */
export async function generateFeedbackAnalytics(
  startDate: Date,
  endDate: Date
): Promise<FeedbackAnalytics> {
  const feedback = await getFeedback(startDate, endDate);

  if (feedback.length === 0) {
    throw new Error('No feedback data available for the specified period');
  }

  // Calculate basic metrics
  const total_feedback = feedback.length;
  const avg_rating = feedback.reduce((sum, fb) => sum + fb.rating, 0) / total_feedback;
  const helpful_count = feedback.filter(fb => fb.helpful).length;
  const helpful_percentage = (helpful_count / total_feedback) * 100;

  // Component-specific accuracy
  const componentComplaints = {
    content_quality: 0,
    ats_compatibility: 0,
    format_structure: 0,
    impact_metrics: 0,
  };

  const componentRatings = {
    content_quality: [] as number[],
    ats_compatibility: [] as number[],
    format_structure: [] as number[],
    impact_metrics: [] as number[],
  };

  feedback.forEach(fb => {
    if (fb.inaccurate_component) {
      const key = fb.inaccurate_component === 'content' ? 'content_quality'
        : fb.inaccurate_component === 'ats' ? 'ats_compatibility'
        : fb.inaccurate_component === 'format' ? 'format_structure'
        : 'impact_metrics';
      componentComplaints[key]++;
    }

    // Collect ratings for all components
    Object.keys(componentRatings).forEach(comp => {
      componentRatings[comp as keyof typeof componentRatings].push(fb.rating);
    });
  });

  const component_accuracy = {
    content_quality: {
      avg_rating: componentRatings.content_quality.reduce((a, b) => a + b, 0) / componentRatings.content_quality.length || 0,
      complaint_rate: (componentComplaints.content_quality / total_feedback) * 100,
    },
    ats_compatibility: {
      avg_rating: componentRatings.ats_compatibility.reduce((a, b) => a + b, 0) / componentRatings.ats_compatibility.length || 0,
      complaint_rate: (componentComplaints.ats_compatibility / total_feedback) * 100,
    },
    format_structure: {
      avg_rating: componentRatings.format_structure.reduce((a, b) => a + b, 0) / componentRatings.format_structure.length || 0,
      complaint_rate: (componentComplaints.format_structure / total_feedback) * 100,
    },
    impact_metrics: {
      avg_rating: componentRatings.impact_metrics.reduce((a, b) => a + b, 0) / componentRatings.impact_metrics.length || 0,
      complaint_rate: (componentComplaints.impact_metrics / total_feedback) * 100,
    },
  };

  // Score accuracy analysis
  const feedbackWithExpected = feedback.filter(fb => fb.expected_score !== undefined);
  const score_diffs = feedbackWithExpected.map(fb =>
    (fb.expected_score || fb.score) - fb.score
  );

  const avg_score_diff = score_diffs.length > 0
    ? score_diffs.reduce((a, b) => a + b, 0) / score_diffs.length
    : 0;

  const overestimations = score_diffs.filter(diff => diff < -5).length;
  const underestimations = score_diffs.filter(diff => diff > 5).length;

  const score_accuracy = {
    avg_score_diff,
    overestimation_rate: (overestimations / total_feedback) * 100,
    underestimation_rate: (underestimations / total_feedback) * 100,
  };

  // Extract common themes from comments
  const comments = feedback.filter(fb => fb.comment).map(fb => fb.comment!);
  const common_themes = extractCommonThemes(comments);

  return {
    period: {
      start_date: startDate,
      end_date: endDate,
    },
    total_feedback,
    avg_rating,
    helpful_percentage,
    component_accuracy,
    score_accuracy,
    common_themes,
  };
}

/**
 * Extract common themes from user comments (simple keyword-based approach)
 */
function extractCommonThemes(comments: string[]): Array<{ theme: string; count: number }> {
  const keywords = [
    'accurate', 'helpful', 'too high', 'too low', 'missing', 'ats',
    'keywords', 'format', 'score', 'content', 'suggestions',
  ];

  const themeCount: Record<string, number> = {};

  comments.forEach(comment => {
    const lowerComment = comment.toLowerCase();
    keywords.forEach(keyword => {
      if (lowerComment.includes(keyword)) {
        themeCount[keyword] = (themeCount[keyword] || 0) + 1;
      }
    });
  });

  return Object.entries(themeCount)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// ==================== Weight Tuning ====================

/**
 * Calculate optimal weights based on feedback analytics
 *
 * This function analyzes feedback patterns and suggests weight adjustments:
 * - Components with high complaint rates get reduced weight
 * - Components with high accuracy get increased weight
 * - Adjustments are gradual (max ±5% per update)
 *
 * @param analytics - Feedback analytics data
 * @param currentWeights - Current weight configuration
 * @returns Suggested new weights
 */
export function calculateOptimalWeights(
  analytics: FeedbackAnalytics,
  currentWeights: WeightConfiguration['weights']
): WeightConfiguration['weights'] {
  const newWeights = { ...currentWeights };

  // Analyze each component
  Object.entries(analytics.component_accuracy).forEach(([component, metrics]) => {
    const key = component as keyof typeof newWeights;
    const currentWeight = currentWeights[key];

    // Calculate adjustment factor based on complaint rate and rating
    let adjustment = 0;

    // High complaint rate = reduce weight
    if (metrics.complaint_rate > 15) {
      adjustment -= 3;
    } else if (metrics.complaint_rate > 10) {
      adjustment -= 2;
    }

    // Low rating = reduce weight
    if (metrics.avg_rating < 3) {
      adjustment -= 2;
    } else if (metrics.avg_rating > 4) {
      adjustment += 1;
    }

    // Apply adjustment (cap at ±5% per update)
    adjustment = Math.max(-5, Math.min(5, adjustment));
    newWeights[key] = Math.max(5, Math.min(50, currentWeight + adjustment));
  });

  // Normalize weights to sum to 100
  const total = Object.values(newWeights).reduce((a, b) => a + b, 0);
  Object.keys(newWeights).forEach(key => {
    newWeights[key as keyof typeof newWeights] = Math.round(
      (newWeights[key as keyof typeof newWeights] / total) * 100
    );
  });

  // Ensure exact 100 sum (adjust largest component if needed)
  const finalTotal = Object.values(newWeights).reduce((a, b) => a + b, 0);
  if (finalTotal !== 100) {
    const largestKey = Object.entries(newWeights).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0] as keyof typeof newWeights;
    newWeights[largestKey] += (100 - finalTotal);
  }

  return newWeights;
}

/**
 * Update weights based on feedback data
 *
 * This is the main function that:
 * 1. Analyzes recent feedback
 * 2. Calculates optimal weights
 * 3. Creates new weight configuration
 * 4. Activates new configuration if improvement is significant
 *
 * @param minFeedbackCount - Minimum feedback entries required for update
 * @returns New weight configuration or null if insufficient data
 */
export async function updateWeightsBasedOnFeedback(
  minFeedbackCount: number = 50
): Promise<WeightConfiguration | null> {
  console.log('[Logic Tuner] Checking for weight updates...');

  // Get feedback from last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const feedback = await getFeedback(startDate, endDate);

  if (feedback.length < minFeedbackCount) {
    console.log(
      `[Logic Tuner] Insufficient feedback (${feedback.length}/${minFeedbackCount}), skipping update`
    );
    return null;
  }

  // Generate analytics
  const analytics = await generateFeedbackAnalytics(startDate, endDate);

  // Get current active configuration
  const currentConfig = weightConfigStore.find(config => config.is_active);
  if (!currentConfig) {
    console.error('[Logic Tuner] No active configuration found');
    return null;
  }

  // Calculate optimal weights
  const optimalWeights = calculateOptimalWeights(analytics, currentConfig.weights);

  // Check if weights changed significantly (>3% change in any component)
  const hasSignificantChange = Object.entries(optimalWeights).some(([key, value]) => {
    const currentValue = currentConfig.weights[key as keyof typeof currentConfig.weights];
    return Math.abs(value - currentValue) > 3;
  });

  if (!hasSignificantChange) {
    console.log('[Logic Tuner] No significant weight changes needed');
    return null;
  }

  // Create new configuration
  const newConfig: WeightConfiguration = {
    id: `auto_tuned_${Date.now()}`,
    name: `Auto-Tuned Weights (${new Date().toISOString().split('T')[0]})`,
    weights: optimalWeights,
    created_at: new Date(),
    is_active: false, // Start as inactive for testing
    performance: {
      avg_user_rating: analytics.avg_rating,
      total_feedback_count: analytics.total_feedback,
      accuracy_score: 100 - analytics.component_accuracy.content_quality.complaint_rate,
    },
  };

  // Save new configuration
  weightConfigStore.push(newConfig);

  console.log('[Logic Tuner] New weight configuration created:', newConfig.id);
  console.log('[Logic Tuner] New weights:', optimalWeights);

  return newConfig;
}

/**
 * Activate a specific weight configuration
 *
 * @param configId - ID of configuration to activate
 */
export async function activateWeightConfiguration(configId: string): Promise<void> {
  // Deactivate all configurations
  weightConfigStore.forEach(config => {
    config.is_active = false;
  });

  // Activate the specified configuration
  const config = weightConfigStore.find(c => c.id === configId);
  if (!config) {
    throw new Error(`Configuration ${configId} not found`);
  }

  config.is_active = true;
  console.log(`[Logic Tuner] Activated configuration: ${configId}`);
}

/**
 * Get active weight configuration
 *
 * @returns Active weight configuration
 */
export function getActiveWeights(): WeightConfiguration {
  const activeConfig = weightConfigStore.find(config => config.is_active);

  if (!activeConfig) {
    // Return default if no active config
    return weightConfigStore[0];
  }

  return activeConfig;
}

/**
 * Get all weight configurations
 *
 * @returns Array of all weight configurations
 */
export function getAllWeightConfigurations(): WeightConfiguration[] {
  return [...weightConfigStore];
}

/**
 * Get role-specific weights (with overrides applied)
 *
 * @param jobRole - Job role to get weights for
 * @returns Weight configuration for the role
 */
export function getWeightsForRole(
  jobRole: string
): WeightConfiguration['weights'] {
  const activeConfig = getActiveWeights();

  // Check if there's a role-specific override
  if (activeConfig.role_overrides && activeConfig.role_overrides[jobRole]) {
    return activeConfig.role_overrides[jobRole];
  }

  // Return default weights
  return activeConfig.weights;
}

// ==================== Adaptive Score Adjustment ====================

/**
 * Apply adaptive adjustment to a score based on variance analysis
 *
 * This function applies small adjustments to component scores based on:
 * - Historical performance variance
 * - Component reliability
 *
 * @param baseScore - Base component score
 * @param componentName - Name of the component
 * @param variance - Score variance (0-1)
 * @returns Adjusted score
 */
export function applyAdaptiveAdjustment(
  baseScore: number,
  componentName: string,
  variance: number = 0.1
): number {
  // Get component reliability from feedback
  // (In production, this would query historical data)
  const reliabilityFactor = 1.0; // Neutral by default

  // Apply adjustment based on variance
  // Higher variance = less reliable = smaller adjustment
  const adjustment = (variance * reliabilityFactor * 0.05) * (baseScore - 50);

  const adjustedScore = baseScore + adjustment;

  return Math.max(0, Math.min(100, adjustedScore));
}

/**
 * Save weight configuration to file (for persistence)
 *
 * In production, this would save to a database or configuration file
 *
 * @param config - Weight configuration to save
 */
export async function saveWeightConfiguration(
  config: WeightConfiguration
): Promise<void> {
  // In production: save to database or file
  console.log('[Logic Tuner] Saving weight configuration:', config.id);

  // For now, it's already in memory (weightConfigStore)
  // In production:
  // await db.weightConfigurations.save(config);
  // or
  // await fs.writeFile('config/weights.json', JSON.stringify(config));
}

/**
 * Load weight configurations from storage
 *
 * In production, this would load from database or file
 */
export async function loadWeightConfigurations(): Promise<void> {
  // In production: load from database or file
  console.log('[Logic Tuner] Loading weight configurations...');

  // For now, we use the in-memory store
  // In production:
  // const configs = await db.weightConfigurations.findAll();
  // weightConfigStore.push(...configs);
}
