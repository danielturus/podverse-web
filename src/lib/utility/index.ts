import { getLastHistoryItemOrNowPlayingItemFromStorage, setNowPlayingItemInStorage } from 'podverse-ui'
import { userUpdateHistoryItem } from '~/redux/actions'
import { updateHistoryItemPlaybackPosition } from '~/services'
import confetti from 'canvas-confetti'
export { validatePassword } from './validatePassword'

// This checks if we are server-side rendering or rendering on the front-end.
export const checkIfLoadingOnFrontEnd = () => {
  return typeof window !== 'undefined'
}

export const convertToYYYYMMDDHHMMSS = () => {
  const now = new Date()
  const year = '' + now.getFullYear()
  let month = '' + (now.getMonth() + 1); if (month.length === 1) { month = '0' + month }
  let day = '' + now.getDate(); if (day.length === 1) { day = '0' + day }
  let hour = '' + now.getHours(); if (hour.length === 1) { hour = '0' + hour }
  let minute = '' + now.getMinutes(); if (minute.length === 1) { minute = '0' + minute }
  let second = '' + now.getSeconds(); if (second.length === 1) { second = '0' + second }
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
}

// eslint-disable-next-line
// @ts-ignore
// eslint-disable-next-line
Date.prototype.addDays = function (days) {
  const date = new Date(this.valueOf())
  date.setDate(date.getDate() + days)
  return date
}

export const isBeforeDate = (expirationDate, dayOffset = 0) => {
  const currentDate = new Date() as any
  const offsetDate = currentDate.addDays(dayOffset)
  return new Date(expirationDate) > offsetDate
}

export const validateEmail = email => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

export const readableDate = (date) => {
  const dateObj = new Date(date),
    year = dateObj.getFullYear(),
    month = dateObj.getMonth() + 1,
    day = dateObj.getDate();

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return month + '/' + day + '/' + year;
}

export const convertSecToHHMMSS = (sec: number) => {
  let totalSec = Math.floor(sec)
  const hours = Math.floor(totalSec / 3600)
  totalSec %= 3600
  const minutes = Math.floor(totalSec / 60)
  const seconds = Math.floor(totalSec % 60)
  let result = ''

  if (hours >= 1) {
    result += hours + ':'
  }

  if (minutes >= 10) {
    result += minutes + ':'
  } else if (minutes >= 1 && hours >= 1) {
    result += '0' + minutes + ':'
  } else if (minutes >= 1) {
    result += minutes + ':'
  } else if (minutes === 0 && hours >= 1) {
    result += '00:'
  }

  if (seconds >= 10) {
    result += seconds
  } else if (seconds >= 1 && minutes >= 1) {
    result += '0' + seconds
  } else if (seconds >= 1) {
    result += seconds
  } else {
    result += '00'
  }

  if (result.length === 2) {
    result = '0:' + result
  }

  if (result.length === 1) {
    result = '0:0' + result
  }

  return result
}

export const readableClipTime = (startTime, endTime) => {
  const s = convertSecToHHMMSS(startTime)
  if ((startTime || startTime === 0) && endTime) {
    const e = convertSecToHHMMSS(endTime)
    return `${s} to ${e}`
  } else {
    return `Start: ${s}`
  }
}

export const convertObjectToQueryString = (obj) => {
  if (!obj) {
    return ''
  } else {
    return Object.keys(obj).map(key => key + '=' + obj[key]).join('&')
  }
}

export const getCookie = name => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  if (match) {
    return match[2]
  }

  return
}

export const getCookieFromRequest = (req, key) => {
  const { cookie } = (req && req.headers) || document

  if (cookie) {
    const match = cookie.match(new RegExp('(^| )' + key + '=([^;]+)'))
    if (match) {
      return match[2]
    }
  }
  return ''
}

export const setCookie = (name, value, days = 365) => {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

export const deleteCookie = name => {
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;domain=localhost;'
}

export const clone = obj => {
  if (null == obj || "object" != typeof obj) return obj
  const copy = obj.constructor()
  for (const attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr]
  }
  return copy
}

export const alertPremiumRequired = () => {
  safeAlert('This feature is only available for premium members. Login for a free trial.')
}

export const alertSomethingWentWrong = () => {
  safeAlert('Something went wrong. Please check your internet connection.')
}

