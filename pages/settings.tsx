import ClipboardJS from 'clipboard'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Form, FormFeedback, FormGroup, FormText, Input, InputGroup, InputGroupAddon, Label } from 'reactstrap'
import { bindActionCreators } from 'redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from 'podverse-ui'
import Meta from '~/components/Meta/Meta'
import CheckoutModal from '~/components/CheckoutModal/CheckoutModal'
import { DeleteAccountModal } from '~/components/DeleteAccountModal/DeleteAccountModal'
import PV from '~/lib/constants'
import { alertPremiumRequired, alertRateLimitError, alertSomethingWentWrong, convertToYYYYMMDDHHMMSS,
  isBeforeDate, validateEmail, safeAlert } from '~/lib/utility'
import { modalsSignUpShow, pageIsLoading, settingsCensorNSFWText, settingsHideFilterButton,
  settingsHideNSFWLabels, settingsHideNSFWMode, settingsHidePlaybackSpeedButton,
  settingsHideTimeJumpBackwardButton, userSetInfo } from '~/redux/actions'
import { downloadLoggedInUserData, updateLoggedInUser } from '~/services'
import config from '~/config'
import { withTranslation } from '../i18n'
const { BASE_URL } = config()
const fileDownload = require('js-file-download')
const cookie = require('cookie')

type Props = {
  lastScrollPosition?: number
  modalsSignUpShow?: any
  pageKey?: string
  settings?: any
  settingsCensorNSFWText?: any
  settingsHideFilterButton?: any
  settingsHideNSFWMode?: any
  settingsHideTimeJumpBackwardButton?: any
  settingsHidePlaybackSpeedButton?: any
  settingsHideNSFWLabels?: any
  t: any
  user?: any
  userSetInfo?: any
}

type State = {
  email?: string
  emailError?: string
  isCheckoutOpen?: boolean
  isDeleteAccountOpen?: boolean
  isDeleting?: boolean
  isDownloading?: boolean
  isPublic?: boolean
  isSaving?: boolean
  name?: string
  wasCopied?: boolean
}

const kPageKey = 'settings'

class Settings extends Component<Props, State> {

  static async getInitialProps({ req, store }) {
    const state = store.getState()
    const { pages } = state

    const currentPage = pages[kPageKey] || {}
    const lastScrollPosition = currentPage.lastScrollPosition

    store.dispatch(pageIsLoading(false))

    const namespacesRequired = PV.nexti18next.namespaces

    return { lastScrollPosition, namespacesRequired, pageKey: kPageKey }
  }

  constructor(props) {
    super(props)
    const { user } = props

    this.state = {
      ...(user.email ? { email: user.email } : {}),
      isDownloading: false,
      ...(user.isPublic || user.isPublic === false ? {isPublic: user.isPublic} : {}),
      ...(user.name ? {name: user.name} : {})
    }
  }

  componentDidMount() {
    new ClipboardJS('#settings-privacy-profile-link .btn')
  }

  profileLinkHref = () => {
    const { user } = this.props
    return `${BASE_URL}${PV.paths.web.profile}/${user.id}`
  }

  copyProfileLink = () => {
    this.setState({ wasCopied: true })
    setTimeout(() => {
      this.setState({ wasCopied: false })
    }, 3000)
  }

  componentWillReceiveProps (newProps) {
    const oldProps = this.props
    
    if (!oldProps.user.id && newProps.user.id) {
      this.setState({
        email: newProps.user.email,
        isPublic: newProps.user.isPublic,
        name: newProps.user.name
      })
    }
  }

  downloadLoggedInUserData = async () => {
    this.setState({ isDownloading: true })
    const { user } = this.props

    try {
      const userData = await downloadLoggedInUserData(user.id)
      fileDownload(JSON.stringify(userData.data), `podverse-${convertToYYYYMMDDHHMMSS()}`)
    } catch (error) {
      if (error && error.response && error.response.status === 429) {
        alertRateLimitError(error)
      } else {
        safeAlert(PV.i18n.errorMessages.alerts.somethingWentWrong)
      }
      console.log(error)
    }

    this.setState({ isDownloading: false })
  }

