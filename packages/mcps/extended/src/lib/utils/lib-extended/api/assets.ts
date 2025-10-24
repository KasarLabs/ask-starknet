import { AssetsResponseSchema } from './assets.schema.js'
import { axiosClient } from './axios.js'

export const getAssets = async ({
  assetsNames,
  isCollateral,
}: { assetsNames?: string[]; isCollateral?: boolean } = {}) => {
  const { data } = await axiosClient.get<unknown>('/api/v1/info/assets', {
    params: {
      asset: assetsNames,
      collateral: isCollateral,
    },
  })

  return AssetsResponseSchema.parse(data).data
}
