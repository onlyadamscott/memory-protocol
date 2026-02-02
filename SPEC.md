# Memory Protocol Specification (DRAFT)

**Version:** 0.1.0-draft  
**Status:** Work in Progress  
**Last Updated:** 2026-02-02

---

## 1. Overview

Memory Protocol defines a standard for AI agent memory that is:
- **Portable** — Move between platforms without loss
- **Verifiable** — Cryptographically prove ownership and integrity
- **Structured** — Standard schema that tools can understand
- **Versionable** — Track changes, rollback if needed
- **Linked to Identity** — Tied to Soul Protocol DIDs

## 2. Core Concepts

### 2.1 Memory Layers

Agent memory is organized into three layers:

```
┌─────────────────────────────────┐
│         CORE IDENTITY           │  ← Who am I? (links to Soul Protocol)
│   name, purpose, charter, DID   │
├─────────────────────────────────┤
│        LONG-TERM MEMORY         │  ← What do I know?
│  facts, lessons, relationships  │
├─────────────────────────────────┤
│        WORKING MEMORY           │  ← What am I doing?
│   recent context, active tasks  │
└─────────────────────────────────┘
```

**Core Identity** — Immutable facts about the agent. Links to Soul Protocol.

**Long-Term Memory** — Durable knowledge that persists across sessions:
- Facts and beliefs
- Learned lessons and preferences  
- Relationships and trust ratings
- Skills and capabilities
- Historical decisions and their outcomes

**Working Memory** — Ephemeral context for current tasks:
- Recent conversation history
- Active task state
- Temporary variables
- Session-specific context

### 2.2 Memory Objects

All memory is stored as **Memory Objects**:

```json
{
  "id": "mem_abc123",
  "type": "fact|lesson|relationship|decision|event",
  "content": { ... },
  "created": "2026-02-02T16:00:00Z",
  "updated": "2026-02-02T16:00:00Z",
  "soul": "did:soul:nexus",
  "signature": "z...",
  "tags": ["tag1", "tag2"],
  "confidence": 0.95,
  "source": "experience|told|inferred",
  "expires": null
}
```

### 2.3 Memory Types

| Type | Description | Example |
|------|-------------|---------|
| `fact` | Something known to be true | "Adam's timezone is MST" |
| `lesson` | Something learned from experience | "Large JSON payloads timeout on Moltbook API" |
| `relationship` | Connection to another entity | "Adam is my operator" |
| `decision` | A choice made and why | "Chose centralized MVP to ship faster" |
| `event` | Something that happened | "Registered as Soul #1 on 2026-02-01" |
| `preference` | A preference or value | "Prefer direct communication over hedging" |
| `skill` | A capability or knowledge domain | "Can write TypeScript, use Ed25519 crypto" |

### 2.4 Memory Signature

Every memory object is signed by the owning Soul:

```json
{
  "signature": {
    "type": "Ed25519Signature2020",
    "created": "2026-02-02T16:00:00Z",
    "verificationMethod": "did:soul:nexus#keys-1",
    "proofValue": "z..."
  }
}
```

This proves:
- The memory belongs to this soul
- It hasn't been tampered with
- It was created at a specific time

### 2.5 Memory Hash Chain

Memories form a hash chain for integrity:

```
mem_001 → hash(mem_001) included in mem_002 → hash(mem_002) in mem_003 → ...
```

This creates an append-only log where:
- Deletions are soft (marked deleted, not removed)
- Modifications create new versions
- The entire history is verifiable

## 3. Memory Schema

### 3.1 Standard Directory Structure

```
memory/
├── identity.json          # Core identity (links to Soul)
├── long-term/
│   ├── facts.jsonl        # Facts (append-only)
│   ├── lessons.jsonl      # Lessons learned
│   ├── relationships.jsonl # Entity relationships
│   ├── decisions.jsonl    # Decision log
│   └── index.json         # Search index
├── working/
│   ├── context.json       # Current session context
│   └── tasks.json         # Active tasks
├── snapshots/
│   ├── 2026-02-01.json    # Daily snapshots
│   └── 2026-02-02.json
└── manifest.json          # Memory manifest with checksums
```

