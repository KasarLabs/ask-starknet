import { hash as starkHash, shortString as starkShortString } from 'starknet'

export const jsGetObjMsgHash = (
  domainHash: string,
  publicKey: string,
  objHash: string,
) => {
  const messageFelt = starkShortString.encodeShortString('StarkNet Message')

  return starkHash.computePoseidonHashOnElements([
    messageFelt,
    domainHash,
    publicKey,
    objHash,
  ])
}
