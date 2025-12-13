import { describe, beforeAll, it, expect } from '@jest/globals';
import {
  getOnchainRead,
  getOnchainWrite,
  getDataAsRecord,
  getERC20Balance,
  parseFormattedBalance,
} from '@kasarlabs/ask-starknet-core';
import { createSwap } from '../../src/tools/write/createSwap.js';
import { getNetworks } from '../../src/tools/read/getNetworks.js';
import { getSources } from '../../src/tools/read/getSources.js';
import { getDestinations } from '../../src/tools/read/getDestinations.js';
import { getQuote } from '../../src/tools/read/getQuote.js';
import { getDetailedQuote } from '../../src/tools/read/getDetailedQuote.js';
import { getSwapDetails } from '../../src/tools/read/getSwapDetails.js';
import { getAllSwaps } from '../../src/tools/read/getAllSwaps.js';
import { getDepositActions } from '../../src/tools/read/getDepositActions.js';
import { getSwapRouteLimits } from '../../src/tools/read/getSwapRouteLimits.js';
import { getTransactionStatus } from '../../src/tools/read/getTransactionStatus.js';
import { LayerswapApiClient } from '../../src/lib/utils/apiClient.js';
import { getApiKey, getApiUrl } from '../../src/lib/config.js';
import * as ethers from 'ethers';

// STRK token address on Starknet mainnet
const STRK_ADDRESS =
  '0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
const STRK_DECIMALS = 18;

let starknetAccountAddress: string;
let ethereumRecipientAddress: string;
let apiClient: LayerswapApiClient;
let createdSwapId: string | undefined;
let createdTransactionHash: string | undefined;

