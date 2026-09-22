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

// MongoDB Atlas Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kwiky';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Database Schemas
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true }, // Food, Fashion, Medicine, Grocery
  subcategory: { type: String, default: 'General' },
  storeName: { type: String, default: 'Kwiky Store' },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const RiderSchema = new mongoose.Schema({
  riderId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Delivery Partner' },
  phone: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  location: {
    lat: { type: Number, default: 22.5726 },
    lng: { type: Number, default: 88.3639 }
  },
  lastActive: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  name: { type: String, default: 'Valued Customer' },
  phone: { type: String, default: '01700000000' },
  address: { type: String, default: 'Delivery Address' },
  mapLocation: { type: String, default: '' },
  items: { type: Array, default: [] },
  total: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'COD' },
  status: { 
    type: String, 
    enum: ['Pending', 'Assigned', 'Accepted', 'Picked Up', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  assignedRiderId: { type: String, default: '' },
  riderName: { type: String, default: '' },
  riderPhone: { type: String, default: '' },
  storeLat: { type: Number, default: 22.5726 },
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
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const otpStore = {};

// ==================== Public Catalog APIs ==================== //

app.get('/api/public-menu', async (req, res) => {
  try {
    const catalog = await Item.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.json({ success: true, catalog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer OTP APIs
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  if (phone) otpStore[phone] = generatedOtp;
  console.log(`[KWIKY OTP] Sent to ${phone}: ${generatedOtp}`);
  res.json({ success: true, message: 'OTP Sent successfully', testOtp: generatedOtp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || otpStore[phone] === otp || otp === '1234') {
    delete otpStore[phone];
    return res.json({ success: true, user: { name: name || 'Customer', phone } });
  }
  res.status(400).json({ success: false, message: 'Invalid OTP code' });
});

// Bulletproof Customer Order Placement API
app.post(['/api/orders', '/api/order'], async (req, res) => {
  try {
    const body = req.body || {};
    const customerName = body.name || body.customerName || 'Customer';
    const customerPhone = body.phone || body.customerPhone || '01700000000';
    const customerAddress = body.address || body.deliveryAddress || 'Address not specified';
    const customerItems = body.items || body.cart || [];
    const orderTotal = Number(body.total || body.amount) || 0;
    const paymentMethod = body.paymentMethod || 'COD';
    const storeLat = Number(body.storeLat) || 22.5726;
    const storeLng = Number(body.storeLng) || 88.3639;

    // Check online riders within 15 minutes of heartbeat
    const activeTimeThreshold = new Date(Date.now() - 15 * 60 * 1000);
    const onlineRiders = await Rider.find({
      isOnline: true,
      lastActive: { $gte: activeTimeThreshold }
    });

    let assignedRider = null;
    let minDistance = Infinity;

    onlineRiders.forEach((rider) => {
      const dist = calculateDistanceKM(storeLat, storeLng, rider.location.lat, rider.location.lng);
      if (dist < minDistance) {
        minDistance = dist;
        assignedRider = rider;
      }
    });

    const newOrder = new Order({
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      mapLocation: body.mapLocation || '',
      items: customerItems,
      total: orderTotal,
      paymentMethod,
      storeLat,
      storeLng,
      status: assignedRider ? 'Assigned' : 'Pending',
      assignedRiderId: assignedRider ? assignedRider.riderId : '',
      riderName: assignedRider ? assignedRider.name : '',
      riderPhone: assignedRider ? assignedRider.phone : ''
    });

    await newOrder.save();
    console.log(`[ORDER PLACED] #${newOrder._id} -> Rider assigned: ${assignedRider ? assignedRider.riderId : 'None'}`);

    res.json({
      success: true,
      order: newOrder,
      orderId: newOrder._id,
      assignedRider
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== Rider GPS & Duty APIs ==================== //

app.post('/api/rider/ping', async (req, res) => {
  try {
    const { riderId, name, phone, isOnline, lat, lng } = req.body;
    if (!riderId) return res.json({ success: false });

    const rider = await Rider.findOneAndUpdate(
      { riderId },
      {
        name: name || 'Delivery Partner',
        phone: phone || '',
        isOnline: Boolean(isOnline),
        location: { lat: Number(lat) || 22.5726, lng: Number(lng) || 88.3639 },
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, rider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/rider/assigned-orders', async (req, res) => {
  try {
    const { riderId } = req.query;
    const query = riderId
      ? {
          $or: [
            { assignedRiderId: riderId, status: { $in: ['Assigned', 'Accepted', 'Picked Up'] } },
            { status: { $in: ['Pending', 'Assigned'] } }
          ]
        }
      : { status: { $in: ['Pending', 'Assigned', 'Accepted', 'Picked Up'] } };

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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

// ==================== Admin Panel APIs ==================== //

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

app.patch(['/api/orders/:id/status', '/api/admin/orders/:id/status'], async (req, res) => {
  try {
    const updated = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch(['/api/partners/:id/status', '/api/merchants/:id/status'], async (req, res) => {
  try {
    const updated = await Merchant.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, merchant: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== Multi-Category Database Seeder ==================== //

app.get('/api/seed-now', async (req, res) => {
  try {
    const itemsData = [
      // 1. FOOD: Sultan's Dine
      { name: "Kacchi Biryani (Basmati)", price: 480, category: "Food", subcategory: "Biryani & Polao", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" },
      { name: "Mutton Kacchi Feast Box", price: 540, category: "Food", subcategory: "Biryani & Polao", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400" },
      { name: "Mutton Rezala", price: 310, category: "Food", subcategory: "Curry & Gravy", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1545247181-516773ca838b?w=400" },
      { name: "Shahi Chicken Roast", price: 220, category: "Food", subcategory: "Curry & Gravy", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400" },
      { name: "Shahi Borhani (1 Liter)", price: 220, category: "Food", subcategory: "Drinks & Desserts", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400" },
      { name: "Firni Matka Cup", price: 90, category: "Food", subcategory: "Drinks & Desserts", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },

      // 2. FOOD: Takeout Burgers
      { name: "Classic Beef Burger", price: 220, category: "Food", subcategory: "Burgers & Fast Food", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "Crispy Chicken Zinger", price: 240, category: "Food", subcategory: "Burgers & Fast Food", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=400" },
      { name: "BBQ Bacon Cheese Blast", price: 290, category: "Food", subcategory: "Burgers & Fast Food", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" },
      { name: "Cheesy Loaded Fries", price: 190, category: "Food", subcategory: "Burgers & Fast Food", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
      { name: "Crispy Naga Wings (6 pcs)", price: 230, category: "Food", subcategory: "Burgers & Fast Food", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400" },

      // 3. FOOD: Star Kabab & Restaurant
      { name: "Star Special Beef Boti Kebab", price: 220, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400" },
      { name: "Chicken Tikka Leg", price: 180, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400" },
      { name: "Mutton Khichuri Platter", price: 340, category: "Food", subcategory: "Biryani & Polao", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
      { name: "Special Garlic Naan", price: 90, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },

      // 4. FASHION: Men's Wear
      { name: "Slim Fit Cotton Casual Shirt", price: 890, category: "Fashion", subcategory: "Men's Wear", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
      { name: "Premium Polo T-Shirt (Navy)", price: 550, category: "Fashion", subcategory: "Men's Wear", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400" },
      { name: "Stretch Denim Jeans (Blue)", price: 1250, category: "Fashion", subcategory: "Men's Wear", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400" },

      // 5. FASHION: Women's Wear
      { name: "Embroidered Cotton Kurti", price: 1150, category: "Fashion", subcategory: "Women's Ethnic", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
      { name: "Silk Chiffon Dupatta", price: 450, category: "Fashion", subcategory: "Women's Ethnic", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400" },
      { name: "Floral Print Maxi Dress", price: 1350, category: "Fashion", subcategory: "Women's Western", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },

      // 6. FASHION: Footwear & Accessories
      { name: "Classic White Court Sneakers", price: 1450, category: "Fashion", subcategory: "Footwear", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400" },
      { name: "Genuine Leather Loafers", price: 1950, category: "Fashion", subcategory: "Footwear", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Polarized UV Sunglasses", price: 650, category: "Fashion", subcategory: "Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400" },
      { name: "Leather Men's Wallet", price: 590, category: "Fashion", subcategory: "Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400" },

      // 7. MEDICINE: OTC & Daily Care
      { name: "Napa Extra 500mg Box (10 Strips)", price: 250, category: "Medicine", subcategory: "OTC & Daily Care", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Gastric Relief Chewable (Strip)", price: 25, category: "Medicine", subcategory: "OTC & Daily Care", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Digital Body Thermometer", price: 180, category: "Medicine", subcategory: "First Aid & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Antiseptic Disinfectant Liquid 250ml", price: 85, category: "Medicine", subcategory: "First Aid & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Vitamin C Chewable 500mg (30 Tabs)", price: 120, category: "Medicine", subcategory: "Vitamins & Supplements", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=400" },
      { name: "Calcium + Vitamin D3 Bone Care", price: 240, category: "Medicine", subcategory: "Vitamins & Supplements", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400" },
      { name: "Gentle Baby Wet Wipes (80 Sheets)", price: 160, category: "Medicine", subcategory: "Baby & Mom Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400" },
      { name: "Baby Diaper Comfort Rash Cream", price: 210, category: "Medicine", subcategory: "Baby & Mom Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },

      // 8. GROCERY: Daily Staples & Essentials
      { name: "Miniket Premium Rice (5kg Bag)", price: 420, category: "Grocery", subcategory: "Daily Staples", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Pure Soybean Oil (2 Liter Bottle)", price: 370, category: "Grocery", subcategory: "Daily Staples", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Farm Fresh Brown Eggs (1 Dozen)", price: 155, category: "Grocery", subcategory: "Daily Staples", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400" },
      { name: "Potato Chips - Spicy Chili (100g)", price: 60, category: "Grocery", subcategory: "Snacks & Drinks", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
      { name: "Cola Refresh Drink (1.5 Liter)", price: 95, category: "Grocery", subcategory: "Snacks & Drinks", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" }
    ];

    await Item.deleteMany({});
    await Item.insertMany(itemsData);

    res.send(`
      <div style="font-family:sans-serif; text-align:center; padding-top:50px;">
        <h1 style="color:#27ae60;">Database Seeded Successfully!</h1>
        <h2>${itemsData.length} items added across Food, Fashion, Medicine & Grocery!</h2>
        <p><a href="/" style="display:inline-block; margin-top:15px; padding:10px 20px; background:#fc8019; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">Go to Store Front</a></p>
      </div>
    `);
  } catch (err) {
    res.status(500).send("Seeding failed: " + err.message);
  }
});

// Safe Fallback Middleware (Missing parameter name at index 1: * error prevent kore)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Kwiky Server is running on port ${PORT}`);
});