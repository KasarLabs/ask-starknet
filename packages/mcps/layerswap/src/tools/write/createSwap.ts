import { onchainWrite, toolResult } from '@kasarlabs/ask-starknet-core';
import { LayerswapApiClient } from '../../lib/utils/apiClient.js';
import { CreateSwapSchemaType } from '../../schemas/index.js';
import { getDepositActions } from '../read/getDepositActions.js';

export const createSwap = async (
  apiClient: LayerswapApiClient,
  params: CreateSwapSchemaType,
  env?: onchainWrite
): Promise<toolResult> => {
  try {
    const sourceAddress =
      params.source_address ?? env?.account.address ?? undefined;

    const body: CreateSwapSchemaType = {
      destination_address: params.destination_address,
      source_network: params.source_network.toUpperCase(),
      source_token: params.source_token.toUpperCase(),
      destination_network: params.destination_network.toUpperCase(),
      destination_token: params.destination_token.toUpperCase(),
      amount: params.amount,
      refund_address: params.refund_address,
    };

    // Add optional fields only if they are defined
    if (params.reference_id !== undefined) {
      body.reference_id = params.reference_id;
    }
    if (params.source_exchange !== undefined) {
      body.source_exchange = params.source_exchange;
    }
    if (params.destination_exchange !== undefined) {
      body.destination_exchange = params.destination_exchange;
    }
    if (params.refuel !== undefined) {
      body.refuel = params.refuel;
    }
    body.use_deposit_address = params.use_deposit_address ?? false;
    if (params.use_new_deposit_address !== undefined) {
      body.use_new_deposit_address = params.use_new_deposit_address;
    }
    if (sourceAddress !== undefined && sourceAddress !== null) {
      body.source_address = sourceAddress;
    }
    if (params.slippage !== undefined && params.slippage !== null) {
      // Convert from percentage (10 = 10%) to decimal (0.1 = 10%) for API
      body.slippage = (parseFloat(params.slippage) / 100).toString();
    }

    const response = await apiClient.post<any>('/api/v2/swaps', body);
    const swap = response.data;
    // Execute deposit_actions[0].call_data on Starknet if available
    // Only execute on-chain if source_address matches the environment account address
    const shouldExecuteOnChain =
      env &&
      swap.swap.id &&
      sourceAddress &&
      env.account.address &&
      sourceAddress.toLowerCase() === env.account.address.toLowerCase();
    let transactionHash: string | undefined;
    if (shouldExecuteOnChain) {
      let depositActions: unknown = null;

      // First, check if deposit_actions are in the swap response
      if (
        swap.deposit_actions &&
        Array.isArray(swap.deposit_actions) &&
        swap.deposit_actions.length > 0
      ) {
        depositActions = swap.deposit_actions;
      } else {
        // If not, fetch them using getDepositActions
        const depositActionsResult = await getDepositActions(apiClient, {
          swap_id: swap.swap.id,
          source_address: sourceAddress,
        });

        if (
          depositActionsResult.status === 'success' &&
          depositActionsResult.data
        ) {
          // The response might be an object with deposit_actions array or the array itself
          depositActions = Array.isArray(depositActionsResult.data)
            ? depositActionsResult.data
            : depositActionsResult.data.deposit_actions;
        }
      }

      // Execute the first deposit action if available
      if (
        depositActions &&
        Array.isArray(depositActions) &&
        depositActions.length > 0
      ) {
        const depositAction = depositActions[0];

        if (depositAction.call_data) {
          const account = env.account;
          let calls: any[];

          try {
            // call_data is a JSON string that needs to be parsed
            const callDataStr = depositAction.call_data;

            // Parse the JSON string
            const parsedCallData = JSON.parse(callDataStr);

            // Ensure it's an array
            calls = Array.isArray(parsedCallData)
              ? parsedCallData
              : [parsedCallData];

            const result = await account.execute(calls);
            transactionHash = result.transaction_hash;

            await env.provider.waitForTransaction(transactionHash);
          } catch (parseError) {
            throw new Error(
              `Failed to parse or execute call_data: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
            );
          }
        } else {
          // No call_data found - log warning but don't fail the swap creation
        }
      }
    }

    return {
      status: 'success',
      data: {
        ...(transactionHash && { deposit_transaction_hash: transactionHash }),
        ...swap,
      },
    } as toolResult;
  } catch (error) {
    return {
      status: 'failure',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
