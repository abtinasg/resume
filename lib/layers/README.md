# 8-Layer AI Career Agent Architecture

This directory contains the implementation of the 8-layer architecture for the ResumeIQ AI Career Agent.

## Migration Status

| Layer | Name | Status | Description |
|-------|------|--------|-------------|
| Shared | Types & Utilities | ✅ Done | Common types, enums, and utilities |
| Layer 1 | Evaluation Engine | 🔲 Pending | Resume scoring and job matching |
| Layer 2 | Strategy Engine | 🔲 Pending | Career path analysis and strategy selection |
| Layer 3 | Execution Engine | 🔲 Pending | Evidence-anchored rewriting |
| Layer 4 | State & Pipeline | ✅ Done | User state management using Prisma |
| Layer 5 | Orchestrator | 🔲 Pending | Action planning and prioritization |
| Layer 6 | Job Discovery | 🔲 Pending | Job discovery and matching |
| Layer 7 | Learning Engine | 🔲 Pending | Pattern learning and optimization |
| Layer 8 | AI Coach | 🔲 Pending | Human-friendly explanations |

## Directory Structure

\`\`\`
layers/
├── shared/           # Shared types and utilities
│   ├── types.ts      # Cross-layer type definitions
│   └── index.ts      # Export module
├── layer1/           # Evaluation Engine (pending)
├── layer2/           # Strategy Engine (pending)
├── layer3/           # Execution Engine (pending)
├── layer4/           # State & Pipeline ✅
│   ├── types.ts      # Layer-specific types
│   ├── queries.ts    # Database queries using Prisma
│   └── index.ts      # Export module
├── layer5/           # Orchestrator (pending)
├── layer6/           # Job Discovery (pending)
├── layer7/           # Learning Engine (pending)
├── layer8/           # AI Coach (pending)
├── index.ts          # Main export module
└── README.md         # This file
\`\`\`

## Usage

### Importing Shared Types

\`\`\`typescript
import { StrategyMode, LayerEventType, ActionType } from '@/lib/layers/shared';

// Use enum constants
const mode = StrategyMode.APPLY_MODE;
\`\`\`

### Using Layer 4 (State)

\`\`\`typescript
import { Layer4 } from '@/lib/layers';

// Get user state snapshot
const result = await Layer4.getUserStateSnapshot(userId);

if (result.success) {
  const { profile, currentResume, metrics } = result.data;
  console.log(\`User has \${metrics.totalApplications} applications\`);
}

// Log an event
await Layer4.logEvent(userId, LayerEventType.RESUME_UPLOADED, {
  resumeId: 'xxx',
  source: 'upload',
});
\`\`\`

## Integration with Existing Code

This architecture is designed to **enhance** the existing codebase, not replace it:

1. **Database**: Uses existing Prisma models (User, UserProfile, ResumeVersion, etc.)
2. **Scoring**: Layer 1 will integrate with existing \`lib/scoring\` system
3. **API Routes**: Existing routes will be enhanced to use layers incrementally
4. **Frontend**: No changes required until layers are fully integrated

## Migration Principles

1. **Incremental**: Add one layer at a time
2. **Non-Breaking**: Existing functionality must continue working
3. **Tested**: Each layer must have comprehensive tests
4. **Documented**: Each layer should have clear documentation

## Next Steps

1. ✅ Create shared types
2. ✅ Implement Layer 4 (State) foundation
3. 🔲 Implement Layer 1 (Evaluation) - integrates with \`lib/scoring\`
4. 🔲 Implement Layer 2 (Strategy)
5. 🔲 Continue with remaining layers

## References

- See \`docs/architecture/agent/\` for full layer specifications
- See \`Shared_Types_v1.0.md\` for type definitions
- See \`docs/architecture/agent/layers/\` for individual layer specs
