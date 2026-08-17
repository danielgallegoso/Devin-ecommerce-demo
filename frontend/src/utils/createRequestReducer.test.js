import { createRequestReducer } from './createRequestReducer';

const types = ['THING_REQUEST', 'THING_SUCCESS', 'THING_FAIL'];

describe('createRequestReducer', () => {
  test('marks the state as loading when the request starts', () => {
    // Arrange
    const reducer = createRequestReducer({ types, successKey: 'thing' });

    // Act
    const state = reducer(undefined, { type: 'THING_REQUEST' });

    // Assert
    expect(state).toEqual({ loading: true });
  });

  test('merges the configured request state while loading', () => {
    const reducer = createRequestReducer({
      types,
      successKey: 'things',
      requestState: { things: [] },
    });

    expect(reducer(undefined, { type: 'THING_REQUEST' })).toEqual({
      loading: true,
      things: [],
    });
  });

  test('stores the payload under the success key on success', () => {
    const reducer = createRequestReducer({ types, successKey: 'thing' });

    expect(reducer({ loading: true }, { type: 'THING_SUCCESS', payload: { _id: '1' } })).toEqual({
      loading: false,
      thing: { _id: '1' },
    });
  });

  test('flags success without a payload key when configured to', () => {
    const reducer = createRequestReducer({ types, successFlag: true });

    expect(reducer({ loading: true }, { type: 'THING_SUCCESS', payload: 'ignored' })).toEqual({
      loading: false,
      success: true,
    });
  });

  test('stores the error message on failure', () => {
    const reducer = createRequestReducer({ types, successKey: 'thing' });

    expect(reducer({ loading: true }, { type: 'THING_FAIL', payload: 'Request failed' })).toEqual({
      loading: false,
      error: 'Request failed',
    });
  });

  test('returns to the initial state on reset', () => {
    const reducer = createRequestReducer({
      types,
      resetType: 'THING_RESET',
      successKey: 'thing',
      initialState: { thing: null },
    });

    expect(reducer({ loading: false, error: 'boom' }, { type: 'THING_RESET' })).toEqual({
      thing: null,
    });
  });

  test('leaves unrelated actions untouched', () => {
    const reducer = createRequestReducer({ types, successKey: 'thing' });
    const currentState = { loading: false, thing: { _id: '1' } };

    expect(reducer(currentState, { type: 'OTHER_ACTION' })).toBe(currentState);
  });
});
