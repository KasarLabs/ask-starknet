import { afterAll, beforeAll, expect, test, vi } from 'vitest'

import * as generateNonceModule from '../utils/generate-nonce.ts'
import { Decimal, Long } from '../utils/number.ts'
import { Order } from './order.ts'
import { type OrderContext } from './order.types.ts'

const CTX: OrderContext = {
  assetIdCollateral: Decimal(
    '1508159369509269042908118660797226224713309535454600628063900735297932481180',
  ),
  assetIdSynthetic: Decimal('344400637343183300222065759427231744'),
  settlementResolutionCollateral: Decimal('1000000'),
  settlementResolutionSynthetic: Decimal('10000000000'),
  minOrderSizeChange: Decimal('0.0001'),
  maxPositionValue: Decimal('10000000000'),
  feeRate: Decimal('2').div(Decimal('10000')),
  vaultId: Long(10002),
  starkPrivateKey: '0x659127796b268530385f753efee81112c628b2bf266e025d3b52d16204c5504',
  starknetDomain: {
    name: 'Perpetuals',
    version: 'v0',
    chainId: 'SN_SEPOLIA',
    revision: 1,
  },
  builderId: Long(2001),
  builderFee: Decimal('0.0012'),
}

beforeAll(() => {
  vi.useFakeTimers({
    now: Date.parse('2024-01-05 01:08:56.860694'),
  })
})

afterAll(() => {
  vi.useRealTimers()
})

test('creates `LIMIT / SELL` order correctly', () => {
  // given
  vi.spyOn(generateNonceModule, 'generateNonce').mockReturnValue(1473459052)

  const order = Order.create({
    marketName: 'BTC-USD',
    orderType: 'LIMIT',
    side: 'SELL',
    amountOfSynthetic: Decimal('0.001'),
    price: Decimal('43445.11680000'),
    timeInForce: 'GTT',
    expiryTime: undefined,
    reduceOnly: false,
    postOnly: false,
    tpSlType: 'ORDER',
    takeProfit: {
      triggerPrice: Decimal('49000'),
      triggerPriceType: 'MARK',
      price: Decimal('50000'),
      priceType: 'LIMIT',
    },
    stopLoss: {
      triggerPrice: Decimal('40000'),
      triggerPriceType: 'MARK',
      price: Decimal('39000'),
      priceType: 'LIMIT',
    },
    ctx: CTX,
  })

  // when / then
  expect(order.toJSON()).toMatchInlineSnapshot(`
    {
      "builderFee": "0.0012",
      "builderId": "2001",
      "debuggingAmounts": {
        "collateralAmount": "43445116",
        "feeAmount": "60824",
        "syntheticAmount": "10000000",
      },
      "expiryEpochMillis": 1704420536860,
      "fee": "0.0014",
      "id": "1088023465382590833070844354772991406799121939245800917524942990980270111150",
      "market": "BTC-USD",
      "nonce": "1473459052",
      "postOnly": false,
      "price": "43445.1168",
      "qty": "0.001",
      "reduceOnly": false,
      "settlement": {
        "collateralPosition": "10002",
        "signature": {
          "r": "0x2a89b52eea807bc7e22f8eedf636f4b9f4ecd9c90da7973840e5ef77cb8255c",
          "s": "0x6913f549d532336c26959190ffae3e92f1e92b436da4e6025226320fefc320f",
        },
        "starkKey": "0x2b8ee0cf95a353cb59fdae9afb54851769e750326e24cee9621ce33f08c02ed",
      },
      "side": "SELL",
      "stopLoss": {
        "debuggingAmounts": {
          "collateralAmount": "39000000",
          "feeAmount": "54600",
          "syntheticAmount": "10000000",
        },
        "price": "39000",
        "priceType": "LIMIT",
        "settlement": {
          "collateralPosition": "10002",
          "signature": {
            "r": "0x44ae74d3783ef3d099c15a78cb06cf2cb7a38ae7d257a7f861380dc18266e9b",
            "s": "0x248e0bbce83f091d1db78005b06b427fe1c2816c36ca72c166fdbc61161a0bd",
          },
          "starkKey": "0x2b8ee0cf95a353cb59fdae9afb54851769e750326e24cee9621ce33f08c02ed",
        },
        "triggerPrice": "40000",
        "triggerPriceType": "MARK",
      },
      "takeProfit": {
        "debuggingAmounts": {
          "collateralAmount": "50000000",
          "feeAmount": "70000",
          "syntheticAmount": "10000000",
        },
        "price": "50000",
        "priceType": "LIMIT",
        "settlement": {
          "collateralPosition": "10002",
          "signature": {
            "r": "0x7b9a3c5ad98aa3831662d107b97d4310334cef9def0a622c4233358b8215958",
            "s": "0x5d3669a776a87840afedf83a5a20724157d1e8ad6dab176d7bdea898de5df50",
          },
          "starkKey": "0x2b8ee0cf95a353cb59fdae9afb54851769e750326e24cee9621ce33f08c02ed",
        },
        "triggerPrice": "49000",
        "triggerPriceType": "MARK",
      },
      "timeInForce": "GTT",
      "tpSlType": "ORDER",
      "type": "LIMIT",
    }
  `)
})
