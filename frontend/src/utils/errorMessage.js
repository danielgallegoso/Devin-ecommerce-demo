const FALLBACK_MESSAGE = 'Something went wrong.';

const getErrorMessage = (error) => {
  if (!error) {
    return FALLBACK_MESSAGE;
  }
  const data = error.response && error.response.data;
  if (data && data.message) {
    return data.message;
  }
  if (typeof data === 'string' && data.trim()) {
    return data;
  }
  return error.message || FALLBACK_MESSAGE;
};

export { getErrorMessage };
