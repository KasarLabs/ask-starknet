import { Account, Call } from 'starknet';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { ApprovalService } from './approval.js';

import { DEFAULT_SLIPPAGE_PERCENTAGE } from '../lib/constants/index.js';
import { TokenService } from './fetchTokens.js';
import type { Router as FibrousRouter } from 'fibrous-router-sdk';
import { SwapResult, SwapParams } from '../lib/types/index.js';
import { getV3DetailsPayload } from '../lib/utils/utils.js';
import { TransactionMonitor } from '../lib/utils/transactionMonitor.js';
import { formatToBaseUnits } from '../lib/utils/amount.js';
import { getFibrousRouterCtor } from '../lib/utils/fibrousRouterSdk.js';

const FibrousRouterCtor = getFibrousRouterCtor();

export class SwapService {
  private tokenService: TokenService;
  private approvalService: ApprovalService;

  constructor(
    private env: onchainWrite,
    private walletAddress: string,
    private router: FibrousRouter
  ) {
    this.tokenService = new TokenService();
    this.approvalService = new ApprovalService();
  }

  async initialize(): Promise<void> {
    await this.tokenService.initializeTokens();
  }

  async executeSwapTransaction(params: SwapParams): Promise<SwapResult> {
    try {
      await this.initialize();

      const provider = this.env.provider;
      const account = new Account({
        provider,
        address: this.walletAddress,
        signer: this.env.account.signer,
      });

      const { sellToken, buyToken } = this.tokenService.validateTokenPair(
        params.sellTokenSymbol,
        params.buyTokenSymbol
      );

      const inputAmount = formatToBaseUnits(
        params.sellAmount,
        Number(sellToken.decimals)
      );

      const destinationAddress = account.address;

      const batchCalls = await this.router.buildBatchTransaction({
        inputAmounts: [inputAmount],
        tokenInAddresses: [sellToken.address],
        tokenOutAddresses: [buyToken.address],
        slippage: params.slippage ?? DEFAULT_SLIPPAGE_PERCENTAGE,
        destination: destinationAddress,
        chainName: 'starknet',
      });
      const swapCall: Call | any = Array.isArray(batchCalls)
        ? batchCalls[0]
        : null;

      if (!swapCall) {
        throw new Error('Calldata not available for this swap');
      }

      const routerAddress = await this.router.getRouterAddress('starknet');
      const approveCalldata =
        await this.approvalService.checkAndGetApproveToken(
          account,
          sellToken.address,
          routerAddress,
          inputAmount
        );

      let calldata: Call[] = [];

      if (approveCalldata) {
        calldata = [approveCalldata, swapCall as Call];
      } else {
        calldata = [swapCall as Call];
      }

      const swapResult = await account.execute(calldata, getV3DetailsPayload());

      const { receipt, events } = await this.monitorSwapStatus(
        swapResult.transaction_hash
      );

      return {
        status: 'success',
        message: `Successfully swapped ${params.sellAmount} ${params.sellTokenSymbol} for ${params.buyTokenSymbol}`,
        transactionHash: swapResult.transaction_hash,
        sellAmount: params.sellAmount,
        sellToken: params.sellTokenSymbol,
        buyToken: params.buyTokenSymbol,
        receipt,
        events,
      };
    } catch (error) {
      console.error('Detailed swap error:', error);
      if (error instanceof Error) {
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async monitorSwapStatus(txHash: string) {
    const transactionMonitor = new TransactionMonitor(this.env.provider);
    const receipt = await transactionMonitor.waitForTransaction(
      txHash,
      (status) => console.info('Swap status:', status)
    );

    const events = await transactionMonitor.getTransactionEvents(txHash);
    return { receipt, events };
  }
}

export const createSwapService = (
  env: onchainWrite,
  walletAddress?: string
): SwapService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new SwapService(env, walletAddress, new FibrousRouterCtor());
};

export const swapTokensFibrous = async (
  env: onchainWrite,
  params: SwapParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;

  try {
    const swapService = createSwapService(env, accountAddress);
    const result = await swapService.executeSwapTransaction(params);
    return result;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
