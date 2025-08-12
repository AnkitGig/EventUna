const Category = require("../models/merchant/Category");
const Subcategory = require("../models/merchant/Subcategory");
const Product = require("../models/merchant/Product");
const joi = require("joi");
const { parseJsonArray } = require("../utils/helpers");

const mongoose = require("mongoose");
const { deleteOldImages } = require("../utils/helpers");

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
    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ categoryId: category._id });
        return {
          ...category.toObject(),
          productCount,
        };
      })
    );
    res.json({ status: true, data: categoriesWithCount });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    const schema = joi.object({
      categoryId: joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const category = await Category.findOne({
      _id: categoryId,
      userId: req.user.id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ status: false, message: "Category not found" });
    }

    await Category.deleteOne({ _id: categoryId, userId: req.user.id });
    await Subcategory.deleteMany({
      categoryId: categoryId,
      userId: req.user.id,
    });

    res.json({ status: true, message: "Category deleted successfully" });
  } catch (error) {
    console.log(`Error while deleting category: ${error.message}`);
    res.status(500).json({ status: false, message: error.message });
  }
};

// exports.deleteCategory = async(req,res)=>{
//   try {
//     const { categoryId } = req.params;
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res
//         .status(404)
//         .json({ status: false, message: "Category not found" });
//     }
//     await Category.deleteOne({ _id: categoryId });
//     await Subcategory.deleteMany({ categoryId: categoryId });
//     res.json({ status: true, message: "Category deleted successfully" });
//   } catch (err) {
//     console.log(`Error deleting category: ${err.message}`);
//     res.status(500).json({ status: false, message: err.message });
//   }
// }

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
    const { categoryId } = req.body;

    const schema = joi.object({
      categoryId: joi.string().required(),
    });
    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

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

exports.deleteSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.body;

    const schema = joi.object({
      subcategoryId: joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });
    const subcategory = await Subcategory.findOne({
      _id: subcategoryId,
      userId: req.user.id,
    });

    if (!subcategory) {
      return res
        .status(404)
        .json({ status: false, message: "Subcategory not found" });
    }

    await Subcategory.deleteOne({ _id: subcategoryId, userId: req.user.id });
    res.json({ status: true, message: "Subcategory deleted successfully" });
  } catch (error) {
    console.log(`Error while deleting subcategory: ${error.message}`);
    res.status(500).json({ status: false, message: error.message });
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

    console.log(req.files);

    if (!req.files || req.files.length === 0)
      return res
        .status(400)
        .json({ status: false, message: "No photo uploaded" });

    photoArry = req.files.map((file) => ({
      _id: new mongoose.Types.ObjectId(),
      fileName: file.filename,
    }));

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
    console.log(`Error while adding product: ${err.message}`);
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ merchantId: req.user.id });
    if (products.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "No products found" });
    }

    products.map((product) => {
      product.photo = product.photo.map((photo) => {
        return (photo.fileName = `${process.env.BASE_URL}/merchant/products/${photo.fileName}`);
      });
    });
    res.json({ status: true, data: products });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.body;

    const schema = joi.object({
      productId: joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });
    const product = await Product.findOne({
      _id: productId,
      merchantId: req.user.id,
    });

    console.log(product);
    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    await Product.deleteOne({ _id: productId, merchantId: req.user.id });
    product.photo.map((photo) => {
      deleteOldImages("merchant/products", photo);
    });
    res.json({ status: true, message: "Product deleted successfully" });
  } catch (error) {
    console.log(`Error while deleting product: ${error.message}`);
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const imageIds = parseJsonArray("imageIds", req);
    req.body.imageIds = imageIds;
    const { productId, name, description, price, categoryId, subcategoryId } =
      req.body;

    const schema = joi.object({
      productId: joi.string().required(),
      name: joi.string().optional(),
      description: joi.string().optional(),
      price: joi.number().optional(),
      categoryId: joi.string().optional(),
      subcategoryId: joi.string().optional(),
      imageIds: joi.array().items(joi.string().optional()).min(1).optional(),
    });

    console.log("Request body:", req.body.name);

    const { error } = schema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ status: false, message: error.details[0].message });

    const product = await Product.findOne({
      _id: productId,
      merchantId: req.user.id,
    });
    if (!product) {
      return res
        .status(404)
        .json({ status: false, message: "Product not found" });
    }

    if (imageIds && imageIds.length > 0) {
      const idsToDelete = new Set(imageIds.map((id) => id.toString()));

      // Call helper function to delete files
      product.photo.forEach((img) => {
        if (idsToDelete.has(img._id.toString())) {
          deleteOldImages("merchant/products", img.fileName);
        }
      });

      // Remove from DB photo array
      product.photo = product.photo.filter(
        (img) => !idsToDelete.has(img._id.toString())
      );

      // Save changes to DB
      await product.save();
    }

    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map((file) => ({
        _id: new mongoose.Types.ObjectId(),
        fileName: file.filename,
      }));
      product.photo.push(...newPhotos);

      console.log("New photos added:", newPhotos);
      await product.save();
    }
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.categoryId = categoryId || product.categoryId;
    product.subcategoryId = subcategoryId || product.subcategoryId;

    await product.save();

    res.json({
      status: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.log(`Error while updating product: ${error.message}`);
    res.status(500).json({ status: false, message: error.message });
  }
};
