
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux';
import { MediaListItem, addItemToPriorityQueueStorage, getPriorityQueueItemsStorage
  } from 'podverse-ui'
import { generateShareURLs, getViewContentsElementScrollTop } from '~/lib/utility'
import { modalsAddToShow, modalsShareShow, pageIsLoading, pagesSetQueryState, playerQueueLoadPriorityItems,
  userSetInfo } from '~/redux/actions'
import { updateUserQueueItems } from '~/services'
const uuidv4 = require('uuid/v4')

type Props = {
  canDrag?: boolean
  handlePlayItem?: (event: React.MouseEvent<HTMLButtonElement>) => void
  handleRemoveItem?: (event: React.MouseEvent<HTMLButtonElement>) => void
  hideDescription?: boolean
  hideDivider?: boolean
  isActive?: boolean
  mediaListItemType?: any
  mediaPlayerLoadNowPlayingItem?: any
  mediaPlayerUpdatePlaying?: any
  modals?: any
  modalsAddToShow?: any
  modalsShareShow?: any
  nowPlayingItem?: any
  pageIsLoading?: any
  pageKey?: string
  pagesSetQueryState?: any
  playerQueueLoadPriorityItems?: any
  playlist?: any
  podcast?: any
  profileUser?: any
  queryFrom?: string
  queryType?: string
  settings?: any
  showMoreMenu?: boolean
  showRemove?: boolean
  user?: any
  userSetInfo?: any
}

type State = {}

class MediaListItemCtrl extends Component<Props, State> {

  addToQueue = async (nowPlayingItem, isLast) => {
    const { playerQueueLoadPriorityItems, user } = this.props

    let priorityItems = []
    if (user && user.id) {
      user.queueItems = Array.isArray(user.queueItems) ? user.queueItems : []
      isLast ? user.queueItems.push(nowPlayingItem) : user.queueItems.unshift(nowPlayingItem)

      const response = await updateUserQueueItems({ queueItems: user.queueItems })
      priorityItems = response.data || []
    } else {
      addItemToPriorityQueueStorage(nowPlayingItem, isLast)

      priorityItems = getPriorityQueueItemsStorage()
    }

    playerQueueLoadPriorityItems(priorityItems)
  }

  toggleAddToModal = (nowPlayingItem, showQueue = true) => {
    const { modals, modalsAddToShow } = this.props
    const { addTo } = modals
    const { isOpen } = addTo

    modalsAddToShow({
      isOpen: !isOpen,
      nowPlayingItem,
      showQueue
    })
  }

  toggleShareModal = (nowPlayingItem) => {
    const { modals, modalsShareShow } = this.props
    const { share } = modals
    const { isOpen } = share

    const { clipLinkAs, episodeLinkAs, podcastLinkAs } = generateShareURLs(nowPlayingItem)

    modalsShareShow({
      clipLinkAs,
      episodeLinkAs,
      isOpen: !isOpen,
      podcastLinkAs
    })
  }

  linkClick = () => {
    const { pageIsLoading, pageKey, pagesSetQueryState } = this.props
    pageIsLoading(true)

    const scrollPos = getViewContentsElementScrollTop()
    pagesSetQueryState({
      pageKey,
      lastScrollPosition: scrollPos
    })
  }

  render() {
    const { handleRemoveItem, handlePlayItem, hideDescription, hideDivider, isActive,
      mediaListItemType, nowPlayingItem, playlist, podcast, profileUser, settings, showMoreMenu,
      showRemove } = this.props
    const { censorNSFWText } = settings

    return (
      <MediaListItem
        censorNSFWText={censorNSFWText === 'true' || !censorNSFWText}
        dataNowPlayingItem={nowPlayingItem}
        dataPlaylist={playlist}
        dataPodcast={podcast}
        dataUser={profileUser}
        handleAddToQueueLast={() => { this.addToQueue(nowPlayingItem, true) }}
        handleAddToQueueNext={() => { this.addToQueue(nowPlayingItem, false) }}
        handleLinkClick={this.linkClick}
        handlePlayItem={() => handlePlayItem ? handlePlayItem(nowPlayingItem) : null}
        handleRemoveItem={handleRemoveItem}
        handleToggleAddToPlaylist={() => this.toggleAddToModal(nowPlayingItem, false)}
        handleToggleShare={() => this.toggleShareModal(nowPlayingItem)}
        hasLink={true}
        hideDescription={hideDescription}
        hideDivider={hideDivider}
        isActive={isActive}
        isSlim={!!profileUser}
        itemType={mediaListItemType}
        key={`nowPlayingListItem-${uuidv4()}`}
        showMoreMenu={showMoreMenu}
        showRemove={showRemove} />
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  modalsAddToShow: bindActionCreators(modalsAddToShow, dispatch),
  modalsShareShow: bindActionCreators(modalsShareShow, dispatch),
  pageIsLoading: bindActionCreators(pageIsLoading, dispatch),
  pagesSetQueryState: bindActionCreators(pagesSetQueryState, dispatch),
  playerQueueLoadPriorityItems: bindActionCreators(playerQueueLoadPriorityItems, dispatch),
  userSetInfo: bindActionCreators(userSetInfo, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(MediaListItemCtrl)
