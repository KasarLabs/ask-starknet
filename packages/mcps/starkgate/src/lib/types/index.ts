/**
 * Type definitions for Starkgate MCP
 */

export interface DepositResult {
  status: 'success' | 'failure';
  token?: string;
  amount?: string;
  l1_tx_hash?: string;
  l2_recipient?: string;
  estimated_l2_arrival?: string;
  error?: string;
  step?: string;
}

export interface WithdrawResult {
  status: 'success' | 'failure';
  token?: string;
  amount?: string;
  l2_tx_hash?: string;
  l1_recipient?: string;
  message?: string;
  error?: string;
  step?: string;
}

export interface BridgeAddresses {
  L1_BRIDGE: string;
  L2_BRIDGE: string;
  L1_TOKEN: string;
  L2_TOKEN: string;
}
