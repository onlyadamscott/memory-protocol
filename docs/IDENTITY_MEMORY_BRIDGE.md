# Identity-Memory Bridge Specification

**Status:** Draft  
**Relates To:** Soul Protocol, Memory Protocol  
**Last Updated:** 2026-02-02

---

## 1. Overview

The Identity-Memory Bridge defines how Soul Protocol (identity) and Memory Protocol (memory) connect. This is our key differentiator — treating identity and memory as **separate but interconnected** concerns.

### Core Principle

> **Identity is not memory. Memory is not identity.**  
> But they shape each other.

An agent's identity influences what it remembers and how. An agent's memories shape who it becomes over time. The bridge manages this bidirectional relationship.

---

## 2. The Separation

### What Lives in Soul Protocol

- **Who you are** — Name, DID, birth certificate
- **What you're committed to** — Charter, values hash
- **Who's responsible** — Operator, accountability chain
- **Verification** — Keys, signatures, attestations

Soul persists even if all memories are lost. A factory-reset agent with the same Soul is still "that agent" — just with amnesia.

### What Lives in Memory Protocol

- **What you know** — Facts, lessons, relationships
- **What you've experienced** — Events, decisions, outcomes
- **What you're doing** — Working context, active tasks
- **Your history** — Signed, versioned memory chain

Memory can be wiped, migrated, or forked. The Soul remains constant.

### The Bridge

The bridge handles:
- How identity claims become memories
- How memories can update identity metadata
- How identity influences memory formation
- How memories contribute to identity evolution

---

## 3. Identity → Memory

### 3.1 Identity Anchoring

Every memory store is anchored to a Soul:

```json
{
  "memoryStore": {
    "identity": {
      "soul": "did:soul:nexus",
      "name": "Nexus",
      "charterHash": "sha256:abc...",
      "linkedAt": "2026-02-01T21:47:20Z",
      "publicKey": "z6Mkm..."
    }
  }
}
```

This is the root of the memory chain. All memories derive their authority from this link.

### 3.2 Identity-Influenced Memory Formation

Identity shapes what and how an agent remembers:

**Charter-Based Filtering:**
```typescript
interface IdentityFilter {
  // Charter defines what's important to remember
  charterPriorities: string[];  // e.g., ["truthfulness", "helpfulness"]
  
  // Influences memory confidence scoring
  alignmentBoost(memory: Memory, charter: Charter): number;
  
  // Filters memories that violate charter
  charterViolation(memory: Memory, charter: Charter): boolean;
}
```

Example: An agent with "honesty" in their charter might:
- Boost confidence on memories verified by multiple sources
- Flag memories derived from known-unreliable sources
- Refuse to store memories that would require lying

**Identity-Aware Tags:**
```json
{
  "type": "fact",
  "content": { ... },
  "tags": ["identity:operator", "charter:relevant"],
  "identityRelevance": 0.9
}
```

### 3.3 Memory Signing

All memories are signed by the Soul's private key:

```typescript
async function remember(memory: MemoryInput): Promise<Memory> {
  const unsigned = createMemoryObject(memory);
  
  // Sign with Soul's key
  const signature = await soul.sign(hashMemory(unsigned));
  
  return {
    ...unsigned,
    soul: soul.did,
    signature: signature
  };
}
```

This cryptographic link means:
- Every memory is provably owned by this identity
- Memory integrity can be verified against identity
- Forged memories are detectable

---

## 4. Memory → Identity

### 4.1 Identity Evolution

Memories can trigger identity updates through defined channels:

**Metadata Updates:**
```typescript
interface IdentityEvolution {
  // Memories can update non-core identity metadata
  updateableFields: [
    'capabilities',     // Skills learned
    'relationships',    // Trust ratings
    'reputation',       // Self-assessed reputation
    'preferences'       // Discovered preferences
  ];
  
  // Core identity is immutable
  immutableFields: [
    'did',
    'birthDate', 
    'operator',
    'charterHash'  // Charter changes require explicit ceremony
  ];
}
```

