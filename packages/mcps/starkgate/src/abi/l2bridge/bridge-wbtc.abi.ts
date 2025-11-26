export const BRIDGE_L2_WBTC_TO_ETHEREUM_ABI = [
  {
    name: 'TokenBridgeAdmin',
    type: 'impl',
    interface_name: 'src::token_bridge_admin_interface::ITokenBridgeAdmin',
  },
  {
    name: 'core::starknet::eth_address::EthAddress',
    type: 'struct',
    members: [
      {
        name: 'address',
        type: 'core::felt252',
      },
    ],
  },
  {
    name: 'src::token_bridge_admin_interface::ITokenBridgeAdmin',
    type: 'interface',
    items: [
      {
        name: 'get_erc20_class_hash',
        type: 'function',
        inputs: [],
        outputs: [
          {
            type: 'core::starknet::class_hash::ClassHash',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'get_l2_token_governance',
        type: 'function',
        inputs: [],
        outputs: [
          {
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'set_l1_bridge',
        type: 'function',
        inputs: [
          {
            name: 'l1_bridge_address',
            type: 'core::starknet::eth_address::EthAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'set_erc20_class_hash',
        type: 'function',
        inputs: [
          {
            name: 'erc20_class_hash',
            type: 'core::starknet::class_hash::ClassHash',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'set_l2_token_governance',
        type: 'function',
        inputs: [
          {
            name: 'l2_token_governance',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'enable_withdrawal_limit',
        type: 'function',
        inputs: [
          {
            name: 'l1_token',
            type: 'core::starknet::eth_address::EthAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'disable_withdrawal_limit',
        type: 'function',
        inputs: [
          {
            name: 'l1_token',
            type: 'core::starknet::eth_address::EthAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    name: 'TokenBridge',
    type: 'impl',
    interface_name: 'src::token_bridge_interface::ITokenBridge',
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
    name: 'src::token_bridge_interface::ITokenBridge',
    type: 'interface',
    items: [
      {
        name: 'get_version',
        type: 'function',
        inputs: [],
        outputs: [
          {
            type: 'core::felt252',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'get_identity',
        type: 'function',
        inputs: [],
        outputs: [
          {
            type: 'core::felt252',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'get_l1_token',
        type: 'function',
        inputs: [
          {
            name: 'l2_token',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::starknet::eth_address::EthAddress',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'get_l2_token',
        type: 'function',
        inputs: [
          {
            name: 'l1_token',
            type: 'core::starknet::eth_address::EthAddress',
          },
        ],
        outputs: [
          {
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'get_remaining_withdrawal_quota',
        type: 'function',
        inputs: [
          {
            name: 'l1_token',
            type: 'core::starknet::eth_address::EthAddress',
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
        name: 'initiate_withdraw',
        type: 'function',
        inputs: [
          {
            name: 'l1_recipient',
            type: 'core::starknet::eth_address::EthAddress',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'initiate_token_withdraw',
        type: 'function',
        inputs: [
          {
            name: 'l1_token',
            type: 'core::starknet::eth_address::EthAddress',
          },
          {
            name: 'l1_recipient',
            type: 'core::starknet::eth_address::EthAddress',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    name: 'Replaceable',
    type: 'impl',
    interface_name: 'src::replaceability_interface::IReplaceable',
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
    name: 'src::replaceability_interface::EICData',
    type: 'struct',
    members: [
      {
        name: 'eic_hash',
        type: 'core::starknet::class_hash::ClassHash',
      },
      {
        name: 'eic_init_data',
        type: 'core::array::Span::<core::felt252>',
      },
    ],
  },
  {
    name: 'core::option::Option::<src::replaceability_interface::EICData>',
    type: 'enum',
    variants: [
      {
        name: 'Some',
        type: 'src::replaceability_interface::EICData',
      },
      {
        name: 'None',
        type: '()',
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
    name: 'src::replaceability_interface::ImplementationData',
    type: 'struct',
    members: [
      {
        name: 'impl_hash',
        type: 'core::starknet::class_hash::ClassHash',
      },
      {
        name: 'eic_data',
        type: 'core::option::Option::<src::replaceability_interface::EICData>',
      },
      {
        name: 'final',
        type: 'core::bool',
      },
    ],
  },
  {
    name: 'src::replaceability_interface::IReplaceable',
    type: 'interface',
    items: [
      {
        name: 'get_upgrade_delay',
        type: 'function',
        inputs: [],
        outputs: [
          {
            type: 'core::integer::u64',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'get_impl_activation_time',
        type: 'function',
        inputs: [
          {
            name: 'implementation_data',
            type: 'src::replaceability_interface::ImplementationData',
          },
        ],
        outputs: [
          {
            type: 'core::integer::u64',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'add_new_implementation',
        type: 'function',
        inputs: [
          {
            name: 'implementation_data',
            type: 'src::replaceability_interface::ImplementationData',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_implementation',
        type: 'function',
        inputs: [
          {
            name: 'implementation_data',
            type: 'src::replaceability_interface::ImplementationData',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'replace_to',
        type: 'function',
        inputs: [
          {
            name: 'implementation_data',
            type: 'src::replaceability_interface::ImplementationData',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    name: 'AccessControlImplExternal',
    type: 'impl',
    interface_name: 'src::access_control_interface::IAccessControl',
  },
  {
    name: 'src::access_control_interface::IAccessControl',
    type: 'interface',
    items: [
      {
        name: 'has_role',
        type: 'function',
        inputs: [
          {
            name: 'role',
            type: 'core::felt252',
          },
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'get_role_admin',
        type: 'function',
        inputs: [
          {
            name: 'role',
            type: 'core::felt252',
          },
        ],
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
    name: 'RolesImpl',
    type: 'impl',
    interface_name: 'src::roles_interface::IRoles',
  },
  {
    name: 'src::roles_interface::IRoles',
    type: 'interface',
    items: [
      {
        name: 'is_app_governor',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'is_app_role_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'is_governance_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'is_operator',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'is_token_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'is_upgrade_governor',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'is_security_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'is_security_agent',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [
          {
            type: 'core::bool',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'register_app_governor',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_app_governor',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'register_app_role_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_app_role_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'register_governance_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_governance_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'register_operator',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_operator',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'register_token_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_token_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'register_upgrade_governor',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_upgrade_governor',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'renounce',
        type: 'function',
        inputs: [
          {
            name: 'role',
            type: 'core::felt252',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'register_security_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_security_admin',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'register_security_agent',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'remove_security_agent',
        type: 'function',
        inputs: [
          {
            name: 'account',
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    name: 'constructor',
    type: 'constructor',
    inputs: [
      {
        name: 'upgrade_delay',
        type: 'core::integer::u64',
      },
    ],
  },
  {
    name: 'handle_deposit',
    type: 'l1_handler',
    inputs: [
      {
        name: 'from_address',
        type: 'core::felt252',
      },
      {
        name: 'l2_recipient',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'amount',
        type: 'core::integer::u256',
      },
    ],
    outputs: [],
    state_mutability: 'external',
  },
  {
    name: 'handle_token_deposit',
    type: 'l1_handler',
    inputs: [
      {
        name: 'from_address',
        type: 'core::felt252',
      },
      {
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        name: 'depositor',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        name: 'l2_recipient',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'amount',
        type: 'core::integer::u256',
      },
    ],
    outputs: [],
    state_mutability: 'external',
  },
  {
    name: 'handle_deposit_with_message',
    type: 'l1_handler',
    inputs: [
      {
        name: 'from_address',
        type: 'core::felt252',
      },
      {
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        name: 'depositor',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        name: 'l2_recipient',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        name: 'amount',
        type: 'core::integer::u256',
      },
      {
        name: 'message',
        type: 'core::array::Span::<core::felt252>',
      },
    ],
    outputs: [],
    state_mutability: 'external',
  },
  {
    name: 'handle_token_deployment',
    type: 'l1_handler',
    inputs: [
      {
        name: 'from_address',
        type: 'core::felt252',
      },
      {
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        name: 'name',
        type: 'core::felt252',
      },
      {
        name: 'symbol',
        type: 'core::felt252',
      },
      {
        name: 'decimals',
        type: 'core::integer::u8',
      },
    ],
    outputs: [],
    state_mutability: 'external',
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::L1BridgeSet',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'l1_bridge_address',
        type: 'core::starknet::eth_address::EthAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::Erc20ClassHashStored',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'previous_hash',
        type: 'core::starknet::class_hash::ClassHash',
      },
      {
        kind: 'data',
        name: 'erc20_class_hash',
        type: 'core::starknet::class_hash::ClassHash',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::L2TokenGovernanceChanged',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'previous_governance',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'new_governance',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::withdraw_initiated',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'l1_recipient',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        kind: 'data',
        name: 'amount',
        type: 'core::integer::u256',
      },
      {
        kind: 'data',
        name: 'caller_address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::WithdrawInitiated',
    type: 'event',
    members: [
      {
        kind: 'key',
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        kind: 'key',
        name: 'l1_recipient',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        kind: 'data',
        name: 'amount',
        type: 'core::integer::u256',
      },
      {
        kind: 'key',
        name: 'caller_address',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::deposit_handled',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'amount',
        type: 'core::integer::u256',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::DepositHandled',
    type: 'event',
    members: [
      {
        kind: 'key',
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        kind: 'key',
        name: 'l2_recipient',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'amount',
        type: 'core::integer::u256',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::DepositWithMessageHandled',
    type: 'event',
    members: [
      {
        kind: 'key',
        name: 'depositor',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        kind: 'key',
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        kind: 'key',
        name: 'l2_recipient',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'amount',
        type: 'core::integer::u256',
      },
      {
        kind: 'data',
        name: 'message',
        type: 'core::array::Span::<core::felt252>',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::DeployHandled',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
      {
        kind: 'data',
        name: 'name',
        type: 'core::felt252',
      },
      {
        kind: 'data',
        name: 'symbol',
        type: 'core::felt252',
      },
      {
        kind: 'data',
        name: 'decimals',
        type: 'core::integer::u8',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::WithdrawalLimitEnabled',
    type: 'event',
    members: [
      {
        kind: 'key',
        name: 'sender',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'key',
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::token_bridge::TokenBridge::WithdrawalLimitDisabled',
    type: 'event',
    members: [
      {
        kind: 'key',
        name: 'sender',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'key',
        name: 'l1_token',
        type: 'core::starknet::eth_address::EthAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::replaceability_interface::ImplementationAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'implementation_data',
        type: 'src::replaceability_interface::ImplementationData',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::replaceability_interface::ImplementationRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'implementation_data',
        type: 'src::replaceability_interface::ImplementationData',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::replaceability_interface::ImplementationReplaced',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'implementation_data',
        type: 'src::replaceability_interface::ImplementationData',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::replaceability_interface::ImplementationFinalized',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'impl_hash',
        type: 'core::starknet::class_hash::ClassHash',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::access_control_interface::RoleGranted',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'role',
        type: 'core::felt252',
      },
      {
        kind: 'data',
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'sender',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::access_control_interface::RoleRevoked',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'role',
        type: 'core::felt252',
      },
      {
        kind: 'data',
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'sender',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::access_control_interface::RoleAdminChanged',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'role',
        type: 'core::felt252',
      },
      {
        kind: 'data',
        name: 'previous_admin_role',
        type: 'core::felt252',
      },
      {
        kind: 'data',
        name: 'new_admin_role',
        type: 'core::felt252',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::AppGovernorAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'added_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'added_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::AppGovernorRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'removed_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'removed_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::AppRoleAdminAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'added_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'added_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::AppRoleAdminRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'removed_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'removed_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::GovernanceAdminAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'added_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'added_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::GovernanceAdminRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'removed_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'removed_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::OperatorAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'added_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'added_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::OperatorRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'removed_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'removed_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::TokenAdminAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'added_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'added_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::TokenAdminRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'removed_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'removed_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::UpgradeGovernorAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'added_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'added_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::UpgradeGovernorRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'removed_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'removed_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::SecurityAdminAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'added_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'added_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::SecurityAdminRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'removed_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'removed_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::SecurityAgentAdded',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'added_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'added_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'src::roles_interface::SecurityAgentRemoved',
    type: 'event',
    members: [
      {
        kind: 'data',
        name: 'removed_account',
        type: 'core::starknet::contract_address::ContractAddress',
      },
      {
        kind: 'data',
        name: 'removed_by',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'enum',
    name: 'src::token_bridge::TokenBridge::Event',
    type: 'event',
    variants: [
      {
        kind: 'nested',
        name: 'L1BridgeSet',
        type: 'src::token_bridge::TokenBridge::L1BridgeSet',
      },
      {
        kind: 'nested',
        name: 'Erc20ClassHashStored',
        type: 'src::token_bridge::TokenBridge::Erc20ClassHashStored',
      },
      {
        kind: 'nested',
        name: 'L2TokenGovernanceChanged',
        type: 'src::token_bridge::TokenBridge::L2TokenGovernanceChanged',
      },
      {
        kind: 'nested',
        name: 'withdraw_initiated',
        type: 'src::token_bridge::TokenBridge::withdraw_initiated',
      },
      {
        kind: 'nested',
        name: 'WithdrawInitiated',
        type: 'src::token_bridge::TokenBridge::WithdrawInitiated',
      },
      {
        kind: 'nested',
        name: 'deposit_handled',
        type: 'src::token_bridge::TokenBridge::deposit_handled',
      },
      {
        kind: 'nested',
        name: 'DepositHandled',
        type: 'src::token_bridge::TokenBridge::DepositHandled',
      },
      {
        kind: 'nested',
        name: 'DepositWithMessageHandled',
        type: 'src::token_bridge::TokenBridge::DepositWithMessageHandled',
      },
      {
        kind: 'nested',
        name: 'DeployHandled',
        type: 'src::token_bridge::TokenBridge::DeployHandled',
      },
      {
        kind: 'nested',
        name: 'WithdrawalLimitEnabled',
        type: 'src::token_bridge::TokenBridge::WithdrawalLimitEnabled',
      },
      {
        kind: 'nested',
        name: 'WithdrawalLimitDisabled',
        type: 'src::token_bridge::TokenBridge::WithdrawalLimitDisabled',
      },
      {
        kind: 'nested',
        name: 'ImplementationAdded',
        type: 'src::replaceability_interface::ImplementationAdded',
      },
      {
        kind: 'nested',
        name: 'ImplementationRemoved',
        type: 'src::replaceability_interface::ImplementationRemoved',
      },
      {
        kind: 'nested',
        name: 'ImplementationReplaced',
        type: 'src::replaceability_interface::ImplementationReplaced',
      },
      {
        kind: 'nested',
        name: 'ImplementationFinalized',
        type: 'src::replaceability_interface::ImplementationFinalized',
      },
      {
        kind: 'nested',
        name: 'RoleGranted',
        type: 'src::access_control_interface::RoleGranted',
      },
      {
        kind: 'nested',
        name: 'RoleRevoked',
        type: 'src::access_control_interface::RoleRevoked',
      },
      {
        kind: 'nested',
        name: 'RoleAdminChanged',
        type: 'src::access_control_interface::RoleAdminChanged',
      },
      {
        kind: 'nested',
        name: 'AppGovernorAdded',
        type: 'src::roles_interface::AppGovernorAdded',
      },
      {
        kind: 'nested',
        name: 'AppGovernorRemoved',
        type: 'src::roles_interface::AppGovernorRemoved',
      },
      {
        kind: 'nested',
        name: 'AppRoleAdminAdded',
        type: 'src::roles_interface::AppRoleAdminAdded',
      },
      {
        kind: 'nested',
        name: 'AppRoleAdminRemoved',
        type: 'src::roles_interface::AppRoleAdminRemoved',
      },
      {
        kind: 'nested',
        name: 'GovernanceAdminAdded',
        type: 'src::roles_interface::GovernanceAdminAdded',
      },
      {
        kind: 'nested',
        name: 'GovernanceAdminRemoved',
        type: 'src::roles_interface::GovernanceAdminRemoved',
      },
      {
        kind: 'nested',
        name: 'OperatorAdded',
        type: 'src::roles_interface::OperatorAdded',
      },
      {
        kind: 'nested',
        name: 'OperatorRemoved',
        type: 'src::roles_interface::OperatorRemoved',
      },
      {
        kind: 'nested',
        name: 'TokenAdminAdded',
        type: 'src::roles_interface::TokenAdminAdded',
      },
      {
        kind: 'nested',
        name: 'TokenAdminRemoved',
        type: 'src::roles_interface::TokenAdminRemoved',
      },
      {
        kind: 'nested',
        name: 'UpgradeGovernorAdded',
        type: 'src::roles_interface::UpgradeGovernorAdded',
      },
      {
        kind: 'nested',
        name: 'UpgradeGovernorRemoved',
        type: 'src::roles_interface::UpgradeGovernorRemoved',
      },
      {
        kind: 'nested',
        name: 'SecurityAdminAdded',
        type: 'src::roles_interface::SecurityAdminAdded',
      },
      {
        kind: 'nested',
        name: 'SecurityAdminRemoved',
        type: 'src::roles_interface::SecurityAdminRemoved',
      },
      {
        kind: 'nested',
        name: 'SecurityAgentAdded',
        type: 'src::roles_interface::SecurityAgentAdded',
      },
      {
        kind: 'nested',
        name: 'SecurityAgentRemoved',
        type: 'src::roles_interface::SecurityAgentRemoved',
      },
    ],
  },
];
