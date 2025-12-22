import { Account, Call, Contract } from 'starknet';
import { ERC20_ABI } from '@kasarlabs/ask-starknet-core';
import type { Router } from 'fibrous-router-sdk';
import { getFibrousRouterCtor } from '../lib/utils/fibrousRouterSdk.js';

const FibrousRouterCtor = getFibrousRouterCtor();

export class ApprovalService {
  private fibrous: Router;
  constructor() {
    this.fibrous = new FibrousRouterCtor();
  }

  async checkAndGetApproveToken(
    account: Account,
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<Call | null> {
    try {
      const contract = new Contract({
        abi: ERC20_ABI,
        address: tokenAddress,
        providerOrAccount: account,
      });

      const allowanceResult = await contract.allowance(
        account.address,
        spenderAddress
      );

      let currentAllowance: bigint;
      if (Array.isArray(allowanceResult)) {
        currentAllowance = BigInt(allowanceResult[0].toString());
      } else if (
        typeof allowanceResult === 'object' &&
        allowanceResult !== null
      ) {
        const value: any = Object.values(allowanceResult)[0];
        currentAllowance = BigInt(value.toString());
      } else {
        currentAllowance = BigInt(allowanceResult.toString());
      }

      const requiredAmount = BigInt(amount);

      if (currentAllowance < requiredAmount) {
        const calldata = await this.fibrous.buildApproveStarknet(
          BigInt(amount),
          tokenAddress
        );

        return calldata;
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(
        `Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
