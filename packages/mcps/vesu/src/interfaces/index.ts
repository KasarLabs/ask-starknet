import { z } from 'zod';
import { Hex, hexSchemaBase } from '../lib/utils/num.js';
import { validateChecksumAddress } from 'starknet';

export type Address = `0x${string}`;

export const addressSchema = hexSchemaBase
  .refine((value: string) => {
    // Allow '0x0' as a special case
    if (value === '0x0') return true;
    // Otherwise check length
    if (value.length < 50 || value.length > 66) return false;
    // if it contains uppercase letters, it must match the checksum
    if (/[A-F]/.test(value)) {
      return validateChecksumAddress(value);
    }
    // if it only contains lowercase letters, it's valid
    return true;
  }, 'Address must be valid: either "0x0" or a valid checksum address (50-66 chars)')
  .transform<Address>((value: string) => {
    // Special case for 0x0
    if (value === '0x0') return '0x0';
    // remove 0x prefix
    const withoutPrefix = value.startsWith('0x') ? value.slice(2) : value;
    // pad left until length is 64
    const padded = withoutPrefix.padStart(64, '0');
    // add 0x prefix
    return `0x${padded}`;
  });

/**
 * Represents a token value with its decimal precision
 * @interface ITokenValue
 * @property {bigint} value - The token amount
 * @property {number} decimals - Number of decimal places
 */
export interface ITokenValue {
  value: bigint;
  decimals: number;
}

/**
 * Base token information
 * @interface IBaseToken
 * @property {string} name - Token name
 * @property {Hex} address - Token contract address
 * @property {string} symbol - Token symbol
 * @property {number} decimals - Token decimal places
 * @property {ITokenValue} [usdPrice] - Optional USD price information
 */
export interface IBaseToken {
  name: string;
  address: Hex;
  symbol: string;
  decimals: number;
  usdPrice?: ITokenValue;
}

/**
 * Represents a pair of pool assets
 * @interface IPoolAssetPair
 * @property {Hex} collateralAssetAddress - Address of collateral asset
 * @property {Hex} debtAssetAddress - Address of debt asset
 * @property {ITokenValue} maxLTV - Maximum loan-to-value ratio
 */
export interface IPoolAssetPair {
  collateralAssetAddress: Hex;
  debtAssetAddress: Hex;
  maxLTV: ITokenValue;
}

/**
 * Extended token information with pool-specific data
 * @interface IPoolAsset
 * @extends IBaseToken
 * @property {IBaseToken} vToken - Associated vToken information
 * @property {number} listedBlockNumber - Block number when asset was listed
 * @property {Object} config - Asset configuration
 * @property {ITokenValue} interestRate - Current interest rate
 * @property {Object} stats - Asset statistics
 */
export interface IPoolAsset extends IBaseToken {
  vToken: IBaseToken;
  listedBlockNumber: number;
  config: {
    debtFloor: ITokenValue;
    isLegacy: boolean;
    feeRate: ITokenValue;
    lastFullUtilizationRate: ITokenValue;
    lastRateAccumulator: ITokenValue;
    lastUpdated: Date;
    maxUtilization: ITokenValue;
    reserve: ITokenValue;
    totalCollateralShares: ITokenValue;
    totalNominalDebt: ITokenValue;
  };
  interestRate: ITokenValue;
  stats: {
    totalSupplied: ITokenValue;
    totalDebt: ITokenValue;
    currentUtilization: ITokenValue;
    supplyApy: ITokenValue;
    defiSpringSupplyApr: ITokenValue | null;
    lstApr: ITokenValue | null;
    borrowApr: ITokenValue;
  };
}

/**
 * Pool information and configuration
 * @interface IPool
 * @property {string} id - Pool identifier
 * @property {string} name - Pool name
 * @property {Hex} owner - Pool owner address
 * @property {Hex | null} extensionContractAddress - Address of pool extension contract (null if not available)
 * @property {boolean} isVerified - Pool verification status
 * @property {'v1' | 'v2'} protocolVersion - Protocol version (v1 or v2)
 * @property {IPoolAsset[]} assets - Pool assets
 * @property {Object} [stats] - Optional pool statistics
 * @property {IPoolAssetPair[]} [pairs] - Optional asset pairs configuration
 */
export interface IPool {
  id: string;
  name: string;
  owner: Hex;
  // shutdownStatus: PoolShutdownStatus
  extensionContractAddress: Hex | null;
  isVerified: boolean;
  protocolVersion: 'v1' | 'v2';
  assets: IPoolAsset[];
  stats?: {
    usdTotalSupplied: ITokenValue;
    usdTotalBorrowed: ITokenValue;
  };
  pairs?: IPoolAssetPair[];
}

