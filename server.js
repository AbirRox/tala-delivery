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
  console.error("Database connection failed: MONGO_URI missing!");
} else {
  mongoose.connect(mongoURI)
    .then(() => console.log('>>> MongoDB Connected Successfully! <<<'))
    .catch(err => console.error('Database connection failed:', err.message));
}

// Memory Cache for OTPs (Phone -> { otp, expiresAt })
const otpStore = new Map();

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

// 2. Partner Schema & Model
const partnerSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  category: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  tradeLicense: { type: String, required: true },
  ownerNid: { type: String, required: true },
  payoutDetails: { type: String, required: true },
  address: { type: String, required: true },
  isOpen: { type: Boolean, default: true },
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Rejected'], 
    default: 'Pending' 
  },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true }
  }],
  createdAt: { type: Date, default: Date.now }
});
const Partner = mongoose.model('Partner', partnerSchema);

// Web Pages
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/partner', (req, res) => res.sendFile(path.join(__dirname, 'public', 'partner.html')));

// --- Swiggy Style OTP Login APIs ---

// Send OTP API
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^01[3-9]\d{8}$/.test(phone.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid 11-digit mobile number' });
  }

  const cleanPhone = phone.trim();
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes expiry

  otpStore.set(cleanPhone, { otp, expiresAt });
  console.log(`[OTP Generated] Phone: ${cleanPhone}, OTP: ${otp}`);

  // Response includes test OTP when no SMS Gateway key is present
  res.json({ 
    success: true, 
    message: 'OTP sent successfully', 
    testOtp: otp 
  });
});

// Verify OTP API
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  const cleanPhone = phone ? phone.trim() : '';

  const record = otpStore.get(cleanPhone);
  if (!record) {
    return res.status(400).json({ success: false, message: 'OTP expired or not requested' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP. Try again.' });
  }

  otpStore.delete(cleanPhone);
  res.json({ 
    success: true, 
    message: 'Verified successfully', 
    user: { phone: cleanPhone, name: name || 'Customer' } 
  });
});

// --- Customer Order & Menu APIs ---
app.post('/api/orders', async (req, res) => {
  try {
    const { name, phone, address, mapLocation, items, total } = req.body;
    if (!name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing order details.' });
    }
    const newOrder = new Order({
      name, phone, address, mapLocation: mapLocation || '', items, total: total || 0, status: 'Pending'
    });
    const savedOrder = await newOrder.save();
    res.status(201).json({ success: true, message: 'Order placed successfully!', order: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

app.get('/api/public-menu', async (req, res) => {
  try {
    const partners = await Partner.find({ verificationStatus: 'Verified', isOpen: true });
    let publicCatalog = [];
    
    partners.forEach(partner => {
      partner.items.forEach(item => {
        publicCatalog.push({
          itemId: item._id,
          partnerId: partner._id,
          storeName: partner.businessName,
          category: partner.category,
          name: item.name,
          price: item.price,
          description: item.description,
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable
        });
      });
    });

    res.json({ success: true, catalog: publicCatalog });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching catalog' });
  }
});

// --- Admin APIs ---
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

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
    const { status } = req.body;
    const updated = await Partner.findByIdAndUpdate(req.params.id, { verificationStatus: status }, { new: true });
    res.json({ success: true, partner: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update status' });
  }
});

// --- Partner Portal APIs ---
app.post('/api/partners/login', async (req, res) => {
  try {
    const { phone } = req.body;
    const partner = await Partner.findOne({ phone: phone.trim() });
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not registered' });
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/partners/register', async (req, res) => {
  try {
    const { businessName, category, ownerName, phone, tradeLicense, ownerNid, payoutDetails, address } = req.body;
    const existing = await Partner.findOne({ phone: phone.trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Phone already registered' });

    const newPartner = new Partner({
      businessName, category, ownerName, phone: phone.trim(), tradeLicense, ownerNid, payoutDetails, address, verificationStatus: 'Pending', items: []
    });
    const saved = await newPartner.save();
    res.status(201).json({ success: true, partner: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/partners/:id/items', async (req, res) => {
  try {
    const { name, price, description, imageUrl } = req.body;
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    partner.items.push({ name, price: Number(price), description: description || '', imageUrl: imageUrl || '', isAvailable: true });
    await partner.save();
    res.json({ success: true, message: 'Item added', items: partner.items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not add item' });
  }
});

app.patch('/api/partners/:partnerId/items/:itemId/toggle-stock', async (req, res) => {
  try {
    const { partnerId, itemId } = req.params;
    const partner = await Partner.findById(partnerId);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
    const item = partner.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.isAvailable = !item.isAvailable;
    await partner.save();
    res.json({ success: true, isAvailable: item.isAvailable });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Stock update failed' });
  }
});

app.delete('/api/partners/:partnerId/items/:itemId', async (req, res) => {
  try {
    const { partnerId, itemId } = req.params;
    const partner = await Partner.findById(partnerId);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

    partner.items.pull({ _id: itemId });
    await partner.save();
    res.json({ success: true, items: partner.items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

app.patch('/api/partners/:partnerId/toggle-open', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.partnerId);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
    partner.isOpen = !partner.isOpen;
    await partner.save();
    res.json({ success: true, isOpen: partner.isOpen });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Toggle failed' });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));