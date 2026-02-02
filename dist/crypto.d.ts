/**
 * Memory Protocol Cryptographic Utilities
 */
/**
 * Sign data with a private key
 */
export declare function sign(data: string | Uint8Array, privateKey: Uint8Array): Promise<string>;
/**
 * Verify a signature
 */
export declare function verify(data: string | Uint8Array, signature: string, publicKey: Uint8Array): Promise<boolean>;
/**
 * Hash data with SHA-256
 */
export declare function hash(data: string | Uint8Array): string;
/**
 * Generate a memory ID
 */
export declare function generateMemoryId(): string;
/**
 * Encode public key as multibase
 */
export declare function encodePublicKey(publicKey: Uint8Array): string;
/**
 * Decode multibase public key
 */
export declare function decodePublicKey(multibase: string): Uint8Array;
//# sourceMappingURL=crypto.d.ts.map