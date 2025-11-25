import { Contract, RpcProvider } from 'starknet';
import { Address } from '../../interfaces/index.js';
import { vTokenAbi } from '../abis/vTokenAbi.js';
import { singletonAbi } from '../abis/singletonAbi.js';
import { extensionAbi } from '../abis/extensionAbi.js';
import { erc20Abi } from '@kasarlabs/ask-starknet-core';

export const getErc20Contract = (address: Address) => {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  return new Contract({
    abi: erc20Abi,
    address,
    providerOrAccount: provider,
  }).typedv2(erc20Abi);
};
export const getVTokenContract = (address: Address) => {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  return new Contract({
    abi: vTokenAbi,
    address,
    providerOrAccount: provider,
  }).typedv2(vTokenAbi);
};

export const getSingletonContract = (address: Address) => {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  return new Contract({
    abi: singletonAbi,
    address,
    providerOrAccount: provider,
  }).typedv2(singletonAbi);
};
export const getExtensionContract = (address: Address) => {
  const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });
  return new Contract({
    abi: extensionAbi,
    address,
    providerOrAccount: provider,
  }).typedv2(extensionAbi);
};
