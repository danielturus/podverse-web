import { actionTypes } from "~/redux/constants";

export const userSetInfo = payload => {
  return {
    type: actionTypes.USER_SET_INFO,
    payload
  }
}

export const userUpdateHistoryItem = payload => {
  return {
    type: actionTypes.USER_UPDATE_HISTORY_ITEM,
    payload
  }
}
