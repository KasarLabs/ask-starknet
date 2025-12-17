import { ContractAddressParams } from '../schemas/index.js';
import { Contract } from 'starknet';
import { FACTORY_ABI } from '../lib/abis/unruggableFactory.js';
import { FACTORY_ADDRESS } from '../lib/constants/index.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

type LiquidityType =
  | { type: 'JediERC20'; address: string }
  | { type: 'StarkDeFiERC20'; address: string }
  | { type: 'EkuboNFT'; tokenId: number };

interface LockedLiquidityInfo {
  hasLockedLiquidity: boolean;
  liquidityType?: LiquidityType;
  liquidityContractAddress?: string;
}

/**
 * Retrieves locked liquidity information for a given token contract.
 *
 * @param env - The onchain environment
 * @param params - Object containing the token contract address
 * @returns Promise with locked liquidity information or error response
 */
export const getLockedLiquidity = async (
  env: onchainWrite,
  params: ContractAddressParams
): Promise<toolResult> => {
  try {
    const { provider } = env;
    const contract = new Contract({
      abi: FACTORY_ABI,
      address: FACTORY_ADDRESS,
      providerOrAccount: provider,
    });

    const result = await contract.locked_liquidity(params.contractAddress);
    const liquidityInfo: LockedLiquidityInfo = {
      hasLockedLiquidity: false,
    };

    if (result.length > 0) {
      const [contractAddress, liquidityData] = result;
      liquidityInfo.hasLockedLiquidity = true;
      liquidityInfo.liquidityContractAddress = contractAddress;

      if ('JediERC20' in liquidityData) {
        liquidityInfo.liquidityType = {
          type: 'JediERC20',
          address: liquidityData.JediERC20,
        };
      } else if ('StarkDeFiERC20' in liquidityData) {
        liquidityInfo.liquidityType = {
          type: 'StarkDeFiERC20',
          address: liquidityData.StarkDeFiERC20,
        };
      } else if ('EkuboNFT' in liquidityData) {
        liquidityInfo.liquidityType = {
          type: 'EkuboNFT',
          tokenId: Number(liquidityData.EkuboNFT),
        };
      }
    }

    return {
      status: 'success',
      data: liquidityInfo,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error.message,
    };
  }
};
