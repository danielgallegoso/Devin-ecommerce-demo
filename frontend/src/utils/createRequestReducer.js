const createRequestReducer = ({
  types: [requestType, successType, failType],
  resetType,
  successKey,
  successFlag = false,
  initialState = {},
  requestState = {},
}) => (state = initialState, action) => {
  switch (action.type) {
    case requestType:
      return { loading: true, ...requestState };
    case successType: {
      const nextState = { loading: false };
      if (successKey) {
        nextState[successKey] = action.payload;
      }
      if (successFlag) {
        nextState.success = true;
      }
      return nextState;
    }
    case failType:
      return { loading: false, error: action.payload };
    case resetType:
      return initialState;
    default:
      return state;
  }
};

export { createRequestReducer };
