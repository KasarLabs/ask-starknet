import {
  RpcProvider,
  validateAndParseAddress,
  Account,
  Call,
  Contract,
  cairo,
} from 'starknet';
import { ERC20_ABI } from '../constants/abis/index.js';
import { onchainWrite } from '../interfaces/index.js';

/**
 * Checks if data is a Record object (not an array)
 * @param data - The data to check
 * @returns True if data is a Record object, false otherwise
 */
export function isRecord(
  data: Record<string, any> | Array<any>
): data is Record<string, any> {
  return !Array.isArray(data) && typeof data === 'object' && data !== null;
}

/**
 * Gets data as a Record object, throwing if it's not
 * @param data - The data to convert to Record
 * @returns The data as a Record object
 * @throws Error if data is not a Record object
 */
export function getDataAsRecord(
  data: Record<string, any> | Array<any> | undefined
): Record<string, any> {
  if (!data || !isRecord(data)) {
    throw new Error('Expected data to be a Record object');
  }
  return data;
}

/**
 * Reads ERC20 token balance for an account
 * Tries both 'balance_of' and 'balanceOf' entrypoints for compatibility
 * @param provider - The Starknet RPC provider
 * @param tokenAddress - The ERC20 token contract address
 * @param accountAddress - The account address to check balance for
 * @returns The token balance as a bigint
 * @throws Error if balance cannot be read
 */
export async function getERC20Balance(
  provider: RpcProvider,
  tokenAddress: string,
  accountAddress: string
): Promise<bigint> {
  const contractAddress = validateAndParseAddress(tokenAddress);
  const account = validateAndParseAddress(accountAddress);

  const entrypoints: Array<'balance_of' | 'balanceOf'> = [
    'balance_of',
    'balanceOf',
  ];

  let lastErr: unknown = null;

  for (const entrypoint of entrypoints) {
    try {
      const res = await provider.callContract({
        contractAddress,
        entrypoint,
        calldata: [account],
      });

      const out: string[] = Array.isArray((res as any)?.result)
        ? (res as any).result
        : Array.isArray(res)
          ? (res as any)
          : [];

      // Uint256 is returned as [low, high] pair
      if (out.length >= 2) {
        const low = BigInt(out[0]);
        const high = BigInt(out[1]);
        return (high << 128n) + low;
      }

      // Uint128 or smaller is returned as a single value
      if (out.length === 1) {
        return BigInt(out[0]);
      }
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(
    `Failed to read balance on ${contractAddress} for ${account}` +
      (lastErr instanceof Error ? ` (last error: ${lastErr.message})` : '')
  );
}

/**
 * Parses a formatted balance string (e.g., "100.5") into a bigint
 * @param formatted - The formatted balance string (e.g., "100.5")
 * @param decimals - The number of decimals for the token
 * @returns The balance as a bigint
 */
export function parseFormattedBalance(
  formatted: string,
  decimals: number
): bigint {
  const [whole, fraction = ''] = formatted.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

/**
 * Executes a V3 transaction and waits for confirmation
 * @param call - The call to execute
 * @param account - The account to execute the transaction with
 * @returns The transaction hash
 * @throws Error if transaction fails
 */
export async function executeV3Transaction({
  call,
  account,
}: {
  call: Call;
  account: Account;
}): Promise<string> {
  const { transaction_hash } = await account.execute(call);

  const receipt = await account.waitForTransaction(transaction_hash);
  if (!receipt.isSuccess()) {
    throw new Error('Transaction confirmed but failed');
  }

  return transaction_hash;
}

/**
 * Transfers ERC20 tokens from an account to a recipient
 * @param account - The account to transfer from
 * @param tokenAddress - The ERC20 token contract address
 * @param recipientAddress - The recipient address
 * @param amount - The amount to transfer as a string (e.g., "100.5")
 * @param decimals - The number of decimals for the token (default: 18)
 * @returns The transaction hash
 */
export async function transferERC20(
  account: Account,
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  decimals: number = 18
): Promise<string> {
  const contract = new Contract({
    abi: ERC20_ABI,
    address: tokenAddress,
    providerOrAccount: account,
  });

  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const amountStr = whole + paddedFraction;
  const amountBigInt = BigInt(amountStr);
  const amountUint256 = cairo.uint256(amountBigInt);

  const calldata = contract.populate('transfer', {
    recipient: validateAndParseAddress(recipientAddress),
    amount: amountUint256,
  });

  const txHash = await executeV3Transaction({
    call: calldata,
    account: account,
  });

  return txHash;
}

/**
 * Creates an onchainWrite instance from an address and private key
 * @param address - The account address
 * @param privateKey - The account private key
 * @returns An onchainWrite instance with provider and account
 * @throws Error if STARKNET_RPC_URL environment variable is missing
 */
export function createOnchainWriteWithAccount(
  address: string,
  privateKey: string
): onchainWrite {
  const rpcUrl = process.env.STARKNET_RPC_URL;
  if (!rpcUrl) {
    throw new Error('Missing required environment variable: STARKNET_RPC_URL');
  }

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const account = new Account({
    provider: provider,
    address: address,
    signer: privateKey,
  });

  return {
    provider,
    account,
  };
}
