const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
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

// Rider Schema for Live Location & Duty Tracking
const RiderSchema = new mongoose.Schema({
  riderId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Delivery Hero' },
  phone: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  lastActive: { type: Date, default: Date.now }
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
    enum: ['Pending', 'Assigned', 'Accepted', 'Picked Up', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  assignedRiderId: { type: String, default: '' },
  riderName: { type: String, default: '' },
  riderPhone: { type: String, default: '' },
  storeLat: { type: Number, default: 22.5726 }, // ডিফল্ট স্টোর লোকেশন
  storeLng: { type: Number, default: 88.3639 },
  createdAt: { type: Date, default: Date.now }
});

const MerchantSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  nid: { type: String, default: '' },
  tradeLicense: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', ItemSchema);
const Rider = mongoose.model('Rider', RiderSchema);
const Order = mongoose.model('Order', OrderSchema);
const Merchant = mongoose.model('Merchant', MerchantSchema);

// Distance Calculation Helper (Haversine Formula in KM)
function calculateDistanceKM(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// In-Memory OTP Store
const otpStore = {};

// ==================== Customer & Menu APIs ==================== //

app.get('/api/public-menu', async (req, res) => {
  try {
    const catalog = await Item.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.json({ success: true, catalog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ success: false, message: 'Valid mobile number required' });
  }
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore[phone] = generatedOtp;
  console.log(`[KWIKY OTP] Code for ${phone}: ${generatedOtp}`);
  res.json({ success: true, message: 'OTP sent successfully', testOtp: generatedOtp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  if (otpStore[phone] && otpStore[phone] === otp) {
    delete otpStore[phone];
    return res.json({ success: true, user: { name: name || 'Valued Customer', phone } });
  }
  res.status(400).json({ success: false, message: 'Invalid OTP code' });
});

// কাস্টমার অর্ডার প্লেস করবে এবং কাছের অনলাইন রাইডার স্বয়ংক্রিয়ভাবে পাবে
app.post('/api/orders', async (req, res) => {
  try {
    const { name, phone, address, mapLocation, items, total, storeLat, storeLng } = req.body;
    
    const targetStoreLat = storeLat || 22.5726;
    const targetStoreLng = storeLng || 88.3639;

    // ১. বর্তমানে অনলাইনে সক্রিয় থাকা রাইডারদের তালিকা নেওয়া (গত ৫ মিনিটের মধ্যে অ্যাক্টিভ)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const availableRiders = await Rider.find({
      isOnline: true,
      lastActive: { $gte: fiveMinutesAgo }
    });

    let assignedRider = null;
    let minDistance = Infinity;

    // ২. স্টোরের সবচেয়ে কাছে থাকা রাইডার খোঁজা
    availableRiders.forEach(rider => {
      const dist = calculateDistanceKM(targetStoreLat, targetStoreLng, rider.location.lat, rider.location.lng);
      if (dist < minDistance) {
        minDistance = dist;
        assignedRider = rider;
      }
    });

    const newOrder = new Order({
      name,
      phone,
      address,
      mapLocation,
      items,
      total,
      storeLat: targetStoreLat,
      storeLng: targetStoreLng,
      status: assignedRider ? 'Assigned' : 'Pending',
      assignedRiderId: assignedRider ? assignedRider.riderId : '',
      riderName: assignedRider ? assignedRider.name : '',
      riderPhone: assignedRider ? assignedRider.phone : ''
    });

    await newOrder.save();
    console.log(`[AUTO-ASSIGN] Order #${newOrder._id} assigned to Rider: ${assignedRider ? assignedRider.riderId : 'Unassigned (No Rider Nearby)'}`);

    res.json({ success: true, order: newOrder, assignedRider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== Rider GPS & Auto-Assignment APIs ==================== //

// রাইডারের লাইভ লোকেশন ও ডিউটি পিং (Heartbeat)
app.post('/api/rider/ping', async (req, res) => {
  try {
    const { riderId, name, phone, isOnline, lat, lng } = req.body;
    if (!riderId) return res.status(400).json({ success: false, message: 'riderId required' });

    const rider = await Rider.findOneAndUpdate(
      { riderId },
      {
        name: name || 'Delivery Hero',
        phone: phone || '',
        isOnline: Boolean(isOnline),
        location: { lat: Number(lat) || 0, lng: Number(lng) || 0 },
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, rider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// নির্দিষ্ট রাইডারের জন্য অ্যাসাইন করা অর্ডারগুলো পাওয়ার API (Swiggy Alert-এর জন্য)
app.get('/api/rider/assigned-orders', async (req, res) => {
  try {
    const { riderId } = req.query;
    
    // রাইডারের নিজস্ব অ্যাসাইনড অর্ডার অথবা আন-অ্যাসাইনড পেন্ডিং অর্ডারগুলো আনা
    const query = riderId
      ? {
          $or: [
            { assignedRiderId: riderId, status: { $in: ['Assigned', 'Accepted', 'Picked Up'] } },
            { status: 'Pending' }
          ]
        }
      : { status: { $in: ['Pending', 'Assigned', 'Accepted', 'Picked Up'] } };

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// রাইডার অর্ডার অ্যাকসেপ্ট বা স্ট্যাটাস আপডেট করবে
app.patch('/api/rider/order/:id/status', async (req, res) => {
  try {
    const { status, riderId, riderName, riderPhone } = req.body;
    const updateData = { status };
    if (riderId) updateData.assignedRiderId = riderId;
    if (riderName) updateData.riderName = riderName;
    if (riderPhone) updateData.riderPhone = riderPhone;

    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== Admin APIs ==================== //

app.get(['/api/orders', '/api/admin/orders'], async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get(['/api/partners', '/api/admin/partners', '/api/merchants', '/api/admin/merchants'], async (req, res) => {
  try {
    const merchants = await Merchant.find({}).sort({ createdAt: -1 });
    res.json(merchants);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fallback SPA Route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Kwiky Server is running on port ${PORT}`);
});