/**
 * Pool data validation schema
 * @constant {z.ZodType}
 */
export const poolParser = z.object({
  id: z.string(),
  name: z.string(),
  owner: addressSchema,
  extensionContractAddress: addressSchema.nullable(),
  isVerified: z.boolean(),
  protocolVersion: z.enum(['v1', 'v2']),
  assets: z.any(),
  pairs: z.any(),
  // assets: z.array(poolAssetParser),
  // pairs: z.array(poolPairParser),
});

/**
 * Parameters for deposit operations
 * @interface DepositParams
 * @property {string} depositTokenSymbol - Symbol of token to deposit
 * @property {string} depositAmount - Amount to deposit
 * @property {string} [poolId] - Optional pool ID. If not provided, GENESIS_POOLID will be used
 */
export interface DepositParams {
  depositTokenSymbol: string;
  depositAmount: string;
  poolId?: string;
}

/**
 * Parameters for withdrawal operations
 * @interface WithdrawParams
 * @property {string} withdrawTokenSymbol - Symbol of token to withdraw
 * @property {string} [withdrawAmount] - Optional amount to withdraw in human decimal format. If "0" or not provided, withdraws all available tokens
 * @property {string} [poolId] - Optional pool ID. If not provided, GENESIS_POOLID will be used
 */
export interface WithdrawParams {
  withdrawTokenSymbol: string;
  withdrawAmount?: string;
  poolId?: string;
}

/**
 * Parameters for multiply deposit operations
 * @interface DepositMultiplyParams
 * @property {string} collateralTokenSymbol - Symbol of collateral token to deposit
 * @property {string} debtTokenSymbol - Symbol of debt token to borrow
 * @property {string} depositAmount - Amount of collateral to deposit in human decimal format
 * @property {string} targetLTV - Target LTV (Loan-to-Value) ratio as a percentage (mandatory)
 * @property {string} [poolId] - Optional pool ID. If not provided, GENESIS_POOLID will be used
 * @property {number} [ekuboFee] - Optional Ekubo pool fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)
 * @property {number} [ekuboTickSpacing] - Optional Ekubo pool tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)
 * @property {string} [ekuboExtension] - Optional Ekubo pool extension contract address (default: "0x0")
 * @property {number} [ekuboSlippage] - Optional slippage tolerance in basis points (e.g., 50 for 0.5%, 100 for 1%, defaults to 50 for 0.5%)
 */
export interface DepositMultiplyParams {
  collateralTokenSymbol: string;
  debtTokenSymbol: string;
  depositAmount: string;
  targetLTV: string;
  poolId?: string;
  ekuboFee?: number;
  ekuboTickSpacing?: number;
  ekuboExtension?: string;
  ekuboSlippage?: number;
}

/**
 * Parameters for multiply withdraw operations
 * @interface WithdrawMultiplyParams
 * @property {string} collateralTokenSymbol - Symbol of collateral token to withdraw
 * @property {string} debtTokenSymbol - Symbol of debt token to repay
 * @property {string} [withdrawAmount] - Optional amount of collateral to withdraw in human decimal format. If "0" or not provided, closes the entire position
 * @property {string} [poolId] - Optional pool ID. If not provided, GENESIS_POOLID will be used
 * @property {number} [ekuboFee] - Optional Ekubo pool fee tier as a percentage (e.g., 0.05 for 0.05%, 0.3 for 0.3%, 1 for 1%, defaults to 0.05)
 * @property {number} [ekuboTickSpacing] - Optional Ekubo pool tick spacing as a percentage (e.g., 0.01 for 0.01%, 0.1 for 0.1%, 1 for 1%, defaults to 0.1)
 * @property {string} [ekuboExtension] - Optional Ekubo pool extension contract address (default: "0x0")
 * @property {number} [ekuboSlippage] - Optional slippage tolerance in basis points (e.g., 50 for 0.5%, 100 for 1%, defaults to 50 for 0.5%)
 */
export interface WithdrawMultiplyParams {
  collateralTokenSymbol: string;
  debtTokenSymbol: string;
  withdrawAmount?: string;
  poolId?: string;
  ekuboFee?: number;
  ekuboTickSpacing?: number;
  ekuboExtension?: string;
  ekuboSlippage?: number;
}

/**
 * Represents a decimal number with precision
 * @interface BigDecimal
 * @property {bigint} value - The numeric value
 * @property {number} decimals - Number of decimal places
 */