// Remove double quotes from text so it does not cut off in SEO descriptions
export const removeDoubleQuotes = str => str ? str.replace(/["]+/g, '') : ''

export const alertRateLimitError = err => {
  safeAlert(err.response.data.message)
}

export const getPlaybackPositionFromHistory = (historyItems: any[], nowPlayingItem: any) => {
  if (historyItems && historyItems.length > 0) {
    const oldItem = historyItems.find((x) => x.episodeId === nowPlayingItem.episodeId)

    if (oldItem && oldItem.userPlaybackPosition) {
      return oldItem.userPlaybackPosition
    }
  }

  return nowPlayingItem.userPlaybackPosition || 0
}

export const assignLocalOrLoggedInNowPlayingItemPlaybackPosition = (user, nowPlayingItem) => {
  if (!user || !user.id) {
    const currentItem = getLastHistoryItemOrNowPlayingItemFromStorage(user && user.historyItems)
    if (currentItem && currentItem.episodeId === nowPlayingItem.episodeId) {
      nowPlayingItem.userPlaybackPosition = currentItem.userPlaybackPosition
    }
  } else {
    nowPlayingItem.userPlaybackPosition = getPlaybackPositionFromHistory(user.historyItems, nowPlayingItem)
  }
  return nowPlayingItem
}

export const addOrUpdateHistoryItemPlaybackPosition = async (nowPlayingItem, user, overridePosition?: number) => {
  let currentTime = (window.player && Math.floor(window.player.getCurrentTime())) || 0
  currentTime = overridePosition ? overridePosition : currentTime
  nowPlayingItem.userPlaybackPosition = currentTime

  if (user && user.id) {
    updateHistoryItemPlaybackPosition(nowPlayingItem)
    await userUpdateHistoryItem(nowPlayingItem)
  }

  await setNowPlayingItemInStorage(nowPlayingItem)
}

export const getViewContentsElementScrollTop = () => {
  if (document) {
    const el = document.querySelector('.view__contents')
    if (el) {
      return el.scrollTop
    }
  }
  return 0
}

export const enrichPodcastsWithCategoriesString = (podcasts: any) => {
  const enrichedPodcasts = [] as any
  for (const podcast of podcasts) {
    const { categories = [] } = podcast
    let categoriesString = ''
    if (categories && categories.length > 0) {
      for (const category of categories) {
        categoriesString += category.title + ', '
      }
      categoriesString = categoriesString.substring(0, categoriesString.length - 2)
    }

    podcast.categoriesString = categoriesString
    enrichedPodcasts.push(podcast)
  }
  return enrichedPodcasts
}

/**
 * Determine the mobile operating system.
 * This function returns one of 'iOS', 'Android', 'Windows Phone', or 'unknown'.
 *
 * @returns {String}
 */
export const getMobileOperatingSystem = () => {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
  
    // Windows Phone must come first because its UA also contains 'Android'
    if (/windows phone/i.test(userAgent)) {
      return 'Windows Phone'
    }
  
    if (/android/i.test(userAgent)) {
      return 'Android'
    }
  
    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return 'iOS'
    }
  }

  return 'unknown'
}

export const safeAlert = (text: string) => {
  if (typeof window !== 'undefined') {
    alert(text)
  }
}

export const cookieGetQuery = (req: any, pageKey: string) => {
  const key = cookieCreateQueryKey(pageKey)
  if (key) {
    try {
      const item = getCookieFromRequest(req, key)
      return item ? JSON.parse(item) : {}
    } catch (error) {
      console.log(key + ' cookieGetQuery', error)
    }
  }
  return {}
}

export const cookieSetQuery = (pageKey: string, from: string, type: string, sort: string, categoryId?: string) => {
  const key = cookieCreateQueryKey(pageKey)
  if (key) {
    try {
      setCookie(key, JSON.stringify({
        from,
        type,
        sort,
        ...(categoryId ? { categoryId } : {})
      }))
    } catch (error) {
      console.log(key + ' cookieSetQuery', error)
      deleteCookie(key)
    }
  }
}

const cookieCreateQueryKey = (pageKey: string) => {
  if (pageKey === 'home') {
    return 'home_query'
  } else if (pageKey === 'podcasts') {
    return 'podcasts_query'
  } else if (pageKey.indexOf('podcast_') >= 0) {
    return 'podcast_query'
  } else if (pageKey === 'episodes') {
    return 'episodes_query'
  } else if (pageKey.indexOf('episode_') >= 0) {
    return 'episode_query'
  } else if (pageKey === 'clips') {
    return 'clips_query'
  } else if (pageKey.indexOf('clip_') >= 0) {
    return 'clip_query'
  } else {
    return ''
  }
}

export const generateShareURLs = (nowPlayingItem) => {
  if (nowPlayingItem) {
    const clipLinkAs = nowPlayingItem.clipId ? `${window.location.origin}/clip/${nowPlayingItem.clipId}` : ''
    const episodeLinkAs = `${window.location.origin}/episode/${nowPlayingItem.episodeId}`
    const podcastLinkAs = `${window.location.origin}/podcast/${nowPlayingItem.podcastId}`
    
    return { clipLinkAs, episodeLinkAs, podcastLinkAs }
  } else {
    return {}
  }
}

export const fireConfetti = () => {
  confetti({
    particleCount: 50,
    spread: 70,
    origin: { y: 0.6 }
  })
}

export const getPlaybackRateText = num => {
  switch (num) {
    case 0.5:
      return `0.5x`
    case 0.75:
      return `0.75x`
    case 1:
      return `1x`
    case 1.25:
      return `1.25x`
    case 1.5:
      return `1.5x`
    case 2:
      return `2x`
    default:
      return `1x`
  }
}

export const getPlaybackRateNextValue = num => {
  switch (num) {
    case 0.5:
      return 0.75
    case 0.75:
      return 1
    case 1:
      return 1.25
    case 1.25:
      return 1.5
    case 1.5:
      return 2
    case 2:
      return 0.5
    default:
      return 1
  }
}
