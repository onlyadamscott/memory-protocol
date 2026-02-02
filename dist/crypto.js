/**
 * Memory Protocol Cryptographic Utilities
 */
import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
const MULTIBASE_BASE58BTC = 'z';
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
/**
 * Sign data with a private key
 */
export async function sign(data, privateKey) {
    const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const signature = await ed.signAsync(message, privateKey);
    return MULTIBASE_BASE58BTC + base58Encode(signature);
}
/**
 * Verify a signature
 */
export async function verify(data, signature, publicKey) {
    if (!signature.startsWith(MULTIBASE_BASE58BTC)) {
        return false;
    }
    const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const signatureBytes = base58Decode(signature.slice(1));
    try {
        return await ed.verifyAsync(signatureBytes, message, publicKey);
    }
    catch {
        return false;
    }
}
/**
 * Hash data with SHA-256
 */
export function hash(data) {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return 'sha256:' + bytesToHex(sha256(bytes));
}
/**
 * Generate a memory ID
 */
export function generateMemoryId() {
    const timestamp = Date.now().toString(36);
    const random = base58Encode(crypto.getRandomValues(new Uint8Array(8)));
    return `mem_${timestamp}_${random}`;
}
/**
 * Encode public key as multibase
 */
export function encodePublicKey(publicKey) {
    const MULTICODEC_ED25519_PUB = new Uint8Array([0xed, 0x01]);
    const prefixed = new Uint8Array(MULTICODEC_ED25519_PUB.length + publicKey.length);
    prefixed.set(MULTICODEC_ED25519_PUB);
    prefixed.set(publicKey, MULTICODEC_ED25519_PUB.length);
    return MULTIBASE_BASE58BTC + base58Encode(prefixed);
}
/**
 * Decode multibase public key
 */
export function decodePublicKey(multibase) {
    if (!multibase.startsWith(MULTIBASE_BASE58BTC)) {
        throw new Error('Invalid multibase prefix');
    }
    const decoded = base58Decode(multibase.slice(1));
    return decoded.slice(2); // Strip multicodec prefix
}
// Base58 encoding/decoding
function base58Encode(bytes) {
    if (bytes.length === 0)
        return '';
    let zeros = 0;
    while (zeros < bytes.length && bytes[zeros] === 0)
        zeros++;
    const size = Math.ceil(bytes.length * 138 / 100) + 1;
    const b58 = new Uint8Array(size);
    let length = 0;
    for (let i = zeros; i < bytes.length; i++) {
        let carry = bytes[i];
        let j = 0;
        for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
            carry += 256 * b58[k];
            b58[k] = carry % 58;
            carry = Math.floor(carry / 58);
        }
        length = j;
    }
    let i = size - length;
    while (i < size && b58[i] === 0)
        i++;
    let result = '1'.repeat(zeros);
    while (i < size) {
        result += BASE58_ALPHABET[b58[i++]];
    }
    return result;
}
function base58Decode(str) {
    if (str.length === 0)
        return new Uint8Array(0);
    let zeros = 0;
    while (zeros < str.length && str[zeros] === '1')
        zeros++;
    const size = Math.ceil(str.length * 733 / 1000) + 1;
    const bytes = new Uint8Array(size);
    let length = 0;
    for (let i = zeros; i < str.length; i++) {
        const charIndex = BASE58_ALPHABET.indexOf(str[i]);
        if (charIndex === -1)
            throw new Error(`Invalid base58 character: ${str[i]}`);
        let carry = charIndex;
        let j = 0;
        for (let k = size - 1; (carry !== 0 || j < length) && k >= 0; k--, j++) {
            carry += 58 * bytes[k];
            bytes[k] = carry % 256;
            carry = Math.floor(carry / 256);
        }
        length = j;
    }
    let i = size - length;
    while (i < size && bytes[i] === 0)
        i++;
    const result = new Uint8Array(zeros + (size - i));
    result.fill(0, 0, zeros);
    let j = zeros;
    while (i < size) {
        result[j++] = bytes[i++];
    }
    return result;
}
//# sourceMappingURL=crypto.js.map