class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const notFoundHandler = (req, res) => {
  res.status(404).send({ message: `Not Found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return;
  }
  if (error.status) {
    res.status(error.status).send({ message: error.message });
    return;
  }
  if (error.name === 'CastError') {
    res.status(400).send({ message: `Invalid ${error.path}: ${error.value}` });
    return;
  }
  if (error.name === 'ValidationError') {
    res.status(400).send({ message: error.message });
    return;
  }
  if (error.code === 11000) {
    res.status(409).send({ message: 'Duplicate key.' });
    return;
  }
  console.error(error);
  res.status(500).send({ message: 'Internal Server Error' });
};

export { HttpError, asyncHandler, notFoundHandler, errorHandler };
