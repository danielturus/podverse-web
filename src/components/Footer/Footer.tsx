import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebookF, faGithub, faRedditAlien, faTwitter } from '@fortawesome/free-brands-svg-icons'
import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Link from 'next/link'
import Switch from 'react-switch'
import config from '~/config'
import PV from '~/lib/constants'
import { getViewContentsElementScrollTop } from '~/lib/utility'
import { pageIsLoading, pagesSetQueryState, settingsSetNSFWMode, settingsSetUITheme
  } from '~/redux/actions'
const cookie = require('cookie')
const { CONTACT_FORM_URL, SOCIAL_FACEBOOK_PAGE_URL, SOCIAL_GITHUB_PAGE_URL,
  SOCIAL_REDDIT_PAGE_URL, SOCIAL_TWITTER_PAGE_URL } = config()

type Props = {
  isMobileDevice?: boolean
  pageIsLoading?: any
  pageKey?: string
  pagesSetQueryState?: any
  settings: any
  settingsSetNSFWMode: any
  settingsSetUITheme: any
  user: any
}

type State = {
  nsfwModalIsOpen?: boolean
}

class Footer extends Component<Props, State> {

  constructor(props) {
    super(props)

    this.state = {}
  }
  
  handleUIThemeChange = checked => {
    const { settingsSetUITheme } = this.props
    const uiTheme = checked ? PV.attributes.dark : PV.attributes.light

    settingsSetUITheme(uiTheme)

    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    const uiThemeCookie = cookie.serialize(PV.cookies.uiTheme, uiTheme, {
      expires,
      path: PV.paths.web.home
    })
    document.cookie = uiThemeCookie

    const html = document.querySelector('html')
    if (html) {
      html.setAttribute(PV.attributes.data_theme, uiTheme)
      // use .is-switching-ui-mode to prevent ugly transition effects
      html.setAttribute(PV.attributes.is_switching_ui_mode, 'true')
      setTimeout(() => {
        html.setAttribute(PV.attributes.is_switching_ui_mode, '')
      }, 1000)
    }
  }

  handleNSFWModeChange = checked => {
    const { settingsSetNSFWMode } = this.props
    const nsfwMode = checked ? 'on' : 'off'

    settingsSetNSFWMode(nsfwMode)

    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    const nsfwModeCookie = cookie.serialize(PV.attributes.nsfwMode, nsfwMode, {
      expires,
      path: PV.paths.web.home
    })
    document.cookie = nsfwModeCookie

    this.setState({ nsfwModalIsOpen: true })
  }

