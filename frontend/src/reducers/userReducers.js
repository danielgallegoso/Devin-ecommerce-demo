import { USER_SIGNIN_REQUEST, USER_SIGNIN_SUCCESS, USER_SIGNIN_FAIL, USER_REGISTER_REQUEST, USER_REGISTER_SUCCESS, USER_REGISTER_FAIL, USER_LOGOUT, USER_UPDATE_REQUEST, USER_UPDATE_SUCCESS, USER_UPDATE_FAIL } from "../constants/userConstants";
import { createRequestReducer } from "../utils/createRequestReducer";

const userSigninReducer = createRequestReducer({
  types: [USER_SIGNIN_REQUEST, USER_SIGNIN_SUCCESS, USER_SIGNIN_FAIL],
  resetType: USER_LOGOUT,
  successKey: 'userInfo'
});

const userUpdateReducer = createRequestReducer({
  types: [USER_UPDATE_REQUEST, USER_UPDATE_SUCCESS, USER_UPDATE_FAIL],
  successKey: 'userInfo'
});

const userRegisterReducer = createRequestReducer({
  types: [USER_REGISTER_REQUEST, USER_REGISTER_SUCCESS, USER_REGISTER_FAIL],
  successKey: 'userInfo'
});

export {
  userSigninReducer, userRegisterReducer, userUpdateReducer
}
