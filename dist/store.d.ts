/**
 * Memory Store - Core memory management for agents
 */
import type { MemoryObject, MemoryStoreConfig, RememberRequest, RecallRequest, ForgetRequest, ExportResponse, VerifyResponse } from './types.js';
export declare class MemoryStore {
    private config;
    private identity;
    private memories;
    private dataDir;
    constructor(config: MemoryStoreConfig);
    /**
     * Remember something new
     */
    remember(request: RememberRequest): Promise<MemoryObject>;
    /**
     * Recall memories matching criteria
     */
    recall(request?: RecallRequest): MemoryObject[];
    /**
     * Get a specific memory by ID
     */
    get(id: string): MemoryObject | null;
    /**
     * Forget a memory (soft delete)
     */
    forget(request: ForgetRequest): Promise<MemoryObject | null>;
    /**
     * Update a memory
     */
    update(id: string, updates: Partial<RememberRequest>): Promise<MemoryObject | null>;
    /**
     * Export all memories for backup/migration
     */
    export(): Promise<ExportResponse>;
    /**
     * Verify memory integrity
     */
    verify(): Promise<VerifyResponse>;
    /**
     * Get statistics
     */
    stats(): {
        total: number;
        active: number;
        deleted: number;
        byType: Record<string, number>;
    };
    private loadOrCreateIdentity;
    private loadMemories;
    private save;
    private signMemory;
}
//# sourceMappingURL=store.d.ts.map