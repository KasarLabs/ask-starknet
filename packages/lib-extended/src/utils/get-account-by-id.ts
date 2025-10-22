import { type AccountInfo } from '../api/account-info.schema.js'
import { checkRequired } from './check-required.js'
import { type Long } from './number.js'

export const getAccountById = (accounts: AccountInfo[], accountId: Long) => {
  const account = accounts.find((account) => account.accountId.eq(accountId))

  return checkRequired(account, 'account')
}
