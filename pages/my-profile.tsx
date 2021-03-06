import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Meta from '~/components/Meta/Meta'
import UserHeaderCtrl from '~/components/UserHeaderCtrl/UserHeaderCtrl'
import UserMediaListCtrl from '~/components/UserMediaListCtrl/UserMediaListCtrl'
import config from '~/config'
import PV from '~/lib/constants'
import { convertToNowPlayingItem } from '~/lib/nowPlayingItem'
import { clone } from '~/lib/utility'
import { pageIsLoading, playerQueueLoadSecondaryItems, pagesSetQueryState } from '~/redux/actions'
import { getLoggedInUserMediaRefs, getLoggedInUserPlaylists, getPodcastsByQuery
  } from '~/services'
import { withTranslation } from '../i18n'
const { BASE_URL } = config()

type Props = {
  lastScrollPosition?: number
  listItems?: any[]
  pageKey?: string
  pagesSetQueryState?: any
  queryPage?: number
  querySort?: string
  queryType?: string
  t: any
  user?: any
}

type State = {}

const kPageKey = 'my_profile'

class MyProfile extends Component<Props, State> {

  static async getInitialProps({ bearerToken, query, req, store }) {
    const state = store.getState()
    const { pages, user } = state
    
    const currentPage = pages[kPageKey] || {}
    const lastScrollPosition = currentPage.lastScrollPosition
    const queryPage = currentPage.queryPage || query.page || 1
    const querySort = currentPage.querySort || query.sort || PV.queryParams.alphabetical
    const queryType = currentPage.queryType || query.type || PV.queryParams.podcasts

    if (Object.keys(currentPage).length === 0) {
      let queryDataResult
      let listItems = [] as any

      if (queryType === PV.queryParams.clips) {
        queryDataResult = await getLoggedInUserMediaRefs(bearerToken, 'on', queryPage)
        const mediaRefs = queryDataResult.data as any
        const nowPlayingItems = mediaRefs[0].map(x => convertToNowPlayingItem(x))
        listItems = [nowPlayingItems, mediaRefs[1]]
        store.dispatch(playerQueueLoadSecondaryItems(clone(listItems[0])))
      } else if (queryType === PV.queryParams.playlists) {
        queryDataResult = await getLoggedInUserPlaylists(bearerToken, queryPage)
        listItems = queryDataResult.data
      } else if (
        queryType === PV.queryParams.podcasts
        && user.subscribedPodcastIds
        && user.subscribedPodcastIds.length > 0) {
        queryDataResult = await getPodcastsByQuery({
          from: PV.queryParams.subscribed_only,
          page: queryPage,
          sort: querySort,
          subscribedPodcastIds: user.subscribedPodcastIds
        })
        listItems = queryDataResult.data
      }

      store.dispatch(pagesSetQueryState({
        pageKey: kPageKey,
        listItems: listItems[0],
        listItemsTotal: listItems[1],
        queryPage,
        querySort,
        queryType
      }))
    }
    
    store.dispatch(pageIsLoading(false))

    const namespacesRequired = PV.nexti18next.namespaces
    return { lastScrollPosition, namespacesRequired, pageKey: kPageKey, user }
  }

  render() {
    const { pageKey, pagesSetQueryState, queryPage, querySort, queryType, t, user
      } = this.props

    const meta = {
      currentUrl: BASE_URL + PV.paths.web.my_profile,
      description: t('pages:my_profile._Description'),
      title: t('pages:my_profile._Title')
    }
      

    return (
      <div className='user-profile'>
        <Meta
          description={meta.description}
          ogDescription={meta.description}
          ogTitle={meta.title}
          ogType='website'
          ogUrl={meta.currentUrl}
          robotsNoIndex={true}
          title={meta.title}
          twitterDescription={meta.description}
          twitterTitle={meta.title} />
        {
          !user &&
            <h3>Page not found</h3>
        }
        {
          user &&
          <Fragment>
            <UserHeaderCtrl
              loggedInUser={user}
              profileUser={user} />
            <UserMediaListCtrl
              handleSetPageQueryState={pagesSetQueryState}
              isMyProfilePage={true}
              loggedInUser={user}
              pageKey={pageKey}
              queryPage={queryPage}
              querySort={querySort}
              queryType={queryType}
              profileUser={user} />
          </Fragment>
        }
      </div>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  pagesSetQueryState: bindActionCreators(pagesSetQueryState, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(MyProfile))
