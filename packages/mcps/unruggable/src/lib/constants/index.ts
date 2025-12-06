import { getStartingTick } from '../utils/helper.js';

export const FACTORY_ADDRESS =
  '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc';

export const EKUBO_TICK_SIZE = 1.000001;
const EKUBO_MAX_PRICE = '0x100000000000000000000000000000000'; // 2 ** 128

export const EKUBO_TICK_SPACING = 5982; // log(1 + 0.6%) / log(1.000001) => 0.6% is the tick spacing percentage
export const EKUBO_TICK_SIZE_LOG = Math.log(EKUBO_TICK_SIZE);
export const EKUBO_FEES_MULTIPLICATOR = EKUBO_MAX_PRICE;
export const EKUBO_BOUND = getStartingTick(+EKUBO_MAX_PRICE);
export const MEMECOIN_DECIMALS = 18;

export type TokenInfo = {
  address: string;
  decimals: number;
  symbol: string;
  router_address?: string;
};

export const STRK_TOKEN: TokenInfo = {
  address: '0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D',
  decimals: 18,
  symbol: 'STRK',
  router_address:
    '0x5726725e9507c3586cc0516449e2c74d9b201ab2747752bb0251aaa263c9a26',
};

export const USDC_TOKEN: TokenInfo = {
  address: '0x053C91253BC9682c04929cA02ED00b3E423f6710D2ee7e0D5EBB06F3eCF368A8',
  decimals: 6,
  symbol: 'USDC',
};

export const ETH_TOKEN: TokenInfo = {
  address: '0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7',
  decimals: 18,
  symbol: 'ETH',
  router_address:
    '0x04d0390b777b424e43839cd1e744799f3de6c176c7e32c1812a41dbd9c19db6a',
};

export const QUOTE_TOKEN_INFO: Record<'STRK' | 'ETH' | 'USDC', TokenInfo> = {
  STRK: STRK_TOKEN,
  ETH: ETH_TOKEN,
  USDC: USDC_TOKEN,
};
