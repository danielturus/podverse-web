import axios from 'axios'
import PV from '~/lib/constants'
import { convertObjectToQueryString } from '~/lib/utility'
import config from '~/config'
const { API_BASE_URL } = config()

export const addOrRemovePlaylistItem = async (data: any) => {
  return axios(`${API_BASE_URL}${PV.paths.api.playlist}${PV.paths.api.add_or_remove}`, {
    method: 'patch',
    data,
    withCredentials: true
  })
}

export const createPlaylist = async (data: any) => {
  return axios(`${API_BASE_URL}${PV.paths.api.playlist}`, {
    method: 'post',
    data,
    withCredentials: true
  })
}

export const deletePlaylist = async (id: string) => {
  return axios(`${API_BASE_URL}${PV.paths.api.playlist}/${id}`, {
    method: 'delete',
    withCredentials: true
  })
}

export const getPlaylistById = async (id: string) => {
  return axios.get(`${API_BASE_URL}${PV.paths.api.playlist}/${id}`)
}

export const getPlaylistsByQuery = async (query) => {
  const filteredQuery: any = {}

  if (query.from === PV.queryParams.subscribed_only) {
    filteredQuery.playlistId = query.subscribedPlaylistIds
  }

  const queryString = convertObjectToQueryString(filteredQuery)
  return axios.get(`${API_BASE_URL}${PV.paths.api.playlist}?${queryString}`)
}

export const toggleSubscribeToPlaylist = async (playlistId: string) => {
  return axios(`${API_BASE_URL}${PV.paths.api.playlist}${PV.paths.api.toggle_subscribe}/${playlistId}`, {
    method: 'get',
    withCredentials: true
  })
}

export const updatePlaylist = async (data: any) => {
  return axios(`${API_BASE_URL}${PV.paths.api.playlist}`, {
    method: 'patch',
    data,
    withCredentials: true
  })
}
