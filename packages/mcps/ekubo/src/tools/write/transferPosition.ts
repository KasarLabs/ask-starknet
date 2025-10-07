import { cairo } from 'starknet';
import { getContract } from '../../lib/utils/contracts.js';
import { TransferPositionSchema } from '../../schemas/index.js';

export const transferPosition = async (
  env: any,
  params: TransferPositionSchema
) => {
  try {
    const account = env.account;
    const NFTContract = await getContract(env.provider, 'positionsNFT');

    NFTContract.connect(account);
    const transferCalldata = NFTContract.populate('transfer_from', [
      env.accountAddress,
      params.to_address,
      cairo.uint256(params.position_id),
    ]);

    const { transaction_hash } = await account.execute([transferCalldata]);

    const receipt = await account.waitForTransaction(transaction_hash);
    if (!receipt.isSuccess()) {
      throw new Error('Transaction confirmed but failed');
    }

    return JSON.stringify({
      status: 'success',
      data: {
        transaction_hash,
        position_id: params.position_id,
        from: env.accountAddress,
        to: params.to_address,
      },
    });
  } catch (error: any) {
    return JSON.stringify({
      status: 'failure',
      error: error.message || 'Unknown error while transferring position',
    });
  }
};
