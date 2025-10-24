import { get_transfer_msg as wasmLibGetTransferMsgHash } from '@x10xchange/stark-crypto-wrapper-wasm';

import { type StarknetDomain } from '../../api/starknet.schema.js';
import { fromHexString, type HexString } from '../hex.js';
import { type Long } from '../number.js';
import { jsGetTransferMsgHash } from './js/js-get-transfer-msg-hash.js';

type GetStarknetTransferMsgHashArgs = {
  amount: Long;
  assetId: HexString;
  expirationTimestamp: number;
  nonce: Long;
  receiverPositionId: Long;
  senderPositionId: Long;
  senderPublicKey: HexString;
  starknetDomain: StarknetDomain;
};

export const getStarknetTransferMsgHash = ({
  amount,
  assetId,
  expirationTimestamp,
  nonce,
  receiverPositionId,
  senderPositionId,
  senderPublicKey,
  starknetDomain,
}: GetStarknetTransferMsgHashArgs) => {
  const getTransferHashArgs = [
    /* recipient_position_id */ receiverPositionId.toString(10),
    /* sender_position_id    */ senderPositionId.toString(10),
    /* collateral_id_hex     */ assetId,
    /* amount                */ amount.toString(10),
    /* expiration            */ expirationTimestamp.toString(10),
    /* salt                  */ nonce.toString(10),
    /* user_public_key_hex   */ senderPublicKey,
    /* domain_name           */ starknetDomain.name,
    /* domain_version        */ starknetDomain.version,
    /* domain_chain_id       */ starknetDomain.chainId,
    /* domain_revision       */ starknetDomain.revision.toString(),
  ] as const;

  try {
    const wasmHash = wasmLibGetTransferMsgHash(...getTransferHashArgs);

    return fromHexString(wasmHash as HexString);
  } catch {
    const jsHash = jsGetTransferMsgHash(...getTransferHashArgs);

    return fromHexString(jsHash as HexString);
  }
};