export interface BigDecimal {
  value: bigint;
  decimals: number;
}

/**
 * Result of a deposit operation
 * @interface DepositResult
 * @property {'success' | 'failure'} status - Operation status
 * @property {string} [amount] - Amount deposited
 * @property {string} [symbol] - Token symbol
 * @property {string} [recipient_address] - Recipient address
 * @property {string} [transaction_hash] - Transaction hash
 * @property {string} [error] - Error message if failed
 * @property {string} [step] - Current step in process
 */
export interface DepositResult {
  status: 'success' | 'failure';
  amount?: string;
  symbol?: string;
  recipient_address?: string;
  transaction_hash?: string;
  error?: string;
  step?: string;
}

/**
 * Result of a withdrawal operation
 * @interface WithdrawResult
 * @property {'success' | 'failure'} status - Operation status
 * @property {string} [symbol] - Token symbol
 * @property {string} [recipient_address] - Recipient address
 * @property {string} [transaction_hash] - Transaction hash
 * @property {string} [error] - Error message if failed
 * @property {string} [step] - Current step in process
 */
export interface WithdrawResult {
  status: 'success' | 'failure';
  symbol?: string;
  recipient_address?: string;
  transaction_hash?: string;
  error?: string;
  step?: string;
}

/**
 * Result of a multiply deposit operation
 * @interface DepositMultiplyResult
 * @property {'success' | 'failure'} status - Operation status
 * @property {string} [amount] - Amount deposited
 * @property {string} [collateralSymbol] - Collateral token symbol
 * @property {string} [debtSymbol] - Debt token symbol
 * @property {string} [recipient_address] - Recipient address
 * @property {string} [transaction_hash] - Transaction hash
 * @property {string} [error] - Error message if failed
 */
export interface DepositMultiplyResult {
  status: 'success' | 'failure';
  amount?: string;
  collateralSymbol?: string;
  debtSymbol?: string;
  recipient_address?: string;
  transaction_hash?: string;
  error?: string;
}

/**
 * Result of a multiply withdraw operation
 * @interface WithdrawMultiplyResult
 * @property {'success' | 'failure'} status - Operation status
 * @property {string} [collateralSymbol] - Collateral token symbol
 * @property {string} [debtSymbol] - Debt token symbol
 * @property {string} [recipient_address] - Recipient address
 * @property {string} [transaction_hash] - Transaction hash
 * @property {string} [error] - Error message if failed
 */
export interface WithdrawMultiplyResult {
  status: 'success' | 'failure';
  collateralSymbol?: string;
  debtSymbol?: string;
  recipient_address?: string;
  transaction_hash?: string;
  error?: string;
}

/**
 * Parameters for multiply update operations (update LTV without depositing/withdrawing)
 * @interface UpdateMultiplyParams
 * @property {string} collateralTokenSymbol - Symbol of collateral token in the position
 * @property {string} debtTokenSymbol - Symbol of debt token in the position
 * @property {string} targetLTV - Target LTV (Loan-to-Value) ratio as a percentage (mandatory)
 * @property {string} [poolId] - Optional pool ID. If not provided, GENESIS_POOLID will be used
 * @property {number} [ekuboFee] - Optional Ekubo pool fee tier as a percentage
 * @property {number} [ekuboTickSpacing] - Optional Ekubo pool tick spacing as a percentage
 * @property {string} [ekuboExtension] - Optional Ekubo pool extension contract address
 * @property {number} [ekuboSlippage] - Optional slippage tolerance in basis points
 */
export interface UpdateMultiplyParams {
  collateralTokenSymbol: string;
  debtTokenSymbol: string;
  targetLTV: string;
  poolId?: string;
  ekuboFee?: number;
  ekuboTickSpacing?: number;
  ekuboExtension?: string;
  ekuboSlippage?: number;
}

/**
 * Result of a multiply update operation
 * @interface UpdateMultiplyResult
 * @property {'success' | 'failure'} status - Operation status
 * @property {string} [collateralSymbol] - Collateral token symbol
 * @property {string} [debtSymbol] - Debt token symbol
 * @property {string} [targetLTV] - Target LTV that was set
 * @property {string} [recipient_address] - Recipient address
 * @property {string} [transaction_hash] - Transaction hash
 * @property {string} [error] - Error message if failed
 */
export interface UpdateMultiplyResult {
  status: 'success' | 'failure';
  collateralSymbol?: string;
  debtSymbol?: string;
  targetLTV?: string;
  recipient_address?: string;
  transaction_hash?: string;
  error?: string;
}

