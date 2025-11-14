import { executeSwap, fetchQuotes, QuoteRequest, Quote } from '@avnu/avnu-sdk';

import { ApprovalService } from './approval.js';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { SwapParams, SwapResult } from '../lib/types/index.js';
import {
  DEFAULT_QUOTE_SIZE,
  SLIPPAGE_PERCENTAGE,
} from '../lib/constants/index.js';
import { TokenService } from './fetchTokens.js';
import { ContractInteractor } from '../lib/utils/contractInteractor.js';
import { TransactionMonitor } from '../lib/utils/transactionMonitor.js';

/**
 * Service handling token swap operations using AVNU SDK
 * @class SwapService
 */
export class SwapService {
  private tokenService: TokenService;
  private approvalService: ApprovalService;

  /**
   * Creates an instance of SwapService
   * @param {onchainWrite} env - The onchain write environment for blockchain interactions
   */
  constructor(private env: onchainWrite) {
    this.tokenService = new TokenService();
    this.approvalService = new ApprovalService(env);
  }

  /**
   * Extracts spender address from a quote
   * @private
   * @param {Quote} quote - The quote containing route information
   * @returns {string|undefined} The spender address if available
   */
  private extractSpenderAddress(quote: Quote): string | undefined {
    if (quote.routes?.length > 0) {
      const mainRoute = quote.routes[0];
      return mainRoute.address;
    }

    return undefined;
  }

  /**
   * Executes a token swap transaction
   * @param {SwapParams} params - The swap parameters
   * @returns {Promise<SwapResult>} The result of the swap operation
   */
  async executeSwapTransaction(params: SwapParams): Promise<SwapResult> {
    try {
      const contractInteractor = new ContractInteractor(this.env.provider);

      const account = this.env.account;

      const { sellToken, buyToken } =
        await this.tokenService.validateTokenPairBySymbolOrAddress(
          params.sellTokenSymbol,
          params.sellTokenAddress,
          params.buyTokenSymbol,
          params.buyTokenAddress
        );

      const formattedAmount = BigInt(
        contractInteractor.formatTokenAmount(
          params.sellAmount.toString(),
          sellToken.decimals
        )
      );

      const quoteParams: QuoteRequest = {
        sellTokenAddress: sellToken.address,
        buyTokenAddress: buyToken.address,
        sellAmount: formattedAmount,
        takerAddress: account.address,
        size: DEFAULT_QUOTE_SIZE,
      };

      const quotes = await fetchQuotes(quoteParams);
      if (!quotes?.length) {
        throw new Error('No quotes available for this swap');
      }

      const quote = quotes[0];

      const spenderAddress = this.extractSpenderAddress(quote);

      if (!spenderAddress) {
        throw new Error(
          `Could not determine spender address from quote. Available properties: ${Object.keys(quote).join(', ')}`
        );
      }

      await this.approvalService.checkAndApproveToken(
        account,
        sellToken.address,
        spenderAddress,
        formattedAmount.toString()
      );

      const swapResult = await executeSwap(account, quote, {
        slippage: SLIPPAGE_PERCENTAGE,
      });

      const { receipt, events } = await this.monitorSwapStatus(
        swapResult.transactionHash
      );

      const sellTokenIdentifier =
        params.sellTokenSymbol || params.sellTokenAddress || sellToken.symbol;
      const buyTokenIdentifier =
        params.buyTokenSymbol || params.buyTokenAddress || buyToken.symbol;

      return {
        status: 'success',
        message: `Successfully swapped ${params.sellAmount} ${sellTokenIdentifier} for ${buyTokenIdentifier}`,
        transactionHash: swapResult.transactionHash,
        sellAmount: params.sellAmount,
        sellToken: sellTokenIdentifier,
        buyToken: buyTokenIdentifier,
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

  /**
   * Monitors the status of a swap transaction
   * @private
   * @param {string} txHash - The transaction hash to monitor
   * @returns {Promise<{receipt: any, events: any}>} Transaction receipt and events
   */
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

/**
 * Creates a new SwapService instance
 * @param {onchainWrite} env - The onchain write environment
 * @returns {SwapService} A new SwapService instance
 */
export const createSwapService = (env: onchainWrite): SwapService => {
  return new SwapService(env);
};

export const swapTokens = async (env: onchainWrite, params: SwapParams) : Promise <toolResult> => {
  try {
    const swapService = createSwapService(env);
    const result = await swapService.executeSwapTransaction(params);
    return {
      status: "success",
      data : result
    }
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
