
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { InputGroup, InputGroupAddon, Input } from 'reactstrap'
import { Button, MediaListSelect, Pagination, setNowPlayingItemInStorage
  } from 'podverse-ui'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import MediaListItemCtrl from '~/components/MediaListItemCtrl/MediaListItemCtrl'
import config from '~/config'
import { convertToNowPlayingItem } from '~/lib/nowPlayingItem'
import PV from '~/lib/constants'
import { addOrUpdateHistoryItemPlaybackPosition, assignLocalOrLoggedInNowPlayingItemPlaybackPosition,
  clone, cookieSetQuery } from '~/lib/utility'
import { mediaPlayerLoadNowPlayingItem, mediaPlayerUpdatePlaying, pageIsLoading,
  playerQueueAddSecondaryItems, playerQueueLoadPriorityItems,
  playerQueueLoadSecondaryItems, userSetInfo } from '~/redux/actions'
import { getEpisodesByQuery, getMediaRefsByQuery } from '~/services'
import { withTranslation } from '../../../i18n'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
const uuidv4 = require('uuid/v4')
const { QUERY_MEDIA_REFS_LIMIT } = config()

const debouncedEpisodeFilterQuery = AwesomeDebouncePromise(getEpisodesByQuery, 750)
const debouncedMediaRefFilterQuery = AwesomeDebouncePromise(getMediaRefsByQuery, 750)

type Props = {
  adjustTopPosition?: boolean
  allCategories?: any
  currentId?: string
  episode?: any
  episodeId?: string
  handleSetPageQueryState: Function
  includeOldest?: boolean
  mediaPlayer?: any
  mediaPlayerLoadNowPlayingItem?: any
  mediaPlayerUpdatePlaying?: any
  pageIsLoading?: any
  pageKey: string
  page?: any
  pages?: any
  playerQueueAddSecondaryItems?: any
  playerQueueLoadSecondaryItems?: any
  podcast?: any
  podcastId?: string
  queryFrom?: string
  queryPage: number
  querySort?: string
  queryType?: string
  settings?: any
  showQueryTypeSelect?: boolean
  t?: any
  user?: any
  userSetInfo?: any
}

type State = {}

class MediaListCtrl extends Component<Props, State> {

  static defaultProps: Props = {
    handleSetPageQueryState: () => {},
    pageKey: 'default',
    queryPage: 1
  }

