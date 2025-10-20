import { ec, hash, num } from 'starknet';

export interface OrderSignature {
  starkKey: string;
  r: string;
  s: string;
}

/**
 * Generate a Stark signature for Extended order creation
 * @param privateKey - Starknet private key (hex string with or without 0x prefix)
 * @param messageHash - The hash of the order message to sign
 * @returns Signature components (starkKey, r, s)
 */
export function signOrderMessage(
  privateKey: string,
  messageHash: string
): OrderSignature {
  // Remove 0x prefix if present
  const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Create key pair from private key
  const keyPair = ec.starkCurve.getStarkKey(cleanPrivateKey);
  const starkKey = keyPair.startsWith('0x') ? keyPair : '0x' + keyPair;

  // Sign the message hash
  const signature = ec.starkCurve.sign(messageHash, cleanPrivateKey);

  return {
    starkKey,
    r: num.toHex(signature.r),
    s: num.toHex(signature.s),
  };
}

/**
 * Create a message hash for Extended order signing
 * @param params - Order parameters to hash
 * @returns Message hash as hex string
 */
export function createOrderMessageHash(params: {
  market: string;
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
  nonce: number;
  expiryEpochMillis: number;
}): string {
  // Create structured data for hashing following Extended's format
  // This is a simplified version - may need adjustment based on Extended's exact requirements
  const messageData = [
    params.market,
    params.side,
    params.price,
    params.quantity,
    params.nonce.toString(),
    params.expiryEpochMillis.toString(),
  ];

  // Convert each string to a felt (field element) by hashing
  const felts = messageData.map(item => {
    // Use getSelectorFromName for string hashing (similar to starknet keccak)
    return num.toBigInt(hash.getSelectorFromName(item));
  });

  // Hash the array of felts
  const messageHash = hash.computeHashOnElements(felts);

  return num.toHex(messageHash);
}
