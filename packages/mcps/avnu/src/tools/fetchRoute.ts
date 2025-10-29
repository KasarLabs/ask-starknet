import { fetchQuotes, QuoteRequest } from '@avnu/avnu-sdk';
import { onchainRead, onchainWrite } from '@ijusttookadnatest/ask-starknet-core';
import { TokenService } from './fetchTokens.js';
import { RouteSchemaType } from '../schemas/index.js';
import { RouteResult } from '../interfaces/index.js';
import { ContractInteractor } from '../lib/utils/contractInteractor.js';

/**
 * Service class for fetching trading routes
 * @class RouteFetchService
 */
export class RouteFetchService {
  private tokenService: TokenService;

  /**
   * Creates an instance of RouteFetchService
   */
  constructor() {
    this.tokenService = new TokenService();
  }

  /**
   * Initializes the token service
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    await this.tokenService.initializeTokens();
  }

  /**
   * Fetches a trading route based on provided parameters
   * @param {RouteSchemaType} params - The route parameters
   * @param {onchainRead} env - The onchain read environment
   * @param {string} accountAddress - The account address
   * @returns {Promise<RouteResult>} The route fetch result
   */
  async fetchRoute(
    params: RouteSchemaType,
    env: onchainRead,
    accountAddress: string
  ): Promise<RouteResult> {
    try {
      await this.initialize();

      const { sellToken, buyToken } = this.tokenService.validateTokenPair(
        params.sellTokenSymbol,
        params.buyTokenSymbol
      );

      const contractInteractor = new ContractInteractor(env.provider);

      const formattedAmountStr = contractInteractor.formatTokenAmount(
        params.sellAmount.toString(),
        sellToken.decimals
      );

      const formattedAmount = BigInt(formattedAmountStr);

      const quoteParams: QuoteRequest = {
        sellTokenAddress: sellToken.address,
        buyTokenAddress: buyToken.address,
        sellAmount: formattedAmount,
        takerAddress: accountAddress,
        size: 1,
      };

      const quotes = await fetchQuotes(quoteParams);
      if (!quotes?.length) {
        return {
          status: 'failure',
          error: 'No routes available for this swap',
        };
      }

      const quote = quotes[0];
      const route = quote.routes?.[0];

      if (!route) {
        return {
          status: 'failure',
          error: 'No valid route found in quote',
        };
      }

      return {
        status: 'success',
        route,
        quote,
      };
    } catch (error) {
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Utility function to fetch a trading route
 * @param {onchainRead} env - The onchain read environment
 * @param {RouteSchemaType} params - The route parameters
 * @param {string} accountAddress - The account address
 * @returns {Promise<RouteResult>} The route fetch result
 */
export const getRoute = async (env: onchainWrite, params: RouteSchemaType) => {
  try {
    const routeService = new RouteFetchService();
    const result = await routeService.fetchRoute(
      params,
      env,
      env.account.address
    );
    return JSON.stringify(result, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
