const STARKNET_SETTLEMENT_BUFFER_SECONDS = 14 * 24 * 60 * 60
const MILLIS_IN_SECOND = 1_000

export const calcStarknetExpiration = (expiryEpochMillis: number) => {
  return (
    Math.ceil(expiryEpochMillis / MILLIS_IN_SECOND) + STARKNET_SETTLEMENT_BUFFER_SECONDS
  )
}
