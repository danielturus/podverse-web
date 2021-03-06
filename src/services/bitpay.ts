import axios from 'axios'
import config from '~/config'
import PV from '~/lib/constants'
const { API_BASE_URL } = config()

export const createBitPayInvoice = async () => {
  return axios(`${API_BASE_URL}${PV.paths.api.bitpay}${PV.paths.api.invoice}`, {
    method: 'post',
    withCredentials: true
  })
}

export const getBitPayInvoiceStatusByOrderId = async (orderId: string) => {
  return axios(`${API_BASE_URL}${PV.paths.api.bitpay}${PV.paths.api.invoice}/${orderId}`, {
    method: 'get',
    withCredentials: true
  })
}
