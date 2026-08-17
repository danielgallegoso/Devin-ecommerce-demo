import express from 'express';
import Product from '../models/productModel';
import data from '../data';
import { isAuth, isAdmin } from '../util';
import { asyncHandler, HttpError } from '../errors';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const category = req.query.category ? { category: req.query.category } : {};
    const searchKeyword = req.query.searchKeyword
      ? {
          name: {
            $regex: req.query.searchKeyword,
            $options: 'i',
          },
        }
      : {};
    const sortOrder = req.query.sortOrder
      ? req.query.sortOrder === 'lowest'
        ? { price: 1 }
        : { price: -1 }
      : { _id: -1 };
    const products = await Product.find({ ...category, ...searchKeyword }).sort(
      sortOrder
    );
    res.send(products);
  })
);

router.get(
  '/seed',
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpError(404, 'Not Found');
    }
    await Product.deleteMany({});
    const products = data.products.map(({ _id, ...product }) => product);
    const createdProducts = await Product.insertMany(products);
    res.send({ createdProducts });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id });
    if (!product) {
      throw new HttpError(404, 'Product Not Found.');
    }
    res.send(product);
  })
);
router.post(
  '/:id/reviews',
  isAuth,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new HttpError(404, 'Product Not Found');
    }
    const review = {
      name: req.body.name,
      rating: Number(req.body.rating),
      comment: req.body.comment,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((a, c) => c.rating + a, 0) /
      product.reviews.length;
    const updatedProduct = await product.save();
    res.status(201).send({
      data: updatedProduct.reviews[updatedProduct.reviews.length - 1],
      message: 'Review saved successfully.',
    });
  })
);
router.put(
  '/:id',
  isAuth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new HttpError(404, 'Product Not Found.');
    }
    product.name = req.body.name;
    product.price = req.body.price;
    product.image = req.body.image;
    product.brand = req.body.brand;
    product.category = req.body.category;
    product.countInStock = req.body.countInStock;
    product.description = req.body.description;
    const updatedProduct = await product.save();
    res.status(200).send({ message: 'Product Updated', data: updatedProduct });
  })
);

router.delete(
  '/:id',
  isAuth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new HttpError(404, 'Product Not Found.');
    }
    await product.remove();
    res.send({ message: 'Product Deleted' });
  })
);

router.post(
  '/',
  isAuth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      brand: req.body.brand,
      category: req.body.category,
      countInStock: req.body.countInStock,
      description: req.body.description,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
    });
    const newProduct = await product.save();
    res.status(201).send({ message: 'New Product Created', data: newProduct });
  })
);

export default router;
