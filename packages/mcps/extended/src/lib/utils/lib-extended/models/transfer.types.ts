import { type AccountInfo } from '../api/account-info.schema.js';
import { type StarknetDomain } from '../api/starknet.schema.js';
import { type HexString } from '../utils/hex.js';

export type SettlementSignature = { r: string; s: string };
export type TransferContext = {
  accounts: AccountInfo[];
  collateralId: HexString;
  collateralResolution: number;
  starkPrivateKey: HexString;
  starknetDomain: StarknetDomain;
};
