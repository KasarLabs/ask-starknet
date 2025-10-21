import axios from 'axios'

import { parseJsonWithBigNumber } from '../utils/json.ts'

const safeParseResponse = (data: unknown) => {
  if (!data || typeof data !== 'string') {
    return undefined
  }

  try {
    return parseJsonWithBigNumber(data)
  } catch {
    return undefined
  }
}

export const axiosClient = axios.create({
  paramsSerializer: {
    indexes: null,
  },
})

axiosClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject({
        url: error.response.config.url,
        status: error.response.status,
        data: error.response.data,
      })
    }

    return Promise.reject(error)
  },
)

axiosClient.defaults.transformResponse = [safeParseResponse]

export const setHost = (baseUrl: string) => {
  axiosClient.defaults.baseURL = `https://${baseUrl}`
}

export const setApiKey = (apiKey: string) => {
  axiosClient.defaults.headers.common['x-api-key'] = apiKey
}
