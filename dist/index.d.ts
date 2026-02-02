/**
 * Memory Protocol - Portable, verifiable memory for AI agents
 */
export { MemoryStore } from './store.js';
export type { MemoryObject, MemoryType, MemorySource, MemoryIdentity, MemoryManifest, MemorySignature, MemoryStoreConfig, RememberRequest, RecallRequest, ForgetRequest, ExportResponse, VerifyResponse, ImportRequest, } from './types.js';
export { sign, verify, hash, generateMemoryId, encodePublicKey, decodePublicKey, } from './crypto.js';
export declare const VERSION = "0.1.0";
//# sourceMappingURL=index.d.ts.map