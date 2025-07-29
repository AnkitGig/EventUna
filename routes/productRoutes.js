const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProductPhoto } = require('../middleware/merchantMulter');

// Category routes
router.post('/category', protect, productController.addCategory);
router.get('/categories', protect, productController.getCategories);

// Subcategory routes
router.post('/subcategory', protect, productController.addSubcategory);
router.get('/subcategories',protect, productController.getSubcategories);

// Product routes
router.post('/product', protect, uploadProductPhoto.single('photo'), productController.addProduct);
router.get('/products', protect, productController.getProducts);

module.exports = router;