  queryListItems = async (queryType, queryFrom, querySort, page, categoryId) => {
    const { allCategories, episode, episodeId, handleSetPageQueryState, pageIsLoading, pageKey, pages,
      playerQueueLoadSecondaryItems, podcast, podcastId, user } = this.props
    const { subscribedPodcastIds } = user
    const { filterIsShowing, filterText } = pages[pageKey]

    this.setTemporaryMinHeightOnMediaList()
    
    const categories = categoryId || allCategories && allCategories[2].id /* Arts */

    const query: any = {
      page,
      from: queryFrom,
      sort: querySort,
      episodeId: queryFrom === PV.queryParams.from_episode ? episodeId : null,
      podcastId: queryFrom === PV.queryParams.from_podcast ? podcastId : null,
      categories,
      ...(filterIsShowing ? { searchAllFieldsText: filterText } : {}),
      ...(queryFrom === PV.queryParams.all_podcasts ||
          queryFrom === PV.queryParams.subscribed_only ? { includePodcast: true } : {}),
      ...(queryFrom === PV.queryParams.from_podcast ? { includeEpisode: true } : {})
    }

    cookieSetQuery(pageKey, queryFrom, queryType, querySort, categoryId)

    const newState: any = {
      pageKey,
      queryPage: page,
      queryType,
      queryFrom,
      querySort,
      categoryId,
      selected: queryFrom
    }
    pageIsLoading(true)

    handleSetPageQueryState({
      pageKey,
      queryType,
      queryFrom,
      querySort,
      ...(page <= 1 ? { listItems: []} : {}),
      categoryId,
      selected: queryFrom
    })

    if (queryFrom === PV.queryParams.from_podcast) {
      query.podcastId = podcastId
    } else if (queryFrom === PV.queryParams.subscribed_only) {
      if (subscribedPodcastIds && subscribedPodcastIds.length > 0) {
        query.podcastId = subscribedPodcastIds
      } else {
        handleSetPageQueryState({
          ...newState,
          listItems: [],
          listItemsTotal: 0
        })
        pageIsLoading(false)
        return
      }
    }

    try {
      let nowPlayingItems = []
      let listItemsTotal

      if (queryType === PV.queryParams.episodes) {
        const response = await getEpisodesByQuery(query)
        const episodes = response.data
        listItemsTotal = episodes[1]
        nowPlayingItems = episodes[0].map(x => convertToNowPlayingItem(x, episode, podcast))
      } else {
        const response = await getMediaRefsByQuery(query)
        const mediaRefs = response.data
        listItemsTotal = mediaRefs[1]
        nowPlayingItems = mediaRefs[0].map(x => convertToNowPlayingItem(x, episode, podcast))
      }

      playerQueueLoadSecondaryItems(clone(nowPlayingItems))

      handleSetPageQueryState({
        ...newState,
        listItems: nowPlayingItems,
        listItemsTotal
      })
    } catch (error) {
      console.log(error)
      handleSetPageQueryState({
        ...newState,
        listItems: [],
        listItemsTotal: 0
      })
    }

    pageIsLoading(false)

    this.clearTemporaryMinHeightOnMediaList()
  }

  querySort = async selectedValue => {
    const { pageKey, pages } = this.props
    const { categoryId, queryFrom, queryType } = pages[pageKey]
        
    await this.queryListItems(queryType, queryFrom, selectedValue, 1, categoryId)
  }

  setTemporaryMinHeightOnMediaList = () => {
    const mediaListEl = document.querySelector('.media-list') as any
    if (mediaListEl && mediaListEl.clientHeight > 0) {
      mediaListEl.style.minHeight = `${mediaListEl.clientHeight}px`
    }
  }

  clearTemporaryMinHeightOnMediaList = () => {
    const mediaListEl = document.querySelector('.media-list') as any
    if (mediaListEl) {
      mediaListEl.style.minHeight = 'unset'
    }
  }

  getQueryTypeOptions = () => {
    const { pageKey, pages, podcastId, user } = this.props
    const { categoryId, queryFrom } = pages[pageKey]

    return [
      {
        label: PV.i18n.common.Clips,
        onClick: () => this.queryListItems(PV.queryParams.clips, queryFrom, PV.queryParams.top_past_week, 1, categoryId),
        value: PV.queryParams.clips,
      },
      {
        label: PV.i18n.common.Episodes,
        onClick: () => this.queryListItems(
          PV.queryParams.episodes,
          podcastId ? PV.queryParams.from_podcast : queryFrom,
          (user && user.id && !podcastId) ? PV.queryParams.most_recent : PV.queryParams.top_past_week,
          1,
          categoryId
        ),
        value: PV.queryParams.episodes,
      }
    ]
  }

  getQueryFromOptions = (showFromPodcast, showFromEpisode) => {
    const { pageKey, pages } = this.props
    const { querySort, queryType } = pages[pageKey]

    const options = [] as any

    if (showFromPodcast) {
      options.unshift(
        {
          label: PV.i18n.queryLabels.FromThisPodcast,
          onClick: () => this.queryListItems(queryType, PV.queryParams.from_podcast, querySort, 1, null),
          value: PV.queryParams.from_podcast
        }
      )
    }

    if (showFromEpisode) {
      options.unshift(
        {
          label: PV.i18n.queryLabels.FromThisEpisode,
          onClick: () => this.queryListItems(queryType, PV.queryParams.from_episode, querySort, 1, null),
          value: PV.queryParams.from_episode
        }
      )
    }

    return options
  }

