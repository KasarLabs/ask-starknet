import { getAccounts } from './api/account-info.ts'
import { getAssets } from './api/assets.ts'
import { getStarknetDomain } from './api/starknet.ts'
import { transfer } from './api/transfer.ts'
import { init } from './init.ts'
import { Transfer } from './models/transfer.ts'
import type { TransferContext } from './models/transfer.types.ts'
import { checkRequired } from './utils/check-required.ts'
import { getAccountById } from './utils/get-account-by-id.ts'
import { invariant } from './utils/invariant.ts'
import { Decimal } from './utils/number.ts'

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
