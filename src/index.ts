/**
 * Memory Protocol - Portable, verifiable memory for AI agents
 */

// Core exports
export { MemoryStore } from './store.js';

// Adapters
export { 
  importFromClawdbot, 
  exportToClawdbot,
  type ClawdbotMemoryConfig,
} from './adapters/clawdbot.js';

// Types
export type {
  MemoryObject,
  MemoryType,
  MemorySource,
  MemoryIdentity,
  MemoryManifest,
  MemorySignature,
  MemoryStoreConfig,
  RememberRequest,
  RecallRequest,
  ForgetRequest,
  ExportResponse,
  VerifyResponse,
  ImportRequest,
} from './types.js';

// Crypto utilities
export {
  sign,
  verify,
  hash,
  generateMemoryId,
  encodePublicKey,
  decodePublicKey,
} from './crypto.js';

// Version
export const VERSION = '0.1.0';
