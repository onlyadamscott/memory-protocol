/**
 * Memory Protocol Core Types
 */
export type MemoryType = 'fact' | 'lesson' | 'relationship' | 'decision' | 'event' | 'preference' | 'skill';
export type MemorySource = 'experience' | 'told' | 'inferred';
export interface MemoryObject {
    id: string;
    type: MemoryType;
    content: Record<string, unknown>;
    created: string;
    updated: string;
    soul: string;
    tags: string[];
    confidence: number;
    source: MemorySource;
    expires: string | null;
    deleted: boolean;
    deletedAt?: string;
    previousHash?: string;
    signature: MemorySignature;
}
export interface MemorySignature {
    type: 'Ed25519Signature2020';
    created: string;
    verificationMethod: string;
    proofValue: string;
}
export interface MemoryIdentity {
    soul: string;
    name: string;
    created: string;
    memoryProtocolVersion: string;
    publicKey: string;
    chainHead: string | null;
}
export interface MemoryManifest {
    version: string;
    soul: string;
    generated: string;
    files: Record<string, string>;
    chainHead: string | null;
    memoryCount: number;
    signature: string;
}
export interface RememberRequest {
    type: MemoryType;
    content: Record<string, unknown>;
    tags?: string[];
    confidence?: number;
    source?: MemorySource;
    expires?: string;
}
export interface RecallRequest {
    query?: string;
    type?: MemoryType;
    types?: MemoryType[];
    tags?: string[];
    since?: string;
    until?: string;
    limit?: number;
    offset?: number;
    minConfidence?: number;
    includeDeleted?: boolean;
}
export interface ForgetRequest {
    id: string;
    reason?: string;
}
export interface ExportResponse {
    manifest: MemoryManifest;
    identity: MemoryIdentity;
    memories: MemoryObject[];
}
export interface ImportRequest {
    export: ExportResponse;
    mode: 'merge' | 'replace';
    verifySignatures?: boolean;
}
export interface VerifyResponse {
    valid: boolean;
    chainIntact: boolean;
    signaturesValid: boolean;
    memoryCount: number;
    errors: string[];
}
export interface MemoryStoreConfig {
    soul: string;
    name: string;
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    dataDir?: string;
}
//# sourceMappingURL=types.d.ts.map