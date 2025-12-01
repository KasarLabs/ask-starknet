export const multiplyAbi = [
  {
    name: 'LockerImpl',
    type: 'impl',
    interface_name: 'ekubo::interfaces::core::ILocker',
  },
  {
    name: 'core::array::Span::<core::felt252>',
    type: 'struct',
    members: [
      {
        name: 'snapshot',
        type: '@core::array::Array::<core::felt252>',
      },
    ],
  },
  {
    name: 'ekubo::interfaces::core::ILocker',
    type: 'interface',
    items: [
      {
        name: 'locked',
        type: 'function',
        inputs: [
          {
            name: 'id',
            type: 'core::integer::u32',
          },
          {
            name: 'data',
            type: 'core::array::Span::<core::felt252>',
          },
        ],
        outputs: [
          {
            type: 'core::array::Span::<core::felt252>',
          },
        ],
        state_mutability: 'external',
      },
    ],
  },
  {
    name: 'MultiplyImpl',
    type: 'impl',
    interface_name: 'vesu_v2_periphery::multiply::IMultiply',
  },
  {
    name: 'ekubo::types::keys::PoolKey',
    type: 'struct',
    members: [
      {
        name: 'token0',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'token1',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'fee',
        type: 'core::integer::u128',
      },
      {
        name: 'tick_spacing',
        type: 'core::integer::u128',
      },
      {
        name: 'extension',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    name: 'core::integer::u256',
    type: 'struct',
    members: [
      {
        name: 'low',
        type: 'core::integer::u128',
      },
      {
        name: 'high',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::swap::RouteNode',
    type: 'struct',
    members: [
      {
        name: 'pool_key',
        type: 'ekubo::types::keys::PoolKey',
      },
      {
        name: 'sqrt_ratio_limit',
        type: 'core::integer::u256',
      },
      {
        name: 'skip_ahead',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    name: 'core::bool',
    type: 'enum',
    variants: [
      {
        name: 'False',
        type: '()',
      },
      {
        name: 'True',
        type: '()',
      },
    ],
  },
  {
    name: 'ekubo::types::i129::i129',
    type: 'struct',
    members: [
      {
        name: 'mag',
        type: 'core::integer::u128',
      },
      {
        name: 'sign',
        type: 'core::bool',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::swap::TokenAmount',
    type: 'struct',
    members: [
      {
        name: 'token',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'amount',
        type: 'ekubo::types::i129::i129',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::swap::Swap',
    type: 'struct',
    members: [
      {
        name: 'route',
        type: 'core::array::Array::<vesu_v2_periphery::swap::RouteNode>',
      },
      {
        name: 'token_amount',
        type: 'vesu_v2_periphery::swap::TokenAmount',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::multiply::IncreaseLeverParams',
    type: 'struct',
    members: [
      {
        name: 'pool',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'collateral_asset',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'debt_asset',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'user',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'add_margin',
        type: 'core::integer::u128',
      },
      {
        name: 'margin_swap',
        type: 'core::array::Array::<vesu_v2_periphery::swap::Swap>',
      },
      {
        name: 'margin_swap_limit_amount',
        type: 'core::integer::u128',
      },
      {
        name: 'lever_swap',
        type: 'core::array::Array::<vesu_v2_periphery::swap::Swap>',
      },
      {
        name: 'lever_swap_limit_amount',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::multiply::DecreaseLeverParams',
    type: 'struct',
    members: [
      {
        name: 'pool',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'collateral_asset',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'debt_asset',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'user',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'sub_margin',
        type: 'core::integer::u128',
      },
      {
        name: 'recipient',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'lever_swap',
        type: 'core::array::Array::<vesu_v2_periphery::swap::Swap>',
      },
      {
        name: 'lever_swap_limit_amount',
        type: 'core::integer::u128',
      },
      {
        name: 'lever_swap_weights',
        type: 'core::array::Array::<core::integer::u128>',
      },
      {
        name: 'withdraw_swap',
        type: 'core::array::Array::<vesu_v2_periphery::swap::Swap>',
      },
      {
        name: 'withdraw_swap_limit_amount',
        type: 'core::integer::u128',
      },
      {
        name: 'withdraw_swap_weights',
        type: 'core::array::Array::<core::integer::u128>',
      },
      {
        name: 'close_position',
        type: 'core::bool',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::multiply::ModifyLeverAction',
    type: 'enum',
    variants: [
      {
        name: 'IncreaseLever',
        type: 'vesu_v2_periphery::multiply::IncreaseLeverParams',
      },
      {
        name: 'DecreaseLever',
        type: 'vesu_v2_periphery::multiply::DecreaseLeverParams',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::multiply::ModifyLeverParams',
    type: 'struct',
    members: [
      {
        name: 'action',
        type: 'vesu_v2_periphery::multiply::ModifyLeverAction',
      },
    ],
  },
  {
    name: 'alexandria_math::i257::i257',
    type: 'struct',
    members: [
      {
        name: 'abs',
        type: 'core::integer::u256',
      },
      {
        name: 'is_negative',
        type: 'core::bool',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::multiply::ModifyLeverResponse',
    type: 'struct',
    members: [
      {
        name: 'collateral_delta',
        type: 'alexandria_math::i257::i257',
      },
      {
        name: 'debt_delta',
        type: 'alexandria_math::i257::i257',
      },
      {
        name: 'margin_delta',
        type: 'alexandria_math::i257::i257',
      },
    ],
  },
  {
    name: 'vesu_v2_periphery::multiply::IMultiply',
    type: 'interface',
    items: [
      {
        name: 'modify_lever',
        type: 'function',
        inputs: [
          {
            name: 'modify_lever_params',
            type: 'vesu_v2_periphery::multiply::ModifyLeverParams',
          },
        ],
        outputs: [
          {
            type: 'vesu_v2_periphery::multiply::ModifyLeverResponse',
          },
        ],
        state_mutability: 'external',
      },
    ],
  },
] as const;
