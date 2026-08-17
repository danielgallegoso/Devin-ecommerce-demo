import Axios from "axios";
import Cookie from 'js-cookie';
import {
  USER_SIGNIN_REQUEST, USER_SIGNIN_SUCCESS,
  USER_SIGNIN_FAIL, USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS, USER_REGISTER_FAIL, USER_LOGOUT, USER_UPDATE_REQUEST, USER_UPDATE_SUCCESS, USER_UPDATE_FAIL
} from "../constants/userConstants";
import { authConfig, createAsyncAction } from "../utils/apiClient";

const saveUserInfo = (userInfo) => {
  Cookie.set('userInfo', JSON.stringify(userInfo));
};

const update = ({ userId, name, email, password }) => createAsyncAction({
  types: [USER_UPDATE_REQUEST, USER_UPDATE_SUCCESS, USER_UPDATE_FAIL],
  requestPayload: { userId, name, email, password },
  request: ({ userInfo }) => Axios.put("/api/users/" + userId, { name, email, password }, authConfig(userInfo)),
  onSuccess: saveUserInfo
});

const signin = (email, password) => createAsyncAction({
  types: [USER_SIGNIN_REQUEST, USER_SIGNIN_SUCCESS, USER_SIGNIN_FAIL],
  requestPayload: { email, password },
  request: () => Axios.post("/api/users/signin", { email, password }),
  onSuccess: saveUserInfo
});

const register = (name, email, password) => createAsyncAction({
  types: [USER_REGISTER_REQUEST, USER_REGISTER_SUCCESS, USER_REGISTER_FAIL],
  requestPayload: { name, email, password },
  request: () => Axios.post("/api/users/register", { name, email, password }),
  onSuccess: saveUserInfo
});

const logout = () => (dispatch) => {
  Cookie.remove("userInfo");
  dispatch({ type: USER_LOGOUT })
}
export { signin, register, logout, update };
