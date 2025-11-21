import { RpcProvider } from 'starknet';
import { PoolKey } from '../../schemas/index.js';
import { validateToken, validToken } from './token.js';
import {
  convertFeePercentToU128,
  convertTickSpacingPercentToExponent,
} from './math.js';

export async function preparePoolKeyFromParams(
  provider: RpcProvider,
  params: PoolKey
): Promise<{
  poolKey: any;
  token0: validToken;
  token1: validToken;
  isTokenALower: boolean;
}> {
  const token0 = await validateToken(
    provider,
    params.token0_symbol,
    params.token0_address
  );
  const token1 = await validateToken(
    provider,
    params.token1_symbol,
    params.token1_address
  );

  const poolKey = {
    token0: token0.address < token1.address ? token0.address : token1.address,
    token1: token0.address < token1.address ? token1.address : token0.address,
    fee: convertFeePercentToU128(params.fee),
    tick_spacing: convertTickSpacingPercentToExponent(params.tick_spacing),
    extension: params.extension,
  };

  const isTokenALower = token0.address < token1.address ? true : false;
  return { poolKey, token0, token1, isTokenALower };
}