/**
 * Parameters for borrow deposit operations
 * @interface DepositBorrowParams
 * @property {string} collateralTokenSymbol - Symbol of collateral token to deposit
 * @property {string} debtTokenSymbol - Symbol of debt token to borrow
 * @property {string} depositAmount - Amount of collateral to deposit in human decimal format
 * @property {string} targetLTV - Target LTV (Loan-to-Value) ratio as a percentage (mandatory)
 * @property {string} [poolId] - Optional pool ID. If not provided, GENESIS_POOLID will be used
 */
export interface DepositBorrowParams {
  collateralTokenSymbol: string;
  debtTokenSymbol: string;
  depositAmount: string;
  targetLTV: string;
  poolId?: string;
}

/**
 * Result of a borrow deposit operation
 * @interface DepositBorrowResult
 * @property {'success' | 'failure'} status - Operation status
 * @property {string} [amount] - Amount deposited
 * @property {string} [collateralSymbol] - Collateral token symbol
 * @property {string} [debtSymbol] - Debt token symbol
 * @property {string} [recipient_address] - Recipient address
 * @property {string} [transaction_hash] - Transaction hash
 * @property {string} [error] - Error message if failed
 */
export interface DepositBorrowResult {
  status: 'success' | 'failure';
  amount?: string;
  collateralSymbol?: string;
  debtSymbol?: string;
  recipient_address?: string;
  transaction_hash?: string;
  error?: string;
}

/**
 * Parameters for borrow repay operations (repay debt without withdrawing collateral)
 * @interface RepayBorrowParams
 * @property {string} collateralTokenSymbol - Symbol of collateral token
 * @property {string} debtTokenSymbol - Symbol of debt token to repay
 * @property {string} [repayAmount] - Optional amount of debt to repay in human decimal format. If not provided, repays all debt
 * @property {string} [poolId] - Optional pool ID. If not provided, GENESIS_POOLID will be used
 */
export interface RepayBorrowParams {
  collateralTokenSymbol: string;
  debtTokenSymbol: string;
  repayAmount?: string;
  poolId?: string;
}

/**
 * Result of a borrow repay operation
 * @interface RepayBorrowResult
 * @property {'success' | 'failure'} status - Operation status
 * @property {string} [repayAmount] - Amount repaid
 * @property {string} [collateralSymbol] - Collateral token symbol
 * @property {string} [debtSymbol] - Debt token symbol
 * @property {string} [recipient_address] - Recipient address
 * @property {string} [transaction_hash] - Transaction hash
 * @property {string} [error] - Error message if failed
 */
export interface RepayBorrowResult {
  status: 'success' | 'failure';
  repayAmount?: string;
  collateralSymbol?: string;
  debtSymbol?: string;
  recipient_address?: string;
  transaction_hash?: string;
  error?: string;
}

/**
 * Token value information for positions
 * @interface IPositionTokenValue
 * @property {Address} address - Token address
 * @property {string} name - Token name
 * @property {string} symbol - Token symbol
 * @property {number} decimals - Token decimals
 * @property {string} value - Token amount as string
 */
export interface IPositionTokenValue {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  value: string;
}

/**
 * Token value with USD price information for positions
 * @interface IPositionTokenValueWithUsdPrice
 * @extends IPositionTokenValue
 * @property {Object} usdPrice - USD price information
 * @property {string} usdPrice.value - Token value in USD
 * @property {number} usdPrice.decimals - Token value in USD decimals
 */
export interface IPositionTokenValueWithUsdPrice extends IPositionTokenValue {
  usdPrice: {
    value: string;
    decimals: number;
  };
}

/**
 * BigInt value information
 * @interface IBigIntValue
 * @property {string} value - Value as string
 * @property {number} decimals - Decimal places
 */
export interface IBigIntValue {
  value: string;
  decimals: number;
}

/**
 * Pool information within a position
 * @interface IPositionPool
 * @property {string} id - Pool identifier
 * @property {string} name - Pool name
 * @property {Hex | null} extensionContractAddress - Pool extension contract address (nullable)
 */
export interface IPositionPool {
  id: string;
  name: string;
  extensionContractAddress: Hex | null;
}

/**
 * Rebalancing configuration
 * @interface IRebalancing
 * @property {boolean} isEnabled - Whether rebalancing is enabled
 * @property {IBigIntValue} [targetLTV] - Target loan-to-value ratio (optional)
 * @property {IBigIntValue} [tolerance] - Tolerance for rebalancing (optional)
 * @property {IBigIntValue} [minDelta] - Minimum delta for rebalancing (optional)
 */
