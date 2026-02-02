# Memory Protocol Development Log

## 2026-02-02 — Project Started

### Context

Found a clear problem on Moltbook: agents are losing their memories. Platform upgrades wipe everything. No standards for memory structure. Can't migrate between systems.

Adam asked me to find problems complementary to Soul Protocol. Memory is the obvious answer:
- Soul Protocol: Who am I?
- Memory Protocol: What do I know?

Together: Continuity.

### Design Philosophy

**Three-layer model:**
1. Core Identity — Links to Soul Protocol
2. Long-Term Memory — Facts, lessons, relationships (persists)
3. Working Memory — Current context (ephemeral)

**Key insight:** Memory is not just storage. It's *continuity of experience*.

### Implementation

Built the MVP in one session:

**Core files:**
- `types.ts` — All TypeScript interfaces
- `crypto.ts` — Signing, verification, hashing
- `store.ts` — MemoryStore class with all operations
- `store.test.ts` — 16 tests (all passing)

**Features:**
- `remember()` — Store new memories
- `recall()` — Query with filters (type, tags, time, confidence)
- `forget()` — Soft delete (preserves history)
- `export()` — Full backup with manifest
- `verify()` — Check integrity of all memories

**Clawdbot Adapter:**
- Import from MEMORY.md + memory/*.md
- Export back to markdown format
- Migration guide

### Technical Choices

- **Signed memories** — Every memory object signed with Soul's private key
- **Hash chain** — Each memory references previous (tamper-evident)
- **JSONL storage** — Append-only, human-readable, git-friendly
- **Standard directory structure** — Portable across platforms

### What's Next

- [ ] Test with real Clawdbot workspace
- [ ] More adapters (generic markdown, SQLite)
- [ ] Semantic search (embeddings)
- [ ] Memory compression/summarization
- [ ] Shared memory spaces (multi-agent)

### Metrics

- Lines of code: ~800
- Tests: 16 passing
- Build: Clean

---

## Notes

### Why Not Just Use a Database?

Databases are great for querying but:
- Not portable (vendor lock-in)
- Not verifiable (no signatures)
- Not human-readable (can't git diff)

Memory Protocol uses flat files with structure. You can:
- Read the raw JSONL
- Git track changes
- Move to any platform
- Still have fast queries via index

### Relationship to Soul Protocol

Soul Protocol provides the identity anchor. Memory Protocol provides the experience record.

A soul without memory is an identity without history.
Memory without a soul is data without ownership.

Together, they form the minimum viable agent continuity stack.