  getQuerySortOptions(includeOldest?: boolean, showChronological?: boolean) {
    const { t } = this.props

    const items = [
      {
        label: PV.i18n.queryLabels.most_recent,
        onClick: () => this.querySort(PV.queryParams.most_recent),
        value: PV.queryParams.most_recent
      },
      {
        label: PV.i18n.queryLabels.top_past_day,
        onClick: () => this.querySort(PV.queryParams.top_past_day),
        value: PV.queryParams.top_past_day
      },
      {
        label: PV.i18n.queryLabels.top_past_week,
        onClick: () => this.querySort(PV.queryParams.top_past_week),
        value: PV.queryParams.top_past_week
      },
      {
        label: PV.i18n.queryLabels.top_past_month,
        onClick: () => this.querySort(PV.queryParams.top_past_month),
        value: PV.queryParams.top_past_month
      },
      {
        label: PV.i18n.queryLabels.top_past_year,
        onClick: () => this.querySort(PV.queryParams.top_past_year),
        value: PV.queryParams.top_past_year
      },
      {
        label: PV.i18n.queryLabels.top_all_time,
        onClick: () => this.querySort(PV.queryParams.top_all_time),
        value: PV.queryParams.top_all_time
      },
      {
        label: t('queryLabels:random'),
        onClick: () => this.querySort(PV.queryParams.random),
        value: PV.queryParams.random
      }
    ]

    if (showChronological) {
      items.unshift({
        label: PV.queryParams.chronological,
        onClick: () => this.querySort(PV.queryParams.chronological),
        value: PV.queryParams.chronological
      })
    }

    if (includeOldest) {
      items.splice(1, 0, {
        label: PV.queryParams.oldest,
        onClick: () => this.querySort(PV.queryParams.oldest),
        value: PV.queryParams.oldest
      })
    }

    return items
  }

  playItem = async nowPlayingItem => {
    const { mediaPlayer, mediaPlayerLoadNowPlayingItem, mediaPlayerUpdatePlaying,
      pageKey, pages, playerQueueLoadSecondaryItems, user, userSetInfo } = this.props
    const { listItems, podcast } = pages[pageKey]
    const { nowPlayingItem: previousItem } = mediaPlayer
    
    if (window.player) {
      const currentTime = Math.floor(window.player.getCurrentTime()) || 0
      await addOrUpdateHistoryItemPlaybackPosition(mediaPlayer.nowPlayingItem, user, currentTime)
    }

    // If loading a new episode, clear the player to prevent the error:
    // TypeError: Failed to set the 'currentTime' property on 'HTMLMediaElement': The provided double value is non-finite.
    // I don't know why this is happening because everywhere I am setting player.seekTo
    // the value should be wrapped in a Math.floor().
    // I also don't understand why this issue happens only for new episodes, but not new clips :(
    if (nowPlayingItem 
        && previousItem 
        && !nowPlayingItem.clipStartTime
        && nowPlayingItem.episodeId !== previousItem.episodeId) {
      window.player = null
    }

    // If podcast data is not a part of the nowPlayingItem, then user must be
    // using the 'From this podcast' filter on the podcast, episode, or clip page,
    // and we will need to enrich the nowPlayingItem with the podcast data.
    if (!nowPlayingItem.podcastId && podcast) {
      nowPlayingItem.podcastId = podcast.id
      nowPlayingItem.podcastImageUrl = podcast.imageUrl
      nowPlayingItem.podcastTitle = podcast.title
    }

    nowPlayingItem = assignLocalOrLoggedInNowPlayingItemPlaybackPosition(user, nowPlayingItem)
    mediaPlayerLoadNowPlayingItem(nowPlayingItem)
    setNowPlayingItemInStorage(nowPlayingItem)
    mediaPlayerUpdatePlaying(true)

    let nowPlayingItemIndex = -1
    if (nowPlayingItem.clipId) {
      nowPlayingItemIndex = listItems.map((x) => x.clipId).indexOf(nowPlayingItem && nowPlayingItem.clipId)
    } else if (nowPlayingItem.episodeId) {
      nowPlayingItemIndex = listItems.map((x) => x.episodeId).indexOf(nowPlayingItem && nowPlayingItem.episodeId)
    }
    const queuedListItems = clone(listItems)
    if (nowPlayingItemIndex > -1) queuedListItems.splice(0, nowPlayingItemIndex + 1)
    playerQueueLoadSecondaryItems(queuedListItems)

    if (user && user.id) {
      await addOrUpdateHistoryItemPlaybackPosition(nowPlayingItem, user)

      const historyItems = user.historyItems.filter(x => {
        if (x) {
          if ((x.clipStartTime || x.clipEndTime) && x.clipId !== nowPlayingItem.clipId) {
            return x
          } else if (x.episodeId !== nowPlayingItem.episodeId) {
            return x
          }
        }
        return null
      })

      historyItems.push(nowPlayingItem)

      userSetInfo({ historyItems })
    }
  }

