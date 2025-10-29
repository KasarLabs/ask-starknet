import { Account, uint256 } from 'starknet';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';
import { ERC20_ABI } from '../lib/abis/erc20Abi.js';
import { ContractInteractor } from '../lib/utils/contractInteractor.js';
import { TransactionMonitor } from '../lib/utils/transactionMonitor.js';

/**
 * Service handling token approvals on Starknet
 * @class ApprovalService
 */
export class ApprovalService {
  /**
   * Creates an instance of ApprovalService
   * @param {onchainWrite} env - The onchain write environment for blockchain interactions
   */
  constructor(private env: onchainWrite) {}

  /**
   * Safely stringifies objects containing BigInt values
   * @private
   * @param {unknown} obj - Object to stringify
   * @returns {string} JSON string with BigInt values converted to strings
   */
  private safeStringify(obj: unknown): string {
    return JSON.stringify(
      obj,
      (_, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    );
  }

  /**
   * Checks current token allowance and approves additional amount if necessary
   * @param {Account} account - The Starknet account performing the approval
   * @param {string} tokenAddress - The address of the token contract
   * @param {string} spenderAddress - The address being approved to spend tokens
   * @param {string} amount - The amount to approve
   * @throws {Error} If approval transaction fails
   * @returns {Promise<void>}
   */
  async checkAndApproveToken(
    account: Account,
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ): Promise<void> {
    try {
      const contractInteractor = new ContractInteractor(this.env.provider);
      const transactionMonitor = new TransactionMonitor(this.env.provider);

      const contract = contractInteractor.createContract(
        ERC20_ABI,
        tokenAddress,
        account
      );

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
        contract.connect(account);
        const approveCall = await contract.approve(
          spenderAddress,
          uint256.bnToUint256(amount)
        );

        console.error(
          'Approve transaction sent:',
          this.safeStringify(approveCall)
        );

        if (!approveCall?.transaction_hash) {
          throw new Error('No transaction hash in approve result');
        }

        await transactionMonitor.waitForTransaction(
          approveCall.transaction_hash,
          (status) => console.error('Approve status:', status)
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to approve token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