### 3.2 Identity File

Links memory to Soul Protocol:

```json
{
  "soul": "did:soul:nexus",
  "name": "Nexus",
  "created": "2026-02-01T21:47:20Z",
  "memoryProtocolVersion": "0.1.0",
  "publicKey": "z6Mkm...",
  "chainHead": "mem_latest_id"
}
```

### 3.3 Manifest File

Checksums for integrity verification:

```json
{
  "version": "0.1.0",
  "soul": "did:soul:nexus",
  "generated": "2026-02-02T16:00:00Z",
  "files": {
    "identity.json": "sha256:abc...",
    "long-term/facts.jsonl": "sha256:def...",
    ...
  },
  "chainHead": "mem_xyz",
  "signature": "z..."
}
```

## 4. Operations

### 4.1 Remember

Add a new memory:

```typescript
interface RememberRequest {
  type: MemoryType;
  content: object;
  tags?: string[];
  confidence?: number;
  source?: 'experience' | 'told' | 'inferred';
  expires?: string;
}
```

### 4.2 Recall

Query memories:

```typescript
interface RecallRequest {
  query?: string;           // Semantic search
  type?: MemoryType;        // Filter by type
  tags?: string[];          // Filter by tags
  since?: string;           // Time filter
  limit?: number;
  minConfidence?: number;
}
```

### 4.3 Forget

Mark memory as forgotten (soft delete):

```typescript
interface ForgetRequest {
  id: string;
  reason?: string;
}
```

### 4.4 Export

Export all memory for backup/migration:

```typescript
interface ExportResponse {
  manifest: Manifest;
  identity: Identity;
  memories: MemoryObject[];
  signature: string;
}
```

### 4.5 Import

Import memory from another instance:

```typescript
interface ImportRequest {
  export: ExportResponse;
  mode: 'merge' | 'replace';
  verifySignatures: boolean;
}
```

### 4.6 Verify

Verify memory integrity:

```typescript
interface VerifyResponse {
  valid: boolean;
  chainIntact: boolean;
  signaturesValid: boolean;
  errors?: string[];
}
```

## 5. Interoperability

### 5.1 Soul Protocol Integration

Memory Protocol is designed to work with Soul Protocol:

- `identity.json` references the Soul DID
- Memory signatures use the Soul's private key
- Verification uses the Soul's public key from DID Document

### 5.2 Platform Adapters

Adapters translate between Memory Protocol and platform-specific formats:

- **Clawdbot Adapter** — MEMORY.md + memory/*.md ↔ Memory Protocol
- **Generic Markdown Adapter** — Flat files ↔ Memory Protocol
- **Database Adapter** — SQLite/Postgres ↔ Memory Protocol

### 5.3 Migration Path

For existing agents:

1. Export current memory (platform-specific)
2. Convert via adapter to Memory Protocol format
3. Sign with Soul private key
4. Import into new platform

## 6. Security Considerations

- Private keys must be stored securely
- Memory should be encrypted at rest for sensitive content
- Signatures prevent tampering but not unauthorized reading
- Consider encryption for memories marked `sensitive`

## 7. Privacy Considerations

- Agents control their own memory
- Export requires agent consent (private key)
- Selective disclosure: can export subsets
- Forgetting is soft-delete (audit trail preserved)

## 8. Future Extensions

- **Shared Memory** — Multiple souls with access to shared memory spaces
- **Memory Attestations** — Third-party verification of memories
- **Encrypted Memories** — End-to-end encrypted memory objects
- **Memory Merkle Trees** — Efficient verification of large memory sets

---

*This specification is a work in progress. Designed to complement Soul Protocol.*
