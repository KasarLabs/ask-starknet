import {
  Account,
  Contract,
  Call,
  CallData,
  hash,
  EstimateFeeResponseOverhead,
} from 'starknet';
import {
  BaseUtilityClass,
  ContractDeployResult,
  TransactionResult,
} from '../types/index.js';

export class ContractInteractor implements BaseUtilityClass {
  constructor(public provider: any) {}

  async deployContract(
    account: Account,
    classHash: string,
    constructorCalldata: any[] = [],
    salt?: string
  ): Promise<ContractDeployResult> {
    try {
      const deployPayload = {
        classHash,
        constructorCalldata: CallData.compile(constructorCalldata),
        salt: salt || hash.getSelectorFromName(Math.random().toString()),
      };

      const { transaction_hash, contract_address } =
        await account.deploy(deployPayload);
      await this.provider.waitForTransaction(transaction_hash);

      return {
        transactionHash: transaction_hash,
        contractAddress: contract_address,
      };
    } catch (error) {
      throw new Error(`Failed to deploy contract: ${error.message}`);
    }
  }

  async estimateContractDeploy(
    account: Account,
    classHash: string,
    constructorCalldata: any[] = [],
    salt?: string
  ): Promise<EstimateFeeResponseOverhead> {
    try {
      const deployPayload = {
        classHash,
        constructorCalldata: CallData.compile(constructorCalldata),
        salt: salt || hash.getSelectorFromName(Math.random().toString()),
      };

      return account.estimateDeployFee(deployPayload);
    } catch (error) {
      throw new Error(`Failed to estimate contract deploy: ${error.message}`);
    }
  }

  async multicall(account: Account, calls: Call[]): Promise<TransactionResult> {
    try {
      const { transaction_hash } = await account.execute(calls);
      await this.provider.waitForTransaction(transaction_hash);

      return {
        status: 'success',
        transactionHash: transaction_hash,
      };
    } catch (error) {
      return {
        status: 'failure',
        error: error.message,
      };
    }
  }

  async estimateMulticall(
    account: Account,
    calls: Call[]
  ): Promise<EstimateFeeResponseOverhead> {
    try {
      return account.estimateInvokeFee(calls);
    } catch (error) {
      throw new Error(`Failed to estimate multicall: ${error.message}`);
    }
  }

  createContract(abi: any[], address: string, account?: Account): Contract {
    return new Contract({
      abi,
      address,
      providerOrAccount: account || this.provider,
    });
  }

  async readContract(
    contract: Contract,
    method: string,
    args: any[] = []
  ): Promise<any> {
    try {
      return await contract.call(method, args);
    } catch (error) {
      throw new Error(`Failed to read contract: ${error.message}`);
    }
  }

  async writeContract(
    contract: Contract,
    method: string,
    args: any[] = []
  ): Promise<TransactionResult> {
    try {
      const { transaction_hash } = await contract.invoke(method, args);
      await this.provider.waitForTransaction(transaction_hash);

      return {
        status: 'success',
        transactionHash: transaction_hash,
      };
    } catch (error) {
      return {
        status: 'failure',
        error: error.message,
      };
    }
  }

  async estimateContractWrite(
    contract: Contract,
    method: string,
    args: any[] = []
  ): Promise<EstimateFeeResponseOverhead> {
    if (!contract.account) {
      throw new Error(
        'Contract must be connected to an account to estimate fees'
      );
    }

    try {
      const estimate = await contract.estimate(method, args);
      // Handle both possible return types from starknet 8.9.0+
      if ('overall_fee' in estimate) {
        return estimate as EstimateFeeResponseOverhead;
      }
      throw new Error('Unexpected estimate response format');
    } catch (error) {
      throw new Error(`Failed to estimate contract write: ${error.message}`);
    }
  }

  formatTokenAmount(amount: string | number, decimals: number = 18): string {
    if (decimals < 0) {
      throw new Error('Decimals must be non-negative');
    }
    const value = typeof amount === 'string' ? amount : amount.toString();
    const [whole, fraction = ''] = value.split('.');
    const truncatedFraction = fraction.slice(0, decimals).padEnd(decimals, '0');
    return whole + truncatedFraction;
  }

  parseTokenAmount(amount: string, decimals: number = 18): string {
    const amountBigInt = BigInt(amount);
    const divisor = BigInt(10) ** BigInt(decimals);
    const wholePart = amountBigInt / divisor;
    const fractionPart = amountBigInt % divisor;
    const paddedFraction = fractionPart.toString().padStart(decimals, '0');
    return `${wholePart}.${paddedFraction}`;
  }
}
