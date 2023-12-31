const express = require('express');
const router = express.Router();
const orderController = require('../Controllers/orderController');
const { validateToken } = require('../Middlewares/authMiddleware');

//total
router.get('/totalorders', orderController.getTotalOrders);

// List all orders with pagination support
router.get('/', orderController.listOrders);

// Get an order by ID
router.get('/:id', orderController.getOrderById);

// Create a new order
router.post('/',orderController.createOrder);

// Update the order status
router.put('/:id', validateToken, orderController.updateOrderStatus);

module.exports = router;

