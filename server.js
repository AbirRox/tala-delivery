const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas Connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("Database connection failed: MONGO_URI is missing in environment variables!");
} else {
  mongoose.connect(mongoURI)
    .then(() => console.log('>>> MongoDB Cloud Database Connected Successfully! <<<'))
    .catch(err => console.error('Database connection failed:', err.message));
}

// Order Schema & Model
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  mapLocation: { type: String, default: '' },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Admin Page Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API: Place New Order
app.post('/api/orders', async (req, res) => {
  try {
    const { name, phone, address, mapLocation, items, total } = req.body;

    if (!name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide all required order details.' });
    }

    const newOrder = new Order({
      name,
      phone,
      address,
      mapLocation: mapLocation || '',
      items,
      total: total || 0,
      status: 'Pending'
    });

    const savedOrder = await newOrder.save();
    console.log("New Order Received:", savedOrder._id);
    res.status(201).json({ success: true, message: 'Order placed successfully!', order: savedOrder });
  } catch (error) {
    console.error("Order submission error:", error.message);
    res.status(500).json({ success: false, message: 'Server error while saving order.', error: error.message });
  }
});

// API: Get All Orders (for Admin Panel)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});