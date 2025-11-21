import { cairo } from 'starknet';
import { getContract } from '../../lib/utils/contracts.js';
import { TransferPositionSchema } from '../../schemas/index.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

export const transferPosition = async (
  env: onchainWrite,
  params: TransferPositionSchema
) => {
  try {
    const account = env.account;
    const NFTContract = await getContract(
      env.provider,
      'positionsNFT',
      account
    );

    const transferCalldata = NFTContract.populate('transfer_from', [
      account.address,
      params.to_address,
      cairo.uint256(params.position_id),
    ]);

    const { transaction_hash } = await account.execute([transferCalldata]);

    const receipt = await account.waitForTransaction(transaction_hash);
    if (!receipt.isSuccess()) {
      throw new Error('Transaction confirmed but failed');
    }

    return {
      status: 'success',
      data: {
        transaction_hash,
        position_id: params.position_id,
        from: account.address,
        to: params.to_address,
      },
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error while transferring position';
    return {
      status: 'failure',
      error: errorMessage,
    };
  }
};
