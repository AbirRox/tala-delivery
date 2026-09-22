const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kwiky';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Database Schemas
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'Food' },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  storeName: { type: String, default: 'Kwiky Express' },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  mapLocation: { type: String, default: '' },
  items: [
    {
      name: String,
      price: Number
    }
  ],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Picked Up', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  riderName: { type: String, default: '' },
  riderPhone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', ItemSchema);
const Order = mongoose.model('Order', OrderSchema);

// In-Memory OTP Store
const otpStore = {};

// ==================== Customer & Menu APIs ==================== //

// Get public catalog
app.get('/api/public-menu', async (req, res) => {
  try {
    const catalog = await Item.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.json({ success: true, catalog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 11) {
    return res.status(400).json({ success: false, message: 'Valid 11-digit mobile number required' });
  }
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phone] = generatedOtp;

  console.log(`[KWIKY OTP ALERT] Verification Code for ${phone}: ${generatedOtp}`);
  res.json({ success: true, message: 'OTP sent successfully', testOtp: generatedOtp });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  if (otpStore[phone] && otpStore[phone] === otp) {
    delete otpStore[phone];
    return res.json({
      success: true,
      user: { name: name || 'Valued Customer', phone }
    });
  }
  res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
});

// Place customer order
app.post('/api/orders', async (req, res) => {
  try {
    const { name, phone, address, mapLocation, items, total } = req.body;
    const newOrder = new Order({
      name,
      phone,
      address,
      mapLocation,
      items,
      total,
      status: 'Pending'
    });
    await newOrder.save();
    res.json({ success: true, order: newOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== Delivery Partner (Rider) APIs ==================== //

// Get all active assignments for delivery fleet
app.get('/api/rider/orders', async (req, res) => {
  try {
    const activeOrders = await Order.find({
      status: { $in: ['Pending', 'Accepted', 'Picked Up'] }
    }).sort({ createdAt: -1 });

    res.json({ success: true, orders: activeOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update order status by Rider
app.patch('/api/rider/order/:id/status', async (req, res) => {
  try {
    const { status, riderName, riderPhone } = req.body;
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status, riderName, riderPhone },
      { new: true }
    );
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Safe Fallback Route (Fixes PathError: Missing parameter name at index 1: *)
app.get('/(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Kwiky Server is running on port ${PORT}`);
});