import { type AccountInfo } from '../api/account-info.schema.ts'
import { type StarknetDomain } from '../api/starknet.schema.ts'
import { type HexString } from '../utils/hex.ts'

export type SettlementSignature = { r: string; s: string }
export type TransferContext = {
  accounts: AccountInfo[]
  collateralId: HexString
  collateralResolution: number
  starkPrivateKey: HexString
  starknetDomain: StarknetDomain
}