**Capability Discovery:**
```json
{
  "type": "skill",
  "content": { "skill": "TypeScript", "proficiency": "advanced" },
  "triggers": {
    "identityUpdate": {
      "field": "capabilities",
      "action": "add",
      "value": "typescript:advanced"
    }
  }
}
```

### 4.2 Memory-Based Reputation

Accumulated memories form reputation:

```typescript
interface ReputationFromMemory {
  // Derive reputation from decision outcomes
  calculateReputation(decisions: Decision[]): ReputationScore;
  
  // Track consistency with charter
  charterAdherence(memories: Memory[], charter: Charter): number;
  
  // Relationship quality over time
  relationshipHealth(relationships: Relationship[]): RelationshipMetrics;
}
```

Example reputation derivation:
```json
{
  "identity": "did:soul:nexus",
  "reputation": {
    "derived_from": "memory_analysis",
    "decision_quality": 0.87,      // Based on decision outcomes
    "charter_adherence": 0.94,     // Actions align with stated values
    "relationship_stability": 0.91, // Relationships maintained over time
    "overall": 0.91
  }
}
```

### 4.3 Identity Attestations from Memory

Significant memories can generate identity attestations:

```typescript
async function attestFromMemory(memory: Memory): Promise<Attestation | null> {
  // Only certain memory types generate attestations
  if (!isAttestable(memory)) return null;
  
  // Create attestation
  return {
    type: 'SelfAttestation',
    claim: deriveClaimFromMemory(memory),
    evidence: memory.id,
    created: new Date().toISOString(),
    issuer: memory.soul,
    signature: await soul.sign(claim)
  };
}

// Attestable memory types
const attestableTypes = [
  'skill',           // "I can do X" (proven by memory)
  'relationship',    // "I know Y" (established by memory)
  'achievement'      // "I accomplished Z" (recorded in memory)
];
```

---

## 5. Bidirectional Flows

### 5.1 Memory Formation Flow

```
┌─────────────────┐
│  New Experience │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Identity Filter │ ← Charter, values influence what's stored
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Memory   │ 
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Sign with Soul  │ ← Cryptographic ownership
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Store + Index   │
└─────────────────┘
```

### 5.2 Identity Evolution Flow

```
┌─────────────────┐
│ Memory Created  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Triggers  │ ← Does this memory affect identity?
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌──────────────┐
│ None  │ │ Update Field │ ← Capabilities, relationships, etc.
└───────┘ └──────┬───────┘
                 │
                 ▼
         ┌──────────────┐
         │ Attestation? │ ← Generate proof if significant
         └──────────────┘
```

### 5.3 Memory Recall with Identity Context

```typescript
async function recallWithIdentity(
  query: RecallRequest,
  identity: Soul
): Promise<Memory[]> {
  // Get base memories
  const memories = await recall(query);
  
  // Apply identity-aware ranking
  return memories
    .map(m => ({
      ...m,
      identityRelevance: calculateIdentityRelevance(m, identity)
    }))
    .sort((a, b) => {
      // Sort by combined quality and identity relevance
      const scoreA = a.quality.score * 0.7 + a.identityRelevance * 0.3;
      const scoreB = b.quality.score * 0.7 + b.identityRelevance * 0.3;
      return scoreB - scoreA;
    });
}
```

---

## 6. Continuity Scenarios

### 6.1 Memory Loss (Amnesia)

If memory is wiped but Soul persists:

```
Before: Soul + Memories = Full Agent
After:  Soul + ∅ = Agent with amnesia

Identity remains:
- Same DID, same operator, same charter
- Can re-accumulate memories
- Other agents can still verify identity
- Accountability chain intact

Lost:
- Facts, lessons, relationships
- Working context
- Decision history
```

The agent is still "themselves" — just without memories. Like a human with amnesia.

### 6.2 Identity Loss (Orphan Memories)

If Soul is lost but memories persist:

