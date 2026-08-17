import { authConfig, createAsyncAction } from './apiClient';

const types = ['THING_REQUEST', 'THING_SUCCESS', 'THING_FAIL'];

const createStore = (state = { userSignin: {} }) => {
  const dispatched = [];
  return {
    dispatched,
    dispatch: (action) => dispatched.push(action),
    getState: () => state,
  };
};

describe('authConfig', () => {
  test('builds a bearer authorization header from the signed in user', () => {
    // Arrange
    const userInfo = { token: 'abc123' };

    // Act
    const result = authConfig(userInfo);

    // Assert
    expect(result).toEqual({ headers: { Authorization: 'Bearer abc123' } });
  });

  test('builds an empty bearer header when no user is signed in', () => {
    expect(authConfig(null)).toEqual({ headers: { Authorization: 'Bearer ' } });
  });
});

describe('createAsyncAction', () => {
  test('dispatches request then success with the response data', async () => {
    // Arrange
    const store = createStore();
    const action = createAsyncAction({
      types,
      request: async () => ({ data: { _id: '1' } }),
    });

    // Act
    await action(store.dispatch, store.getState);

    // Assert
    expect(store.dispatched).toEqual([
      { type: 'THING_REQUEST' },
      { type: 'THING_SUCCESS', payload: { _id: '1' } },
    ]);
  });

  test('includes the request payload when one is configured', async () => {
    const store = createStore();
    const action = createAsyncAction({
      types,
      requestPayload: { id: '1' },
      request: async () => ({ data: 'ok' }),
    });

    await action(store.dispatch, store.getState);

    expect(store.dispatched[0]).toEqual({
      type: 'THING_REQUEST',
      payload: { id: '1' },
    });
  });

  test('passes the signed in user to the request builder', async () => {
    const store = createStore({ userSignin: { userInfo: { token: 'abc123' } } });
    const request = jest.fn(async () => ({ data: 'ok' }));
    const action = createAsyncAction({ types, request });

    await action(store.dispatch, store.getState);

    expect(request).toHaveBeenCalledWith({ userInfo: { token: 'abc123' } });
  });

  test('transforms the response data before dispatching success', async () => {
    const store = createStore();
    const action = createAsyncAction({
      types,
      request: async () => ({ data: { data: { _id: '1' } } }),
      transform: (data) => data.data,
    });

    await action(store.dispatch, store.getState);

    expect(store.dispatched[1]).toEqual({
      type: 'THING_SUCCESS',
      payload: { _id: '1' },
    });
  });

  test('runs the success callback with the dispatched payload', async () => {
    const store = createStore();
    const onSuccess = jest.fn();
    const action = createAsyncAction({
      types,
      request: async () => ({ data: 'ok' }),
      onSuccess,
    });

    await action(store.dispatch, store.getState);

    expect(onSuccess).toHaveBeenCalledWith('ok', store.getState);
  });

  test('dispatches failure with the error message when the request rejects', async () => {
    const store = createStore();
    const action = createAsyncAction({
      types,
      request: async () => {
        throw new Error('Network Error');
      },
    });

    await action(store.dispatch, store.getState);

    expect(store.dispatched[1]).toEqual({
      type: 'THING_FAIL',
      payload: 'Network Error',
    });
  });
});
