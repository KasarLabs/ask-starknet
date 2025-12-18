import type { Token, Router as FibrousRouter } from 'fibrous-router-sdk';
import { getFibrousRouterCtor } from '../lib/utils/fibrousRouterSdk.js';

const FibrousRouterCtor = getFibrousRouterCtor();

export class TokenService {
  private tokens: Map<string, Token>;
  private readonly aliases: Record<string, string> = {
    // Fibrous uses bridged USDC symbol on Starknet.
    usdc: 'usdc.e',
  };

  async initializeTokens(): Promise<void> {
    try {
      const fibrous: FibrousRouter = new FibrousRouterCtor();
      const tokens = await fibrous.supportedTokens('starknet');
      this.tokens =
        tokens instanceof Map
          ? (tokens as Map<string, Token>)
          : new Map(Object.entries(tokens));
    } catch (error) {
      throw new Error(`Failed to initialize tokens: ${error.message}`);
    }
  }

  getToken(symbol: string): Token | undefined {
    const key = symbol.toLowerCase();
    return this.tokens.get(key) ?? this.tokens.get(this.aliases[key]);
  }

  validateTokenPair(
    sellSymbol: string,
    buySymbol: string
  ): {
    sellToken: Token;
    buyToken: Token;
  } {
    const sellToken = this.getToken(sellSymbol);
    const buyToken = this.getToken(buySymbol);

    if (!sellToken) throw new Error(`Sell token ${sellSymbol} not supported`);
    if (!buyToken) throw new Error(`Buy token ${buySymbol} not supported`);

    return { sellToken, buyToken };
  }
}
