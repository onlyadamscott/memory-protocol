/**
 * Memory Store - Core memory management for agents
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { sign, verify, hash, generateMemoryId, encodePublicKey } from './crypto.js';
const VERSION = '0.1.0';
export class MemoryStore {
    config;
    identity;
    memories = new Map();
    dataDir;
    constructor(config) {
        this.config = config;
        this.dataDir = config.dataDir || './memory-data';
        // Ensure data directory exists
        if (!existsSync(this.dataDir)) {
            mkdirSync(this.dataDir, { recursive: true });
        }
        // Load or create identity
        this.identity = this.loadOrCreateIdentity();
        // Load existing memories
        this.loadMemories();
    }
    /**
     * Remember something new
     */
    async remember(request) {
        const now = new Date().toISOString();
        const id = generateMemoryId();
        // Get previous chain head for linking
        const previousHash = this.identity.chainHead
            ? hash(JSON.stringify(this.memories.get(this.identity.chainHead)))
            : undefined;
        // Create unsigned memory
        const unsignedMemory = {
            id,
            type: request.type,
            content: request.content,
            created: now,
            updated: now,
            soul: this.config.soul,
            tags: request.tags || [],
            confidence: request.confidence ?? 1.0,
            source: request.source || 'experience',
            expires: request.expires || null,
            deleted: false,
            previousHash,
        };
        // Sign the memory
        const signature = await this.signMemory(unsignedMemory);
        const memory = {
            ...unsignedMemory,
            signature,
        };
        // Store
        this.memories.set(id, memory);
        this.identity.chainHead = id;
        // Persist
        this.save();
        return memory;
    }
    /**
     * Recall memories matching criteria
     */
    recall(request = {}) {
        let results = Array.from(this.memories.values());
        // Filter deleted unless requested
        if (!request.includeDeleted) {
            results = results.filter(m => !m.deleted);
        }
        // Filter by type
        if (request.type) {
            results = results.filter(m => m.type === request.type);
        }
        if (request.types && request.types.length > 0) {
            results = results.filter(m => request.types.includes(m.type));
        }
        // Filter by tags (any match)
        if (request.tags && request.tags.length > 0) {
            results = results.filter(m => request.tags.some(tag => m.tags.includes(tag)));
        }
        // Filter by time
        if (request.since) {
            results = results.filter(m => m.created >= request.since);
        }
        if (request.until) {
            results = results.filter(m => m.created <= request.until);
        }
        // Filter by confidence
        if (request.minConfidence !== undefined) {
            results = results.filter(m => m.confidence >= request.minConfidence);
        }
        // Sort by created (newest first)
        results.sort((a, b) => b.created.localeCompare(a.created));
        // Apply offset and limit
        const offset = request.offset || 0;
        const limit = request.limit || 100;
        results = results.slice(offset, offset + limit);
        return results;
    }
    /**
     * Get a specific memory by ID
     */
    get(id) {
        return this.memories.get(id) || null;
    }
    /**
     * Forget a memory (soft delete)
     */
    async forget(request) {
        const memory = this.memories.get(request.id);
        if (!memory)
            return null;
        const now = new Date().toISOString();
        // Update memory
        const updated = {
            ...memory,
            deleted: true,
            deletedAt: now,
            updated: now,
            signature: await this.signMemory({
                ...memory,
                deleted: true,
                deletedAt: now,
                updated: now,
            }),
        };
        this.memories.set(request.id, updated);
        this.save();
        return updated;
    }
    /**
     * Update a memory
     */
    async update(id, updates) {
        const memory = this.memories.get(id);
        if (!memory || memory.deleted)
            return null;
        const now = new Date().toISOString();
        const updated = {
            ...memory,
            ...updates.content && { content: { ...memory.content, ...updates.content } },
            ...updates.tags && { tags: updates.tags },
            ...updates.confidence !== undefined && { confidence: updates.confidence },
            updated: now,
        };
        const signed = {
            ...updated,
            signature: await this.signMemory(updated),
        };
        this.memories.set(id, signed);
        this.save();
        return signed;
    }
    /**
     * Export all memories for backup/migration
     */
    async export() {
        const memories = Array.from(this.memories.values());
        const manifest = {
            version: VERSION,
            soul: this.config.soul,
            generated: new Date().toISOString(),
            files: {},
            chainHead: this.identity.chainHead,
            memoryCount: memories.length,
            signature: '', // Will be set below
        };
        // Calculate file hashes
        manifest.files['memories.json'] = hash(JSON.stringify(memories));
        manifest.files['identity.json'] = hash(JSON.stringify(this.identity));
        // Sign manifest
        manifest.signature = await sign(JSON.stringify({ ...manifest, signature: undefined }), this.config.privateKey);
        return {
            manifest,
            identity: this.identity,
            memories,
        };
    }
    /**
     * Verify memory integrity
     */
    async verify() {
        const errors = [];
        let signaturesValid = true;
        let chainIntact = true;
        const memories = Array.from(this.memories.values());
        const publicKey = this.config.publicKey;
        // Verify each memory signature
        for (const memory of memories) {
            const { signature, ...unsigned } = memory;
            const data = JSON.stringify(unsigned);
            const valid = await verify(data, signature.proofValue, publicKey);
            if (!valid) {
                signaturesValid = false;
                errors.push(`Invalid signature on memory ${memory.id}`);
            }
        }
        // Verify chain integrity (optional, if previousHash is used)
        // TODO: Implement full chain verification
        return {
            valid: signaturesValid && chainIntact && errors.length === 0,
            chainIntact,
            signaturesValid,
            memoryCount: memories.length,
            errors,
        };
    }
    /**
     * Get statistics
     */
    stats() {
        const memories = Array.from(this.memories.values());
        const active = memories.filter(m => !m.deleted);
        const byType = {};
        for (const m of active) {
            byType[m.type] = (byType[m.type] || 0) + 1;
        }
        return {
            total: memories.length,
            active: active.length,
            deleted: memories.length - active.length,
            byType,
        };
    }
    // Private methods
    loadOrCreateIdentity() {
        const identityPath = join(this.dataDir, 'identity.json');
        if (existsSync(identityPath)) {
            return JSON.parse(readFileSync(identityPath, 'utf-8'));
        }
        const identity = {
            soul: this.config.soul,
            name: this.config.name,
            created: new Date().toISOString(),
            memoryProtocolVersion: VERSION,
            publicKey: encodePublicKey(this.config.publicKey),
            chainHead: null,
        };
        writeFileSync(identityPath, JSON.stringify(identity, null, 2));
        return identity;
    }
    loadMemories() {
        const memoriesPath = join(this.dataDir, 'memories.jsonl');
        if (!existsSync(memoriesPath))
            return;
        const lines = readFileSync(memoriesPath, 'utf-8').split('\n').filter(l => l.trim());
        for (const line of lines) {
            try {
                const memory = JSON.parse(line);
                this.memories.set(memory.id, memory);
            }
            catch (e) {
                console.error('Failed to parse memory:', e);
            }
        }
    }
    save() {
        // Save identity
        const identityPath = join(this.dataDir, 'identity.json');
        writeFileSync(identityPath, JSON.stringify(this.identity, null, 2));
        // Save memories (append-only JSONL)
        const memoriesPath = join(this.dataDir, 'memories.jsonl');
        const lines = Array.from(this.memories.values())
            .map(m => JSON.stringify(m))
            .join('\n');
        writeFileSync(memoriesPath, lines);
    }
    async signMemory(memory) {
        const data = JSON.stringify(memory);
        const proofValue = await sign(data, this.config.privateKey);
        return {
            type: 'Ed25519Signature2020',
            created: new Date().toISOString(),
            verificationMethod: `${this.config.soul}#keys-1`,
            proofValue,
        };
    }
}
//# sourceMappingURL=store.js.map