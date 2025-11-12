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
    const decoded = shortString.decodeShortString(word);
    // If decoded string is empty, treat it as unknown
    if (!decoded || decoded.trim() === '') {
      return 'UNKNOWN';
    }
    return decoded;
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Decodes a ByteArray structure to a string
 * ByteArray has the structure: { data: Array<bytes31>, pending_word: felt252, pending_word_len: u32 }
 */
function decodeByteArray(byteArray: any): string {
  try {
    // If it's already a string, return it
    if (typeof byteArray === 'string') {
      return byteArray.trim() === '' ? 'UNKNOWN' : byteArray;
    }

    // If it's an object with ByteArray structure
    if (byteArray && typeof byteArray === 'object') {
      let result = '';

      // Decode data array (Array<bytes31>)
      if (Array.isArray(byteArray.data)) {
        for (const bytes31 of byteArray.data) {
          try {
            result += shortString.decodeShortString(bytes31);
          } catch {
            // Skip invalid bytes31
          }
        }
      }

      // Decode pending_word if pending_word_len > 0
      if (byteArray.pending_word && byteArray.pending_word_len > 0) {
        try {
          const pendingWord = shortString.decodeShortString(
            byteArray.pending_word
          );
          // Only take the first pending_word_len characters
          result += pendingWord.substring(
            0,
            Number(byteArray.pending_word_len)
          );
        } catch {
          // Skip invalid pending_word
        }
      }

      return result.trim() === '' ? 'UNKNOWN' : result;
    }

    return 'UNKNOWN';
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
    const isNewABI = abi !== OLD_ERC20_ABI;

    if (out.length === 1) {
      // felt / felt252 (short string) - old ABI
      symbol = decodeMaybeShortString(out[0]);
    } else if (out.length > 1) {
      // Cairo string: [len, ...felts] or ByteArray structure
      if (isNewABI) {
        // For new ABI, try to decode as ByteArray structure
        // ByteArray is returned as: [data_len, ...data_words, pending_word, pending_word_len]
        try {
          symbol = decodeByteArray({
            data: out.slice(1, out.length - 2), // All words except first (len) and last two (pending_word, pending_word_len)
            pending_word: out[out.length - 2],
            pending_word_len: parseInt(out[out.length - 1], 16) || 0,
          });
        } catch {
          // Fallback to Cairo string decoding
          symbol = decodeCairoString(out);
        }
      } else {
        symbol = decodeCairoString(out);
      }
    } else {
      // If out is empty, try using contract.symbol() directly
      try {
        const r = await contract.symbol();
        if (typeof r === 'string') {
          symbol = r.trim() === '' ? 'UNKNOWN' : r;
        } else if (typeof r === 'bigint') {
          symbol = decodeMaybeShortString('0x' + r.toString(16));
        } else if (typeof r === 'object' && r != null) {
          // Check if it's a ByteArray structure
          if (isNewABI && ('data' in r || 'pending_word' in r)) {
            symbol = decodeByteArray(r);
          } else {
            const maybe = (r.symbol ?? r.res ?? r.value) as string | undefined;
            if (typeof maybe === 'string') {
              symbol =
                maybe.trim() === '' ? 'UNKNOWN' : decodeMaybeShortString(maybe);
            } else if (maybe && typeof maybe === 'object') {
              // Nested ByteArray
              symbol = decodeByteArray(maybe);
            }
          }
        }
      } catch {
        // no-op
      }
    }

    // Ensure symbol is not empty before converting to uppercase
    if (symbol !== 'UNKNOWN' && symbol.trim() !== '') {
      symbol = symbol.toUpperCase();
    } else {
      symbol = 'UNKNOWN';
    }

    return { status: 'success', symbol };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
