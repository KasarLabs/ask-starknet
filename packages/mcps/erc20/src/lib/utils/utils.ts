import { validateAndParseAddress, Contract, Provider, cairo } from 'starknet';
import { ParamsValidationResult, ExecuteV3Args } from '../types/types.js';
import { DECIMALS } from '../types/types.js';
import { OLD_ERC20_ABI } from '../abis/old.js';
import { NEW_ERC20_ABI_MAINNET } from '../abis/new.js';
import { validToken } from '../types/types.js';

/**
 * Formats a balance string to the correct decimal places
 * @param rawBalance - Raw balance as a string, number or bigint
 * @param decimals - Number of decimal places
 * @returns Formatted balance as a string
 */
export const formatBalance = (
  rawBalance: bigint | string | number,
  decimals: number
): string => {
  try {
    const balanceStr =
      typeof rawBalance === 'bigint'
        ? rawBalance.toString()
        : String(rawBalance);

    if (!balanceStr || balanceStr === '0') {
      return '0';
    }

    if (balanceStr.length <= decimals) {
      const zeros = '0'.repeat(decimals - balanceStr.length);
      const formattedBalance = `0.${zeros}${balanceStr}`;
      return formattedBalance;
    }

    const decimalPosition = balanceStr.length - decimals;
    const wholePart = balanceStr.slice(0, decimalPosition) || '0';
    const fractionalPart = balanceStr.slice(decimalPosition);
    const formattedBalance = `${wholePart}.${fractionalPart}`;

    return formattedBalance;
  } catch (error) {
    return '0';
  }
};

/**
 * Formats amount to the correct decimal places for the token
 * @payload amount The amount as a string (e.g., "0.0001")
 * @payload decimals Number of decimal places
 * @returns Formatted amount as a string
 */
export const formatTokenAmount = (amount: string, decimals: number): string => {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0');
  return whole + paddedFraction;
};

/**
 * Validates and formats the address and amount parameters
 * @param address - Starknet address
 * @param amount - Amount to transfer
 * @param decimals - Number of decimal places
 * @returns Formatted address and amount
 * @throws Error if validation fails
 */
export const validateAndFormatParams = (
  address: string,
  amount: string,
  decimals: number
): ParamsValidationResult => {
  try {
    if (!address) {
      throw new Error('Address is required');
    }
    const formattedAddress = validateAndParseAddress(address);

    if (!amount) {
      throw new Error('Amount is required');
    }
    const formattedAmount = formatTokenAmount(amount, decimals);
    const formattedAmountUint256 = cairo.uint256(formattedAmount);

    return {
      address: formattedAddress,
      amount: formattedAmountUint256,
    };
  } catch (error) {
    throw new Error(`Parameter validation failed: ${error.message}`);
  }
};

/**
 * Executes a V3 transaction with preconfigured gas parameters
 * @param {ExecuteV3Args} args - Contains call and account
 * @returns {Promise<string>} Transaction hash
 * @throws {Error} If transaction fails
 */
export const executeV3Transaction = async ({
  call,
  account,
}: ExecuteV3Args): Promise<string> => {
  const { transaction_hash } = await account.execute(call);

  const receipt = await account.waitForTransaction(transaction_hash);
  if (!receipt.isSuccess()) {
    throw new Error('Transaction confirmed but failed');
  }

  return transaction_hash;
};

/**
 * Validates token by his symbol or address
 * @param {Provider} provider - The Starknet provider
 * @param {string} assetAddress - The ERC20 token contract address
 * @returns {Promise<validToken>} The valid token
 * @throws {Error} If token is not valid
 */
export async function validateToken(
  provider: Provider,
  assetAddress?: string
): Promise<validToken> {
  if (!assetAddress) {
    throw new Error('Asset address is required');
  }

  const address = validateAndParseAddress(assetAddress);
  let decimals: number = 0;

  try {
    const abi = await detectAbiType(address, provider);
    const contract = new Contract(abi, address, provider);
    try {
      const decimalsBigInt = await contract.decimals();
      decimals =
        typeof decimalsBigInt === 'bigint'
          ? Number(decimalsBigInt)
          : decimalsBigInt;
    } catch (error) {
      console.warn(`Error getting decimals: ${error.message}`);
      decimals = DECIMALS.DEFAULT;
    }
  } catch (error) {
    console.warn(`Error retrieving token info: ${error.message}`);
    decimals = DECIMALS.DEFAULT;
  }
  return {
    address,
    decimals,
  };
}

/**
 * Detects the ABI type of a token contract
 * @param {string} address - The ERC20 token contract address
 * @param {Provider} provider - The Starknet provider
 * @returns {Promise<string>} The ABI type
 */
export async function detectAbiType(address: string, provider: Provider) {
  try {
    const contract = new Contract(OLD_ERC20_ABI, address, provider);
    const symbol = await contract.symbol();
    if (symbol == 0n) {
      return NEW_ERC20_ABI_MAINNET;
    }
    return OLD_ERC20_ABI;
  } catch (error) {
    // If old ABI fails, assume new ABI
    console.warn(
      `Couldn't detect ABI type, defaulting to NEW_ERC20_ABI_MAINNET: ${error.message}`
    );
    return NEW_ERC20_ABI_MAINNET;
  }
}

/**
 * Converts a Uint256 value from its low and high parts (hex strings) into a single bigint.
 * Uint256 is represented as two 128-bit values: low (least significant) and high (most significant).
 *
 * @param lowHex - The low 128 bits as a hexadecimal string
 * @param highHex - The high 128 bits as a hexadecimal string
 * @returns The combined 256-bit value as a bigint
 */
export function uint256HexToBigInt(lowHex: string, highHex: string): bigint {
  const low = BigInt(lowHex);
  const high = BigInt(highHex);
  return (high << 128n) + low;
}