describe('Layerswap E2E Tests', () => {
  beforeAll(async () => {
    starknetAccountAddress = process.env.STARKNET_ACCOUNT_ADDRESS || '0x0';

    if (starknetAccountAddress === '0x0') {
      throw new Error(
        'STARKNET_ACCOUNT_ADDRESS must be set in environment variables'
      );
    }

    if (!process.env.STARKNET_RPC_URL) {
      throw new Error('STARKNET_RPC_URL must be set in environment variables');
    }

    if (!process.env.ETHEREUM_RPC_URL) {
      throw new Error('ETHEREUM_RPC_URL must be set in environment variables');
    }

    if (!process.env.ETHEREUM_PRIVATE_KEY) {
      throw new Error(
        'ETHEREUM_PRIVATE_KEY must be set in environment variables'
      );
    }

    const ethProvider = new ethers.ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL
    );
    const ethWallet = new ethers.ethers.Wallet(
      process.env.ETHEREUM_PRIVATE_KEY,
      ethProvider
    );
    ethereumRecipientAddress = ethWallet.address;

    const apiKey = getApiKey();
    const apiUrl = getApiUrl();
    apiClient = new LayerswapApiClient(apiKey, apiUrl);
  });

  describe('Create Swap - Transfer STRK from Starknet to Ethereum', () => {
    it('should create a swap to transfer 1 STRK from Starknet to Ethereum wallet', async () => {
      const onchainRead = getOnchainRead();
      const onchainWrite = getOnchainWrite();
      const swapAmount = 5;

      const balanceBefore = await getERC20Balance(
        onchainRead.provider,
        STRK_ADDRESS,
        starknetAccountAddress
      );

      const swapAmountBigInt = parseFormattedBalance(
        swapAmount.toString(),
        STRK_DECIMALS
      );
      if (balanceBefore < swapAmountBigInt) {
        throw new Error(
          `Insufficient STRK balance. Required: ${swapAmount} STRK, Available: ${ethers.formatUnits(balanceBefore, STRK_DECIMALS)} STRK`
        );
      }

      const swapResult = await createSwap(
        apiClient,
        {
          destination_address: ethereumRecipientAddress,
          source_network: 'STARKNET_MAINNET',
          source_token: 'STRK',
          destination_network: 'ETHEREUM_MAINNET',
          destination_token: 'STRK',
          amount: swapAmount,
          refund_address: starknetAccountAddress,
        },
        onchainWrite
      );

      expect(swapResult.status).toBe('success');
      if (swapResult.status === 'success' && swapResult.data) {
        const swapData = getDataAsRecord(swapResult.data);

        // Verify deposit_actions structure
        expect(swapData.deposit_actions).toBeDefined();
        expect(Array.isArray(swapData.deposit_actions)).toBe(true);
        if (swapData.deposit_actions.length > 0) {
          const depositAction = swapData.deposit_actions[0];
          expect(depositAction.type).toBeDefined();
          expect(depositAction.to_address).toBeDefined();
          expect(depositAction.amount).toBeDefined();
          expect(depositAction.call_data).toBeDefined();
        }

        // Verify swap structure
        expect(swapData.swap).toBeDefined();
        const swap = getDataAsRecord(swapData.swap);

        expect(swap.id).toBeDefined();
        expect(typeof swap.id).toBe('string');

        // Verify source_network is now an object
        expect(swap.source_network).toBeDefined();
        const sourceNetwork = getDataAsRecord(swap.source_network);
        expect(sourceNetwork.name).toBe('STARKNET_MAINNET');

        // Verify source_token is now an object
        expect(swap.source_token).toBeDefined();
        const sourceToken = getDataAsRecord(swap.source_token);
        expect(sourceToken.symbol).toBe('STRK');

        // Verify destination_network is now an object
        expect(swap.destination_network).toBeDefined();
        const destinationNetwork = getDataAsRecord(swap.destination_network);
        expect(destinationNetwork.name).toBe('ETHEREUM_MAINNET');

        // Verify destination_token is now an object
        expect(swap.destination_token).toBeDefined();
        const destinationToken = getDataAsRecord(swap.destination_token);
        expect(destinationToken.symbol).toBe('STRK');

        expect(swap.requested_amount).toBe(swapAmount);
        expect(swap.destination_address).toBeDefined();
        expect(swap.destination_address.toLowerCase()).toBe(
          ethereumRecipientAddress.toLowerCase()
        );
        expect(swap.status).toBeDefined();

        // Store swap_id for use in read tests
        createdSwapId = swap.id;

        // Store transaction hash for use in read tests
        if (swapData.deposit_transaction_hash) {
          createdTransactionHash = swapData.deposit_transaction_hash;
          expect(swapData.deposit_transaction_hash).toMatch(/^0x[0-9a-fA-F]+$/);
        }

        // Verify quote structure
        expect(swapData.quote).toBeDefined();
        const quote = getDataAsRecord(swapData.quote);
        expect(quote.requested_amount).toBe(swapAmount);
        expect(quote.receive_amount).toBeDefined();
        expect(quote.total_fee).toBeDefined();
      } else {
        throw new Error(
          `Swap creation failed: ${swapResult.error || 'Unknown error'}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      const balanceAfter = await getERC20Balance(
        onchainRead.provider,
        STRK_ADDRESS,
        starknetAccountAddress
      );

      if (swapResult.status === 'success' && swapResult.data) {
        const swapData = getDataAsRecord(swapResult.data);
        if (swapData.deposit_transaction_hash) {
          const balanceDifference = balanceBefore - balanceAfter;
          expect(balanceAfter).toBeLessThan(balanceBefore);
          expect(balanceDifference).toBeGreaterThanOrEqual(swapAmountBigInt);
        }
      }
    });
  });

  describe('Read Tools Tests', () => {
    describe('getNetworks', () => {
      it('should get all networks', async () => {
        const result = await getNetworks(apiClient);

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
            const network = data[0];
            expect(network.name).toBeDefined();
            expect(network.display_name).toBeDefined();
            expect(network.type).toBeDefined();
          }
        }
      });

      it('should get networks filtered by type', async () => {
        const result = await getNetworks(apiClient, {
          network_types: ['starknet'],
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
            data.forEach((network: any) => {
              expect(network.type).toBe('starknet');
            });
          }
        }
      });
    });

    describe('getSources', () => {
      it('should get all sources', async () => {
        const result = await getSources(apiClient);

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
            const source = data[0];
            expect(source.name).toBeDefined();
            expect(source.display_name).toBeDefined();
          }
        }
      });

      it('should get sources filtered by destination network', async () => {
        const result = await getSources(apiClient, {
          destination_network: 'ETHEREUM_MAINNET',
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
          }
        }
      });

      it('should get sources filtered by destination network and token', async () => {
        const result = await getSources(apiClient, {
          destination_network: 'ETHEREUM_MAINNET',
          destination_token: 'STRK',
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
          }
        }
      });
    });

    describe('getDestinations', () => {
      it('should get all destinations', async () => {
        const result = await getDestinations(apiClient);

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
            const destination = data[0];
            expect(destination.name).toBeDefined();
            expect(destination.display_name).toBeDefined();
          }
        }
      });

      it('should get destinations filtered by source network', async () => {
        const result = await getDestinations(apiClient, {
          source_network: 'STARKNET_MAINNET',
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
          }
        }
      });

      it('should get destinations filtered by source network and token', async () => {
        const result = await getDestinations(apiClient, {
          source_network: 'STARKNET_MAINNET',
          source_token: 'STRK',
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
          }
        }
      });
    });

    describe('getQuote', () => {
      it('should get a quote for STRK swap from Starknet to Ethereum', async () => {
        const result = await getQuote(apiClient, {
          source_network: 'STARKNET_MAINNET',
          source_token: 'STRK',
          destination_network: 'ETHEREUM_MAINNET',
          destination_token: 'STRK',
          amount: 10,
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = getDataAsRecord(result.data);
          const quote = getDataAsRecord(data.quote);
          expect(quote.requested_amount).toBeDefined();
          expect(quote.receive_amount).toBeDefined();
          expect(quote.total_fee).toBeDefined();
          expect(quote.source_network).toBeDefined();
          expect(quote.destination_network).toBeDefined();
        }
      });

      it('should get a quote with slippage parameter', async () => {
        const result = await getQuote(apiClient, {
          source_network: 'STARKNET_MAINNET',
          source_token: 'STRK',
          destination_network: 'ETHEREUM_MAINNET',
          destination_token: 'STRK',
          amount: 10,
          slippage: '1', // 1%
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = getDataAsRecord(result.data);
          const quote = getDataAsRecord(data.quote);
          expect(quote.requested_amount).toBeDefined();
          expect(quote.receive_amount).toBeDefined();
        }
      });
    });

    describe('getDetailedQuote', () => {
      it('should get a detailed quote for STRK swap from Starknet to Ethereum', async () => {
        const result = await getDetailedQuote(apiClient, {
          source_network: 'STARKNET_MAINNET',
          source_token: 'STRK',
          destination_network: 'ETHEREUM_MAINNET',
          destination_token: 'STRK',
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data);
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
            const quote = getDataAsRecord(data[0]);
            expect(quote.min_amount).toBeDefined();
            expect(quote.max_amount).toBeDefined();
          }
        }
      });
    });

    describe('getSwapDetails', () => {
      it('should get swap details if swap was created', async () => {
        if (!createdSwapId) {
          console.warn('Skipping test: no swap ID available');
          return;
        }

        const result = await getSwapDetails(apiClient, {
          swap_id: createdSwapId,
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = getDataAsRecord(result.data);
          const swap = getDataAsRecord(data.swap);
          expect(swap.id).toBe(createdSwapId);
          expect(swap.source_network).toBeDefined();
          expect(swap.destination_network).toBeDefined();
          expect(swap.status).toBeDefined();
        }
      });

      it('should get swap details with source address', async () => {
        if (!createdSwapId) {
          console.warn('Skipping test: no swap ID available');
          return;
        }

        const result = await getSwapDetails(apiClient, {
          swap_id: createdSwapId,
          source_address: starknetAccountAddress,
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = getDataAsRecord(result.data);
          const swap = getDataAsRecord(data.swap);
          expect(swap.id).toBe(createdSwapId);
        }
      });
    });

    describe('getAllSwaps', () => {
      it('should get all swaps for an address', async () => {
        const result = await getAllSwaps(apiClient, {
          address: starknetAccountAddress,
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = result.data;
          // Response might be an array or an object with a swaps array
          if (Array.isArray(data)) {
            expect(Array.isArray(data)).toBe(true);
            if (data.length > 0) {
              const swap = data[0].swap;
              expect(swap.id).toBeDefined();
              expect(swap.source_network).toBeDefined();
            }
          } else if (data.swaps && Array.isArray(data.swaps)) {
            expect(Array.isArray(data.swaps)).toBe(true);
          }
        }
      });

      it('should get all swaps with pagination', async () => {
        const result = await getAllSwaps(apiClient, {
          address: starknetAccountAddress,
          page: 1,
        });

        expect(result.status).toBe('success');
      });

      it('should get all swaps including expired', async () => {
        const result = await getAllSwaps(apiClient, {
          address: starknetAccountAddress,
          include_expired: true,
        });

        expect(result.status).toBe('success');
      });
    });

    describe('getDepositActions', () => {
      it('should get deposit actions if swap was created', async () => {
        if (!createdSwapId) {
          console.warn('Skipping test: no swap ID available');
          return;
        }

        const result = await getDepositActions(apiClient, {
          swap_id: createdSwapId,
          source_address: starknetAccountAddress,
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const data = Array.isArray(result.data)
            ? result.data
            : getDataAsRecord(result.data).deposit_actions || result.data;

          if (Array.isArray(data) && data.length > 0) {
            const depositAction = data[0];
            expect(depositAction.type).toBeDefined();
            expect(depositAction.to_address).toBeDefined();
            expect(depositAction.amount).toBeDefined();
          }
        }
      });
    });

    describe('getSwapRouteLimits', () => {
      it('should get swap route limits for STRK from Starknet to Ethereum', async () => {
        const result = await getSwapRouteLimits(apiClient, {
          source_network: 'STARKNET_MAINNET',
          source_token: 'STRK',
          destination_network: 'ETHEREUM_MAINNET',
          destination_token: 'STRK',
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const limits = getDataAsRecord(result.data);
          expect(limits.min_amount).toBeDefined();
          expect(limits.max_amount).toBeDefined();
        }
      });
    });

    describe('getTransactionStatus', () => {
      it('should get transaction status for a valid transaction hash', async () => {
        if (!createdTransactionHash) {
          console.warn('Skipping test: no transaction hash available');
          return;
        }

        const result = await getTransactionStatus(apiClient, {
          network: 'STARKNET_MAINNET',
          transaction_id: createdTransactionHash,
        });

        expect(result.status).toBe('success');
        if (result.status === 'success' && result.data) {
          const status = getDataAsRecord(result.data);
          expect(status).toBeDefined();
        }
      });
    });
  });
});
