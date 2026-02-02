/**
 * Tests for Memory Store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryStore } from './store.js';
import * as ed from '@noble/ed25519';
import { rmSync, existsSync } from 'fs';

const TEST_DATA_DIR = './test-memory-data';

describe('MemoryStore', () => {
  let store: MemoryStore;
  let privateKey: Uint8Array;
  let publicKey: Uint8Array;

  beforeEach(async () => {
    // Generate test keypair
    privateKey = ed.utils.randomPrivateKey();
    publicKey = await ed.getPublicKeyAsync(privateKey);

    store = new MemoryStore({
      soul: 'did:soul:test',
      name: 'TestAgent',
      privateKey,
      publicKey,
      dataDir: TEST_DATA_DIR,
    });
  });

  afterEach(() => {
    // Cleanup test data
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  describe('remember', () => {
    it('should store a new memory', async () => {
      const memory = await store.remember({
        type: 'fact',
        content: { subject: 'test', value: 'hello' },
      });

      expect(memory.id).toMatch(/^mem_/);
      expect(memory.type).toBe('fact');
      expect(memory.content).toEqual({ subject: 'test', value: 'hello' });
      expect(memory.soul).toBe('did:soul:test');
      expect(memory.signature).toBeDefined();
    });

    it('should set default values', async () => {
      const memory = await store.remember({
        type: 'lesson',
        content: { text: 'learned something' },
      });

      expect(memory.confidence).toBe(1.0);
      expect(memory.source).toBe('experience');
      expect(memory.tags).toEqual([]);
      expect(memory.deleted).toBe(false);
    });

    it('should respect provided values', async () => {
      const memory = await store.remember({
        type: 'fact',
        content: { data: 'test' },
        confidence: 0.8,
        source: 'told',
        tags: ['important', 'verified'],
      });

      expect(memory.confidence).toBe(0.8);
      expect(memory.source).toBe('told');
      expect(memory.tags).toEqual(['important', 'verified']);
    });
  });

  describe('recall', () => {
    beforeEach(async () => {
      await store.remember({ type: 'fact', content: { id: 1 }, tags: ['a'] });
      await store.remember({ type: 'fact', content: { id: 2 }, tags: ['b'] });
      await store.remember({ type: 'lesson', content: { id: 3 }, tags: ['a'] });
      await store.remember({ type: 'decision', content: { id: 4 }, tags: ['a', 'b'] });
    });

    it('should recall all memories', () => {
      const memories = store.recall();
      expect(memories.length).toBe(4);
    });

    it('should filter by type', () => {
      const facts = store.recall({ type: 'fact' });
      expect(facts.length).toBe(2);
      expect(facts.every(m => m.type === 'fact')).toBe(true);
    });

    it('should filter by tags', () => {
      const tagged = store.recall({ tags: ['a'] });
      expect(tagged.length).toBe(3);
    });

    it('should apply limit', () => {
      const limited = store.recall({ limit: 2 });
      expect(limited.length).toBe(2);
    });

    it('should filter by confidence', async () => {
      await store.remember({ type: 'fact', content: { low: true }, confidence: 0.3 });
      
      const highConfidence = store.recall({ minConfidence: 0.5 });
      expect(highConfidence.every(m => m.confidence >= 0.5)).toBe(true);
    });
  });

  describe('forget', () => {
    it('should soft delete a memory', async () => {
      const memory = await store.remember({
        type: 'fact',
        content: { secret: 'data' },
      });

      const forgotten = await store.forget({ id: memory.id });
      
      expect(forgotten).not.toBeNull();
      expect(forgotten!.deleted).toBe(true);
      expect(forgotten!.deletedAt).toBeDefined();
    });

    it('should exclude deleted memories from recall by default', async () => {
      const memory = await store.remember({
        type: 'fact',
        content: { test: true },
      });

      await store.forget({ id: memory.id });
      
      const recalled = store.recall();
      expect(recalled.find(m => m.id === memory.id)).toBeUndefined();
    });

    it('should include deleted if requested', async () => {
      const memory = await store.remember({
        type: 'fact',
        content: { test: true },
      });

      await store.forget({ id: memory.id });
      
      const recalled = store.recall({ includeDeleted: true });
      expect(recalled.find(m => m.id === memory.id)).toBeDefined();
    });
  });

  describe('verify', () => {
    it('should verify empty store', async () => {
      const result = await store.verify();
      expect(result.valid).toBe(true);
      expect(result.memoryCount).toBe(0);
    });

    it('should verify store with memories', async () => {
      await store.remember({ type: 'fact', content: { a: 1 } });
      await store.remember({ type: 'fact', content: { b: 2 } });

      const result = await store.verify();
      expect(result.valid).toBe(true);
      expect(result.signaturesValid).toBe(true);
      expect(result.memoryCount).toBe(2);
    });
  });

  describe('export', () => {
    it('should export all memories', async () => {
      await store.remember({ type: 'fact', content: { test: 1 } });
      await store.remember({ type: 'lesson', content: { test: 2 } });

      const exported = await store.export();

      expect(exported.identity.soul).toBe('did:soul:test');
      expect(exported.memories.length).toBe(2);
      expect(exported.manifest.memoryCount).toBe(2);
      expect(exported.manifest.signature).toBeDefined();
    });
  });

  describe('stats', () => {
    it('should return correct statistics', async () => {
      await store.remember({ type: 'fact', content: { a: 1 } });
      await store.remember({ type: 'fact', content: { b: 2 } });
      await store.remember({ type: 'lesson', content: { c: 3 } });
      
      const toForget = await store.remember({ type: 'decision', content: { d: 4 } });
      await store.forget({ id: toForget.id });

      const stats = store.stats();

      expect(stats.total).toBe(4);
      expect(stats.active).toBe(3);
      expect(stats.deleted).toBe(1);
      expect(stats.byType.fact).toBe(2);
      expect(stats.byType.lesson).toBe(1);
    });
  });

  describe('persistence', () => {
    it('should persist and reload memories', async () => {
      await store.remember({ type: 'fact', content: { persistent: true } });

      // Create new store instance pointing to same data
      const store2 = new MemoryStore({
        soul: 'did:soul:test',
        name: 'TestAgent',
        privateKey,
        publicKey,
        dataDir: TEST_DATA_DIR,
      });

      const recalled = store2.recall();
      expect(recalled.length).toBe(1);
      expect(recalled[0].content).toEqual({ persistent: true });
    });
  });
});
