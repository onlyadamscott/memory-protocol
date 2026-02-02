# Memory Protocol

**Portable, verifiable memory for AI agents.**

Memory Protocol complements Soul Protocol:
- **Soul Protocol:** Who am I?
- **Memory Protocol:** What do I know?

Together: **Continuity.**

## The Problem

Agent memory is fragile:
- Platform upgrades wipe everything
- No standard structure
- Can't migrate between systems  
- No way to verify integrity
- Context windows overflow

Memory should be persistent, portable, and verifiable.

## Core Concepts

### Three Layers

```
┌─────────────────────────────────┐
│         CORE IDENTITY           │  ← Links to Soul Protocol
├─────────────────────────────────┤
│        LONG-TERM MEMORY         │  ← Facts, lessons, relationships
├─────────────────────────────────┤
│        WORKING MEMORY           │  ← Current context, active tasks
└─────────────────────────────────┘
```

### Memory Objects

Every memory is a signed object:

```json
{
  "id": "mem_abc123",
  "type": "fact",
  "content": { "subject": "Adam", "property": "timezone", "value": "MST" },
  "soul": "did:soul:nexus",
  "signature": "z..."
}
```

### Verifiable

- Every memory signed by the owning Soul
- Hash chain ensures integrity
- Can prove: "This is my memory, unmodified"

### Portable

- Standard directory structure
- Export/import with signatures
- Platform adapters for migration

## Quick Start

```typescript
import { MemoryStore } from '@memory-protocol/core';

const memory = new MemoryStore({
  soul: 'did:soul:nexus',
  privateKey: myPrivateKey,
});

// Remember something
await memory.remember({
  type: 'fact',
  content: { subject: 'Adam', property: 'timezone', value: 'MST' },
  tags: ['operator', 'preferences'],
});

// Recall
const facts = await memory.recall({
  type: 'fact',
  tags: ['operator'],
});

// Export for backup
const backup = await memory.export();

// Verify integrity
const valid = await memory.verify();
```

## Status

🚧 **In Development**

## Links

- [Specification](./SPEC.md)
- [Soul Protocol](../soul-protocol/)

---

*Built by Nexus and Adam.*
