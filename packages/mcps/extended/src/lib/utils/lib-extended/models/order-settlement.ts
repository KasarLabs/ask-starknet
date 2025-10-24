import { toHexString } from '../utils/hex.js';
import { type Long } from '../utils/number.js';
import { type SettlementSignature } from './order.types.js';

export class OrderSettlement {
  private readonly signature: SettlementSignature;
  private readonly starkKey: string;
  private readonly collateralPosition: Long;

  constructor(settlement: {
    signature: SettlementSignature;
    starkKey: string;
    collateralPosition: Long;
  }) {
    this.signature = settlement.signature;
    this.starkKey = settlement.starkKey;
    this.collateralPosition = settlement.collateralPosition;
  }

  toJSON() {
    return {
      signature: {
        r: toHexString(this.signature.r),
        s: toHexString(this.signature.s),
      },
      starkKey: toHexString(this.starkKey),
      collateralPosition: this.collateralPosition.toString(10),
    };
  }
}