  toggleFilter = async () => {
    const { handleSetPageQueryState, pageKey, pages } = this.props
    const { categoryId, filterIsShowing, queryFrom, querySort, queryType } = pages[pageKey]
    
    handleSetPageQueryState({
      pageKey,
      filterIsShowing: !filterIsShowing,
      ...(filterIsShowing ? { filterText: '' } : {})
    })

    if (filterIsShowing) {
      await this.queryListItems(queryType, queryFrom, querySort, 1, categoryId)
    }
  }

  handleFilterTextChange = async event => {
    const { allCategories, episodeId, handleSetPageQueryState, pageIsLoading, pageKey,
      pages, podcastId, user } = this.props
    const { categoryId, queryFrom, querySort, queryType } = pages[pageKey]
    const { subscribedPodcastIds } = user
    const text = event.target.value

    pageIsLoading(true)

    handleSetPageQueryState({
      pageKey,
      filterText: text
    })

    let pId
    if (queryFrom === PV.queryParams.from_podcast) {
      pId = podcastId
    } else if (queryFrom === PV.queryParams.subscribed_only) {
      pId = subscribedPodcastIds && subscribedPodcastIds.length > 0 ? subscribedPodcastIds : [PV.queryParams.no_results]
    }

    const query: any = {
      page: 1,
      from: queryFrom,
      sort: querySort,
      categories: categoryId || ((queryFrom === PV.queryParams.from_category && allCategories) ? allCategories[2].id : null),
      episodeId: queryFrom === PV.queryParams.from_episode ? episodeId : null,
      podcastId: pId || null,
      searchAllFieldsText: text,
      includePodcast: !!text || queryFrom === PV.queryParams.subscribed_only || queryFrom === PV.queryParams.all_podcasts
    }

    try {
      let nowPlayingItems
      let listItemsTotal

      if (queryType === PV.queryParams.episodes) {
        const response = await debouncedEpisodeFilterQuery(query)
        const episodes = response.data
        nowPlayingItems = episodes[0].map(x => convertToNowPlayingItem(x))
        listItemsTotal = episodes[1]
      } else {
        const response = await debouncedMediaRefFilterQuery(query)
        const mediaRefs = response.data
        nowPlayingItems = mediaRefs[0].map(x => convertToNowPlayingItem(x))
        listItemsTotal = mediaRefs[1]
      }
      
      playerQueueLoadSecondaryItems(clone(nowPlayingItems))

      handleSetPageQueryState({
        pageKey,
        listItems: nowPlayingItems,
        listItemsTotal
      })
    } catch (error) {
      console.log(error)
      handleSetPageQueryState({
        pageKey,
        listItems: [],
        listItemsTotal: 0
      })
    }

    pageIsLoading(false)
  }

  clearFilterText = async () => {
    this.handleFilterTextChange({
      target: {
        value: ''
      }
    })
  }

