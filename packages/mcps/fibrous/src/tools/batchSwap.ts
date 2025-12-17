import { Account, Call } from 'starknet';

import { ApprovalService } from './approval.js';

import { TokenService } from './fetchTokens.js';
import { Router as FibrousRouter, RouteSuccess } from 'fibrous-router-sdk';
import { getV3DetailsPayload } from '../lib/utils/utils.js';
import { TransactionMonitor } from '../lib/utils/transactionMonitor.js';
import { BatchSwapParams } from '../lib/types/index.js';
import { SLIPPAGE_PERCENTAGE } from '../lib/constants/index.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';

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

      const sellAmount = params.sellAmounts[i].toString();
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

      // Get routes for each swap individually instead of batch
      const routes = [];
      for (let i = 0; i < swapParams.sellAmounts.length; i++) {
        const route = await this.router.getBestRoute({
          amount: swapParams.sellAmounts[i],
          tokenInAddress: swapParams.sellTokenAddresses[i],
          tokenOutAddress: swapParams.buyTokenAddresses[i],
          chainName: 'starknet',
        });
        routes.push(route);
      }

      for (let i = 0; i < routes.length; i++) {
        console.error(`${i}. Route information: `, {
          sellToken: params.sellTokenSymbols[i],
          buyToken: params.buyTokenSymbols[i],
          sellAmount: params.sellAmounts[i],
          buyAmount:
            routes[i] && routes[i].success
              ? (routes[i] as RouteSuccess).outputAmount
              : 'N/A',
        });
      }
      const destinationAddress = account.address; // !!! Destination address is the address of the account that will receive the tokens might be the any address

      const swapCalls = await this.router.buildBatchTransaction({
        inputAmounts: swapParams.sellAmounts,
        tokenInAddresses: swapParams.sellTokenAddresses,
        tokenOutAddresses: swapParams.buyTokenAddresses,
        slippage: SLIPPAGE_PERCENTAGE,
        destination: destinationAddress,
        chainName: 'starknet',
      });
      if (!swapCalls || !Array.isArray(swapCalls)) {
        throw new Error('Calldata not available for this swap');
      }
      const routerAddress = await this.router.getRouterAddress('starknet');
      let calldata: Call[] = [];
      for (let i = 0; i < swapCalls.length; i++) {
        const approveCall = await this.approvalService.checkAndGetApproveToken(
          account,
          swapParams.sellTokenAddresses[i],
          routerAddress,
          swapParams.sellAmounts[i]
        );
        if (approveCall) {
          calldata.push(approveCall);
        }
        calldata.push(swapCalls[i]);
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
      (status) => console.error('Swap status:', status)
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
  return {
    status: 'failure',
    error: 'This tool is currently under maintenance. ',
  };

  const accountAddress = env.account?.address;

  try {
    const swapService = createSwapService(env, accountAddress);
    const result = await swapService.executeSwapTransaction(params);
    return {
      status: 'success',
      data: result,
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
