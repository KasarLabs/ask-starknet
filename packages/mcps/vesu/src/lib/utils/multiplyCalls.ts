import { CairoCustomEnum, Call } from 'starknet';
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
  getVTokenContract,
} from './contracts.js';
import {
  calculateEkuboWeights,
  calculateEkuboLeverSwapData,
  applySlippageToEkuboLimitAmount,
  adjustEkuboWeights,
  type EkuboQuote,
  type BigIntValue,
  safeStringify,
} from './ekubo.js';
import { Hex } from './num.js';

/**
 * Build multiply calls with optional Ekubo swap support
 * This function adapts the logic from fn.ts getMultiplyCalls to work with the current project structure
 */
export const buildMultiplyCalls = async (
  collateralAmount: bigint,
  collateralAsset: IBaseToken,
  debtAmount: bigint,
  debtAsset: IBaseToken,
  poolContractAddress: Hex,
  account: Account,
  provider: any,
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
      value: debtAmount,
      decimals: debtAsset.decimals,
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
  const approveCall = await tokenContract.populateTransaction.approve(
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

/**
 * Build multiply calls with vToken redemption support (for shares type)
 */
export const buildMultiplyCallsWithVToken = async (
  sharesAmount: bigint,
  assetsAmount: bigint,
  collateralAsset: IBaseToken & { vToken: IBaseToken },
  debtAsset: IBaseToken,
  poolContractAddress: Hex,
  account: Account,
  provider: any,
  ekuboQuote?: EkuboQuote,
  slippageBps?: bigint
): Promise<Call[]> => {
  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  // Prepare Ekubo swap data if quote is available
  let leverSwap: any[] = [];
  let leverSwapLimitAmount = 0n;

  if (ekuboQuote && ekuboQuote.splits.length > 0) {
    const weights = calculateEkuboWeights(ekuboQuote);
    const quotedAmount: BigIntValue = {
      value: assetsAmount,
      decimals: debtAsset.decimals,
    };
    leverSwap = calculateEkuboLeverSwapData(
      collateralAsset,
      quotedAmount,
      ekuboQuote,
      weights
    );

    const slippage: BigIntValue = {
      value: slippageBps || 50n,
      decimals: DEFAULT_DECIMALS,
    };
    leverSwapLimitAmount = applySlippageToEkuboLimitAmount(
      ekuboQuote.totalCalculated,
      ekuboQuote.type,
      slippage
    );
  }

  // Get contract instances
  const vtokenContract = getVTokenContract(collateralAsset.vToken.address);
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

  // Step 1: Redeem vToken
  const redeemVTokenCall = await vtokenContract.populateTransaction.redeem(
    sharesAmount,
    account.address,
    account.address
  );

  // Step 2: Approve token
  const approveCall = await tokenContract.populateTransaction.approve(
    MULTIPLY_CONTRACT_ADDRESS,
    assetsAmount
  );

  // Step 3: Modify delegation (set to true)
  const modifyDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      true
    );

  // Step 4: Modify lever
  const modifyLeverCall =
    await multiplyContractForTx.populateTransaction.modify_lever({
      action: new CairoCustomEnum({
        IncreaseLever: {
          pool: poolContractAddress,
          collateral_asset: collateralAsset.address,
          debt_asset: debtAsset.address,
          user: account.address,
          add_margin: assetsAmount,
          margin_swap: [],
          margin_swap_limit_amount: ZERO_BI.value,
          lever_swap: leverSwap,
          lever_swap_limit_amount: leverSwapLimitAmount,
        },
      }),
    });

  // Step 5: Revoke delegation (set to false)
  const revokeDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      false
    );

  return [
    redeemVTokenCall,
    approveCall,
    modifyDelegationCall,
    modifyLeverCall,
    revokeDelegationCall,
  ];
};

/**
 * Build close multiply position calls with optional Ekubo swap support
 * This function adapts the logic from fn.ts getCloseMultiplyPositionCalls to work with the current project structure
 */
export const buildCloseMultiplyCalls = async (
  collateralAsset: IBaseToken,
  debtAsset: IBaseToken,
  poolContractAddress: Hex,
  account: Account,
  provider: any,
  ekuboQuote?: EkuboQuote,
  slippageBps?: bigint // slippage in basis points (e.g., 50 = 0.5%)
): Promise<Call[]> => {
  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  // Get contract instances
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

  const modifyDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      true
    );

  // Prepare Ekubo swap data if quote is available
  let leverSwap: any[] = [];
  let leverSwapLimitAmount = 0n;
  let adjustedWeights: bigint[] = [];

  if (ekuboQuote && ekuboQuote.splits.length > 0) {
    const weights = calculateEkuboWeights(ekuboQuote);
    leverSwap = calculateEkuboLeverSwapData(
      debtAsset,
      ZERO_BI,
      ekuboQuote,
      weights
    );
    adjustedWeights = adjustEkuboWeights(weights);

    const slippage: BigIntValue = {
      value: slippageBps || 50n, // Default 0.5% slippage
      decimals: 4,
    };

    leverSwapLimitAmount = applySlippageToEkuboLimitAmount(
      ekuboQuote.totalCalculated,
      ekuboQuote.type,
      slippage
    );

    if (leverSwapLimitAmount < 0n) {
      leverSwapLimitAmount = -leverSwapLimitAmount;
    }

    console.error(
      'leverSwapLimitAmount after abs:',
      leverSwapLimitAmount.toString()
    );
    console.error('==================================');
  }

  const revokeDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      false
    );

  const modifyLeverCall =
    await multiplyContractForTx.populateTransaction.modify_lever({
      action: new CairoCustomEnum({
        DecreaseLever: {
          pool: poolContractAddress,
          collateral_asset: collateralAsset.address,
          debt_asset: debtAsset.address,
          user: account.address,
          sub_margin: ZERO_BI.value,
          recipient: account.address,
          lever_swap: leverSwap,
          lever_swap_limit_amount: leverSwapLimitAmount,
          lever_swap_weights: adjustedWeights,
          withdraw_swap: [],
          withdraw_swap_limit_amount: ZERO_BI.value,
          withdraw_swap_weights: [],
          close_position: true,
        },
      }),
    });

  return [modifyDelegationCall, modifyLeverCall, revokeDelegationCall];
};

export const buildWithdrawMultiplyCalls = async (
  collateralAsset: IBaseToken,
  debtAsset: IBaseToken,
  poolContractAddress: Hex,
  account: Account,
  provider: any,
  withdrawAmount: BigIntValue
): Promise<Call[]> => {
  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  // Get contract instances
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

  const modifyDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      true
    );

  const revokeDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      false
    );

  const modifyLeverCall =
    await multiplyContractForTx.populateTransaction.modify_lever({
      action: new CairoCustomEnum({
        DecreaseLever: {
          pool: poolContractAddress,
          collateral_asset: collateralAsset.address,
          debt_asset: debtAsset.address,
          user: account.address,
          sub_margin: withdrawAmount.value,
          recipient: account.address,
          lever_swap: [],
          lever_swap_limit_amount: ZERO_BI.value,
          lever_swap_weights: [],
          withdraw_swap: [],
          withdraw_swap_limit_amount: ZERO_BI.value,
          withdraw_swap_weights: [],
          close_position: false,
        },
      }),
    });

  return [modifyDelegationCall, modifyLeverCall, revokeDelegationCall];
};
