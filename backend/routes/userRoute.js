import express from 'express';
import User from '../models/userModel';
import { toAuthResponse, isAuth } from '../util';

const router = express.Router();

router.put('/:id', isAuth, async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.password = req.body.password || user.password;
    const updatedUser = await user.save();
    res.send(toAuthResponse(updatedUser));
  } else {
    res.status(404).send({ message: 'User Not Found' });
  }
});

router.post('/signin', async (req, res) => {
  const signinUser = await User.findOne({
    email: req.body.email,
    password: req.body.password,
  });
  if (signinUser) {
    res.send(toAuthResponse(signinUser));
  } else {
    res.status(401).send({ message: 'Invalid Email or Password.' });
  }
});

router.post('/register', async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  try {
    const newUser = await user.save();
    res.send(toAuthResponse(newUser));
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).send({ message: 'Email is already registered.' });
    } else {
      res.status(400).send({ message: 'Invalid User Data.' });
    }
  }
});

router.get('/createadmin', async (req, res) => {
  try {
    const user = new User({
      name: 'T-Mobile Admin',
      email: 'admin@example.com',
      password: '1234',
      isAdmin: true,
    });
    const newUser = await user.save();
    res.send(newUser);
  } catch (error) {
    res.send({ message: error.message });
  }
});

export default router;
