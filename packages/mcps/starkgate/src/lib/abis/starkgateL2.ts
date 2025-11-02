/**
 * Starkgate L2 Bridge Contract ABI (Cairo contracts on Starknet)
 */

export const STARKGATE_L2_ABI = [
  {
    name: 'initiate_withdraw',
    type: 'function',
    inputs: [
      {
        name: 'l1_token',
        type: 'felt',
      },
      {
        name: 'l1_recipient',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
    ],
    outputs: [],
  },
  {
    name: 'initiate_token_withdraw',
    type: 'function',
    inputs: [
      {
        name: 'l1_token',
        type: 'felt',
      },
      {
        name: 'l1_recipient',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
    ],
    outputs: [],
  },
] as const;
