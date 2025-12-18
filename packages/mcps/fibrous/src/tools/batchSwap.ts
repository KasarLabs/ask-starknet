import { Account, Call } from 'starknet';

import { ApprovalService } from './approval.js';

import { TokenService } from './fetchTokens.js';
import { Router as FibrousRouter, RouteSuccess } from 'fibrous-router-sdk';
import { getV3DetailsPayload } from '../lib/utils/utils.js';
import { TransactionMonitor } from '../lib/utils/transactionMonitor.js';
import { BatchSwapParams } from '../lib/types/index.js';
import { DEFAULT_SLIPPAGE_PERCENTAGE } from '../lib/constants/index.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { formatToBaseUnits } from '../lib/utils/amount.js';

export class BatchSwapService {
  private tokenService: TokenService;
  private approvalService: ApprovalService;
  private router: FibrousRouter;

  constructor(
    private env: onchainWrite,
    private walletAddress: string,
    routerInstance?: FibrousRouter
  ) {
    this.tokenService = new TokenService();
    this.approvalService = new ApprovalService();
    this.router = routerInstance || new FibrousRouter();
  }

  async initialize(): Promise<void> {
    await this.tokenService.initializeTokens();
  }

  extractBatchSwapParams(params: BatchSwapParams): {
    sellTokenAddresses: string[];
    buyTokenAddresses: string[];
    sellAmounts: string[];
  } {
    const sellTokens: string[] = [];
    const buyTokens: string[] = [];
    const sellAmounts: string[] = [];
    for (let i = 0; i < params.sellTokenSymbols.length; i++) {
      const { sellToken, buyToken } = this.tokenService.validateTokenPair(
        params.sellTokenSymbols[i],
        params.buyTokenSymbols[i]
      );

      const sellAmount = formatToBaseUnits(
        params.sellAmounts[i],
        Number(sellToken.decimals)
      );
      sellTokens.push(sellToken.address);
      buyTokens.push(buyToken.address);
      sellAmounts.push(sellAmount);
    }
    return {
      sellTokenAddresses: sellTokens,
      buyTokenAddresses: buyTokens,
      sellAmounts: sellAmounts,
    };
  }

  async executeSwapTransaction(params: BatchSwapParams) {
    try {
      await this.initialize();

      const provider = this.env.provider;
      const account = new Account({
        provider,
        address: this.walletAddress,
        signer: this.env.account.signer,
      });
      const swapParams = this.extractBatchSwapParams(params);

      const destinationAddress = account.address;
      const swapCalls = await this.router.buildBatchTransaction({
        inputAmounts: swapParams.sellAmounts,
        tokenInAddresses: swapParams.sellTokenAddresses,
        tokenOutAddresses: swapParams.buyTokenAddresses,
        slippage: params.slippage ?? DEFAULT_SLIPPAGE_PERCENTAGE,
        destination: destinationAddress,
        chainName: 'starknet',
      });
      if (!swapCalls || !Array.isArray(swapCalls)) {
        throw new Error('Calldata not available for this swap');
      }

      const approvalsByToken = new Map<string, bigint>();
      for (let i = 0; i < swapParams.sellTokenAddresses.length; i++) {
        const tokenAddr = swapParams.sellTokenAddresses[i];
        const amount = BigInt(swapParams.sellAmounts[i]);
        approvalsByToken.set(
          tokenAddr,
          (approvalsByToken.get(tokenAddr) || 0n) + amount
        );
      }

      const routerAddress = await this.router.getRouterAddress('starknet');
      let calldata: Call[] = [];

      for (const [tokenAddr, totalAmount] of approvalsByToken) {
        const approveCall = await this.approvalService.checkAndGetApproveToken(
          account,
          tokenAddr,
          routerAddress,
          totalAmount.toString()
        );
        if (approveCall) {
          calldata.push(approveCall);
        }
      }

      for (const swapCall of swapCalls) {
        calldata.push(swapCall);
      }

      const swapResult = await account.execute(calldata, getV3DetailsPayload());
      const { receipt, events } = await this.monitorSwapStatus(
        swapResult.transaction_hash
      );
      return {
        status: 'success',
        message: `Successfully swapped ${params.sellAmounts} ${params.sellTokenSymbols} for ${params.buyTokenSymbols}`,
        transactionHash: swapResult.transaction_hash,
        sellAmounts: params.sellAmounts,
        sellTokenSymbols: params.sellTokenSymbols,
        buyTokenSymbols: params.buyTokenSymbols,
        receipt,
        events,
      };
    } catch (error) {
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
): BatchSwapService => {
  if (!walletAddress) {
    throw new Error('Wallet address not configured');
  }

  return new BatchSwapService(env, walletAddress);
};

export const batchSwapTokens = async (
  env: onchainWrite,
  params: BatchSwapParams
): Promise<toolResult> => {
  const accountAddress = env.account?.address;

  try {
    const swapService = createSwapService(env, accountAddress);
    const result = await swapService.executeSwapTransaction(params);
    if (result.status === 'failure') {
      return { status: 'failure', error: result.error ?? 'Batch swap failed' };
    }
    return { status: 'success', data: result };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
