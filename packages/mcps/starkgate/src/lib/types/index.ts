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

export interface CheckDepositStatusResult {
  status: 'success' | 'failure';
  deposit_status?:
    | 'PENDING'
    | 'ACCEPTED_ON_L2'
    | 'NOT_FOUND'
    | 'FAILED'
    | 'CONSUMED';
  l1_tx_hash?: string;
  l2_tx_hash?: string;
  message?: string;
  error?: string;
}

export interface CheckWithdrawalReadyResult {
  status: 'success' | 'failure';
  withdrawal_status?: 'PENDING' | 'READY_TO_CLAIM' | 'CLAIMED' | 'NOT_FOUND';
  l2_tx_hash?: string;
  proof_available?: boolean;
  estimated_ready_time?: string;
  message?: string;
  error?: string;
}

export interface BridgedToken {
  symbol: string;
  name: string;
  l1_token_address: string;
  l2_token_address: string;
  l1_bridge_address: string;
  l2_bridge_address: string;
}

export interface ListBridgedTokensResult {
  status: 'success' | 'failure';
  network?: string;
  tokens?: BridgedToken[];
  error?: string;
}

export interface BridgeAddresses {
  L1_BRIDGE: string;
  L2_BRIDGE: string;
  L1_TOKEN: string;
  L2_TOKEN: string;
}
