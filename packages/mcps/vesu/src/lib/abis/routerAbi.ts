export const routerAbi = [
  {
    type: 'struct',
    name: 'ekubo::types::keys::PoolKey',
    members: [
      {
        name: 'token0',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'token1',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      { name: 'fee', type: 'core::integer::u128' },
      { name: 'tick_spacing', type: 'core::integer::u128' },
      {
        name: 'extension',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::router::RouteNode',
    members: [
      { name: 'pool_key', type: 'ekubo::types::keys::PoolKey' },
      { name: 'sqrt_ratio_limit', type: 'core::integer::u256' },
      { name: 'skip_ahead', type: 'core::integer::u128' },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::types::i129::i129',
    members: [
      { name: 'mag', type: 'core::integer::u128' },
      { name: 'sign', type: 'core::bool' },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::router::TokenAmount',
    members: [
      {
        name: 'token',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      { name: 'amount', type: 'ekubo::types::i129::i129' },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::router::Swap',
    members: [
      { name: 'route', type: 'core::array::Array::<ekubo::router::RouteNode>' },
      { name: 'token_amount', type: 'ekubo::router::TokenAmount' },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::types::delta::Delta',
    members: [
      { name: 'amount0', type: 'ekubo::types::i129::i129' },
      { name: 'amount1', type: 'ekubo::types::i129::i129' },
    ],
  },
  {
    type: 'interface',
    name: 'ekubo::router::IRouter',
    items: [
      {
        type: 'function',
        name: 'quote_multi_multihop_swap',
        inputs: [
          { name: 'swaps', type: 'core::array::Array::<ekubo::router::Swap>' },
        ],
        outputs: [
          {
            type: 'core::array::Array::<core::array::Array::<ekubo::types::delta::Delta>>',
          },
        ],
        state_mutability: 'view',
      },
    ],
  },
] as const;
