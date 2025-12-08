export const BRIDGE_L2_DAI_TO_ETHEREUM_ABI = [
  {
    name: 'Uint256',
    size: 2,
    type: 'struct',
    members: [
      {
        name: 'low',
        type: 'felt',
        offset: 0,
      },
      {
        name: 'high',
        type: 'felt',
        offset: 1,
      },
    ],
  },
  {
    data: [
      {
        name: 'user',
        type: 'felt',
      },
    ],
    keys: [],
    name: 'Rely',
    type: 'event',
  },
  {
    data: [
      {
        name: 'user',
        type: 'felt',
      },
    ],
    keys: [],
    name: 'Deny',
    type: 'event',
  },
  {
    data: [],
    keys: [],
    name: 'Closed',
    type: 'event',
  },
  {
    data: [
      {
        name: 'l1_recipient',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
      {
        name: 'caller',
        type: 'felt',
      },
    ],
    keys: [],
    name: 'withdraw_initiated',
    type: 'event',
  },
  {
    data: [
      {
        name: 'account',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
    ],
    keys: [],
    name: 'deposit_handled',
    type: 'event',
  },
  {
    data: [
      {
        name: 'l1_recipient',
        type: 'felt',
      },
      {
        name: 'amount',
        type: 'Uint256',
      },
      {
        name: 'sender',
        type: 'felt',
      },
    ],
    keys: [],
    name: 'force_withdrawal_handled',
    type: 'event',
  },
  {
    name: 'is_open',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: 'res',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'dai',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: 'res',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'registry',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: 'res',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'bridge',
    type: 'function',
    inputs: [],
    outputs: [
      {
        name: 'res',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'wards',
    type: 'function',
    inputs: [
      {
        name: 'user',
        type: 'felt',
      },
    ],
    outputs: [
      {
        name: 'res',
        type: 'felt',
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'rely',
    type: 'function',
    inputs: [
      {
        name: 'user',
        type: 'felt',
      },
    ],
    outputs: [],
  },
  {
    name: 'deny',
    type: 'function',
    inputs: [
      {
        name: 'user',
        type: 'felt',
      },
    ],
    outputs: [],
  },
  {
    name: 'close',
    type: 'function',
    inputs: [],
    outputs: [],
  },
  {
    name: 'constructor',
    type: 'constructor',
    inputs: [
      {
        name: 'ward',
        type: 'felt',
      },
      {
        name: 'dai',
        type: 'felt',
      },
      {
        name: 'bridge',
        type: 'felt',
      },
      {
        name: 'registry',
        type: 'felt',
      },
    ],
    outputs: [],
  },
  {
    name: 'initiate_withdraw',
    type: 'function',
    inputs: [
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
    name: 'handle_deposit',
    type: 'l1_handler',
    inputs: [
      {
        name: 'from_address',
        type: 'felt',
      },
      {
        name: 'l2_recipient',
        type: 'felt',
      },
      {
        name: 'amount_low',
        type: 'felt',
      },
      {
        name: 'amount_high',
        type: 'felt',
      },
      {
        name: 'sender_address',
        type: 'felt',
      },
    ],
    outputs: [],
  },
  {
    name: 'handle_force_withdrawal',
    type: 'l1_handler',
    inputs: [
      {
        name: 'from_address',
        type: 'felt',
      },
      {
        name: 'l2_sender',
        type: 'felt',
      },
      {
        name: 'l1_recipient',
        type: 'felt',
      },
      {
        name: 'amount_low',
        type: 'felt',
      },
      {
        name: 'amount_high',
        type: 'felt',
      },
    ],
    outputs: [],
  },
];
