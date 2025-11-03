// Auto-generated from packages/mcp/mcps.json
// DO NOT EDIT MANUALLY - Run 'pnpm generate:mcps-data' to update
// Generated at: 2025-11-03T12:14:24.320Z

export const MCPS_DATA = {
  "argent": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/argent-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": ""
      }
    },
    "description": "Management of Argent accounts on Starknet",
    "promptInfo": {
      "expertise": "Argent wallet accounts on Starknet",
      "tools": [
        "create_new_argent_account",
        "deploy_existing_argent_account"
      ]
    }
  },
  "erc20": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/erc20-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Management of ERC20 operations (transfer, balance, deployment) on Starknet",
    "promptInfo": {
      "expertise": "ERC20 tokens on Starknet",
      "tools": [
        "erc20_get_allowance",
        "erc20_get_my_given_allowance",
        "erc20_get_allowance_given_to_me",
        "erc20_get_total_supply",
        "erc20_transfer_from",
        "erc20_get_own_balance",
        "erc20_get_balance",
        "erc20_approve",
        "erc20_transfer",
        "erc20_deploy_new_contract"
      ]
    }
  },
  "braavos": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/braavos-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": ""
      }
    },
    "description": "Management of Braavos wallet accounts on Starknet",
    "promptInfo": {
      "expertise": "Braavos wallet accounts on Starknet",
      "tools": [
        "create_new_braavos_account",
        "deploy_existing_braavos_account"
      ]
    }
  },
  "avnu": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/avnu-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "AVNU decentralized exchange integration for token swaps on Starknet",
    "promptInfo": {
      "expertise": "AVNU DEX token swapping on Starknet",
      "tools": [
        "avnu_swap_tokens",
        "avnu_get_route"
      ]
    }
  },
  "erc721": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/erc721-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Comprehensive ERC721 NFT operations on Starknet",
    "promptInfo": {
      "expertise": "ERC721 NFTs on Starknet",
      "tools": [
        "erc721_owner_of",
        "erc721_get_balance",
        "erc721_is_approved_for_all",
        "erc721_get_approved",
        "erc721_transfer_from",
        "erc721_transfer",
        "erc721_approve",
        "erc721_safe_transfer_from",
        "erc721_set_approval_for_all",
        "deploy_erc721"
      ]
    }
  },
  "transaction": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/transaction-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Transaction simulation tools for Starknet",
    "promptInfo": {
      "expertise": "Transaction simulation on Starknet",
      "tools": [
        "simulate_transaction",
        "simulate_deploy_transaction",
        "simulate_declare_transaction",
        "simulate_deploy_account_transaction"
      ]
    }
  },
  "artpeace": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/artpeace-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": "",
        "PATH_UPLOAD_DIR": "",
        "SECRET_PHRASE": ""
      }
    },
    "description": "Collaborative pixel art creation on a shared canvas",
    "promptInfo": {
      "expertise": "Pixel art and canvas interaction",
      "tools": [
        "place_pixel"
      ]
    }
  },
  "contract": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/contract-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Starknet contract declaration and deployment operations",
    "promptInfo": {
      "expertise": "Smart contract deployment on Starknet",
      "tools": [
        "declare_contract",
        "deploy_contract",
        "get_constructor_params"
      ]
    }
  },
  "fibrous": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/fibrous-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Fibrous decentralized exchange for single and batch token swaps",
    "promptInfo": {
      "expertise": "Fibrous DEX token swapping",
      "tools": [
        "fibrous_swap",
        "fibrous_batch_swap",
        "fibrous_get_route"
      ]
    }
  },
  "okx": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/okx-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": ""
      }
    },
    "description": "OKX wallet account creation and deployment on Starknet",
    "promptInfo": {
      "expertise": "OKX wallet accounts on Starknet",
      "tools": [
        "create_new_okx_account",
        "deploy_existing_okx_account"
      ]
    }
  },
  "openzeppelin": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/openzeppelin-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": ""
      }
    },
    "description": "OpenZeppelin account contract creation and deployment on Starknet",
    "promptInfo": {
      "expertise": "OpenZeppelin accounts on Starknet",
      "tools": [
        "create_new_openzeppelin_account",
        "deploy_existing_openzeppelin_account"
      ]
    }
  },
  "opus": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/opus-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Opus lending protocol for Trove management and borrowing",
    "promptInfo": {
      "expertise": "Opus lending protocol and Trove management",
      "tools": [
        "open_trove",
        "get_user_troves",
        "get_trove_health",
        "get_borrow_fee",
        "deposit_trove",
        "withdraw_trove",
        "borrow_trove",
        "repay_trove"
      ]
    }
  },
  "starknet-rpc": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/starknet-rpc-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": ""
      }
    },
    "description": "Direct blockchain interaction via RPC methods for on-chain data access",
    "promptInfo": {
      "expertise": "Starknet RPC and blockchain data",
      "tools": [
        "get_chain_id",
        "get_syncing_status",
        "get_class_hash",
        "get_spec_version",
        "get_block_with_tx_hashes",
        "get_block_with_receipts",
        "get_transaction_status",
        "get_block_number",
        "get_block_transaction_count",
        "get_storage_at",
        "get_class",
        "get_class_at"
      ]
    }
  },
  "scarb": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/scarb-mcp"
      ],
      "transport": "stdio"
    },
    "description": "Scarb Cairo compilation and program execution operations",
    "promptInfo": {
      "expertise": "Cairo development and Scarb toolchain",
      "tools": [
        "install_scarb",
        "init_project",
        "build_project",
        "execute_program",
        "prove_program",
        "verify_program"
      ]
    }
  },
  "unruggable": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/unruggable-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Memecoin creation and analysis with focus on safer token launches",
    "promptInfo": {
      "expertise": "Memecoin creation and liquidity management",
      "tools": [
        "is_memecoin",
        "get_locked_liquidity",
        "create_memecoin",
        "launch_on_ekubo"
      ]
    }
  },
  "vesu": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/vesu-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Vesu protocol for deposit and withdrawal operations for earning positions",
    "promptInfo": {
      "expertise": "Vesu protocol yield farming",
      "tools": [
        "vesu_deposit_earn",
        "vesu_withdraw_earn"
      ]
    }
  },
  "ekubo": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/ekubo-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Ekubo decentralized exchange for liquidity management and token swaps",
    "promptInfo": {
      "expertise": "Ekubo DEX liquidity and trading on Starknet",
      "tools": [
        "get_pool_info",
        "get_pool_liquidity",
        "get_pool_fees_per_liquidity",
        "get_token_price",
        "swap",
        "create_position",
        "add_liquidity",
        "withdraw_liquidity",
        "transfer_position"
      ]
    }
  },
  "extended": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/extended-mcp"
      ],
      "transport": "stdio",
      "env": {
        "EXTENDED_API_KEY": "",
        "EXTENDED_API_URL": "",
        "EXTENDED_PRIVATE_KEY": ""
      }
    },
    "description": "Extended high-performance perpetuals exchange on Starknet for trading derivatives with on-chain settlement",
    "promptInfo": {
      "expertise": "Perpetual derivatives trading, market data analysis, position and risk management, order execution, and account management on Extended exchange (Starknet L2)",
      "tools": [
        "extended_get_balance",
        "extended_get_user_account_info",
        "extended_get_positions",
        "extended_get_open_orders",
        "extended_get_order_by_id",
        "extended_get_trades_history",
        "extended_get_orders_history",
        "extended_get_positions_history",
        "extended_get_funding_payments",
        "extended_get_leverage",
        "extended_get_fees",
        "extended_get_bridge_config",
        "extended_get_bridge_quote",
        "extended_get_markets",
        "extended_get_market_stats",
        "extended_get_market_orderbook",
        "extended_get_market_trades",
        "extended_get_candles_history",
        "extended_get_funding_rates_history",
        "extended_create_limit_order",
        "extended_create_limit_order_with_tpsl",
        "extended_create_market_order",
        "extended_add_position_tpsl",
        "extended_cancel_order",
        "extended_update_leverage"
      ]
    }
  },
  "endurfi": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/endurfi-mcp"
      ],
      "transport": "stdio",
      "env": {
        "STARKNET_RPC_URL": "",
        "STARKNET_ACCOUNT_ADDRESS": "",
        "STARKNET_PRIVATE_KEY": ""
      }
    },
    "description": "Endur.fi liquid staking protocol for STRK and BTC tokens (WBTC, tBTC, LBTC) on Starknet",
    "promptInfo": {
      "expertise": "Liquid staking with xSTRK, xyWBTC, xytBTC, and xyLBTC on Endur.fi",
      "tools": [
        "preview_stake",
        "preview_unstake",
        "get_user_balance",
        "get_total_staked",
        "get_withdraw_request_info",
        "stake",
        "unstake",
        "claim"
      ]
    }
  },
  "cairo-coder": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/cairo-coder-mcp"
      ],
      "transport": "stdio",
      "env": {
        "CAIRO_CODER_API_KEY": ""
      }
    },
    "description": "AI-powered Cairo code assistance and Starknet general knowledge via Cairo Coder API",
    "promptInfo": {
      "expertise": "Cairo smart contract development, Starknet technical documentation, ecosystem knowledge, and recent Starknet news",
      "tools": [
        "assist_with_cairo",
        "starknet_general_knowledge"
      ]
    }
  },
  "ask-starknet-help": {
    "client": {
      "command": "npx",
      "args": [
        "-y",
        "@kasarlabs/ask-starknet-help-mcp"
      ],
      "transport": "stdio"
    },
    "description": "Help and documentation for Ask Starknet: usage guide, architecture explanation, capabilities listing, project ideas, and troubleshooting",
    "promptInfo": {
      "expertise": "Ask Starknet help, usage guide, documentation, architecture explanation, available MCPs and tools, project ideas, and troubleshooting",
      "tools": [
        "ask_starknet_help",
        "ask_starknet_explain_architecture",
        "ask_starknet_list_capabilities",
        "ask_starknet_suggest_projects"
      ]
    }
  }
} as const;

export type McpName = keyof typeof MCPS_DATA;

export type McpConfig = typeof MCPS_DATA[McpName];
