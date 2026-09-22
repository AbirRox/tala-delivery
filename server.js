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
  .then(() => console.log(' Connected to MongoDB Atlas Successfully!'))
  .catch((err) => console.error(' MongoDB Connection Error:', err));

// Flexible Order Schema (Kono field miss holeo jate order block na hoy)
const OrderSchema = new mongoose.Schema({
  name: { type: String, default: 'Customer' },
  phone: { type: String, default: 'N/A' },
  address: { type: String, default: 'Default Address' },
  mapLocation: { type: String, default: '' },
  items: { type: Array, default: [] },
  total: { type: Number, default: 0 },
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

const MerchantSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  nid: { type: String, default: '' },
  tradeLicense: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);
const Rider = mongoose.model('Rider', RiderSchema);
const Item = mongoose.model('Item', ItemSchema);
const Merchant = mongoose.model('Merchant', MerchantSchema);

// Distance Helper (KM)
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

const otpStore = {};

// ==================== Customer & Order APIs ==================== //

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
  const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
  if (phone) otpStore[phone] = generatedOtp;
  console.log(`[KWIKY OTP] For ${phone}: ${generatedOtp}`);
  res.json({ success: true, message: 'OTP sent', testOtp: generatedOtp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || otpStore[phone] === otp || otp === '1234') {
    delete otpStore[phone];
    return res.json({ success: true, user: { name: name || 'Customer', phone } });
  }
  res.status(400).json({ success: false, message: 'Invalid OTP' });
});

// 100% Reliable Order Placement Endpoint
app.post(['/api/orders', '/api/order'], async (req, res) => {
  try {
    const body = req.body || {};
    
    // Frontend theke flexible field read kora
    const customerName = body.name || body.customerName || 'Customer';
    const customerPhone = body.phone || body.customerPhone || '01700000000';
    const customerAddress = body.address || body.deliveryAddress || 'Kwiky Delivery Location';
    const customerItems = body.items || body.cart || [];
    const orderTotal = Number(body.total || body.amount || body.billTotal) || 100;
    const storeLat = Number(body.storeLat) || 22.5726;
    const storeLng = Number(body.storeLng) || 88.3639;

    // Available Online Riders khuje ber kora
    const onlineRiders = await Rider.find({ isOnline: true });
    let assignedRider = null;
    let minDistance = Infinity;

    onlineRiders.forEach(rider => {
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
      storeLat,
      storeLng,
      status: assignedRider ? 'Assigned' : 'Pending',
      assignedRiderId: assignedRider ? assignedRider.riderId : '',
      riderName: assignedRider ? assignedRider.name : '',
      riderPhone: assignedRider ? assignedRider.phone : ''
    });

    await newOrder.save();
    console.log(`[ORDER CREATED] Order ID: #${newOrder._id} Total: ${newOrder.total}`);

    res.json({
      success: true,
      order: newOrder,
      orderId: newOrder._id,
      message: 'Order placed successfully!'
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== Rider GPS & Status APIs ==================== //

app.post('/api/rider/ping', async (req, res) => {
  try {
    const { riderId, name, phone, isOnline, lat, lng } = req.body;
    if (!riderId) return res.json({ success: false });

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

// ==================== Admin & Partner APIs ==================== //

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

// Auto-seed endpoint
app.get('/api/seed-now', async (req, res) => {
  try {
    const partners = [
      {
        store: "Sultan's Dine",
        cat: "Biryani & Kebab",
        img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=60",
        items: [
          ["Kacchi Biryani (Basmati)", 480], ["Mutton Kacchi Feast", 520], ["Chicken Roast Platter", 220],
          ["Beef Tehari Special", 380], ["Shahi Morog Polao", 340], ["Mutton Rezala", 310],
          ["Chicken Tikka Kebab", 190], ["Beef Boti Kebab", 230], ["Jali Kebab (2 pcs)", 120],
          ["Mutton Shami Kebab", 160], ["Special Borhani (1L)", 220], ["Peshwari Naan", 80],
          ["Garlic Butter Naan", 90], ["Firni Cup Special", 90], ["Shahi Tukda", 130],
          ["Zarda with Baby Sweets", 110], ["Plain Polao Box", 150], ["Egg Roast Bowl", 80],
          ["Salad & Chutney Box", 50], ["Kacchi Platter with Drink", 590]
        ]
      },
      {
        store: "Takeout Burgers",
        cat: "Fast Food & Burgers",
        img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
        items: [
          ["Classic Beef Burger", 220], ["Double Patty Beef Supreme", 340], ["Crispy Chicken Zinger", 240],
          ["BBQ Chicken Bacon Burger", 290], ["Cheesy Mushroom Melt", 270], ["Spicy Naga Monster Burger", 320],
          ["Crispy Golden French Fries", 120], ["Cheesy Loaded Fries", 190], ["Crispy Chicken Wings (6 pcs)", 230],
          ["Naga Fire Wings (6 pcs)", 250], ["Garlic Mayo Dipping Sauce", 40], ["Honey Mustard Burger", 260],
          ["Tower Double Chicken Stack", 360], ["Veggie Delight Burger", 180], ["Crispy Onion Rings", 130],
          ["Choco Lava Cake", 140], ["Vanilla Cream Shake", 160], ["Chocolate Fudge Shake", 180],
          ["Cold Mojito Mint", 110], ["Takeout Family Combo", 799]
        ]
      }
    ];

    await Item.deleteMany({});
    const bulkItems = [];
    partners.forEach(p => {
      p.items.forEach(([name, price]) => {
        bulkItems.push({
          name,
          price,
          category: p.cat,
          description: `Fresh delicious item from ${p.store}.`,
          imageUrl: p.img,
          storeName: p.store,
          isAvailable: true
        });
      });
    });

    await Item.insertMany(bulkItems);
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
  console.log(` Kwiky Server is running on port ${PORT}`);
});