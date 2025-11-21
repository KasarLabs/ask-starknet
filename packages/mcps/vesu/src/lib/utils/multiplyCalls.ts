import { CairoCustomEnum, Call, RpcProvider } from 'starknet';
import { Account, Contract } from 'starknet';
import { IBaseToken } from '../../interfaces/index.js';
import {
  MULTIPLY_CONTRACT_ADDRESS,
  DEFAULT_DECIMALS,
} from '../constants/index.js';
import {
  getMultiplyContract,
  getErc20Contract,
  getPoolContract,
} from './contracts.js';
import {
  calculateEkuboWeights,
  calculateEkuboLeverSwapData,
  applySlippageToEkuboLimitAmount,
  type EkuboQuote,
  type BigIntValue,
} from './ekubo.js';
import { Hex } from './num.js';

/**
 * Build multiply calls with optional Ekubo swap support
 * This function adapts the logic from fn.ts getMultiplyCalls to work with the current project structure
 */
export const buildMultiplyCalls = async (
  collateralAmount: bigint,
  collateralAsset: IBaseToken,
  debtAsset: IBaseToken,
  poolContractAddress: Hex,
  account: Account,
  provider: RpcProvider,
  ekuboQuote?: EkuboQuote,
  slippageBps?: bigint // slippage in basis points (e.g., 50 = 0.5%)
): Promise<Call[]> => {
  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  // Prepare Ekubo swap data if quote is available
  let leverSwap: any[] = [];
  let leverSwapLimitAmount = 0n;

  if (ekuboQuote && ekuboQuote.splits.length > 0) {
    const weights = calculateEkuboWeights(ekuboQuote);
    const quotedAmount: BigIntValue = {
      value: collateralAmount,
      decimals: collateralAsset.decimals,
    };
    leverSwap = calculateEkuboLeverSwapData(
      collateralAsset,
      quotedAmount,
      ekuboQuote,
      weights
    );

    const slippage: BigIntValue = {
      value: slippageBps || 50n, // Default 0.5% slippage
      decimals: 4,
    };
    leverSwapLimitAmount = applySlippageToEkuboLimitAmount(
      ekuboQuote.totalCalculated,
      ekuboQuote.type,
      slippage
    );
  }

  // Get contract instances
  const tokenContract = getErc20Contract(collateralAsset.address);
  const multiplyContract = getMultiplyContract(MULTIPLY_CONTRACT_ADDRESS);
  const poolContract = getPoolContract(poolContractAddress);

  const multiplyContractForTx = new Contract(
    multiplyContract.abi,
    MULTIPLY_CONTRACT_ADDRESS,
    provider
  );
  const poolContractForTx = new Contract(
    poolContract.abi,
    poolContractAddress,
    provider
  );

  // Step 1: Approve token
  const approveCall = tokenContract.populateTransaction.approve(
    MULTIPLY_CONTRACT_ADDRESS,
    collateralAmount
  );

  // Step 2: Modify delegation (set to true)
  const modifyDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      true
    );

  // Step 3: Modify lever
  const modifyLeverCall =
    await multiplyContractForTx.populateTransaction.modify_lever({
      action: new CairoCustomEnum({
        IncreaseLever: {
          pool: poolContractAddress,
          collateral_asset: collateralAsset.address,
          debt_asset: debtAsset.address,
          user: account.address,
          add_margin: collateralAmount,
          margin_swap: [],
          margin_swap_limit_amount: ZERO_BI.value,
          lever_swap: leverSwap,
          lever_swap_limit_amount: leverSwapLimitAmount,
        },
      }),
    });

  // Step 4: Revoke delegation (set to false)
  const revokeDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      false
    );

  return [
    approveCall,
    modifyDelegationCall,
    modifyLeverCall,
    revokeDelegationCall,
  ];
};
