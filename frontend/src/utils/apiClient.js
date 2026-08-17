export const authConfig = (userInfo) => ({
  headers: {
    Authorization: 'Bearer ' + (userInfo ? userInfo.token : ''),
  },
});

export const createAsyncAction = ({
  types: [requestType, successType, failType],
  requestPayload,
  request,
  transform,
  onSuccess,
}) => async (dispatch, getState) => {
  dispatch(
    requestPayload === undefined
      ? { type: requestType }
      : { type: requestType, payload: requestPayload }
  );
  try {
    const { userSignin } = getState();
    const { data } = await request({ userInfo: userSignin.userInfo });
    const payload = transform ? transform(data) : data;
    dispatch({ type: successType, payload });
    if (onSuccess) {
      onSuccess(payload, getState);
    }
  } catch (error) {
    dispatch({ type: failType, payload: error.message });
  }
};