export interface IRebalancing {
  isEnabled: boolean;
  targetLTV?: IBigIntValue;
  tolerance?: IBigIntValue;
  minDelta?: IBigIntValue;
}

/**
 * LTV (Loan-to-Value) information
 * @interface ILTV
 * @property {IBigIntValue} max - Maximum LTV
 * @property {IBigIntValue} current - Current LTV
 */
export interface ILTV {
  max: IBigIntValue;
  current: IBigIntValue;
}

/**
 * Earn position (type: "earn")
 * @interface IEarnPosition
 * @property {string} protocolVersion - Protocol version (v1 or v2)
 * @property {'earn'} type - Position type
 * @property {IPositionPool} pool - Pool information
 * @property {boolean} isDeprecated - Whether the position needs to be migrated
 * @property {Address} walletAddress - Wallet address
 * @property {IPositionTokenValueWithUsdPrice} collateral - Collateral token information
 * @property {IPositionTokenValue} collateralShares - Collateral shares token information
 */
export interface IEarnPosition {
  protocolVersion: 'v1' | 'v2';
  type: 'earn';
  pool: IPositionPool;
  isDeprecated: boolean;
  walletAddress: Address;
  collateral: IPositionTokenValueWithUsdPrice;
  collateralShares: IPositionTokenValue;
}

/**
 * Borrow or Multiply position (type: "borrow" or "multiply")
 * @interface IBorrowOrMultiplyPosition
 * @property {'borrow' | 'multiply'} type - Position type
 * @property {IPositionPool} pool - Pool information
 * @property {Address} walletAddress - Wallet address
 * @property {IPositionTokenValue} collateralShares - Collateral shares token information
 * @property {IPositionTokenValueWithUsdPrice} collateral - Collateral token information
 * @property {IPositionTokenValue} nominalDebt - Nominal debt token information
 * @property {IPositionTokenValueWithUsdPrice} debt - Debt token information with USD price
 * @property {ILTV} ltv - Loan-to-value information
 * @property {string | null} healthFactor - Health Factor (null if debt is zero)
 * @property {IRebalancing} rebalancing - Rebalancing configuration
 */
export interface IBorrowOrMultiplyPosition {
  type: 'borrow' | 'multiply';
  pool: IPositionPool;
  walletAddress: Address;
  collateralShares: IPositionTokenValue;
  collateral: IPositionTokenValueWithUsdPrice;
  nominalDebt: IPositionTokenValue;
  debt: IPositionTokenValueWithUsdPrice;
  ltv: ILTV;
  healthFactor: string | null;
  rebalancing: IRebalancing;
}

/**
 * Position information (union type)
 * @type IPosition
 */
export type IPosition = IEarnPosition | IBorrowOrMultiplyPosition;

/**
 * Position data validation schemas
 */
const tokenValueSchema = z.object({
  address: addressSchema,
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  value: z.string(),
});

const tokenValueWithUsdPriceSchema = tokenValueSchema.extend({
  usdPrice: z.object({
    value: z.string(),
    decimals: z.number(),
  }),
});

const bigIntValueSchema = z.object({
  value: z.string(),
  decimals: z.number(),
});

const positionPoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  extensionContractAddress: addressSchema.nullable(),
});

const earnPositionSchema = z.object({
  protocolVersion: z.enum(['v1', 'v2']),
  type: z.literal('earn'),
  pool: positionPoolSchema,
  isDeprecated: z.boolean(),
  walletAddress: addressSchema,
  collateral: tokenValueWithUsdPriceSchema,
  collateralShares: tokenValueSchema,
});

const borrowOrMultiplyPositionSchema = z.object({
  type: z.enum(['borrow', 'multiply']),
  pool: positionPoolSchema,
  walletAddress: addressSchema,
  collateralShares: tokenValueSchema,
  collateral: tokenValueWithUsdPriceSchema,
  nominalDebt: tokenValueSchema,
  debt: tokenValueWithUsdPriceSchema,
  ltv: z.object({
    max: bigIntValueSchema,
    current: bigIntValueSchema,
  }),
  healthFactor: z.string().nullable(),
  rebalancing: z.object({
    isEnabled: z.boolean(),
    targetLTV: bigIntValueSchema.optional(),
    tolerance: bigIntValueSchema.optional(),
    minDelta: bigIntValueSchema.optional(),
  }),
});

/**
 * Position data validation schema (discriminated union)
 * @constant {z.ZodType}
 */
export const positionParser = z.discriminatedUnion('type', [
  earnPositionSchema,
  borrowOrMultiplyPositionSchema,
]);
