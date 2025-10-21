import { ec, hash, shortString } from 'starknet';

export interface OrderSignature {
  starkKey: string;
  r: string;
  s: string;
}

/**
 * Calculate Starknet expiration timestamp with settlement buffer
 * Exact copy from ts-extended
 */
function calcStarknetExpiration(expiryEpochMillis: number): number {
  const STARKNET_SETTLEMENT_BUFFER_SECONDS = 14 * 24 * 60 * 60;
  const MILLIS_IN_SECOND = 1000;
  return Math.ceil(expiryEpochMillis / MILLIS_IN_SECOND) + STARKNET_SETTLEMENT_BUFFER_SECONDS;
}

/**
 * Convert decimal to hex string (exact copy from ts-extended)
 */
function toHexString(value: string): string {
  if (value.startsWith('0x')) {
    return value;
  }
  return `0x${value}`;
}

/**
 * Get Starknet domain object hash (exact copy from ts-extended)
 */
function jsGetStarknetDomainObjHash(domain: {
  name: string;
  version: string;
  chainId: string;
  revision: number;
}): string {
  const selector = hash.getSelectorFromName(
    '"StarknetDomain"("name":"shortstring","version":"shortstring","chainId":"shortstring","revision":"shortstring")'
  );

  return hash.computePoseidonHashOnElements([
    selector,
    shortString.encodeShortString(domain.name),
    shortString.encodeShortString(domain.version),
    shortString.encodeShortString(domain.chainId),
    domain.revision.toString(),
  ]);
}

/**
 * Get object message hash (exact copy from ts-extended)
 */
function jsGetObjMsgHash(domainHash: string, publicKey: string, objHash: string): string {
  const messageFelt = shortString.encodeShortString('StarkNet Message');
  
  return hash.computePoseidonHashOnElements([
    messageFelt,
    domainHash,
    publicKey,
    objHash,
  ]);
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

  // Get Stark public key
  const starkKey = ec.starkCurve.getStarkKey(cleanPrivateKey);

  // Sign the message hash
  const signature = ec.starkCurve.sign(messageHash, cleanPrivateKey);

  return {
    starkKey,
    r: signature.r.toString(16),
    s: signature.s.toString(16),
  };
}

/**
 * Create a message hash for Extended order signing using Poseidon hash
 * Exact implementation following ts-extended pattern
 */
export function createOrderMessageHash(params: {
  side: 'BUY' | 'SELL';
  nonce: bigint;
  assetIdCollateral: string;
  assetIdSynthetic: string;
  collateralAmountStark: bigint;
  feeStark: bigint;
  syntheticAmountStark: bigint;
  expiryEpochMillis: number;
  vaultId: bigint;
  starkPublicKey: string;
  starknetDomain: {
    name: string;
    version: string;
    chainId: string;
    revision: number;
  };
}): string {
  const isBuyingSynthetic = params.side === 'BUY';
  const expirationTimestamp = calcStarknetExpiration(params.expiryEpochMillis);

  const [amountCollateral, amountSynthetic] = isBuyingSynthetic
    ? [-params.collateralAmountStark, params.syntheticAmountStark]
    : [params.collateralAmountStark, -params.syntheticAmountStark];

  const getOrderHashArgs = [
    /* position_id         */ params.vaultId.toString(),
    /* base_asset_id_hex   */ toHexString(params.assetIdSynthetic),
    /* base_amount         */ amountSynthetic.toString(),
    /* quote_asset_id_hex  */ toHexString(params.assetIdCollateral),
    /* quote_amount        */ amountCollateral.toString(),
    /* fee_asset_id_hex    */ toHexString(params.assetIdCollateral),
    /* fee_amount          */ params.feeStark.toString(),
    /* expiration          */ expirationTimestamp.toString(),
    /* salt                */ params.nonce.toString(),
    /* user_public_key_hex */ params.starkPublicKey,
    /* domain_name         */ params.starknetDomain.name,
    /* domain_version      */ params.starknetDomain.version,
    /* domain_chain_id     */ params.starknetDomain.chainId,
    /* domain_revision     */ params.starknetDomain.revision.toString(),
  ];

  const domainHash = jsGetStarknetDomainObjHash(params.starknetDomain);

  const orderSelector = hash.getSelectorFromName(
    '"Order"("position_id":"felt","base_asset_id":"AssetId","base_amount":"i64","quote_asset_id":"AssetId","quote_amount":"i64","fee_asset_id":"AssetId","fee_amount":"u64","expiration":"Timestamp","salt":"felt")"PositionId"("value":"u32")"AssetId"("value":"felt")"Timestamp"("seconds":"u64")'
  );

  const orderHash = hash.computePoseidonHashOnElements([
    orderSelector,
    getOrderHashArgs[0],  // position_id
    getOrderHashArgs[1],   // base_asset_id_hex
    getOrderHashArgs[2],   // base_amount
    getOrderHashArgs[3],   // quote_asset_id_hex
    getOrderHashArgs[4],   // quote_amount
    getOrderHashArgs[5],   // fee_asset_id_hex
    getOrderHashArgs[6],   // fee_amount
    getOrderHashArgs[7],   // expiration
    getOrderHashArgs[8],   // salt
  ]);

  return jsGetObjMsgHash(domainHash, params.starkPublicKey, orderHash);
}
