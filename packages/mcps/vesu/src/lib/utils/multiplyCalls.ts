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

export const buildMultiplyCalls = async (
  collateralAmount: bigint,
  collateralAsset: IBaseToken,
  debtAmount: bigint,
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

  const multiplyContractForTx = new Contract({
    abi: multiplyContract.abi,
    address: MULTIPLY_CONTRACT_ADDRESS,
    providerOrAccount: provider,
  });
  const poolContractForTx = new Contract({
    abi: poolContract.abi,
    address: poolContractAddress,
    providerOrAccount: provider,
  });

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

export const buildCloseMultiplyCalls = async (
  collateralAsset: IBaseToken,
  debtAsset: IBaseToken,
  poolContractAddress: Hex,
  account: Account,
  provider: any,
  ekuboQuote?: EkuboQuote,
  slippageBps?: bigint
): Promise<Call[]> => {
  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  // Get contract instances
  const multiplyContract = getMultiplyContract(MULTIPLY_CONTRACT_ADDRESS);
  const poolContract = getPoolContract(poolContractAddress);

  const multiplyContractForTx = new Contract({
    abi: multiplyContract.abi,
    address: MULTIPLY_CONTRACT_ADDRESS,
    providerOrAccount: provider,
  });
  const poolContractForTx = new Contract({
    abi: poolContract.abi,
    address: poolContractAddress,
    providerOrAccount: provider,
  });

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

  const multiplyContractForTx = new Contract({
    abi: multiplyContract.abi,
    address: MULTIPLY_CONTRACT_ADDRESS,
    providerOrAccount: provider,
  });
  const poolContractForTx = new Contract({
    abi: poolContract.abi,
    address: poolContractAddress,
    providerOrAccount: provider,
  });

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

export const getDecreaseMultiplierCalls = async (
  collateralAsset: IBaseToken,
  debtAsset: IBaseToken,
  poolContractAddress: Hex,
  account: Account,
  provider: any,
  ekuboQuote: EkuboQuote,
  quotedAmount: BigIntValue,
  slippage: BigIntValue
): Promise<Call[]> => {
  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  const multiplyContract = getMultiplyContract(MULTIPLY_CONTRACT_ADDRESS);
  const poolContract = getPoolContract(poolContractAddress);

  const multiplyContractForTx = new Contract({
    abi: multiplyContract.abi,
    address: MULTIPLY_CONTRACT_ADDRESS,
    providerOrAccount: provider,
  });
  const poolContractForTx = new Contract({
    abi: poolContract.abi,
    address: poolContractAddress,
    providerOrAccount: provider,
  });

  const modifyDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      true
    );

  const weights = calculateEkuboWeights(ekuboQuote);

  const leverSwap = calculateEkuboLeverSwapData(
    collateralAsset,
    quotedAmount,
    ekuboQuote,
    weights
  );

  const adjustedWeights = adjustEkuboWeights(weights);

  const limitAmount = applySlippageToEkuboLimitAmount(
    ekuboQuote.totalCalculated,
    ekuboQuote.type,
    slippage
  );

  const decreaseLeverParams = {
    pool: poolContractAddress,
    collateral_asset: collateralAsset.address,
    debt_asset: debtAsset.address,
    user: account.address,
    sub_margin: ZERO_BI.value,
    recipient: account.address,
    lever_swap: leverSwap,
    lever_swap_limit_amount: limitAmount,
    lever_swap_weights: adjustedWeights,
    withdraw_swap: [],
    withdraw_swap_limit_amount: ZERO_BI.value,
    withdraw_swap_weights: [],
    close_position: false,
  };

  const modifyLeverCall =
    await multiplyContractForTx.populateTransaction.modify_lever({
      action: new CairoCustomEnum({
        DecreaseLever: decreaseLeverParams,
      }),
    });

  const revokeDelegationCallData =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      false
    );

  const calls = [
    modifyDelegationCall,
    modifyLeverCall,
    revokeDelegationCallData,
  ];

  return calls;
};

export const getIncreaseMultiplierCalls = async (
  collateralAsset: IBaseToken,
  debtAsset: IBaseToken,
  poolContractAddress: Hex,
  account: Account,
  provider: any,
  ekuboQuote: EkuboQuote | undefined,
  quotedAmount: bigint,
  slippageBps: bigint
): Promise<Call[]> => {
  const ZERO_BI: BigIntValue = { value: 0n, decimals: DEFAULT_DECIMALS };

  const multiplyContract = getMultiplyContract(MULTIPLY_CONTRACT_ADDRESS);
  const poolContract = getPoolContract(poolContractAddress);

  const multiplyContractForTx = new Contract({
    abi: multiplyContract.abi,
    address: MULTIPLY_CONTRACT_ADDRESS,
    providerOrAccount: provider,
  });
  const poolContractForTx = new Contract({
    abi: poolContract.abi,
    address: poolContractAddress,
    providerOrAccount: provider,
  });

  // Step 1: Modify delegation (set to true)
  const modifyDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      true
    );

  // Prepare Ekubo swap data if quote is available
  let leverSwap: any[] = [];
  let leverSwapLimitAmount = 0n;

  if (ekuboQuote && ekuboQuote.splits.length > 0) {
    const weights = calculateEkuboWeights(ekuboQuote);

    const slippage: BigIntValue = {
      value: slippageBps,
      decimals: 4,
    };

    // For increase: Quote is exactOut of collateral, totalCalculated is debt needed
    // quotedAmount is the debt amount we're giving
    const quotedAmountValue: BigIntValue = {
      value: quotedAmount,
      decimals: debtAsset.decimals,
    };

    leverSwap = calculateEkuboLeverSwapData(
      collateralAsset,
      quotedAmountValue,
      ekuboQuote,
      weights
    );

    leverSwapLimitAmount = applySlippageToEkuboLimitAmount(
      ekuboQuote.totalCalculated,
      ekuboQuote.type,
      slippage
    );
  }

  // Step 2: Modify lever
  const increaseLeverParams = {
    pool: poolContractAddress,
    collateral_asset: collateralAsset.address,
    debt_asset: debtAsset.address,
    user: account.address,
    add_margin: ZERO_BI.value,
    margin_swap: [],
    margin_swap_limit_amount: ZERO_BI.value,
    lever_swap: leverSwap,
    lever_swap_limit_amount: leverSwapLimitAmount,
  };

  const modifyLeverCall =
    await multiplyContractForTx.populateTransaction.modify_lever({
      action: new CairoCustomEnum({
        IncreaseLever: increaseLeverParams,
      }),
    });

  // Step 3: Revoke delegation (set to false)
  const revokeDelegationCall =
    await poolContractForTx.populateTransaction.modify_delegation(
      MULTIPLY_CONTRACT_ADDRESS,
      false
    );

  const calls = [modifyDelegationCall, modifyLeverCall, revokeDelegationCall];
  return calls;
};
