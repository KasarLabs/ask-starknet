import { RpcProvider, shortString, Contract } from 'starknet';
import { ekuboAddress } from '../constants/addresses.js';
import {
  CORE_ABI,
  POSITIONS_ABI,
  NFT_POSITIONS_CONTRACT_ABI,
  NEW_ERC20_ABI,
  ROUTER_ABI,
} from '../constants/abis/index.js';

export type Network = 'sepolia' | 'mainnet';
export type EkuboContract = keyof typeof ekuboAddress;

// ABI mapping for each contract type
const CONTRACT_ABIS = {
  core: CORE_ABI,
  positions: POSITIONS_ABI,
  positionsNFT: NFT_POSITIONS_CONTRACT_ABI,
  routerV3: ROUTER_ABI, // Router ABI will be imported separately when needed
} as const;

/**
 * Get the current chain (network) from the provider
 */
export async function getChain(provider: RpcProvider): Promise<Network> {
  const chainId = shortString.decodeShortString(await provider.getChainId());
  return chainId === 'SN_MAIN' ? 'mainnet' : 'sepolia';
}

/**
 * Get an Ekubo contract address for a specific network
 * @param contract - Contract type ('core', 'positions', 'routerV3', 'positionsNFT')
 * @param network - Network ('mainnet' or 'sepolia')
 * @returns Contract address as a hex string
 */
export function getEkuboAddress(
  contract: EkuboContract,
  network: Network
): string {
  return ekuboAddress[contract][network];
}

/**
 * Get a contract instance for a specific Ekubo contract type
 * @param provider - RPC provider
 * @param contractType - Type of contract to instantiate
 * @returns Contract instance
 */
export async function getContract(
  provider: RpcProvider,
  contractType: EkuboContract
): Promise<Contract> {
  const chain = await getChain(provider);
  const address = getEkuboAddress(contractType, chain);
  const abi = CONTRACT_ABIS[contractType];

  return new Contract({ abi, address, providerOrAccount: provider });
}

/**
 * Get an ERC20 contract instance
 * @param tokenAddress - Token contract address
 * @param provider - RPC provider
 * @returns ERC20 Contract instance
 */
export function getERC20Contract(
  tokenAddress: string,
  provider: RpcProvider
): Contract {
  return new Contract({
    abi: NEW_ERC20_ABI,
    address: tokenAddress,
    providerOrAccount: provider,
  });
}
