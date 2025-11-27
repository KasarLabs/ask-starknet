/**
 * ERC20 ABI for transfer and balance operations
 * Used in tests for token transfers
 */
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      {
        name: 'recipient',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'amount',
        type: 'core::integer::u256',
      },
    ],
    outputs: [
      {
        type: 'core::bool',
      },
    ],
    state_mutability: 'external',
  },
  {
    type: 'function',
    name: 'balance_of',
    inputs: [
      {
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
    outputs: [
      {
        type: 'core::integer::u256',
      },
    ],
    state_mutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [
      {
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
    outputs: [
      {
        type: 'core::integer::u256',
      },
    ],
    state_mutability: 'view',
  },
] as const;