  generateQueryTypeOptions = () => {
    const { pageKey, pages, podcastId, user } = this.props
    const { categoryId, queryFrom } = pages[pageKey]

    return [
      {
        label: PV.i18n.common.Clips,
        onClick: () => this.queryListItems(PV.queryParams.clips, queryFrom, PV.queryParams.top_past_week, 1, categoryId),
        value: PV.queryParams.clips,
      },
      {
        label: PV.i18n.common.Episodes,
        onClick: () => this.queryListItems(
          PV.queryParams.episodes,
          podcastId ? PV.queryParams.from_podcast : queryFrom,
          (user && user.id && !podcastId) ? PV.queryParams.most_recent : PV.queryParams.top_past_week,
          1,
          categoryId
        ),
        value: PV.queryParams.episodes,
      }
    ]
  }

  generateTopLevelSelectNodes = () => {
    const { pageKey, pages } = this.props
    const { queryFrom, queryType, querySort } = pages[pageKey]
    const topLevelItems = [] as any[]

    topLevelItems.push({
      label: PV.i18n.queryLabels.Subscribed,
      onClick: () => this.queryListItems(queryType, PV.queryParams.subscribed_only, querySort, 1, null),
      parentValue: null,
      value: PV.queryParams.subscribed_only
    })

    topLevelItems.push({
      label: PV.i18n.queryLabels.AllPodcasts,
      onClick: () => this.queryListItems(queryType, PV.queryParams.all_podcasts, querySort, 1, null),
      parentValue: null,
      value: PV.queryParams.all_podcasts
    })

    topLevelItems.push({
      label: PV.i18n.queryLabels.Categories,
      onClick: () => this.queryListItems(queryType, PV.queryParams.from_category, querySort, 1, null),
      parentValue: null,
      value: PV.queryParams.from_category
    })

    return (
      <MediaListSelect
        items={topLevelItems}
        key='top-level-select'
        selected={queryFrom} />
    )
  }

  generateCategorySelectNodes = (selectedCategoryId) => {
    const { allCategories, pageKey, pages } = this.props
    const { queryType, queryFrom, querySort, selected } = pages[pageKey]

    const categoryItems = allCategories.map(x => {
      return {
        hasSubcategories: x.categories && x.categories.length > 0,
        label: x.title,
        onClick: () => this.queryListItems(queryType, PV.queryParams.from_category, querySort, 1, x.id),
        parentValue: (x.category && x.category.id) || null,
        value: x.id
      }
    })

    const categorySelectNodes: any[] = []
    const selectedCategory = categoryItems.find(x => x.value === selectedCategoryId) || categoryItems[3] // Arts category

    if (selectedCategory) {
      const topLevelCategoryItems = categoryItems.filter(x => x.parentValue === null)

      let subcategoryItems: any[] = []
      if (selectedCategory.parentValue) {
        subcategoryItems = categoryItems.filter(x => x.parentValue === selectedCategory.parentValue)
      } else {
        subcategoryItems = categoryItems.filter(x => x.parentValue === selectedCategory.value)
      }

      subcategoryItems.unshift({
        label: PV.i18n.queryLabels.All,
        onClick: () => this.queryListItems(queryType, queryFrom, querySort, 1, selectedCategory.parentValue),
        parentValue: null,
        value: selectedCategory.parentValue
      })

      // If it is a top-level category with sub-categories
      if (selectedCategory.hasSubcategories) {
        categorySelectNodes.push(
          <MediaListSelect
            items={topLevelCategoryItems}
            key='category-select-1'
            selected={selectedCategory.value} />
        )
        categorySelectNodes.push(
          <MediaListSelect
            items={subcategoryItems}
            key='category-select-2' />
        )
      }
      // Else if it is a sub-category
      else if (selectedCategory.parentValue) {
        const topLevelCategoryItems = categoryItems.filter(x => x.parentValue === null)

        categorySelectNodes.push(
          <MediaListSelect
            items={topLevelCategoryItems}
            key='category-select-3'
            selected={selectedCategory.parentValue} />
        )

        categorySelectNodes.push(
          <MediaListSelect
            items={subcategoryItems}
            key='category-select-4'
            selected={selectedCategory.value} />
        )
      }
      // Else it is a top-level category without sub-categories
      else {
        categorySelectNodes.push(
          <MediaListSelect
            items={topLevelCategoryItems}
            key='category-select-5'
            selected={selectedCategory.value} />
        )
      }
    } else {
      const topLevelCategoryItems = categoryItems.filter(x => x.parentValue === null)
      categorySelectNodes.push(
        <MediaListSelect
          items={topLevelCategoryItems}
          key='category-select-6'
          selected={selected} />
      )
    }

    return categorySelectNodes
  }

