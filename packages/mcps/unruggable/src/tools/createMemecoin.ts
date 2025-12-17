import { CreateMemecoinParams } from '../schemas/index.js';
import { stark, uint256, validateAndParseAddress, Contract } from 'starknet';
import { decimalsScale } from '../lib/utils/helper.js';
import { FACTORY_ABI } from '../lib/abis/unruggableFactory.js';
import { FACTORY_ADDRESS, MEMECOIN_DECIMALS } from '../lib/constants/index.js';
import { extractMemecoinAddressFromReceipt } from '../lib/utils/events.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

export const createMemecoin = async (
  env: onchainWrite,
  params: CreateMemecoinParams
): Promise<toolResult> => {
  try {
    validateAndParseAddress(params.owner);

    const { account, provider } = env;
    const salt = stark.randomAddress();

    const contract = new Contract({
      abi: FACTORY_ABI,
      address: FACTORY_ADDRESS,
      providerOrAccount: account,
    });

    const initialSupplyUint256 = uint256.bnToUint256(
      BigInt(params.initialSupply) * BigInt(decimalsScale(MEMECOIN_DECIMALS))
    );

    const { transaction_hash } = await contract.invoke('create_memecoin', [
      params.owner,
      params.name,
      params.symbol,
      initialSupplyUint256,
      salt,
    ]);

    await provider.waitForTransaction(transaction_hash);

    const receipt = await provider.getTransactionReceipt(transaction_hash);
    const memecoinAddress = extractMemecoinAddressFromReceipt(receipt);

    if (!memecoinAddress) {
      throw new Error('Could not extract memecoin address from transaction');
    }

    return {
      status: 'success',
      data: {
        transactionHash: transaction_hash,
        memecoinAddress: memecoinAddress,
      },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
