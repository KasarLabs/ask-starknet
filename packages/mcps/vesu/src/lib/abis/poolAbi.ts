export const poolAbi = [
  {
    type: 'impl',
    name: 'PoolImpl',
    interface_name: 'vesu::pool::IPool',
  },
  {
    type: 'struct',
    name: 'core::integer::u256',
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
    type: 'enum',
    name: 'core::bool',
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
    type: 'struct',
    name: 'vesu::data_model::AssetConfig',
    members: [
      {
        name: 'total_collateral_shares',
        type: 'core::integer::u256',
      },
      {
        name: 'total_nominal_debt',
        type: 'core::integer::u256',
      },
      {
        name: 'reserve',
        type: 'core::integer::u256',
      },
      {
        name: 'max_utilization',
        type: 'core::integer::u256',
      },
      {
        name: 'floor',
        type: 'core::integer::u256',
      },
      {
        name: 'scale',
        type: 'core::integer::u256',
      },
      {
        name: 'is_legacy',
        type: 'core::bool',
      },
      {
        name: 'last_updated',
        type: 'core::integer::u64',
      },
      {
        name: 'last_rate_accumulator',
        type: 'core::integer::u256',
      },
      {
        name: 'last_full_utilization_rate',
        type: 'core::integer::u256',
      },
      {
        name: 'fee_rate',
        type: 'core::integer::u256',
      },
      {
        name: 'fee_shares',
        type: 'core::integer::u256',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::AssetPrice',
    members: [
      {
        name: 'value',
        type: 'core::integer::u256',
      },
      {
        name: 'is_valid',
        type: 'core::bool',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::Position',
    members: [
      {
        name: 'collateral_shares',
        type: 'core::integer::u256',
      },
      {
        name: 'nominal_debt',
        type: 'core::integer::u256',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::Context',
    members: [
      {
        name: 'collateral_asset',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'debt_asset',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'collateral_asset_config',
        type: 'vesu::data_model::AssetConfig',
      },
      {
        name: 'debt_asset_config',
        type: 'vesu::data_model::AssetConfig',
      },
      {
        name: 'collateral_asset_price',
        type: 'vesu::data_model::AssetPrice',
      },
      {
        name: 'debt_asset_price',
        type: 'vesu::data_model::AssetPrice',
      },
      {
        name: 'max_ltv',
        type: 'core::integer::u64',
      },
      {
        name: 'user',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'position',
        type: 'vesu::data_model::Position',
      },
    ],
  },
  {
    type: 'struct',
    name: 'alexandria_math::i257::i257',
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
    type: 'enum',
    name: 'vesu::data_model::AmountDenomination',
    variants: [
      {
        name: 'Native',
        type: '()',
      },
      {
        name: 'Assets',
        type: '()',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::Amount',
    members: [
      {
        name: 'denomination',
        type: 'vesu::data_model::AmountDenomination',
      },
      {
        name: 'value',
        type: 'alexandria_math::i257::i257',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::ModifyPositionParams',
    members: [
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
        name: 'collateral',
        type: 'vesu::data_model::Amount',
      },
      {
        name: 'debt',
        type: 'vesu::data_model::Amount',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::UpdatePositionResponse',
    members: [
      {
        name: 'collateral_delta',
        type: 'alexandria_math::i257::i257',
      },
      {
        name: 'collateral_shares_delta',
        type: 'alexandria_math::i257::i257',
      },
      {
        name: 'debt_delta',
        type: 'alexandria_math::i257::i257',
      },
      {
        name: 'nominal_debt_delta',
        type: 'alexandria_math::i257::i257',
      },
      {
        name: 'bad_debt',
        type: 'core::integer::u256',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::LiquidatePositionParams',
    members: [
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
        name: 'min_collateral_to_receive',
        type: 'core::integer::u256',
      },
      {
        name: 'debt_to_repay',
        type: 'core::integer::u256',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::Pair',
    members: [
      {
        name: 'total_collateral_shares',
        type: 'core::integer::u256',
      },
      {
        name: 'total_nominal_debt',
        type: 'core::integer::u256',
      },
    ],
  },
  {
    type: 'struct',
    name: 'vesu::data_model::PairConfig',
    members: [
      {
        name: 'max_ltv',
        type: 'core::integer::u64',
      },
      {
        name: 'liquidation_factor',
        type: 'core::integer::u64',
      },
      {
        name: 'debt_cap',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    type: 'interface',
    name: 'vesu::pool::IPool',
    items: [
      {
        type: 'function',
        name: 'pair_config',
        inputs: [
          {
            name: 'collateral_asset',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'debt_asset',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'vesu::data_model::PairConfig',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'price',
        inputs: [
          {
            name: 'asset',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'vesu::data_model::AssetPrice',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'asset_config',
        inputs: [
          {
            name: 'asset',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'vesu::data_model::AssetConfig',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'modify_position',
        inputs: [
          {
            name: 'params',
            type: 'vesu::data_model::ModifyPositionParams',
          },
        ],
        outputs: [
          {
            type: 'vesu::data_model::UpdatePositionResponse',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'modify_delegation',
        inputs: [
          {
            name: 'delegatee',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'delegation',
            type: 'core::bool',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
] as const;
