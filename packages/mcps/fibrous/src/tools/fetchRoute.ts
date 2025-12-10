import { TokenService } from './fetchTokens.js';
import { Router as FibrousRouter, RouteResponse } from 'fibrous-router-sdk';
import { RouteSchemaType } from '../schemas/index.js';

export interface RouteResult {
  status: 'success' | 'failure';
  route?: RouteResponse | null;
  error?: string;
}

export class RouteFetchService {
  private tokenService: TokenService;
  private router: FibrousRouter;

  constructor() {
    this.tokenService = new TokenService();
    this.router = new FibrousRouter();
  }

  async initialize(): Promise<void> {
    await this.tokenService.initializeTokens();
  }

  async fetchRoute(params: RouteSchemaType): Promise<RouteResult> {
    try {
      await this.initialize();

      const { sellToken, buyToken } = this.tokenService.validateTokenPair(
        params.sellTokenSymbol,
        params.buyTokenSymbol
      );

      const formattedAmount = params.sellAmount.toString();

      const route = await this.router.getBestRoute({
        amount: formattedAmount,
        tokenInAddress: sellToken.address,
        tokenOutAddress: buyToken.address,
        chainName: 'starknet'
      });

      if (!route?.success) {
        return {
          status: 'failure',
          error: 'No routes available for this swap',
        };
      }

      if (!route) {
        return {
          status: 'failure',
          error: 'No valid route found in quote',
        };
      }

      return {
        status: 'success',
        route,
      };
    } catch (error) {
      return {
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const getRouteFibrous = async (
  params: RouteSchemaType
): Promise<RouteResult> => {
  try {
    return {
      status: 'failure',
      error: 'This tool is currently under maintenance. ',
    };

    const tokenService = new TokenService();
    await tokenService.initializeTokens();
    const routeService = new RouteFetchService();
    return routeService.fetchRoute(params);
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
