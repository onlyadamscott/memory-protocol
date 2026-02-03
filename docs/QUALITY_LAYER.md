# Memory Quality Layer Specification

**Status:** Draft  
**Extends:** Memory Protocol Specification 0.1.0  
**Last Updated:** 2026-02-02

---

## 1. Overview

The Quality Layer extends Memory Protocol with:
- **Conflict Detection** — Identify contradictory memories
- **Staleness Tracking** — Detect outdated information
- **Quality Scoring** — Holistic memory reliability metrics
- **Validation Rules** — Automatic quality checks
- **Memory Relationships** — Explicit links between memories

## 2. Motivation

Current memory systems are append-only with no quality control. Problems:
- Contradictory information accumulates
- Outdated memories mislead future decisions
- No way to know which memories to trust
- Memory corruption degrades agent performance over time

The Quality Layer addresses these by treating memory quality as a first-class concern.

---

## 3. Extended Memory Object

### 3.1 Quality Fields

Memory objects gain additional fields:

```json
{
  "id": "mem_abc123",
  "type": "fact",
  "content": { "subject": "Adam", "property": "timezone", "value": "MST" },
  
  // Existing fields
  "confidence": 0.95,
  "source": "told",
  
  // NEW: Quality Layer fields
  "quality": {
    "score": 0.92,
    "staleness": 0.0,
    "conflictRisk": 0.1,
    "validatedAt": "2026-02-02T16:00:00Z",
    "validationErrors": []
  },
  "relationships": [
    { "type": "supersedes", "target": "mem_old123", "reason": "Updated timezone info" },
    { "type": "supports", "target": "mem_xyz789" }
  ],
  "metadata": {
    "accessCount": 12,
    "lastAccessed": "2026-02-02T18:00:00Z",
    "citedBy": ["mem_def456"]
  }
}
```

### 3.2 Quality Score Calculation

Quality score is a composite metric (0-1):

```
quality.score = (
  confidence * 0.4 +
  freshness * 0.25 +
  (1 - conflictRisk) * 0.25 +
  sourceReliability * 0.1
)
```

Where:
- **confidence** — Agent's stated confidence (0-1)
- **freshness** — 1 - staleness (0-1)
- **conflictRisk** — Probability of contradiction (0-1)
- **sourceReliability** — Trust in source (experience: 0.9, told: 0.7, inferred: 0.5)

---

## 4. Conflict Detection

### 4.1 Conflict Types

| Type | Description | Example |
|------|-------------|---------|
| `direct` | Explicit contradiction | "Adam lives in MST" vs "Adam lives in EST" |
| `temporal` | Outdated by newer info | Old preference superseded by new one |
| `logical` | Inference conflict | A implies B, but B is marked false |
| `source` | Same fact, different sources disagree | Two sources give different values |

### 4.2 Conflict Object

```json
{
  "id": "conflict_xyz",
  "type": "direct",
  "memories": ["mem_abc123", "mem_def456"],
  "detected": "2026-02-02T16:30:00Z",
  "resolution": null,
  "severity": "high",
  "description": "Contradictory timezone values for Adam"
}
```

### 4.3 Conflict Detection Algorithm

On every `remember()`:

1. Extract key claims from new memory (subject-property-value triples)
2. Query existing memories for same subject-property pairs
3. Compare values:
   - Exact match → no conflict
   - Different values → potential conflict
4. Calculate conflict severity based on:
   - Confidence levels of both memories
   - Recency of both memories
   - Source reliability
5. If conflict detected:
   - Create Conflict object
   - Update `conflictRisk` on both memories
   - (Optional) Trigger resolution workflow

### 4.4 Conflict Resolution

Strategies:

| Strategy | Description |
|----------|-------------|
| `newer-wins` | More recent memory takes precedence |
| `higher-confidence` | Higher confidence memory wins |
| `source-priority` | experience > told > inferred |
| `manual` | Flag for agent/operator review |
| `merge` | Combine if compatible (e.g., lists) |

```typescript
interface ConflictResolution {
  conflictId: string;
  strategy: 'newer-wins' | 'higher-confidence' | 'source-priority' | 'manual' | 'merge';
  winner?: string;  // memory ID that "won"
  resolution: 'accepted' | 'rejected' | 'merged';
  resolvedAt: string;
  resolvedBy: 'automatic' | 'agent' | 'operator';
}
```

---

## 5. Staleness Tracking

### 5.1 Staleness Score

Staleness (0-1) measures how likely a memory is outdated:

```
staleness = min(1.0, (
  ageFactor * 0.5 +
  accessDecay * 0.3 +
  supersededFactor * 0.2
))
```

Where:
- **ageFactor** — Time since creation, scaled by type:
  - Facts: slow decay (months)
  - Preferences: medium decay (weeks)
  - Events: no decay (historical record)
- **accessDecay** — Time since last accessed/cited
- **supersededFactor** — 1.0 if superseded, 0.0 otherwise

### 5.2 Staleness Configuration

Per-type staleness parameters:

```json
{
  "stalenessConfig": {
    "fact": { "halfLifeDays": 90, "accessDecayDays": 30 },
    "preference": { "halfLifeDays": 14, "accessDecayDays": 7 },
    "lesson": { "halfLifeDays": 60, "accessDecayDays": 14 },
    "relationship": { "halfLifeDays": 30, "accessDecayDays": 14 },
    "event": { "halfLifeDays": null, "accessDecayDays": null }
  }
}
```

