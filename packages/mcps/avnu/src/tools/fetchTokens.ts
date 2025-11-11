import { Token, fetchTokens } from '@avnu/avnu-sdk';

/**
 * Service for managing token information
 * @class TokenService
 */
export class TokenService {
  /**
   * Validates a pair of tokens for trading using either symbol or address
   * Makes a single API call to fetch all tokens and finds both tokens in the response
   * @param {string | undefined} sellSymbol - Symbol of the token to sell
   * @param {string | undefined} sellAddress - Address of the token to sell
   * @param {string | undefined} buySymbol - Symbol of the token to buy
   * @param {string | undefined} buyAddress - Address of the token to buy
   * @throws {Error} If either token is not supported or if neither symbol nor address is provided
   * @returns {Promise<{ sellToken: Token, buyToken: Token }>} Object containing validated sell and buy tokens
   */
  async validateTokenPairBySymbolOrAddress(
    sellSymbol?: string,
    sellAddress?: string,
    buySymbol?: string,
    buyAddress?: string
  ): Promise<{
    sellToken: Token;
    buyToken: Token;
  }> {
    if (!sellSymbol && !sellAddress) {
      throw new Error(
        'Either sellTokenSymbol or sellTokenAddress must be provided'
      );
    }
    if (!buySymbol && !buyAddress) {
      throw new Error(
        'Either buyTokenSymbol or buyTokenAddress must be provided'
      );
    }

    try {
      const response = await fetchTokens();
      const tokens = response.content;

      // Find sell token
      const sellToken = sellSymbol
        ? tokens.find(
            (token) => token.symbol.toLowerCase() === sellSymbol.toLowerCase()
          )
        : tokens.find(
            (token) =>
              token.address.toLowerCase() === sellAddress!.toLowerCase()
          );

      // Find buy token
      const buyToken = buySymbol
        ? tokens.find(
            (token) => token.symbol.toLowerCase() === buySymbol.toLowerCase()
          )
        : tokens.find(
            (token) => token.address.toLowerCase() === buyAddress!.toLowerCase()
          );

      if (!sellToken) {
        const identifier = sellSymbol || sellAddress;
        throw new Error(`Sell token ${identifier} not supported`);
      }
      if (!buyToken) {
        const identifier = buySymbol || buyAddress;
        throw new Error(`Buy token ${identifier} not supported`);
      }

      return { sellToken, buyToken };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not supported')) {
        throw error;
      }
      throw new Error(`Failed to fetch tokens: ${error.message}`);
    }
  }
}
