export const EKUBO_CORE_ABI = [
  {
    type: 'impl',
    name: 'CoreHasInterface',
    interface_name: 'ekubo::components::upgradeable::IHasInterface',
  },
  {
    type: 'interface',
    name: 'ekubo::components::upgradeable::IHasInterface',
    items: [
      {
        type: 'function',
        name: 'get_primary_interface_id',
        inputs: [],
        outputs: [
          {
            type: 'core::felt252',
          },
        ],
        state_mutability: 'view',
      },
    ],
  },
  {
    type: 'impl',
    name: 'Core',
    interface_name: 'ekubo::interfaces::core::ICore',
  },
  {
    type: 'struct',
    name: 'ekubo::interfaces::core::LockerState',
    members: [
      {
        name: 'address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'nonzero_delta_count',
        type: 'core::integer::u32',
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
    name: 'ekubo::types::i129::i129',
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
    type: 'struct',
    name: 'ekubo::types::pool_price::PoolPrice',
    members: [
      {
        name: 'sqrt_ratio',
        type: 'core::integer::u256',
      },
      {
        name: 'tick',
        type: 'ekubo::types::i129::i129',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::types::fees_per_liquidity::FeesPerLiquidity',
    members: [
      {
        name: 'value0',
        type: 'core::felt252',
      },
      {
        name: 'value1',
        type: 'core::felt252',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::types::bounds::Bounds',
    members: [
      {
        name: 'lower',
        type: 'ekubo::types::i129::i129',
      },
      {
        name: 'upper',
        type: 'ekubo::types::i129::i129',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::types::keys::PositionKey',
    members: [
      {
        name: 'salt',
        type: 'core::felt252',
      },
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'bounds',
        type: 'ekubo::types::bounds::Bounds',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::types::position::Position',
    members: [
      {
        name: 'liquidity',
        type: 'core::integer::u128',
      },
      {
        name: 'fees_per_liquidity_inside_last',
        type: 'ekubo::types::fees_per_liquidity::FeesPerLiquidity',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::interfaces::core::GetPositionWithFeesResult',
    members: [
      {
        name: 'position',
        type: 'ekubo::types::position::Position',
      },
      {
        name: 'fees0',
        type: 'core::integer::u128',
      },
      {
        name: 'fees1',
        type: 'core::integer::u128',
      },
      {
        name: 'fees_per_liquidity_inside_current',
        type: 'ekubo::types::fees_per_liquidity::FeesPerLiquidity',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::types::keys::SavedBalanceKey',
    members: [
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'token',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'salt',
        type: 'core::felt252',
      },
    ],
  },
  {
    type: 'struct',
    name: 'core::array::Span::<core::felt252>',
    members: [
      {
        name: 'snapshot',
        type: '@core::array::Array::<core::felt252>',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::interfaces::core::IForwardeeDispatcher',
    members: [
      {
        name: 'contract_address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    type: 'enum',
    name: 'core::option::Option::<core::integer::u256>',
    variants: [
      {
        name: 'Some',
        type: 'core::integer::u256',
      },
      {
        name: 'None',
        type: '()',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::interfaces::core::UpdatePositionParameters',
    members: [
      {
        name: 'salt',
        type: 'core::felt252',
      },
      {
        name: 'bounds',
        type: 'ekubo::types::bounds::Bounds',
      },
      {
        name: 'liquidity_delta',
        type: 'ekubo::types::i129::i129',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::types::delta::Delta',
    members: [
      {
        name: 'amount0',
        type: 'ekubo::types::i129::i129',
      },
      {
        name: 'amount1',
        type: 'ekubo::types::i129::i129',
      },
    ],
  },
  {
    type: 'struct',
    name: 'ekubo::interfaces::core::SwapParameters',
    members: [
      {
        name: 'amount',
        type: 'ekubo::types::i129::i129',
      },
      {
        name: 'is_token1',
        type: 'core::bool',
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
    type: 'struct',
    name: 'ekubo::types::call_points::CallPoints',
    members: [
      {
        name: 'before_initialize_pool',
        type: 'core::bool',
      },
      {
        name: 'after_initialize_pool',
        type: 'core::bool',
      },
      {
        name: 'before_swap',
        type: 'core::bool',
      },
      {
        name: 'after_swap',
        type: 'core::bool',
      },
      {
        name: 'before_update_position',
        type: 'core::bool',
      },
      {
        name: 'after_update_position',
        type: 'core::bool',
      },
      {
        name: 'before_collect_fees',
        type: 'core::bool',
      },
      {
        name: 'after_collect_fees',
        type: 'core::bool',
      },
    ],
  },
  {
    type: 'interface',
    name: 'ekubo::interfaces::core::ICore',
    items: [
      {
        type: 'function',
        name: 'get_protocol_fees_collected',
        inputs: [
          {
            name: 'token',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_locker_state',
        inputs: [
          {
            name: 'id',
            type: 'core::integer::u32',
          },
        ],
        outputs: [
          {
            type: 'ekubo::interfaces::core::LockerState',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_locker_delta',
        inputs: [
          {
            name: 'id',
            type: 'core::integer::u32',
          },
          {
            name: 'token_address',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::i129::i129',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_pool_price',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::pool_price::PoolPrice',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_pool_liquidity',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_pool_fees_per_liquidity',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::fees_per_liquidity::FeesPerLiquidity',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_pool_fees_per_liquidity_inside',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'bounds',
            type: 'ekubo::types::bounds::Bounds',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::fees_per_liquidity::FeesPerLiquidity',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_pool_tick_liquidity_delta',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'index',
            type: 'ekubo::types::i129::i129',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::i129::i129',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_pool_tick_liquidity_net',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'index',
            type: 'ekubo::types::i129::i129',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_pool_tick_fees_outside',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'index',
            type: 'ekubo::types::i129::i129',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::fees_per_liquidity::FeesPerLiquidity',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_position',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'position_key',
            type: 'ekubo::types::keys::PositionKey',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::position::Position',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_position_with_fees',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'position_key',
            type: 'ekubo::types::keys::PositionKey',
          },
        ],
        outputs: [
          {
            type: 'ekubo::interfaces::core::GetPositionWithFeesResult',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_saved_balance',
        inputs: [
          {
            name: 'key',
            type: 'ekubo::types::keys::SavedBalanceKey',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'next_initialized_tick',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'from',
            type: 'ekubo::types::i129::i129',
          },
          {
            name: 'skip_ahead',
            type: 'core::integer::u128',
          },
        ],
        outputs: [
          {
            type: '(ekubo::types::i129::i129, core::bool)',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'prev_initialized_tick',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'from',
            type: 'ekubo::types::i129::i129',
          },
          {
            name: 'skip_ahead',
            type: 'core::integer::u128',
          },
        ],
        outputs: [
          {
            type: '(ekubo::types::i129::i129, core::bool)',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'withdraw_all_protocol_fees',
        inputs: [
          {
            name: 'recipient',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'token',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'withdraw_protocol_fees',
        inputs: [
          {
            name: 'recipient',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'token',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'amount',
            type: 'core::integer::u128',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'lock',
        inputs: [
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
      {
        type: 'function',
        name: 'forward',
        inputs: [
          {
            name: 'to',
            type: 'ekubo::interfaces::core::IForwardeeDispatcher',
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
      {
        type: 'function',
        name: 'withdraw',
        inputs: [
          {
            name: 'token_address',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'recipient',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'amount',
            type: 'core::integer::u128',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'save',
        inputs: [
          {
            name: 'key',
            type: 'ekubo::types::keys::SavedBalanceKey',
          },
          {
            name: 'amount',
            type: 'core::integer::u128',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'pay',
        inputs: [
          {
            name: 'token_address',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'load',
        inputs: [
          {
            name: 'token',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'salt',
            type: 'core::felt252',
          },
          {
            name: 'amount',
            type: 'core::integer::u128',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u128',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'initialize_pool',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'initial_tick',
            type: 'ekubo::types::i129::i129',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u256',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'maybe_initialize_pool',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'initial_tick',
            type: 'ekubo::types::i129::i129',
          },
        ],
        outputs: [
          {
            type: 'core::option::Option::<core::integer::u256>',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'update_position',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'params',
            type: 'ekubo::interfaces::core::UpdatePositionParameters',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::delta::Delta',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'collect_fees',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'salt',
            type: 'core::felt252',
          },
          {
            name: 'bounds',
            type: 'ekubo::types::bounds::Bounds',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::delta::Delta',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'swap',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'params',
            type: 'ekubo::interfaces::core::SwapParameters',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::delta::Delta',
          },
        ],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'accumulate_as_fees',
        inputs: [
          {
            name: 'pool_key',
            type: 'ekubo::types::keys::PoolKey',
          },
          {
            name: 'amount0',
            type: 'core::integer::u128',
          },
          {
            name: 'amount1',
            type: 'core::integer::u128',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'set_call_points',
        inputs: [
          {
            name: 'call_points',
            type: 'ekubo::types::call_points::CallPoints',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'get_call_points',
        inputs: [
          {
            name: 'extension',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'ekubo::types::call_points::CallPoints',
          },
        ],
        state_mutability: 'view',
      },
    ],
  },
  {
    type: 'impl',
    name: 'Owned',
    interface_name: 'ekubo::components::owned::IOwned',
  },
  {
    type: 'interface',
    name: 'ekubo::components::owned::IOwned',
    items: [
      {
        type: 'function',
        name: 'get_owner',
        inputs: [],
        outputs: [
          {
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'transfer_ownership',
        inputs: [
          {
            name: 'new_owner',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    type: 'impl',
    name: 'Upgradeable',
    interface_name: 'ekubo::interfaces::upgradeable::IUpgradeable',
  },
  {
    type: 'interface',
    name: 'ekubo::interfaces::upgradeable::IUpgradeable',
    items: [
      {
        type: 'function',
        name: 'replace_class_hash',
        inputs: [
          {
            name: 'class_hash',
            type: 'core::starknet::class_hash::ClassHash',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    type: 'constructor',
    name: 'constructor',
    inputs: [
      {
        name: 'owner',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::components::upgradeable::Upgradeable::ClassHashReplaced',
    kind: 'struct',
    members: [
      {
        name: 'new_class_hash',
        type: 'core::starknet::class_hash::ClassHash',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::components::upgradeable::Upgradeable::Event',
    kind: 'enum',
    variants: [
      {
        name: 'ClassHashReplaced',
        type: 'ekubo::components::upgradeable::Upgradeable::ClassHashReplaced',
        kind: 'nested',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::components::owned::Owned::OwnershipTransferred',
    kind: 'struct',
    members: [
      {
        name: 'old_owner',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'new_owner',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::components::owned::Owned::Event',
    kind: 'enum',
    variants: [
      {
        name: 'OwnershipTransferred',
        type: 'ekubo::components::owned::Owned::OwnershipTransferred',
        kind: 'nested',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::ProtocolFeesPaid',
    kind: 'struct',
    members: [
      {
        name: 'pool_key',
        type: 'ekubo::types::keys::PoolKey',
        kind: 'data',
      },
      {
        name: 'position_key',
        type: 'ekubo::types::keys::PositionKey',
        kind: 'data',
      },
      {
        name: 'delta',
        type: 'ekubo::types::delta::Delta',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::ProtocolFeesWithdrawn',
    kind: 'struct',
    members: [
      {
        name: 'recipient',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'token',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'amount',
        type: 'core::integer::u128',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::PoolInitialized',
    kind: 'struct',
    members: [
      {
        name: 'pool_key',
        type: 'ekubo::types::keys::PoolKey',
        kind: 'data',
      },
      {
        name: 'initial_tick',
        type: 'ekubo::types::i129::i129',
        kind: 'data',
      },
      {
        name: 'sqrt_ratio',
        type: 'core::integer::u256',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::PositionUpdated',
    kind: 'struct',
    members: [
      {
        name: 'locker',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'pool_key',
        type: 'ekubo::types::keys::PoolKey',
        kind: 'data',
      },
      {
        name: 'params',
        type: 'ekubo::interfaces::core::UpdatePositionParameters',
        kind: 'data',
      },
      {
        name: 'delta',
        type: 'ekubo::types::delta::Delta',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::PositionFeesCollected',
    kind: 'struct',
    members: [
      {
        name: 'pool_key',
        type: 'ekubo::types::keys::PoolKey',
        kind: 'data',
      },
      {
        name: 'position_key',
        type: 'ekubo::types::keys::PositionKey',
        kind: 'data',
      },
      {
        name: 'delta',
        type: 'ekubo::types::delta::Delta',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::Swapped',
    kind: 'struct',
    members: [
      {
        name: 'locker',
        type: 'core::starknet::contract_address::ContractAddress',
        kind: 'data',
      },
      {
        name: 'pool_key',
        type: 'ekubo::types::keys::PoolKey',
        kind: 'data',
      },
      {
        name: 'params',
        type: 'ekubo::interfaces::core::SwapParameters',
        kind: 'data',
      },
      {
        name: 'delta',
        type: 'ekubo::types::delta::Delta',
        kind: 'data',
      },
      {
        name: 'sqrt_ratio_after',
        type: 'core::integer::u256',
        kind: 'data',
      },
      {
        name: 'tick_after',
        type: 'ekubo::types::i129::i129',
        kind: 'data',
      },
      {
        name: 'liquidity_after',
        type: 'core::integer::u128',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::SavedBalance',
    kind: 'struct',
    members: [
      {
        name: 'key',
        type: 'ekubo::types::keys::SavedBalanceKey',
        kind: 'data',
      },
      {
        name: 'amount',
        type: 'core::integer::u128',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::LoadedBalance',
    kind: 'struct',
    members: [
      {
        name: 'key',
        type: 'ekubo::types::keys::SavedBalanceKey',
        kind: 'data',
      },
      {
        name: 'amount',
        type: 'core::integer::u128',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::FeesAccumulated',
    kind: 'struct',
    members: [
      {
        name: 'pool_key',
        type: 'ekubo::types::keys::PoolKey',
        kind: 'data',
      },
      {
        name: 'amount0',
        type: 'core::integer::u128',
        kind: 'data',
      },
      {
        name: 'amount1',
        type: 'core::integer::u128',
        kind: 'data',
      },
    ],
  },
  {
    type: 'event',
    name: 'ekubo::core::Core::Event',
    kind: 'enum',
    variants: [
      {
        name: 'UpgradeableEvent',
        type: 'ekubo::components::upgradeable::Upgradeable::Event',
        kind: 'flat',
      },
      {
        name: 'OwnedEvent',
        type: 'ekubo::components::owned::Owned::Event',
        kind: 'nested',
      },
      {
        name: 'ProtocolFeesPaid',
        type: 'ekubo::core::Core::ProtocolFeesPaid',
        kind: 'nested',
      },
      {
        name: 'ProtocolFeesWithdrawn',
        type: 'ekubo::core::Core::ProtocolFeesWithdrawn',
        kind: 'nested',
      },
      {
        name: 'PoolInitialized',
        type: 'ekubo::core::Core::PoolInitialized',
        kind: 'nested',
      },
      {
        name: 'PositionUpdated',
        type: 'ekubo::core::Core::PositionUpdated',
        kind: 'nested',
      },
      {
        name: 'PositionFeesCollected',
        type: 'ekubo::core::Core::PositionFeesCollected',
        kind: 'nested',
      },
      {
        name: 'Swapped',
        type: 'ekubo::core::Core::Swapped',
        kind: 'nested',
      },
      {
        name: 'SavedBalance',
        type: 'ekubo::core::Core::SavedBalance',
        kind: 'nested',
      },
      {
        name: 'LoadedBalance',
        type: 'ekubo::core::Core::LoadedBalance',
        kind: 'nested',
      },
      {
        name: 'FeesAccumulated',
        type: 'ekubo::core::Core::FeesAccumulated',
        kind: 'nested',
      },
    ],
  },
];
