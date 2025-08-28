import { fetchQuotes, QuoteRequest } from '@avnu/avnu-sdk';
import { SnakAgentInterface } from '../dependances/types.js';
import { TokenService } from './fetchTokens.js';
import { RouteSchemaType } from '../schemas/index.js';
import { RouteResult } from '../interfaces/index.js';
import { ContractInteractor } from '../utils/contractInteractor.js';

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
   * @param {SnakAgentInterface} agent - The Starknet agent interface
   * @returns {Promise<RouteResult>} The route fetch result
   */
  async fetchRoute(
    params: RouteSchemaType,
    agent: SnakAgentInterface
  ): Promise<RouteResult> {
    const accountAddress = agent.getAccountCredentials()?.accountPublicKey;

    try {
      await this.initialize();

      const { sellToken, buyToken } = this.tokenService.validateTokenPair(
        params.sellTokenSymbol,
        params.buyTokenSymbol
      );

      const provider = agent.getProvider();
      const contractInteractor = new ContractInteractor(provider);

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
 * @param {SnakAgentInterface} agent - The Starknet agent interface
 * @param {RouteSchemaType} params - The route parameters
 * @returns {Promise<RouteResult>} The route fetch result
 */
export const getRoute = async (
  agent: SnakAgentInterface,
  params: RouteSchemaType
): Promise<string> => {
  try {
    const routeService = new RouteFetchService();
    const result = await routeService.fetchRoute(params, agent);
    return JSON.stringify(result, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  } catch (error) {
    return JSON.stringify({
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
