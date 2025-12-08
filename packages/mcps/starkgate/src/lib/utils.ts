import * as ethers from 'ethers';
import { Connection, Keypair } from '@solana/web3.js';
import * as bitcoin from 'bitcoinjs-lib';

export interface ethereumWrite {
  provider: ethers.ethers.JsonRpcProvider;
  wallet: ethers.ethers.Wallet;
}

export interface solanaWrite {
  connection: Connection;
  keypair: Keypair;
}

export interface bitcoinWrite {
  network: bitcoin.networks.Network;
  privateKey: Buffer;
  publicKey: Buffer;
}

/**
 * Get Ethereum write environment from environment variables
 * @returns ethereumWrite object with provider and wallet
 * @throws Error if required environment variables are missing
 */
export const getEthereumWrite = (): ethereumWrite => {
  const ethRpcUrl = process.env.ETHEREUM_RPC_URL;
  const ethPrivateKey = process.env.ETHEREUM_PRIVATE_KEY;

  if (!ethRpcUrl || !ethPrivateKey) {
    throw new Error(
      'Missing required environment variables: ETHEREUM_RPC_URL, ETHEREUM_PRIVATE_KEY'
    );
  }

  // Validate private key format
  const cleanPrivateKey = ethPrivateKey.trim();
  const keyWithoutPrefix = cleanPrivateKey.startsWith('0x')
    ? cleanPrivateKey.slice(2)
    : cleanPrivateKey;

  if (keyWithoutPrefix.length !== 64) {
    throw new Error(
      `Invalid ETHEREUM_PRIVATE_KEY format: Expected 64 hex characters (32 bytes), got ${keyWithoutPrefix.length} characters. ` +
        `Private key should be 64 hexadecimal characters with optional 0x prefix.`
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(keyWithoutPrefix)) {
    throw new Error(
      'Invalid ETHEREUM_PRIVATE_KEY format: Private key must contain only hexadecimal characters (0-9, a-f, A-F).'
    );
  }

  try {
    const provider = new ethers.ethers.JsonRpcProvider(ethRpcUrl);
    const wallet = new ethers.ethers.Wallet(cleanPrivateKey, provider);

    return {
      provider,
      wallet,
    };
  } catch (error) {
    throw new Error(
      `Failed to initialize Ethereum wallet: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `Please check your ETHEREUM_PRIVATE_KEY format.`
    );
  }
};

/**
 * Get Solana write environment from environment variables
 * @returns solanaWrite object with connection and keypair
 * @throws Error if required environment variables are missing
 */
export const getSolanaWrite = (): solanaWrite => {
  const solanaRpcUrl = process.env.SOLANA_RPC_URL;
  const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;

  if (!solanaRpcUrl || !solanaPrivateKey) {
    throw new Error(
      'Missing required environment variables: SOLANA_RPC_URL, SOLANA_PRIVATE_KEY'
    );
  }

  try {
    const connection = new Connection(solanaRpcUrl, 'confirmed');

    // Parse private key - expecting JSON array of 64 numbers (Solana standard format)
    let secretKey: Uint8Array;

    // Try to parse as JSON array
    if (solanaPrivateKey.trim().startsWith('[')) {
      const parsed = JSON.parse(solanaPrivateKey);
      if (!Array.isArray(parsed) || parsed.length !== 64) {
        throw new Error(
          'Invalid SOLANA_PRIVATE_KEY format: JSON array must contain exactly 64 numbers'
        );
      }
      secretKey = Uint8Array.from(parsed);
    } else {
      // Try to parse as base64 encoded string
      try {
        secretKey = Uint8Array.from(Buffer.from(solanaPrivateKey, 'base64'));
        if (secretKey.length !== 64) {
          throw new Error(
            `Invalid SOLANA_PRIVATE_KEY format: Expected 64 bytes, got ${secretKey.length} bytes`
          );
        }
      } catch {
        throw new Error(
          'Invalid SOLANA_PRIVATE_KEY format: Must be a JSON array of 64 numbers or base64 encoded string'
        );
      }
    }

    const keypair = Keypair.fromSecretKey(secretKey);

    return {
      connection,
      keypair,
    };
  } catch (error) {
    throw new Error(
      `Failed to initialize Solana keypair: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `Please check your SOLANA_PRIVATE_KEY format (JSON array of 64 numbers or base64 string).`
    );
  }
};

/**
 * Get Bitcoin write environment from environment variables
 * @returns bitcoinWrite object with network and key pair
 * @throws Error if required environment variables are missing
 */
export const getBitcoinWrite = (): bitcoinWrite => {
  const bitcoinNetwork = process.env.BITCOIN_NETWORK;
  const bitcoinPrivateKey = process.env.BITCOIN_PRIVATE_KEY;

  if (!bitcoinNetwork || !bitcoinPrivateKey) {
    throw new Error(
      'Missing required environment variables: BITCOIN_NETWORK, BITCOIN_PRIVATE_KEY'
    );
  }

  // Validate private key format
  const cleanPrivateKey = bitcoinPrivateKey.trim();
  const keyWithoutPrefix = cleanPrivateKey.startsWith('0x')
    ? cleanPrivateKey.slice(2)
    : cleanPrivateKey;

  if (keyWithoutPrefix.length !== 64) {
    throw new Error(
      `Invalid BITCOIN_PRIVATE_KEY format: Expected 64 hex characters (32 bytes), got ${keyWithoutPrefix.length} characters. ` +
        `Private key should be 64 hexadecimal characters with optional 0x prefix.`
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(keyWithoutPrefix)) {
    throw new Error(
      'Invalid BITCOIN_PRIVATE_KEY format: Private key must contain only hexadecimal characters (0-9, a-f, A-F).'
    );
  }

  try {
    // Determine network
    let network: bitcoin.networks.Network;
    switch (bitcoinNetwork.toLowerCase()) {
      case 'mainnet':
      case 'bitcoin':
        network = bitcoin.networks.bitcoin;
        break;
      case 'testnet':
        network = bitcoin.networks.testnet;
        break;
      case 'regtest':
        network = bitcoin.networks.regtest;
        break;
      default:
        throw new Error(
          `Invalid BITCOIN_NETWORK: ${bitcoinNetwork}. Must be one of: mainnet, testnet, regtest`
        );
    }

    // Convert hex private key to Buffer
    const privateKey = Buffer.from(keyWithoutPrefix, 'hex');

    // Derive public key using Node.js crypto
    const crypto = require('crypto');
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(privateKey);
    const publicKey = ecdh.getPublicKey();

    return {
      network,
      privateKey,
      publicKey,
    };
  } catch (error) {
    throw new Error(
      `Failed to initialize Bitcoin keypair: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        `Please check your BITCOIN_PRIVATE_KEY format and BITCOIN_NETWORK setting.`
    );
  }
};
