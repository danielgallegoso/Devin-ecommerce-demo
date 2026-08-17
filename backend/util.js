import jwt from 'jsonwebtoken';
import config from './config';

const getToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    config.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '48h',
    }
  );
};

const isAuth = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).send({ message: 'Token is not supplied.' });
  }

  const [scheme, token] = header.trim().split(/\s+/);
  if (!/^Bearer$/i.test(scheme) || !token) {
    return res.status(401).send({ message: 'Invalid Token' });
  }

  return jwt.verify(
    token,
    config.JWT_SECRET,
    { algorithms: ['HS256'] },
    (err, decode) => {
      if (err) {
        return res.status(401).send({ message: 'Invalid Token' });
      }
      req.user = decode;
      return next();
    }
  );
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }
  return res.status(401).send({ message: 'Admin Token is not valid.' });
};

const isSelfOrAdmin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || String(req.user._id) === req.params.id)) {
    return next();
  }
  return res.status(403).send({ message: 'Not authorized.' });
};

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export { getToken, isAuth, isAdmin, isSelfOrAdmin, isNonEmptyString, escapeRegExp };
