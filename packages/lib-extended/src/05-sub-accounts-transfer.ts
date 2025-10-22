import { getAccounts } from './api/account-info.js'
import { getAssets } from './api/assets.js'
import { getStarknetDomain } from './api/starknet.js'
import { transfer } from './api/transfer.js'
import { init } from './init.js'
import { Transfer } from './models/transfer.js'
import type { TransferContext } from './models/transfer.types.js'
import { checkRequired } from './utils/check-required.js'
import { getAccountById } from './utils/get-account-by-id.js'
import { invariant } from './utils/invariant.js'
import { Decimal } from './utils/number.js'

const runExample = async () => {
  const { apiKey, starkPrivateKey } = await init()

  const assets = await getAssets({ assetsNames: ['USD'], isCollateral: true })
  const accounts = await getAccounts()
  const starknetDomain = await getStarknetDomain()

  const fromAccountId = accounts[0].accountId
  const toAccountId = accounts[1].accountId
  const amount = Decimal(1)
  const usdAsset = checkRequired(assets[0], 'USD asset')

  invariant(accounts.length > 1, 'Should be at least 2 accounts to run this example')

  // Both accounts must belong to the same client (wallet)
  const fromAccount = getAccountById(accounts, fromAccountId)
  const toAccount = getAccountById(accounts, toAccountId)

  invariant(
    fromAccount.apiKeys.includes(apiKey),
    'API key is not valid for the from account',
  )

  console.log(
    'Transferring %s%s from account %s to account %s',
    amount.toString(),
    usdAsset.symbol,
    fromAccount.description,
    toAccount.description,
  )

  const ctx: TransferContext = {
    accounts,
    collateralId: usdAsset.starkexId,
    collateralResolution: usdAsset.starkexResolution,
    starkPrivateKey,
    starknetDomain,
  }
  const transferObject = Transfer.create({
    fromAccountId: fromAccount.accountId,
    toAccountId: toAccount.accountId,
    amount,
    transferredAsset: 'USD',
    ctx,
  })

  const result = await transfer(transferObject)

  console.log('Transfer: %o', result)
}

await runExample()
