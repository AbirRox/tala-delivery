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
  console.error("Database connection failed: MONGO_URI is missing!");
} else {
  mongoose.connect(mongoURI)
    .then(() => console.log('>>> MongoDB Cloud Database Connected Successfully! <<<'))
    .catch(err => console.error('Database connection failed:', err.message));
}

// 1. Order Schema & Model
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

// 2. Partner / Merchant Schema & Model (For Legal Onboarding)
const partnerSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  category: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  tradeLicense: { type: String, required: true },
  ownerNid: { type: String, required: true },
  payoutDetails: { type: String, required: true },
  address: { type: String, required: true },
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Rejected'], 
    default: 'Pending' 
  },
  items: [{
    name: String,
    price: Number,
    description: String,
    available: { type: Boolean, default: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Partner = mongoose.model('Partner', partnerSchema);

// Admin & Partner Page Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/partner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'partner.html'));
});

// Customer API: Place Order
app.post('/api/orders', async (req, res) => {
  try {
    const { name, phone, address, mapLocation, items, total } = req.body;
    if (!name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing order details.' });
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
    res.status(201).json({ success: true, message: 'Order placed successfully!', order: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// Admin API: Get All Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// Partner API: Register New Merchant
app.post('/api/partners/register', async (req, res) => {
  try {
    const { businessName, category, ownerName, phone, tradeLicense, ownerNid, payoutDetails, address } = req.body;
    
    if (!businessName || !phone || !tradeLicense || !ownerNid) {
      return res.status(400).json({ success: false, message: 'Mandatory KYC fields are missing.' });
    }

    const newPartner = new Partner({
      businessName,
      category,
      ownerName,
      phone,
      tradeLicense,
      ownerNid,
      payoutDetails,
      address,
      verificationStatus: 'Pending',
      items: []
    });

    const savedPartner = await newPartner.save();
    res.status(201).json({ success: true, partner: savedPartner });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error registering partner: ' + err.message });
  }
});

// Partner API: Add New Item
app.post('/api/partners/:id/items', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    partner.items.push({ name, price, description, available: true });
    await partner.save();

    res.json({ success: true, message: 'Item added successfully', items: partner.items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not add item' });
  }
});

// Admin API: List all Partners & Verification
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch partners' });
  }
});

app.put('/api/partners/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'Verified' or 'Rejected'
    const updated = await Partner.findByIdAndUpdate(req.params.id, { verificationStatus: status }, { new: true });
    res.json({ success: true, partner: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update status' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});