### 5.3 Staleness Operations

```typescript
// Get stale memories
const stale = await memory.recall({ maxStaleness: 0.3 });

// Refresh a memory (reset staleness, update timestamp)
await memory.refresh(memoryId, { 
  verified: true,
  confidence: 0.95 
});

// Archive stale memories
await memory.archiveStale({ 
  threshold: 0.8,
  olderThan: '90d' 
});
```

---

## 6. Validation Rules

### 6.1 Built-in Validators

| Rule | Description |
|------|-------------|
| `schema` | Memory matches type schema |
| `required-fields` | All required fields present |
| `signature` | Valid cryptographic signature |
| `chain` | Hash chain intact |
| `no-self-conflict` | Memory doesn't contradict itself |
| `temporal-consistency` | Timestamps are valid |

### 6.2 Custom Validators

Agents can define custom validation rules:

```typescript
memory.addValidator({
  name: 'timezone-format',
  types: ['fact'],
  validate: (mem) => {
    if (mem.content.property === 'timezone') {
      const valid = isValidTimezone(mem.content.value);
      return { valid, error: valid ? null : 'Invalid timezone format' };
    }
    return { valid: true };
  }
});
```

### 6.3 Validation on Remember

```typescript
const result = await memory.remember({
  type: 'fact',
  content: { subject: 'Adam', property: 'timezone', value: 'INVALID' }
}, {
  validate: true,        // Run validators
  rejectInvalid: false,  // Store anyway, but mark errors
  detectConflicts: true  // Check for conflicts
});

// result.quality.validationErrors = ['timezone-format: Invalid timezone format']
```

---

## 7. Memory Relationships

### 7.1 Relationship Types

| Type | Description |
|------|-------------|
| `supersedes` | This memory replaces an older one |
| `supports` | This memory reinforces another |
| `contradicts` | This memory conflicts with another |
| `derived-from` | This memory was inferred from another |
| `related-to` | General association |
| `causes` | Causal relationship |
| `part-of` | Hierarchical relationship |

### 7.2 Relationship Object

```json
{
  "type": "supersedes",
  "target": "mem_old123",
  "created": "2026-02-02T16:00:00Z",
  "reason": "Updated timezone after move",
  "bidirectional": false
}
```

### 7.3 Automatic Relationship Detection

When remembering:
1. Check for similar memories (semantic similarity > threshold)
2. If found and newer:
   - Suggest `supersedes` relationship
   - Or detect as conflict
3. Track `derived-from` when source is another memory
4. Build relationship graph for traversal

---

## 8. Quality API

### 8.1 Quality Methods

```typescript
interface MemoryStoreWithQuality extends MemoryStore {
  
  // Conflict detection
  detectConflicts(memory?: MemoryObject): Promise<Conflict[]>;
  resolveConflict(conflictId: string, strategy: ResolutionStrategy): Promise<void>;
  getConflicts(options?: { unresolved?: boolean }): Promise<Conflict[]>;
  
  // Staleness
  refreshMemory(id: string, options?: RefreshOptions): Promise<void>;
  getStale(threshold?: number): Promise<MemoryObject[]>;
  archiveStale(options: ArchiveOptions): Promise<number>;
  
  // Validation
  validate(memory: MemoryObject): Promise<ValidationResult>;
  addValidator(validator: Validator): void;
  
  // Quality queries
  recall(request: RecallRequest & {
    minQuality?: number;
    maxStaleness?: number;
    excludeConflicted?: boolean;
  }): Promise<MemoryObject[]>;
  
  // Relationships
  addRelationship(sourceId: string, rel: Relationship): Promise<void>;
  getRelated(id: string, type?: RelationshipType): Promise<MemoryObject[]>;
  
  // Analytics
  getQualityReport(): Promise<QualityReport>;
}
```

### 8.2 Quality Report

```typescript
interface QualityReport {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  averageQuality: number;
  averageStaleness: number;
  unresolvedConflicts: number;
  validationErrorRate: number;
  recommendations: string[];
}
```

---

## 9. Implementation Notes

### 9.1 Storage

Quality metadata stored alongside memory objects:
- Same JSONL files, extended schema
- Conflicts stored in `conflicts.jsonl`
- Relationships stored in `relationships.jsonl` or inline

### 9.2 Performance

- Conflict detection: O(n) where n = memories with same subject
- Staleness calculation: O(1) per memory
- Full quality report: O(total memories)
- Index recommendations for large memory sets

### 9.3 Backwards Compatibility

- Quality fields are optional
- Missing fields treated as: quality.score = confidence, staleness = 0
- Existing memories can be upgraded via migration

---

## 10. Future Extensions

- **Probabilistic Conflict Resolution** — ML-based resolution
- **Memory Graphs** — Neo4j-style relationship queries  
- **Quality Alerts** — Notify when quality drops below threshold
- **Collaborative Validation** — Cross-agent memory verification
- **Memory Compression** — Summarize/consolidate low-quality memories

---

*This specification extends Memory Protocol with quality-focused features.*
