import { Fraction } from '@uniswap/sdk-core';
import { BlockNumber, BlockTag, ProviderInterface, uint256 } from 'starknet';
import { decimalsScale } from './helper.js';

export type USDCPair = {
  address: string;
  reversed: boolean;
};

export async function getPairPrice(
  provider: ProviderInterface,
  pair?: USDCPair,
  blockNumber: BlockNumber = BlockTag.LATEST
) {
  if (!pair) return new Fraction(1, 1);

  const result = await provider.callContract(
    {
      contractAddress: pair.address,
      entrypoint: 'get_reserves',
    },
    blockNumber
  );

  const [reserve0Low, reserve0High, reserve1Low, reserve1High] = result;

  if (!reserve0Low && !reserve0High) {
    throw new Error('Invalid reserves: reserve0 is zero');
  }
  const pairPrice = new Fraction(
    uint256.uint256ToBN({ low: reserve1Low, high: reserve1High }).toString(),
    uint256.uint256ToBN({ low: reserve0Low, high: reserve0High }).toString()
  );
  return (pair.reversed ? pairPrice.invert() : pairPrice).multiply(
    decimalsScale(12)
  );
}
