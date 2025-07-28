const Category = require('../models/merchant/Category');
const Subcategory = require('../models/merchant/Subcategory');
const Product = require('../models/merchant/Product');
const joi = require('joi');

// CATEGORY CRUD
exports.addCategory = async (req, res) => {
  try {
    const schema = joi.object({ name: joi.string().required(), description: joi.string().optional() });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: false, message: error.details[0].message });
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json({ status: true, message: 'Category created', data: category });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ status: true, data: categories });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// SUBCATEGORY CRUD
exports.addSubcategory = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().required(),
      description: joi.string().optional(),
      categoryId: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: false, message: error.details[0].message });
    const { name, description, categoryId } = req.body;
    const subcategory = new Subcategory({ name, description, categoryId });
    await subcategory.save();
    res.status(201).json({ status: true, message: 'Subcategory created', data: subcategory });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};
    const subcategories = await Subcategory.find(filter);
    res.json({ status: true, data: subcategories });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// PRODUCT CRUD
exports.addProduct = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().required(),
      description: joi.string().optional(),
      price: joi.number().required(),
      categoryId: joi.string().required(),
      subcategoryId: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: false, message: error.details[0].message });
    const { name, description, price, categoryId, subcategoryId } = req.body;
    let photo = null;
    if (req.file) photo = req.file.filename;
    const merchantId = req.user.id;
    const product = new Product({ name, description, price, photo, categoryId, subcategoryId, merchantId });
    await product.save();
    res.status(201).json({ status: true, message: 'Product created', data: product });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.query;
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (subcategoryId) filter.subcategoryId = subcategoryId;
    // Always use merchantId from token (req.user.id)
    if (req.user && req.user.id) {
      filter.merchantId = req.user.id;
    } else {
      return res.status(401).json({ status: false, message: 'Unauthorized: No merchant token found' });
    }
    const products = await Product.find(filter).populate('categoryId').populate('subcategoryId');
    res.json({ status: true, data: products });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};