  handleQueryPage = async page => {
    const { pageIsLoading, pageKey, pages } = this.props
    const { categoryId, queryFrom, querySort, queryType } = pages[pageKey]
    pageIsLoading(true)

    await this.queryListItems(
      queryType,
      queryFrom,
      querySort,
      page,
      categoryId
    )
    
    pageIsLoading(false)

    const mediaListSelectsEl = document.querySelector('.media-list__selects')
    if (mediaListSelectsEl) {
      mediaListSelectsEl.scrollIntoView()
    }
  }

  render() {
    const { adjustTopPosition, episodeId, includeOldest, mediaPlayer, page, pageKey, pages,
      podcastId, settings, showQueryTypeSelect, t, user } = this.props
    const { isLoading } = page
    const { filterButtonHide } = settings
    const { nowPlayingItem: mpNowPlayingItem } = mediaPlayer
    const { categoryId, filterIsShowing, filterText, listItems, listItemsTotal, queryFrom,
      queryPage, querySort, queryType } = pages[pageKey]

    let mediaListItemType = PV.attributes.mediaListItem.now_playing_item
    if (queryType === PV.queryParams.episodes) {
      if (queryFrom === PV.queryParams.from_podcast) {
        mediaListItemType = PV.attributes.mediaListItem.now_playing_episode_from_podcast
      } else if (queryFrom === PV.queryParams.all_podcasts) {
        mediaListItemType = PV.attributes.mediaListItem.now_playing_episode_from_all_podcasts
      }
    } else {
      if (queryFrom === PV.queryParams.from_episode) {
        mediaListItemType = PV.attributes.mediaListItem.now_playing_clip_from_episode
      } else if (queryFrom === PV.queryParams.from_podcast) {
        mediaListItemType = PV.attributes.mediaListItem.now_playing_clip_from_podcast
      }
    }

    const listItemNodes = listItems.map(x => {
      const isActive = () => {
        if (mpNowPlayingItem) {
          if (x.clipId) {
            return x.clipId === mpNowPlayingItem.clipId
          } else if (x.episodeId) {
            return x.episodeId === mpNowPlayingItem.episodeId
          }
        }

        return false
      }

      return (
        <MediaListItemCtrl
          handlePlayItem={this.playItem}
          key={`media-list-item-${uuidv4()}`}
          isActive={isActive()}
          mediaListItemType={mediaListItemType}
          nowPlayingItem={x}
          pageKey={pageKey}
          showMoreMenu={true} />
      )
    })

    const selectedQueryTypeOption = this.getQueryTypeOptions().filter(x => x.value === queryType)
    const selectedQueryFromOption = this.getQueryFromOptions(
      !!podcastId, !!episodeId && queryType === PV.queryParams.clips).filter(x => x.value === queryFrom)
    const sortOptions = this.getQuerySortOptions(includeOldest, !!episodeId && queryType === PV.queryParams.clips && queryFrom === PV.queryParams.from_episode)
    const selectedQuerySortOption = sortOptions.filter(x => x.value === querySort)
    const isNotLoggedInOnSubscribedOnly = (!user || !user.id) && queryFrom === PV.queryParams.subscribed_only
    const itemType = queryType === PV.queryParams.episodes ? PV.queryParams.episodes : PV.queryParams.clips
    const noResultsFoundMsg = isNotLoggedInOnSubscribedOnly ? t('errorMessages:login.ViewYourSubscriptions') : PV.i18n.common.noResultsMessage(itemType)

    return (      
      <div className={`media-list ${adjustTopPosition ? 'adjust-top-position' : ''}`}>
        <div className='media-list__selects'>
          <div className='media-list-selects__left'>
            {
              showQueryTypeSelect &&
                <MediaListSelect
                  items={this.getQueryTypeOptions()}
                  selected={selectedQueryTypeOption.length > 0 ? selectedQueryTypeOption[0].value : null} />
            }
            {
              (podcastId || episodeId) ?
                <MediaListSelect
                  items={this.getQueryFromOptions(!!podcastId, !!episodeId && queryType === PV.queryParams.clips)}
                  selected={selectedQueryFromOption.length > 0 ? selectedQueryFromOption[0].value : null} />
                :
                this.generateTopLevelSelectNodes()}
          </div>
          <div className='media-list-selects__right'>
            <MediaListSelect
              className='align-right'
              items={sortOptions}
              selected={selectedQuerySortOption.length > 0 ? selectedQuerySortOption[0].value : null} />
          </div>
        </div>
        <div className='media-list__selects'>
          <div className='media-list-selects__inline'>
            {queryFrom === PV.queryParams.from_category && !podcastId && !episodeId && this.generateCategorySelectNodes(categoryId)}
          </div>
        </div>
        {
          filterButtonHide !== 'true' &&
            <div className='media-list__filter'>
              <InputGroup>
                <InputGroupAddon
                  addonType='prepend'
                  className='media-list-filter__filter-icon'>
                  <Button
                    className={filterIsShowing ? '' : 'not-showing'}
                    onClick={this.toggleFilter}>
                    <FontAwesomeIcon icon='filter' /> filter
                  </Button>
                </InputGroupAddon>
                {
                  filterIsShowing &&
                  <Fragment>
                    <Input
                      onChange={this.handleFilterTextChange}
                      value={filterText || ''} />
                    <InputGroupAddon
                      addonType='append'
                      className='media-list-filter__clear-icon'>
                      <Button onClick={this.clearFilterText}>
                        <FontAwesomeIcon icon='times' />
                      </Button>
                    </InputGroupAddon>
                  </Fragment>  
                }
              </InputGroup>
            </div>
        }
        <Fragment>
          {
            listItemNodes && listItemNodes.length > 0 &&
              <Fragment>
                {listItemNodes}
                <Pagination
                  currentPage={queryPage || 1}
                  handleQueryPage={this.handleQueryPage}
                  pageRange={2}
                  totalPages={Math.ceil(listItemsTotal / QUERY_MEDIA_REFS_LIMIT)} />
              </Fragment>
          }
          {
            (!isLoading && queryPage === 1 && listItemNodes && listItemNodes.length === 0) &&
              <div className='no-results-msg'>{noResultsFoundMsg}</div>
          }
        </Fragment>
      </div>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  mediaPlayerLoadNowPlayingItem: bindActionCreators(mediaPlayerLoadNowPlayingItem, dispatch),
  mediaPlayerUpdatePlaying: bindActionCreators(mediaPlayerUpdatePlaying, dispatch),
  pageIsLoading: bindActionCreators(pageIsLoading, dispatch),
  playerQueueAddSecondaryItems: bindActionCreators(playerQueueAddSecondaryItems, dispatch),
  playerQueueLoadPriorityItems: bindActionCreators(playerQueueLoadPriorityItems, dispatch),
  playerQueueLoadSecondaryItems: bindActionCreators(playerQueueLoadSecondaryItems, dispatch),
  userSetInfo: bindActionCreators(userSetInfo, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(MediaListCtrl))
