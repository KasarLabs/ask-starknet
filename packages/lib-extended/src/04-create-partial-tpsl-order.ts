import { getFees } from './api/fees.ts'
import { getMarket } from './api/markets.ts'
import { placeOrder } from './api/order.ts'
import { getStarknetDomain } from './api/starknet.ts'
import { init } from './init.ts'
import { Order } from './models/order.ts'
import { createOrderContext } from './utils/create-order-context.ts'
import { Decimal } from './utils/number.ts'
import { roundToMinChange } from './utils/round-to-min-change.ts'

const MARKET_NAME = 'ETH-USD'

const runExample = async () => {
  const { starkPrivateKey, vaultId } = await init()

  const market = await getMarket(MARKET_NAME)
  const fees = await getFees({ marketName: MARKET_NAME })
  const starknetDomain = await getStarknetDomain()

  const roundPrice = (value: Decimal) => {
    return roundToMinChange(
      value,
      market.tradingConfig.minPriceChange,
      Decimal.ROUND_DOWN,
    )
  }

  const orderSize = market.tradingConfig.minOrderSize
  const bidPrice = market.marketStats.bidPrice
  const tpTriggerPrice = bidPrice.times(1.01)
  const tpPrice = bidPrice.times(1.015)
  const slTriggerPrice = bidPrice.times(0.99)
  const slPrice = bidPrice.times(0.985)

  const ctx = createOrderContext({
    market,
    fees,
    starknetDomain,
    vaultId,
    starkPrivateKey,
  })
  // Assuming you have LONG ETH-USD position with a size >= `minOrderSize`
  const order = Order.create({
    marketName: MARKET_NAME,
    orderType: 'TPSL',
    side: 'SELL',
    amountOfSynthetic: roundToMinChange(
      orderSize,
      market.tradingConfig.minOrderSizeChange,
      Decimal.ROUND_DOWN,
    ),
    price: Decimal(0), // Ignored for TPSL orders
    timeInForce: 'GTT',
    reduceOnly: true,
    postOnly: false,
    tpSlType: 'ORDER',
    takeProfit: {
      triggerPrice: roundPrice(tpTriggerPrice),
      triggerPriceType: 'LAST',
      price: roundPrice(tpPrice),
      priceType: 'LIMIT',
    },
    stopLoss: {
      triggerPrice: roundPrice(slTriggerPrice),
      triggerPriceType: 'LAST',
      price: roundPrice(slPrice),
      priceType: 'LIMIT',
    },
    ctx,
  })

  const result = await placeOrder({ order })

  console.log('Order placed: %o', result)
}

await runExample()
