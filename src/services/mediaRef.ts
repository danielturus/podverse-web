import axios from 'axios'
import PV from '~/lib/constants'
import { convertObjectToQueryString } from '~/lib/utility'
import config from '~/config'
const { API_BASE_URL } = config()

export const createMediaRef = async (data: any) => {
  return axios(`${API_BASE_URL}${PV.paths.api.mediaRef}`, {
    method: 'post',
    data,
    withCredentials: true
  })
}

export const deleteMediaRef = async (id: string) => {
  return axios(`${API_BASE_URL}${PV.paths.api.mediaRef}/${id}`, {
    method: 'delete',
    withCredentials: true
  })
}

export const getMediaRefsByQuery = async (query) => {
  const filteredQuery: any = {}

  if (query.page) {
    filteredQuery.page = query.page
  } else {
    filteredQuery.page = 1
  }

  if (query.sort) {
    filteredQuery.sort = query.sort
  } else {
    filteredQuery.sort = PV.queryParams.top_past_week
  }

  if (query.from === PV.queryParams.from_podcast) {
    filteredQuery.podcastId = query.podcastId
  } else if (query.from === PV.queryParams.from_episode) {
    filteredQuery.episodeId = query.episodeId
  } else if (query.from === PV.queryParams.subscribed_only) {
    filteredQuery.podcastId = Array.isArray(query.podcastId) && query.podcastId.length > 0 ? query.podcastId : ['no-results']
  } else if (query.from === PV.queryParams.from_category) {
    filteredQuery.categories = query.categories
    filteredQuery.includePodcast = true
  } else {
    // from = all-podcasts
    // add nothing
  }

  if (query.includePodcast) {
    filteredQuery.includePodcast = true
  } else if (query.includeEpisode) {
    filteredQuery.includeEpisode = true
  }

  if (query.searchAllFieldsText) {
    filteredQuery.searchAllFieldsText = query.searchAllFieldsText
  }

  const queryString = convertObjectToQueryString(filteredQuery)
  return axios(`${API_BASE_URL}${PV.paths.api.mediaRef}?${queryString}`, {
    method: 'get'
  })
}

export const getMediaRefById = async (id: string) => {
  return axios.get(`${API_BASE_URL}${PV.paths.api.mediaRef}/${id}`)
}

export const updateMediaRef = async (data: any) => {
  return axios(`${API_BASE_URL}${PV.paths.api.mediaRef}`, {
    method: 'patch',
    data,
    withCredentials: true
  })
}
