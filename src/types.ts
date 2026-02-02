/**
 * Memory Protocol Core Types
 */

// Memory Types
export type MemoryType = 
  | 'fact'
  | 'lesson'
  | 'relationship'
  | 'decision'
  | 'event'
  | 'preference'
  | 'skill';

export type MemorySource = 'experience' | 'told' | 'inferred';

// Memory Object
export interface MemoryObject {
  id: string;
  type: MemoryType;
  content: Record<string, unknown>;
  created: string;
  updated: string;
  soul: string;                    // DID of owning soul
  tags: string[];
  confidence: number;              // 0-1
  source: MemorySource;
  expires: string | null;
  deleted: boolean;
  deletedAt?: string;
  previousHash?: string;           // Hash of previous memory (chain)
  signature: MemorySignature;
}

export interface MemorySignature {
  type: 'Ed25519Signature2020';
  created: string;
  verificationMethod: string;
  proofValue: string;
}

// Identity
export interface MemoryIdentity {
  soul: string;                    // DID
  name: string;
  created: string;
  memoryProtocolVersion: string;
  publicKey: string;               // Multibase encoded
  chainHead: string | null;        // ID of latest memory
}

// Manifest
export interface MemoryManifest {
  version: string;
  soul: string;
  generated: string;
  files: Record<string, string>;   // filename -> sha256 hash
  chainHead: string | null;
  memoryCount: number;
  signature: string;
}

// Operations
export interface RememberRequest {
  type: MemoryType;
  content: Record<string, unknown>;
  tags?: string[];
  confidence?: number;
  source?: MemorySource;
  expires?: string;
}

export interface RecallRequest {
  query?: string;                  // Semantic search (future)
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

// Store Configuration
export interface MemoryStoreConfig {
  soul: string;                    // DID
  name: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  dataDir?: string;
}
