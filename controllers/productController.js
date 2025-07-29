const Category = require("../models/merchant/Category");
const Subcategory = require("../models/merchant/Subcategory");
const Product = require("../models/merchant/Product");
const joi = require("joi");

// CATEGORY CRUD
exports.addCategory = async (req, res) => {
  try {
    const schema = joi.object({
      name: joi.string().required(),
      description: joi.string().optional(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });
    const { name, description } = req.body;
    const category = new Category({ name, description, userId: req.user.id });
    await category.save();
    res
      .status(201)
      .json({ status: true, message: "Category created", data: category });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id });
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
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const { name, description, categoryId } = req.body;
    const subcategory = new Subcategory({
      name,
      description,
      categoryId,
      userId: req.user.id,
    });
    await subcategory.save();
    res.status(201).json({
      status: true,
      message: "Subcategory created",
      data: subcategory,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.query;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ status: false, message: "Category not found" });
    }
    const subcategories = await Subcategory.find({
      categoryId: category._id,
      userId: req.user.id,
    });

    if (subcategories.length === 0)
      return res
        .status(404)
        .json({ status: false, message: "Category not found" });

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
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });
    const { name, description, price, categoryId, subcategoryId } = req.body;
    const category = await Category.findById(categoryId);
    const subcategory = await Subcategory.findById(subcategoryId);

    if (!category || !subcategory) {
      return res
        .status(404)
        .json({ status: false, message: "Category or Subcategory not found" });
    }

    let photoArry = [];

    if (!req.files || req.files.length === 0)
      return res
        .status(400)
        .json({ status: false, message: "No photo uploaded" });

    req.files.map((file) => {
      photoArry.push(file.filename);
    });

    console.log(photoArry);

    const merchantId = req.user.id;
    const product = new Product({
      name,
      description,
      price,
      photo: photoArry,
      categoryId,
      subcategoryId,
      merchantId,
    });
    await product.save();
    res
      .status(201)
      .json({ status: true, message: "Product created", data: product });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.query;

    const category = await Category.findById(categoryId);
    const subcategory = await Subcategory.findById(subcategoryId);

    if (!category || !subcategory) {
      return res
        .status(404)
        .json({ status: false, message: "Category or Subcategory not found" });
    }

    const products = await Product.find({
      categoryId,
      subcategoryId,
      merchantId: req.user.id,
    })
      .populate("categoryId")
      .populate("subcategoryId");

    products.map((product) => {
      product.photo = product.photo.map((photo)=>{
        return `${process.env.BASE_URL}/merchant/products/${photo}`;
      })
      
    });
    res.json({ status: true, data: products });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};
