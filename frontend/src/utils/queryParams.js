const getQueryValue = (search, fallback = '') =>
  search ? search.split('=')[1] : fallback;

const getRedirectPath = (search) => getQueryValue(search, '/');

const getQty = (search) => Number(getQueryValue(search, 1));

export { getQueryValue, getRedirectPath, getQty };
