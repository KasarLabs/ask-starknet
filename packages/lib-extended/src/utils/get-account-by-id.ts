import { type AccountInfo } from '../api/account-info.schema.ts'
import { checkRequired } from './check-required.ts'
import { type Long } from './number.ts'

export const getAccountById = (accounts: AccountInfo[], accountId: Long) => {
  const account = accounts.find((account) => account.accountId.eq(accountId))

  return checkRequired(account, 'account')
}
