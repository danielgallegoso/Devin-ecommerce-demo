import express from 'express';
import User from '../models/userModel';
import { getToken, isAuth } from '../util';
import { asyncHandler, HttpError } from '../errors';

const router = express.Router();

router.put(
  '/:id',
  isAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new HttpError(404, 'User Not Found');
    }
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.password = req.body.password || user.password;
    const updatedUser = await user.save();
    res.send({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: getToken(updatedUser),
    });
  })
);

router.post(
  '/signin',
  asyncHandler(async (req, res) => {
    const signinUser = await User.findOne({
      email: req.body.email,
      password: req.body.password,
    });
    if (!signinUser) {
      throw new HttpError(401, 'Invalid Email or Password.');
    }
    res.send({
      _id: signinUser.id,
      name: signinUser.name,
      email: signinUser.email,
      isAdmin: signinUser.isAdmin,
      token: getToken(signinUser),
    });
  })
);

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    try {
      const newUser = await user.save();
      res.send({
        _id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        token: getToken(newUser),
      });
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpError(409, 'Email is already registered.');
      }
      if (error.name === 'ValidationError') {
        throw new HttpError(400, 'Invalid User Data.');
      }
      throw error;
    }
  })
);

router.get(
  '/createadmin',
  asyncHandler(async (req, res) => {
    const user = new User({
      name: 'T-Mobile Admin',
      email: 'admin@example.com',
      password: '1234',
      isAdmin: true,
    });
    try {
      const newUser = await user.save();
      res.send(newUser);
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpError(409, 'Admin user already exists.');
      }
      throw error;
    }
  })
);

export default router;
