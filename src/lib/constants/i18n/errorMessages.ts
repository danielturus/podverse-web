/* eslint-disable @typescript-eslint/camelcase */

export const errorMessages = {
  alerts: {
    couldNotUpdateQueue: `Could not update queue on server. Please check your internet connection.`,
    couldNotRemoveFromPlaylist: `Could not remove from playlist. Please check your internet connection and try again later.`,
    deleteClipFailed: `Delete clip failed. Please check your internet connection and try again later.`,
    deletePlaylistFailed: `Delete playlist failed. Please check your internet connection and try again later.`,
    updatePlaylistFailed: `Update playlist failed. Please check your internet connection and try again later.`,
    premiumRequired: `Your Premium membership has expired. Renew your membership on the Settings page, or log out to create a clip anonymously.`,
    somethingWentWrong: `Something went wrong. Please check your internet connection.`,
    noProfilesFound: `No profiles found`
  },
  header: {
    Error_404: `404 Error`,
    LoginNeeded: `Login Needed`,
    ServersUnderMaintenance: `Servers under maintenance`,
    SomethingWentWrong: `Something went wrong`
  },
  message: {
    AnUnknownErrorHasOccurred: `An unknown error has occurred.`,
    CheckConnectionOrDifferentPage: `Please check your internet connection, or try a different page.`,
    passwordError: `Password must contain a number, uppercase, lowercase, and be at least 8 characters long.`,
    passwordMatchError: `Passwords do not match.`,
    PleaseProvideValidEmail: `Please provide a valid email address`,
    PageNotFound: `Page not found`,
    SiteOfflineUntilWorkIsComplete: `The site will be offline until the work is complete.`,
    YouMustLoginToUseThisFeature: `You must login to use this feature.`
  },
  internetConnectivityErrorMessage: `Error: Please check your internet connection and try again later.`
}