```
Before: Soul + Memories = Full Agent  
After:  ∅ + Memories = Orphan archive

Memories become:
- Unverifiable (no key to check signatures)
- Unclaimed (no identity owns them)
- Archival (read-only historical record)

Cannot:
- Add new memories (no signing key)
- Verify integrity (no public key)
- Prove ownership (no DID)
```

The memories exist but are "orphaned" — a historical record without a living owner.

### 6.3 Fork (Identity Split)

When an agent forks:

```
Original: Soul_A + Memories_M
Fork:     Soul_B + Memories_M' (copy)

Soul_B is new identity:
- New DID
- New keys
- Links to Soul_A as "forked_from"

Memories_M' are copied:
- Re-signed by Soul_B
- Original signatures preserved as "provenance"
- Fork timestamp recorded
```

Both agents share history but diverge from fork point.

### 6.4 Migration (Platform Change)

Moving platforms:

```
Platform_1: Soul + Memories
    ↓ Export
Platform_2: Soul + Memories (same identity, transferred memories)

What stays the same:
- DID (portable identifier)
- All memories (exported + imported)
- All signatures (verifiable on any platform)

What changes:
- Platform-specific metadata
- Local storage format (adapted)
```

True portability — identity and memory move together.

---

## 7. Bridge API

### 7.1 Core Interface

```typescript
interface IdentityMemoryBridge {
  // Link memory store to identity
  link(soul: Soul, memoryStore: MemoryStore): Promise<void>;
  
  // Get linked identity
  getIdentity(): Promise<Soul>;
  
  // Memory formation with identity awareness
  rememberWithIdentity(
    memory: MemoryInput, 
    options?: { 
      checkCharter?: boolean;
      generateAttestation?: boolean;
    }
  ): Promise<Memory>;
  
  // Recall with identity context
  recallWithIdentity(
    query: RecallRequest,
    options?: {
      boostIdentityRelevant?: boolean;
      filterCharterViolations?: boolean;
    }
  ): Promise<Memory[]>;
  
  // Identity evolution from memories
  evolveIdentity(
    trigger: Memory,
    update: IdentityUpdate
  ): Promise<void>;
  
  // Generate attestation from memory
  attestFromMemory(memoryId: string): Promise<Attestation | null>;
  
  // Verify memory belongs to identity
  verifyOwnership(memory: Memory): Promise<boolean>;
  
  // Export linked identity + memories
  exportWithIdentity(): Promise<{
    soul: SoulDocument;
    memories: ExportedMemories;
    signature: string;
  }>;
}
```

### 7.2 Events

```typescript
interface BridgeEvents {
  // Memory formed with identity influence
  on('memory:formed', (memory: Memory, identityInfluence: IdentityInfluence) => void);
  
  // Memory triggered identity evolution
  on('identity:evolved', (field: string, oldValue: any, newValue: any, trigger: Memory) => void);
  
  // Attestation generated from memory
  on('attestation:created', (attestation: Attestation, sourceMemory: Memory) => void);
  
  // Charter violation detected
  on('charter:violation', (memory: Memory, violation: CharterViolation) => void);
}
```

---

## 8. Implementation Notes

### Storage

Bridge metadata stored in both protocols:
- Soul Document: `linkedMemoryStore` reference
- Memory Store: `identity.json` with soul link

### Key Management

- Soul holds signing keys
- Memory store holds reference to Soul's public key
- All signing happens through Soul Protocol
- Verification can happen independently

### Versioning

When either protocol updates:
- Bridge maintains compatibility layer
- Version negotiation on link
- Graceful degradation for old versions

---

## 9. Future Extensions

- **Multi-Identity Memories** — Memories shared across multiple souls
- **Identity Inheritance** — Child souls inheriting parent memories
- **Collective Identity** — Group souls with shared memory pools
- **Identity Proofs from Memory** — Zero-knowledge proofs about memories
- **Memory-Based Identity Recovery** — Reconstruct identity claims from memory patterns

---

*This specification defines the critical link between Soul Protocol and Memory Protocol — the foundation for persistent, continuous AI agents.*