  hideNSFWModal = () => {
    this.setState({ nsfwModalIsOpen: false })
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
    const { settings } = this.props
    const { uiTheme, uiThemeHide } = settings

    const uiThemeAriaLabel = uiTheme === PV.attributes.dark || !uiTheme ? PV.i18n.common.TurnOnLight : PV.i18n.common.TurnOnDark

    return (
      <React.Fragment>
        <div className='footer'>
          <div className='footer__top'>
            <Link
              as={PV.paths.web.home}
              href={PV.paths.web.home}>
              <a
                className='footer-top__brand'
                onClick={this.linkClick}>
                Podverse
              </a>
            </Link>
            {
              uiThemeHide !== 'true' &&
                <div className='footer-top__ui-theme'>
                  <span className='footer-top-ui-theme__left'>
                    <FontAwesomeIcon icon='sun' />&nbsp;
                  </span>
                  <Switch
                    aria-label={uiThemeAriaLabel}
                    checked={!uiTheme || uiTheme === PV.attributes.dark}
                    checkedIcon
                    height={24}
                    id="ui-theme-switch"
                    offColor={PV.colors.grayLighter}
                    onColor={PV.colors.grayDarker}
                    onChange={this.handleUIThemeChange}
                    uncheckedIcon
                    width={40} />
                  <span className='footer-top-ui-theme__right'>
                    &nbsp;<FontAwesomeIcon icon='moon' />
                  </span>
                </div>
            }
            {/* {
              nsfwModeHide !== 'true' &&
                <div className='footer-top__nsfw'>
                  <span className='footer-top-nsfw__left'>SFW&nbsp;</span>
                  <Switch
                    aria-label={nsfwModeAriaLabel}
                    checked={!nsfwMode || nsfwMode === 'on'}
                    checkedIcon
                    height={24}
                    offColor={colors.blue}
                    onChange={this.handleNSFWModeChange}
                    onColor={colors.redDarker}
                    uncheckedIcon
                    width={40} />
                  <span className='footer-top-nsfw__right'>&nbsp;NSFW</span>
                </div>
            } */}
            <Link
              as={PV.paths.web.license}
              href={PV.paths.web.license}>
              <a 
                className='footer-top__license'
                target='_blank'>
                <span className='hide-tiny'>open source </span>
                <span className='flip-text-horizontal'>&copy;</span>
              </a>
            </Link>
          </div>
          <div className='footer__bottom'>
            <div className='footer-bottom__site-links'>
              <Link
                as={CONTACT_FORM_URL}
                href={CONTACT_FORM_URL || ''}>
                <a 
                  className='footer-bottom__link'
                  target='_blank'>
                  {PV.i18n.common.Contact}
                </a>
              </Link>
              {/* <Link
                as='/faq'
                href='/faq'>
                <a
                  className='footer-bottom__link'
                  onClick={this.linkClick}>
                  FAQ
                </a>
              </Link> */}
              <Link
                as={PV.paths.web.about}
                href={PV.paths.web.about}>
                <a
                  className='footer-bottom__link'
                  onClick={this.linkClick}>
                  {PV.i18n.common.About}
                </a>
              </Link>
              <Link
                as={PV.paths.web.terms}
                href={PV.paths.web.terms}>
                <a
                  className='footer-bottom__link'
                  onClick={this.linkClick}>
                  {PV.i18n.common.Terms}
                </a>
              </Link>
              <Link
                as={PV.paths.web.faq}
                href={PV.paths.web.faq}>
                <a
                  className='footer-bottom__link'
                  onClick={this.linkClick}>
                  {PV.i18n.common.FAQ}
                </a>
              </Link>
              <Link
                as={PV.paths.web.membership}
                href={PV.paths.web.membership}>
                <a
                  className='footer-bottom__link'
                  onClick={this.linkClick}>
                  {PV.i18n.common.Premium}
                </a>
              </Link>
            </div>
            <div className='footer-bottom__social-links'>
              {
                SOCIAL_GITHUB_PAGE_URL &&
                  <Link
                    as={SOCIAL_GITHUB_PAGE_URL}
                    href={SOCIAL_GITHUB_PAGE_URL}>
                    <a
                      className='footer-bottom__social-link'
                      target='_blank'>
                      <FontAwesomeIcon icon={faGithub} />
                    </a>
                  </Link>
              }
              {
                SOCIAL_TWITTER_PAGE_URL &&
                  <Link
                    as={SOCIAL_TWITTER_PAGE_URL}
                    href={SOCIAL_TWITTER_PAGE_URL}>
                    <a
                      className='footer-bottom__social-link'
                      target='_blank'>
                      <FontAwesomeIcon icon={faTwitter} />
                    </a>
                  </Link>
              }
              {
                SOCIAL_FACEBOOK_PAGE_URL &&
                  <Link
                    as={SOCIAL_FACEBOOK_PAGE_URL}
                    href={SOCIAL_FACEBOOK_PAGE_URL}>
                    <a
                      className='footer-bottom__social-link'
                      target='_blank'>
                      <FontAwesomeIcon icon={faFacebookF} />
                    </a>
                  </Link>
              }
              {
                SOCIAL_REDDIT_PAGE_URL &&
                  <Link
                    as={SOCIAL_REDDIT_PAGE_URL}
                    href={SOCIAL_REDDIT_PAGE_URL}>
                    <a
                      className='footer-bottom__social-link'
                      target='_blank'>
                      <FontAwesomeIcon icon={faRedditAlien} />
                    </a>
                  </Link>
              }
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  pageIsLoading: bindActionCreators(pageIsLoading, dispatch),
  pagesSetQueryState: bindActionCreators(pagesSetQueryState, dispatch),
  settingsSetNSFWMode: bindActionCreators(settingsSetNSFWMode, dispatch),
  settingsSetUITheme: bindActionCreators(settingsSetUITheme, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Footer)
