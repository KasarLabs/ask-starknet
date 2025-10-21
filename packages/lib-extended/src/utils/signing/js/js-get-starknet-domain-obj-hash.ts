import {
  hash as starkHash,
  selector as starkSelector,
  shortString as starkShortString,
} from 'starknet'

import { type StarknetDomain } from '../../../api/starknet.schema.ts'

export const jsGetStarknetDomainObjHash = (domain: StarknetDomain) => {
  const selector = starkSelector.getSelector(
    '"StarknetDomain"("name":"shortstring","version":"shortstring","chainId":"shortstring","revision":"shortstring")',
  )

  return starkHash.computePoseidonHashOnElements([
    selector,
    starkShortString.encodeShortString(domain.name),
    starkShortString.encodeShortString(domain.version),
    starkShortString.encodeShortString(domain.chainId),
    domain.revision,
  ])
}
