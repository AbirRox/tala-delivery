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
  .then(() => console.log('Connected to MongoDB Atlas Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Schemas
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  storeName: { type: String, default: 'Kwiky Store' },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const RiderSchema = new mongoose.Schema({
  riderId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Delivery Hero' },
  phone: { type: String, default: '01711223344' },
  isOnline: { type: Boolean, default: false },
  location: {
    lat: { type: Number, default: 22.5726 },
    lng: { type: Number, default: 88.3639 }
  },
  lastActive: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  name: { type: String, default: 'Customer' },
  phone: { type: String, default: '01700000000' },
  address: { type: String, default: 'Delivery Address' },
  mapLocation: { type: String, default: '' },
  items: { type: Array, default: [] },
  total: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'COD' },
  status: { 
    type: String, 
    enum: ['Pending', 'Assigned', 'Accepted', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  assignedRiderId: { type: String, default: '' },
  riderName: { type: String, default: '' },
  riderPhone: { type: String, default: '' },
  riderLocation: {
    lat: { type: Number, default: 22.5726 },
    lng: { type: Number, default: 88.3639 }
  },
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

// Distance Calculation Helper
function calculateDistanceKM(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Public Menu Catalog
app.get('/api/public-menu', async (req, res) => {
  try {
    const catalog = await Item.find({ isAvailable: true }).sort({ createdAt: -1 });
    res.json({ success: true, catalog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Order Placement API
app.post(['/api/orders', '/api/order'], async (req, res) => {
  try {
    const body = req.body || {};
    const customerName = body.name || 'Customer';
    const customerPhone = body.phone || '01700000000';
    const customerAddress = body.address || 'Address Not Provided';
    const customerItems = body.items || [];
    const orderTotal = Number(body.total) || 0;
    const paymentMethod = body.paymentMethod || 'COD';
    const storeLat = Number(body.storeLat) || 22.5726;
    const storeLng = Number(body.storeLng) || 88.3639;

    const activeThreshold = new Date(Date.now() - 15 * 60 * 1000);
    const onlineRiders = await Rider.find({
      isOnline: true,
      lastActive: { $gte: activeThreshold }
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
      riderPhone: assignedRider ? assignedRider.phone : '',
      riderLocation: assignedRider ? assignedRider.location : { lat: storeLat, lng: storeLng }
    });

    await newOrder.save();
    res.json({ success: true, order: newOrder, assignedRider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Real-time Swiggy Customer Live Order Tracking API
app.get('/api/order/:id/track', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let riderInfo = null;
    let distanceKm = 1.8; // Estimated default
    let etaMinutes = 15;

    if (order.assignedRiderId) {
      const rider = await Rider.findOne({ riderId: order.assignedRiderId });
      if (rider) {
        riderInfo = {
          name: rider.name,
          phone: rider.phone,
          riderId: rider.riderId,
          lat: rider.location.lat,
          lng: rider.location.lng
        };
        // Calculate live distance from store to rider
        distanceKm = calculateDistanceKM(order.storeLat, order.storeLng, rider.location.lat, rider.location.lng);
        if (distanceKm > 50 || distanceKm === 0) distanceKm = 1.5;
        etaMinutes = Math.max(5, Math.round(distanceKm * 4));
      }
    }

    res.json({
      success: true,
      order: {
        id: order._id,
        status: order.status,
        total: order.total,
        address: order.address,
        items: order.items,
        riderName: order.riderName || (riderInfo ? riderInfo.name : 'Searching nearby hero...'),
        riderPhone: order.riderPhone || (riderInfo ? riderInfo.phone : ''),
        distanceKm: distanceKm.toFixed(1),
        etaMinutes: etaMinutes
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Rider APIs (Heartbeat & Status updates)
app.post('/api/rider/ping', async (req, res) => {
  try {
    const { riderId, name, phone, isOnline, lat, lng } = req.body;
    if (!riderId) return res.json({ success: false });

    const rider = await Rider.findOneAndUpdate(
      { riderId },
      {
        name: name || 'Delivery Partner',
        phone: phone || '01711223344',
        isOnline: Boolean(isOnline),
        location: { lat: Number(lat) || 22.5726, lng: Number(lng) || 88.3639 },
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );

    // Active order-er riderLocation update
    await Order.updateMany(
      { assignedRiderId: riderId, status: { $in: ['Assigned', 'Accepted', 'Picked Up', 'Out for Delivery'] } },
      { riderLocation: { lat: Number(lat) || 22.5726, lng: Number(lng) || 88.3639 } }
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
            { assignedRiderId: riderId, status: { $in: ['Assigned', 'Accepted', 'Picked Up', 'Out for Delivery'] } },
            { status: { $in: ['Pending', 'Assigned'] } }
          ]
        }
      : { status: { $in: ['Pending', 'Assigned', 'Accepted', 'Picked Up', 'Out for Delivery'] } };

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

// Admin APIs
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

// Seeder Endpoint
app.get('/api/seed-now', async (req, res) => {
  try {
    const defaultCatalog = [
      { name: "Basmati Mutton Kacchi Biryani", price: 480, category: "Food", subcategory: "Biryani & Polao", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" },
      { name: "Mutton Rezala", price: 310, category: "Food", subcategory: "Bengali Curries", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1545247181-516773ca838b?w=400" },
      { name: "Classic Beef Burger", price: 220, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "Cheesy Loaded French Fries", price: 190, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
      { name: "Special Beef Boti Kebab", price: 220, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400" },
      { name: "Crispy Chicken Zinger Burger", price: 240, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" },
      { name: "Special Shorshe Ilish", price: 520, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400" },
      { name: "Cotton Casual Shirt (Navy)", price: 890, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
      { name: "Napa Extra 500mg (1 Box)", price: 250, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Deshi Miniket Rice (5kg Bag)", price: 420, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" }
    ];

    await Item.deleteMany({});
    await Item.insertMany(defaultCatalog);
    res.send("<h1>Items Seeded Successfully!</h1><p><a href='/'>Go to Home</a></p>");
  } catch (err) {
    res.status(500).send("Seeding failed: " + err.message);
  }
});

// Safe Fallback Route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Kwiky Server is running on port ${PORT}`);
});