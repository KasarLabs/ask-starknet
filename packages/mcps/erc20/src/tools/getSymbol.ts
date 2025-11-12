import { Contract, RpcProvider } from 'starknet';
import { onchainRead } from '@kasarlabs/ask-starknet-core';
import { detectAbiType } from '../lib/utils/utils.js';
import { validateAndParseAddress } from 'starknet';
import { OLD_ERC20_ABI } from '../lib/abis/old.js';
import { shortString } from 'starknet';
import { z } from 'zod';
import { getSymbolSchema } from '../schemas/index.js';

function decodeCairoString(words: string[]): string {
  // words = [len, ...felts]
  if (!words?.length) return 'UNKNOWN';
  const len = parseInt(words[0], 16);
  // Validate len is a valid number and within reasonable bounds
  if (isNaN(len) || len < 0 || len > 1000) return 'UNKNOWN';
  const data = words.slice(1, 1 + len);
  if (data.length !== len) return 'UNKNOWN';
  try {
    return data.map((w) => shortString.decodeShortString(w)).join('');
  } catch {
    return 'UNKNOWN';
  }
}

function decodeMaybeShortString(word: string): string {
  try {
    return shortString.decodeShortString(word);
  } catch {
    return 'UNKNOWN';
  }
}

async function callSymbolRaw(
  provider: RpcProvider,
  address: string,
  entrypoint: 'symbol' | 'get_symbol'
): Promise<string[]> {
  const res = await provider.callContract({
    contractAddress: address,
    entrypoint,
    calldata: [],
  });
  // starknet.js v8 can return string[] or { result: string[] } depending on the interface
  // (Provider vs ProviderInterface). We normalize:
  // @ts-ignore - compat
  return Array.isArray(res) ? res : (res?.result ?? []);
}

/**
 * Gets the symbol of a token from its contract address
 * @param {onchainRead} env - The onchain read environment
 * @param {GetSymbolParams} params - Symbol parameters
 * @returns {Promise<Object>} JSON object with symbol
 * @throws {Error} If operation fails
 */
export const getSymbol = async (
  env: onchainRead,
  params: z.infer<typeof getSymbolSchema>
) => {
  try {
    if (!params?.assetAddress) {
      throw new Error('Asset address is required');
    }

    const provider = env.provider;
    const address = validateAndParseAddress(params.assetAddress);

    const abi = await detectAbiType(address, provider);
    const contract = new Contract(abi, address, provider);

    let out: string[] = [];
    try {
      out = await callSymbolRaw(provider, address, 'symbol');
    } catch {
      out = await callSymbolRaw(provider, address, 'get_symbol');
    }

    let symbol = 'UNKNOWN';
    if (out.length === 1) {
      // felt / felt252 (short string)
      symbol = decodeMaybeShortString(out[0]);
    } else if (out.length > 1) {
      // Cairo string: [len, ...felts]
      symbol = decodeCairoString(out);
    } else {
      try {
        const r = await contract.symbol();
        if (typeof r === 'string') {
          symbol = r;
        } else if (typeof r === 'bigint') {
          symbol = decodeMaybeShortString('0x' + r.toString(16));
        } else if (typeof r === 'object' && r != null) {
          const maybe = (r.symbol ?? r.res ?? r.value) as string | undefined;
          if (typeof maybe === 'string') symbol = decodeMaybeShortString(maybe);
        }
      } catch {
        // no-op
      }
    }

    if (symbol !== 'UNKNOWN') symbol = symbol.toUpperCase();

    return { status: 'success', symbol };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
