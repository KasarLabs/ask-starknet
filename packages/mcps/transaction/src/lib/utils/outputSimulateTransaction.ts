import {
  SimulateTransactionOverheadResponse,
  SimulateTransactionResponse,
} from 'starknet';

export const TransactionReponseFormat = (
  transactionResponse: SimulateTransactionOverheadResponse
): Array<{
  transaction_number: number;
  fee_estimation: {
    title: string;
    details: any;
  };
  resource_bounds: {
    l1_gas: {
      max_amount: string;
      max_price_per_unit: string;
    };
    l2_gas: {
      max_amount: string;
      max_price_per_unit: string;
    };
  };
}> => {
  const transactionDetails = transactionResponse.map((transaction, index) => {
    const overall_fee = transaction.overall_fee.toString();
    const resourceBounds = transaction.resourceBounds;

    return {
      transaction_number: index + 1,

      fee_estimation: {
        title: 'Fee Estimation Breakdown',
        details: {
          overall_fee: overall_fee,
        },
      },

      resource_bounds: {
        l1_gas: {
          max_amount: resourceBounds.l1_gas.max_amount.toString(),
          max_price_per_unit:
            resourceBounds.l1_gas.max_price_per_unit.toString(),
        },
        l2_gas: {
          max_amount: resourceBounds.l2_gas.max_amount.toString(),
          max_price_per_unit:
            resourceBounds.l2_gas.max_price_per_unit.toString(),
        },
      },
    };
  });
  return transactionDetails;
};
