import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Error from './_error'
import { addItemsToSecondaryQueueStorage, clearItemsFromSecondaryQueueStorage
  } from 'podverse-ui'
import MediaHeaderCtrl from '~/components/MediaHeaderCtrl/MediaHeaderCtrl'
import MediaInfoCtrl from '~/components/MediaInfoCtrl/MediaInfoCtrl'
import MediaListCtrl from '~/components/MediaListCtrl/MediaListCtrl'
import Meta from '~/components/Meta/Meta'
import config from '~/config'
import PV from '~/lib/constants'
import { convertToNowPlayingItem } from '~/lib/nowPlayingItem'
import { checkIfLoadingOnFrontEnd, clone, cookieGetQuery, removeDoubleQuotes } from '~/lib/utility'
import { pageIsLoading, pagesSetQueryState, playerQueueLoadSecondaryItems
  } from '~/redux/actions'
import { getEpisodeById, getEpisodesByQuery, getMediaRefsByQuery } from '~/services/'
import { withTranslation } from '../i18n'
const { BASE_URL } = config()

type Props = {
  episode?: any
  errorCode?: number
  lastScrollPosition?: number
  meta?: any
  newPlayingItem?: any
  pageKey: string
  pages?: any
  pagesSetQueryState?: any
  playerQueue?: any
  queryFrom?: any
  queryPage: number
  querySort?: any
  queryType?: any
  t: any
  user?: any
  userSetInfo?: any
}

type State = {}

const kPageKey = 'episode_'

class Episode extends Component<Props, State> {

  static async getInitialProps({ query, req, store }) {
    const pageKeyWithId = `${kPageKey}${query.id}`
    const state = store.getState()
    const { mediaPlayer, pages, user } = state
    const { nowPlayingItem } = mediaPlayer

    let episodeResult
    try {
      episodeResult = await getEpisodeById(query.id)
    } catch (err) {
      store.dispatch(pageIsLoading(false))
      return { errorCode: err.response && err.response.status || 500 }
    }

    const episode = episodeResult.data
    let newPlayingItem
    if (!checkIfLoadingOnFrontEnd()) {
      newPlayingItem = convertToNowPlayingItem(episode)
    }

    const localStorageQuery = cookieGetQuery(req, kPageKey)

    const currentPage = pages[pageKeyWithId] || {}
    const lastScrollPosition = currentPage.lastScrollPosition
    const queryFrom = currentPage.queryFrom || query.from || localStorageQuery.from || PV.queryParams.from_episode
    const queryPage = currentPage.queryPage || query.page || 1
    const querySort = currentPage.querySort || query.sort || localStorageQuery.sort || PV.queryParams.top_past_week
    const queryType = currentPage.queryType || query.type || localStorageQuery.type || PV.queryParams.clips
    let podcastId = ''
    let episodeId = ''

    if (queryFrom === PV.queryParams.from_podcast) {
      podcastId = episode.podcast.id
    } else if (queryFrom === PV.queryParams.from_episode) {
      episodeId = episode.id
    } else if (queryFrom === PV.queryParams.subscribed_only) {
      podcastId = user.subscribedPodcastIds
    }

    if (Object.keys(currentPage).length === 0) {
      let results

      if (queryType === PV.queryParams.episodes) {
        results = await getEpisodesByQuery({
          from: queryFrom,
          page: queryPage,
          ...(!podcastId ? { includePodcast: true } : {}),
          ...(podcastId ? { podcastId } : {}),
          sort: querySort,
          type: queryType
        })
      } else {
        results = await getMediaRefsByQuery({
          ...(episodeId ? { episodeId } : {}),
          from: queryFrom,
          ...(!episodeId && podcastId ? { includeEpisode: true } : {}),
          ...(!episodeId && !podcastId ? { includePodcast: true } : {}),
          page: queryPage,
          ...(podcastId ? { podcastId } : {}),
          sort: querySort,
          type: queryType
        })
      }

      const listItems = results.data[0].map(x => convertToNowPlayingItem(x, episode, episode.podcast))
      const nowPlayingItemIndex = listItems.map((x) => x.clipId).indexOf(nowPlayingItem && nowPlayingItem.clipId)
      const queuedListItems = clone(listItems)
      if (nowPlayingItemIndex > -1) {
        queuedListItems.splice(0, nowPlayingItemIndex + 1)
      }
      
      store.dispatch(playerQueueLoadSecondaryItems(queuedListItems))

      store.dispatch(pagesSetQueryState({
        pageKey: pageKeyWithId,
        listItems,
        listItemsTotal: results[1],
        podcast: episode.podcast,
        queryFrom,
        queryPage,
        querySort,
        queryType
      }))
    }

    store.dispatch(pageIsLoading(false))
    
    let meta = {}
    if (episode) {
      const podcastTitle = (episode && episode.podcast && episode.podcast.title) || PV.i18n.common.untitledPodcast
      meta = {
        currentUrl: BASE_URL + PV.paths.web.episode + '/' + episode.id,
        description: removeDoubleQuotes(episode.description),
        imageAlt: podcastTitle,
        imageUrl: episode.shrunkImageUrl || episode.podcast.shrunkImageUrl || episode.imageUrl || episode.podcast.imageUrl,
        title: `${episode.title} - ${podcastTitle}`
      }
    }
    const namespacesRequired = ['common']

    return { episode, lastScrollPosition, meta, namespacesRequired, newPlayingItem, pageKey: pageKeyWithId,
      queryFrom, querySort, queryType }
  }

  componentDidMount() {
    const { errorCode, playerQueue } = this.props

    if (errorCode) return

    const { secondaryItems } = playerQueue
    clearItemsFromSecondaryQueueStorage()
    addItemsToSecondaryQueueStorage(secondaryItems)
  }

  render() {
    const { episode, errorCode, meta, pageKey, pages, pagesSetQueryState } = this.props
    const page = pages[pageKey] || {}
    const { queryFrom, queryPage, querySort, queryType } = page

    if (errorCode) {
      return <Error statusCode={errorCode} />
    }

    return (
      <Fragment>
        <Meta
          description={meta.description}
          ogDescription={meta.description}
          ogImage={meta.imageUrl}
          ogTitle={meta.title}
          ogType='website'
          ogUrl={meta.currentUrl}
          robotsNoIndex={false}
          title={meta.title}
          twitterDescription={meta.description}
          twitterImage={meta.imageUrl}
          twitterImageAlt={meta.imageAlt}
          twitterTitle={meta.title} />
        <MediaHeaderCtrl
          episode={episode}
          pageKey={pageKey} />
        <MediaInfoCtrl
          episode={episode}
          initialShowDescription={true}
          pageKey={pageKey} />
        <MediaListCtrl
          episode={episode}
          episodeId={episode.id}
          handleSetPageQueryState={pagesSetQueryState}
          includeOldest={queryType === PV.queryParams.episodes}
          pageKey={pageKey}
          podcast={episode.podcast}
          podcastId={episode.podcast.id}
          queryFrom={queryFrom}
          queryPage={queryPage}
          querySort={querySort}
          queryType={queryType}
          showQueryTypeSelect={true} />
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  pagesSetQueryState: bindActionCreators(pagesSetQueryState, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation('common')(Episode))
