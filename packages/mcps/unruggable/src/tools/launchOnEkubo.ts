import { LaunchOnEkuboParams } from '../schemas/index.js';
import {
  EKUBO_BOUND,
  EKUBO_FEES_MULTIPLICATOR,
  EKUBO_TICK_SPACING,
  FACTORY_ADDRESS,
  QUOTE_TOKEN_INFO,
} from '../lib/constants/index.js';
import { CallData, uint256 } from 'starknet';
import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { Fraction, Percent } from '@uniswap/sdk-core';
import {
  decimalsScale,
  getMemecoinTotalSupply,
  getStartingTick,
} from '../lib/utils/helper.js';
import { getPairPrice } from '../lib/utils/price.js';

export const launchOnEkubo = async (
  env: onchainWrite,
  params: LaunchOnEkuboParams
): Promise<toolResult> => {
  try {
    const { account, provider } = env;
    const token_info = QUOTE_TOKEN_INFO[params.quoteToken];

    const teamAllocations = params.initialHolders.map((address, index) => ({
      address,
      amount: params.initialHoldersAmounts[index],
    }));

    const quoteTokenPrice = await getPairPrice(provider);
    const feeBigInt = Math.round(parseFloat(params.fee) * 100);
    const fees_percent = new Percent(feeBigInt, 10000);
    const fees = fees_percent
      .multiply(EKUBO_FEES_MULTIPLICATOR)
      .quotient.toString();

    const max_buyPercent = new Percent(params.maxPercentageBuyLaunch, 100);
    const totalSupply = await getMemecoinTotalSupply(
      provider,
      params.memecoinAddress
    );
    const initialPrice = +new Fraction(params.startingMarketCap)
      .divide(quoteTokenPrice)
      .multiply(decimalsScale(18))
      .divide(new Fraction(totalSupply.toString()))
      .toFixed(18);

    const startingTickMag = getStartingTick(initialPrice);
    const i129StartingTick = {
      mag: Math.abs(startingTickMag),
      sign: startingTickMag < 0,
    };

    const initialHolders = teamAllocations.map(({ address }) => address);
    const initialHoldersAmounts = teamAllocations.map(({ amount }) =>
      uint256.bnToUint256(BigInt(amount) * BigInt(decimalsScale(18)))
    );

    const launchCalldata = CallData.compile([
      params.memecoinAddress,
      params.transferRestrictionDelay,
      +max_buyPercent.toFixed(1) * 100,
      token_info.address,
      initialHolders,
      initialHoldersAmounts,
      fees,
      EKUBO_TICK_SPACING,
      i129StartingTick,
      EKUBO_BOUND,
    ]);

    const teamAllocationFraction = teamAllocations.reduce(
      (acc, { amount }) => acc.add(amount),
      new Fraction(0)
    );
    const teamAllocationPercentage = new Percent(
      teamAllocationFraction.quotient.toString(),
      new Fraction(
        totalSupply.toString(),
        decimalsScale(18)
      ).quotient.toString()
    );

    const teamAllocationQuoteAmount = new Fraction(params.startingMarketCap)
      .divide(quoteTokenPrice)
      .multiply(teamAllocationPercentage.multiply(fees_percent.add(1)));
    const uin256TeamAllocationQuoteAmount = uint256.bnToUint256(
      BigInt(
        teamAllocationQuoteAmount
          .multiply(decimalsScale(token_info.decimals))
          .quotient.toString()
      )
    );

    const transferCalldata = CallData.compile([
      FACTORY_ADDRESS,
      uin256TeamAllocationQuoteAmount,
    ]);

    const calls = [
      {
        contractAddress: token_info.address,
        entrypoint: 'transfer',
        calldata: transferCalldata,
      },
      {
        contractAddress: FACTORY_ADDRESS,
        entrypoint: 'launch_on_ekubo',
        calldata: launchCalldata,
      },
    ];

    const tx = await account.execute(calls);
    await provider.waitForTransaction(tx.transaction_hash);

    return {
      status: 'success',
      data: { transactionHash: tx.transaction_hash },
    };
  } catch (error) {
    return {
      status: 'failure',
      error: error.message,
    };
  }
};