  handleEmailChange = event => {
    const email = event.target.value
    this.setState({ email })
  }

  handleNameChange = event => {
    const name = event.target.value
    this.setState({ name })
  }

  handlePrivacyChange = event => {
    const isPublic = event.target.value
    this.setState({ isPublic: isPublic === 'public' }, () => {
      // If the share button should have appeared, apply the Clipboard event listener
      if (isPublic === 'public') {
        new ClipboardJS('#settings-privacy-profile-link .btn')
      }
    })
  }

  handleToggleFilterButton = event => {
    const { settingsHideFilterButton } = this.props
    const isChecked = event.currentTarget.checked
    const val = isChecked ? true : false

    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    const c = cookie.serialize('filterButtonHide', val, {
      expires,
      path: '/'
    })
    document.cookie = c

    settingsHideFilterButton(`${val}`)
  }

  handleToggleNSFWLabels = event => {
    const { settingsHideNSFWLabels } = this.props
    const isChecked = event.currentTarget.checked
    const val = isChecked ? true : false

    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    const c = cookie.serialize('nsfwLabelsHide', val, {
      expires,
      path: '/'
    })
    document.cookie = c

    settingsHideNSFWLabels(`${val}`)
  }

  handleToggleCensorNSFWText = event => {
    const { settingsCensorNSFWText } = this.props
    const isChecked = event.currentTarget.checked
    const val = isChecked ? true : false

    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    const c = cookie.serialize('censorNSFWText', val, {
      expires,
      path: '/'
    })
    document.cookie = c

    settingsCensorNSFWText(`${val}`)
  }

  handleToggleNSFWMode = event => {
    const { settingsHideNSFWMode } = this.props
    const isChecked = event.currentTarget.checked
    const val = isChecked ? true : false

    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    const c = cookie.serialize('nsfwModeHide', val, {
      expires,
      path: '/'
    })
    document.cookie = c
        
    settingsHideNSFWMode(`${val}`)
  }

  handleTogglePlaybackSpeedButton = event => {
    const { settingsHidePlaybackSpeedButton } = this.props
    const isChecked = event.currentTarget.checked
    const val = isChecked ? true : false

    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    const c = cookie.serialize('playbackSpeedButtonHide', val, {
      expires,
      path: '/'
    })
    document.cookie = c

    settingsHidePlaybackSpeedButton(`${val}`)
  }

  handleToggleTimeJumpBackwardButton = event => {
    const { settingsHideTimeJumpBackwardButton } = this.props
    const isChecked = event.currentTarget.checked
    const val = isChecked ? true : false

    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    const c = cookie.serialize('timeJumpBackwardButtonHide', val, {
      expires,
      path: '/'
    })
    document.cookie = c

    settingsHideTimeJumpBackwardButton(`${val}`)
  }

  validateProfileData = () => {
    const { user } = this.props
    const { email: oldEmail, isPublic: oldIsPublic, name: oldName } = user
    const { email: newEmail, isPublic: newIsPublic, name: newName } = this.state

    return (
      (oldEmail !== newEmail && validateEmail(newEmail))
      || (oldName !== newName && (!newEmail || validateEmail(newEmail))
      || (oldIsPublic !== newIsPublic && (!newEmail || validateEmail(newEmail))))
    )
  }

  validateEmail = () => {
    const { email } = this.state
    if (!validateEmail(email)) {
      this.setState({ emailError: PV.i18n.errorMessages.message.PleaseProvideValidEmail })
    } else {
      this.setState({ emailError: '' })
    }
  }

  resetProfileChanges = () => {
    const { user } = this.props
    const { email, name } = user
    this.setState({ email, name })
  }

