import { constants, Contract, RpcProvider } from 'starknet';
import { erc20Abi } from '@kasarlabs/ask-starknet-core';
import { abbotAbi } from '../abis/abbotAbi.js';
import { shrineAbi } from '../abis/shrineAbi.js';
import { sentinelAbi } from '../abis/sentinelAbi.js';
import { getOpusContractAddress } from '../constant/index.js';

export const getErc20Contract = (address: string) => {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  return new Contract({
    abi: erc20Abi,
    address,
    providerOrAccount: provider,
  }).typedv2(erc20Abi);
};

export const getAbbotContract = (chainId: constants.StarknetChainId) => {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  const address = getOpusContractAddress({ chainId, contractName: 'abbot' });
  return new Contract({
    abi: abbotAbi,
    address,
    providerOrAccount: provider,
  }).typedv2(abbotAbi);
};

export const getSentinelContract = (chainId: constants.StarknetChainId) => {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  const address = getOpusContractAddress({ chainId, contractName: 'sentinel' });
  return new Contract({
    abi: sentinelAbi,
    address,
    providerOrAccount: provider,
  }).typedv2(sentinelAbi);
};

export const getShrineContract = (chainId: constants.StarknetChainId) => {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  const address = getOpusContractAddress({ chainId, contractName: 'shrine' });
  return new Contract({
    abi: shrineAbi,
    address,
    providerOrAccount: provider,
  }).typedv2(shrineAbi);
};
