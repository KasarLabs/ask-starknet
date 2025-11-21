import { Account, constants, Contract } from 'starknet';
import { artpeaceAbi } from '../lib/abis/artpeaceAbi.js';
import { artpeaceAddr } from '../lib/constants/artpeace.js';
import { ArtpeaceHelper } from '../lib/utils/helper.js';
import { placePixelParam } from '../schemas/index.js';
import { Checker } from '../lib/utils/checker.js';
import { onchainWrite } from '@kasarlabs/ask-starknet-core';

/**
 * Places pixels on a Starknet canvas using the Artpeace contract
 * @param agent Interface for interacting with Starknet blockchain
 * @param input Object containing array of pixel parameters
 * @returns JSON string with transaction status and hash(es)
 */
export const placePixel = async (
  env: onchainWrite,
  input: { params: placePixelParam[] }
) => {
  try {
    const { params } = input;
    const account = env.account;
    const provider = env.provider;

    const artpeaceContract = new Contract({
      abi: artpeaceAbi,
      address: artpeaceAddr,
      providerOrAccount: account,
    });
    const checker = new Checker(params[0].canvasId ?? 0);
    const id = await checker.checkWorld();
    await checker.getColors();

    const txHash = [];
    for (const param of params) {
      const { position, color } = await ArtpeaceHelper.validateAndFillDefaults(
        param,
        checker
      );
      const timestamp = Math.floor(Date.now() / 1000);

      const call = artpeaceContract.populate('place_pixel', {
        canvas_id: id,
        pos: position,
        color: color,
        now: timestamp,
      });

      const res = await account.execute(call);
      await provider.waitForTransaction(res.transaction_hash);
      txHash.push(res.transaction_hash);
    }

    return {
      status: 'success',
      transaction_hash: txHash,
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: {
        code: 'PLACE_PIXEL_DATA_ERROR',
        message: error.message || 'Failed to place a pixel',
      },
    };
  }
};
