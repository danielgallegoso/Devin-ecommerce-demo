import express from 'express';
import User from '../models/userModel';
import config from '../config';
import { getToken, isAuth, isSelfOrAdmin, isNonEmptyString } from '../util';

const router = express.Router();

router.put('/:id', isAuth, isSelfOrAdmin, async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (user) {
    if (isNonEmptyString(req.body.name)) {
      user.name = req.body.name;
    }
    if (isNonEmptyString(req.body.email)) {
      user.email = req.body.email;
    }
    if (isNonEmptyString(req.body.password)) {
      user.password = req.body.password;
    }
    const updatedUser = await user.save();
    res.send({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: getToken(updatedUser),
    });
  } else {
    res.status(404).send({ message: 'User Not Found' });
  }
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(401).send({ message: 'Invalid Email or Password.' });
  }
  const signinUser = await User.findOne({ email });
  if (signinUser && (await signinUser.comparePassword(password))) {
    return res.send({
      _id: signinUser.id,
      name: signinUser.name,
      email: signinUser.email,
      isAdmin: signinUser.isAdmin,
      token: getToken(signinUser),
    });
  }
  return res.status(401).send({ message: 'Invalid Email or Password.' });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(password)
  ) {
    return res.status(400).send({ message: 'Invalid User Data.' });
  }
  const user = new User({ name, email, password });
  try {
    const newUser = await user.save();
    return res.send({
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      token: getToken(newUser),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send({ message: 'Email is already registered.' });
    }
    return res.status(400).send({ message: 'Invalid User Data.' });
  }
});

// Development-only helper for seeding the demo admin account.
router.get('/createadmin', async (req, res) => {
  if (config.isProduction) {
    return res.status(404).send({ message: 'Not Found' });
  }
  try {
    const user = new User({
      name: 'T-Mobile Admin',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'admin1234',
      isAdmin: true,
    });
    const newUser = await user.save();
    return res.send({
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    });
  } catch (error) {
    return res.status(400).send({ message: error.message });
  }
});

export default router;