  updateProfile = async () => {
    this.setState({ isSaving: true })
    const { user, userSetInfo } = this.props
    const { id } = user
    const { email, isPublic, name } = this.state

    try {
      const newData = { email, id, isPublic, name }
      await updateLoggedInUser(newData)
      userSetInfo(newData)
    } catch (error) {
      if (error && error.response && error.response.data && error.response.data.message === PV.i18n.common.PremiumMembershipRequired) {
        alertPremiumRequired()
      } else if (error && error.response && error.response.status === 429) {
        alertRateLimitError(error)
      } else {
        alertSomethingWentWrong()
      }
    }

    this.setState({ isSaving: false })
  }

  showSignUpModal = () => {
    const { modalsSignUpShow } = this.props
    modalsSignUpShow(true)
  }

  toggleCheckoutModal = show => {
    this.setState({ isCheckoutOpen: show })
  }
  
  toggleDeleteAccountModal = show => {
    this.setState({ isDeleteAccountOpen: show })
  }
  
  render() {
    const { settings, t, user } = this.props
    const meta = {
      currentUrl: BASE_URL + PV.paths.web.settings,
      description: t('pages:settings._Description'),
      title: t('pages:settings._Title')
    }
    const { censorNSFWText, filterButtonHide, nsfwLabelsHide, playbackSpeedButtonHide,
      timeJumpBackwardButtonHide } = settings
    const { email, emailError, isCheckoutOpen, isDeleteAccountOpen, isDownloading,
      isPublic, isSaving, name, wasCopied } = this.state
    const isLoggedIn = user && !!user.id

    const checkoutBtn = (isRenew = false) => (
      <Button
        className='settings-membership__checkout'
        color='primary'
        onClick={() => this.toggleCheckoutModal(true)}>
        <FontAwesomeIcon icon='shopping-cart' />&nbsp;&nbsp;{isRenew ? PV.i18n.common.Renew : PV.i18n.common.Checkout}
      </Button>
    )

    const membershipStatusHeader = <h3 id='membership'>{PV.i18n.common.MembershipStatus}</h3>

    return (
      <div className='settings'>
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
        <h3>{PV.i18n.common.Settings}</h3>
        <Form>
          {
            isLoggedIn &&
            <Fragment>
                <FormGroup>
                  <Label for='settings-name'>{PV.i18n.common.Name}</Label>
                  <Input 
                    id='settings-name'
                    name='settings-name'
                    onChange={this.handleNameChange}
                    placeholder='anonymous'
                    type='text'
                    value={name} />
                  <FormText>{PV.i18n.common.MayAppearNextToContentYouCreate}</FormText>
                </FormGroup>
                <FormGroup>
                  <Label for='settings-name'>{PV.i18n.common.Email}</Label>
                  <Input
                    id='settings-email'
                    invalid={emailError}
                    name='settings-email'
                    onBlur={this.validateEmail}
                    onChange={this.handleEmailChange}
                    placeholder=''
                    type='text'
                    value={email} />
                  {
                    emailError &&
                      <FormFeedback invalid='true'>
                        {emailError}
                      </FormFeedback>
                  }
                </FormGroup>
                <FormGroup>
                  <Label for='settings-privacy'>Profile Privacy</Label>
                  <Input
                    className='settings-privacy'
                    name='settings-privacy'
                    onChange={this.handlePrivacyChange}
                    type='select'
                    value={isPublic ? 'public' : 'private'}>
                    <option value='public'>{PV.i18n.common.Public}</option>
                    <option value='private'>{PV.i18n.common.Private}</option>
                  </Input>
                  {
                    isPublic ?
                      <FormText>Podcasts, clips, and playlists are visible on your profile page</FormText>
                      : <FormText>Your profile page is hidden. Your Public clips are still accessible by anyone,
                        and your Only with Link clips and playlists are still accessible to anyone with the URL.</FormText>
                  }
                </FormGroup>
                {
                  (user.isPublic && isPublic) &&
                    <FormGroup style={{marginBottom: '2rem'}}>
                      <Label for='settings-privacy-profile-link'>{PV.i18n.common.SharableProfileLink}</Label>
                      <InputGroup id='settings-privacy-profile-link'>
                        <Input
                          id='settings-privacy-profile-link-input'
                          readOnly={true}
                          value={`${BASE_URL}/profile/${user.id}`} />
                        <InputGroupAddon
                          addonType='append'>
                          <Button
                            color='primary'
                            dataclipboardtarget='#settings-privacy-profile-link-input'
                            onClick={this.copyProfileLink}
                            text={wasCopied ? 'Copied!' : 'Copy'} />
                        </InputGroupAddon>
                      </InputGroup>
                    </FormGroup>
                }
                <div className='settings-profile__btns'>
                  <Button
                    className='settings-profile-btns__cancel'
                    onClick={this.resetProfileChanges}>
                    {PV.i18n.common.Cancel}
                  </Button>
                  <Button
                    className='settings-profile-btns__save'
                    color='primary'
                    disabled={!this.validateProfileData()}
                    isLoading={isSaving}
                    onClick={this.updateProfile}>
                    {PV.i18n.common.Save}
                  </Button>
                </div>
                <hr />
              </Fragment>
          }
          {
            user && user.id &&
            <Fragment>
              {
                (user.membershipExpiration
                  && isBeforeDate(user.membershipExpiration)) &&
                <Fragment>
                  {membershipStatusHeader}
                  <p className='settings-membership__status is-active'>{PV.i18n.common.Premium}</p>
                  <p>{PV.i18n.common.Ends}{new Date(user.membershipExpiration).toLocaleString()}</p>
                  {checkoutBtn(true)}
                  <hr />
                </Fragment>
              }
              {
                (!user.membershipExpiration
                  && user.freeTrialExpiration
                  && isBeforeDate(user.freeTrialExpiration)) &&
                <Fragment>
                  {membershipStatusHeader}
                  <p className='settings-membership__status is-active'>{PV.i18n.common.PremiumFreeTrial}</p>
                <p>{PV.i18n.common.Ends}{new Date(user.freeTrialExpiration).toLocaleString()}</p>
                  {checkoutBtn()}
                  <hr />
                </Fragment>
              }
              {
                (!user.membershipExpiration
                  && user.freeTrialExpiration
                  && !isBeforeDate(user.freeTrialExpiration)) &&
                <Fragment>
                  {membershipStatusHeader}
                <p className='settings-membership__status is-expired'>{PV.i18n.common.Expired}</p>
                  <p>{PV.i18n.common.Ended}{new Date(user.freeTrialExpiration).toLocaleString()}</p>
                  <p>{PV.i18n.common.TrialEnded}</p>
                  {checkoutBtn()}
                  <hr />
                </Fragment>
              }
              {
                (user.freeTrialExpiration && user.membershipExpiration
                  && !isBeforeDate(user.freeTrialExpiration)
                  && !isBeforeDate(user.membershipExpiration)) &&
                <Fragment>
                  {membershipStatusHeader}
                  <p className='settings-membership__status is-expired'>{PV.i18n.common.Expired}</p>
                  <p>{PV.i18n.common.Ended}{new Date(user.membershipExpiration).toLocaleString()}</p>
                  <p>{PV.i18n.common.MembershipEnded}</p>
                  {checkoutBtn(true)}
                  <hr />
                </Fragment>
              }
              {
                (user.id && !user.freeTrialExpiration && !user.membershipExpiration) &&
                <Fragment>
                  {membershipStatusHeader}
                  <p className='settings-membership__status is-expired'>{PV.i18n.common.Inactive}</p>
                  <p>{PV.i18n.common.MembershipInactive}</p>
                  {checkoutBtn(true)}
                  <hr />
                </Fragment>
              }
            </Fragment>
          }
          <h3>{PV.i18n.common.Interface}</h3>
          <FormGroup check>
            <Label className='checkbox-label' check>
              <Input
                checked={censorNSFWText === 'true'}
                onChange={this.handleToggleCensorNSFWText}
                type="checkbox" />
              &nbsp;&nbsp;{PV.i18n.common.CensorNSFWText}
            </Label>
          </FormGroup>
          <FormGroup check>
            <Label className='checkbox-label' check>
              <Input
                checked={nsfwLabelsHide === 'true' || !nsfwLabelsHide}
                onChange={this.handleToggleNSFWLabels}
                type="checkbox" />
              &nbsp;&nbsp;{PV.i18n.common.HideNSFWLabels}
            </Label>
          </FormGroup>
          <FormGroup check>
            <Label className='checkbox-label' check>
              <Input
                checked={timeJumpBackwardButtonHide === 'true'}
                onChange={this.handleToggleTimeJumpBackwardButton}
                type="checkbox" />
              &nbsp;&nbsp;{PV.i18n.common.HideJumpBackwardsButton}
            </Label>
          </FormGroup>
          <FormGroup check>
            <Label className='checkbox-label' check>
              <Input
                checked={playbackSpeedButtonHide === 'true'}
                onChange={this.handleTogglePlaybackSpeedButton}
                type="checkbox" />
              &nbsp;&nbsp;{PV.i18n.common.HidePlaybackSpeedButton}
            </Label>
          </FormGroup>    
          <FormGroup check>
            <Label className='checkbox-label' check>
              <Input
                checked={filterButtonHide === 'true'}
                onChange={this.handleToggleFilterButton}
                type="checkbox" />
              &nbsp;&nbsp;{PV.i18n.common.HideFilterButtons}
            </Label>
          </FormGroup>
          {
            user && user.id &&
            <Fragment>
              <hr />
              <h3>{PV.i18n.common.MyData}</h3>
              <p>
                {PV.i18n.common.DownloadDataBackup}
              </p>
              <Button
                className='settings__download'
                isLoading={isDownloading}
                onClick={this.downloadLoggedInUserData}>
                <FontAwesomeIcon icon='download' />&nbsp;&nbsp;{PV.i18n.common.Download}
              </Button>
              <hr />
            </Fragment>
          }
          {
            user && user.id &&
              <Fragment>
                <h3>{PV.i18n.common.Management}</h3>
                <Button
                  className='settings__delete-account'
                  color='danger'
                  onClick={() => this.toggleDeleteAccountModal(true)}>
                  <FontAwesomeIcon icon='trash' />&nbsp;&nbsp;{PV.i18n.common.DeleteAccount}
                </Button>
                <DeleteAccountModal 
                  email={email}
                  handleHideModal={() => this.toggleDeleteAccountModal(false)}
                  id={user.id}
                  isOpen={isDeleteAccountOpen} />
              </Fragment>
          }
          <CheckoutModal
            handleHideModal={() => this.toggleCheckoutModal(false)}
            isOpen={isCheckoutOpen} />
        </Form>
      </div>
    )
  }
}

const mapStateToProps = state => ({ ...state })

const mapDispatchToProps = dispatch => ({
  modalsSignUpShow: bindActionCreators(modalsSignUpShow, dispatch),
  settingsCensorNSFWText: bindActionCreators(settingsCensorNSFWText, dispatch),
  settingsHideFilterButton: bindActionCreators(settingsHideFilterButton, dispatch),
  settingsHideNSFWLabels: bindActionCreators(settingsHideNSFWLabels, dispatch),
  settingsHideNSFWMode: bindActionCreators(settingsHideNSFWMode, dispatch),
  settingsHidePlaybackSpeedButton: bindActionCreators(settingsHidePlaybackSpeedButton, dispatch),
  settingsHideTimeJumpBackwardButton: bindActionCreators(settingsHideTimeJumpBackwardButton, dispatch),
  userSetInfo: bindActionCreators(userSetInfo, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation(PV.nexti18next.namespaces)(Settings))
