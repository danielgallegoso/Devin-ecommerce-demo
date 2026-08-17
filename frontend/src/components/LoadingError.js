import React from 'react';

// `children` may be a function so screens can defer reading data that only
// exists once the request succeeded.
function LoadingError({
  loading,
  error,
  success,
  successMessage,
  children = null,
}) {
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (success && successMessage) {
    return <div>{successMessage}</div>;
  }
  return typeof children === 'function' ? children() : children;
}

export default LoadingError;
