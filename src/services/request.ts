import axios from 'axios'
import config from '~/config'
const { API_BASE_URL } = config()

type PVRequest = {
  endpoint?: string
  query?: {}
  body?: any
  headers?: any
  method?: string
  opts?: any
}

export const request = async (req: PVRequest) => {
  const { endpoint = '', query = {}, headers = {}, body, method = 'GET', opts = {} } = req

  const queryString = Object.keys(query)
    .map((key) => {
      return `${key}=${query[key]}`
    })
    .join('&')

  const axiosRequest = {
    url: `${API_BASE_URL}${endpoint}?${queryString}`,
    headers,
    ...(body ? { data: body } : {}),
    method,
    ...opts,
    timeout: 30000
  }

  try {
    const response = await axios(axiosRequest)

    return response
  } catch (error) {
    console.log('error message:', error.message)
    console.log('error response:', error.response)

    throw error
  }
}
