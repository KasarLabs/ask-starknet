import { TokenService } from './fetchTokens.js';
import type {
  Router as FibrousRouter,
  RouteResponse,
} from 'fibrous-router-sdk';
import { RouteSchemaType } from '../schemas/index.js';
import { formatToBaseUnits } from '../lib/utils/amount.js';
import { getFibrousRouterCtor } from '../lib/utils/fibrousRouterSdk.js';

const FibrousRouterCtor = getFibrousRouterCtor();

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
    this.router = new FibrousRouterCtor();
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

      // Fibrous API expects base units
      const formattedAmount = formatToBaseUnits(
        params.sellAmount,
        Number(sellToken.decimals)
      );
      const route = await this.router.getBestRoute({
        amount: formattedAmount,
        tokenInAddress: sellToken.address,
        tokenOutAddress: buyToken.address,
        chainName: 'starknet',
      });

      if (!route?.success) {
        return {
          status: 'failure',
          error: 'No routes available for this swap',
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
    const routeService = new RouteFetchService();
    return routeService.fetchRoute(params);
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
