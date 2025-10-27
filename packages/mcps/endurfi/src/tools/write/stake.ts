import {
  getLiquidTokenContract,
  getUnderlyingTokenContract,
  getTokenDecimals,
  getLiquidTokenName,
  getUnderlyingTokenName,
} from '../../lib/utils/contracts.js';
import { StakeSchema } from '../../schemas/index.js';
import { onchainWrite } from '@ask-starknet/core';
import { formatUnits } from '../../lib/utils/formatting.js';

export const stake = async (env: onchainWrite, params: StakeSchema) => {
  try {
    const account = env.account;
    const liquidTokenContract = getLiquidTokenContract(
      env.provider,
      params.token_type
    );
    const underlyingTokenContract = getUnderlyingTokenContract(
      env.provider,
      params.token_type
    );
    const decimals = getTokenDecimals(params.token_type);
    const liquidTokenName = getLiquidTokenName(params.token_type);
    const underlyingTokenName = getUnderlyingTokenName(params.token_type);

    const amount = BigInt(params.amount);

    const expectedShares = await liquidTokenContract.preview_deposit(amount);

    // Step 1: Approve liquid token contract to spend underlying token
    underlyingTokenContract.connect(account);
    const approveCalldata = underlyingTokenContract.populate('approve', [
      liquidTokenContract.address,
      amount,
    ]);

    // Step 2: Deposit underlying token to receive liquid token
    liquidTokenContract.connect(account);
    const depositCalldata = liquidTokenContract.populate('deposit', [
      amount,
      account.address,
    ]);

    const { transaction_hash } = await account.execute([
      approveCalldata,
      depositCalldata,
    ]);

    const receipt = await account.waitForTransaction(transaction_hash);
    if (!receipt.isSuccess()) {
      throw new Error('Transaction confirmed but failed');
    }

    return {
      status: 'success',
      data: {
        token_type: params.token_type,
        transaction_hash: transaction_hash,
        underlying_token: underlyingTokenName,
        staked_amount: params.amount,
        staked_amount_formatted: formatUnits(amount, decimals),
        liquid_token: liquidTokenName,
        received_amount: expectedShares.toString(),
        received_amount_formatted: formatUnits(expectedShares, decimals),
      },
    };
  } catch (error: any) {
    return {
      status: 'failure',
      error:
        error.message || `Unknown error during ${params.token_type} staking`,
    };
  }
};
