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

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kwiky';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// Database Schemas
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
  phone: { type: String, default: '' },
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

// Public API
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
      riderPhone: assignedRider ? assignedRider.phone : ''
    });

    await newOrder.save();
    res.json({ success: true, order: newOrder, assignedRider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Rider APIs
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

// Admin Panel APIs
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

// Complete 400 Items Database Seeder (4 Categories x 10 Subcategories x 10 Verified Items)
app.get('/api/seed-now', async (req, res) => {
  try {
    const fullCatalog = [
      // ==========================================
      // 1. FOOD (10 Subcategories x 10 Items = 100 Items)
      // ==========================================
      // Subcat 1: Biryani & Polao
      { name: "Basmati Mutton Kacchi Biryani", price: 480, category: "Food", subcategory: "Biryani & Polao", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" },
      { name: "Kacchi Feast with Egg & Aloo", price: 520, category: "Food", subcategory: "Biryani & Polao", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400" },
      { name: "Dhaka Shahi Morog Polao", price: 320, category: "Food", subcategory: "Biryani & Polao", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400" },
      { name: "Old Dhaka Beef Tehari Special", price: 340, category: "Food", subcategory: "Biryani & Polao", storeName: "Kacchi Bhai", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
      { name: "Chicken Dum Biryani (Hyderabadi)", price: 380, category: "Food", subcategory: "Biryani & Polao", storeName: "Kacchi Bhai", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" },
      { name: "Basmati Beef Kacchi Platter", price: 460, category: "Food", subcategory: "Biryani & Polao", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400" },
      { name: "Achari Mutton Khichuri", price: 330, category: "Food", subcategory: "Biryani & Polao", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400" },
      { name: "Kashmiri Pulao with Dry Fruits", price: 290, category: "Food", subcategory: "Biryani & Polao", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
      { name: "Plain Chinigura Polao Box", price: 150, category: "Food", subcategory: "Biryani & Polao", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" },
      { name: "Mutton Kacchi Family Mega Box", price: 1750, category: "Food", subcategory: "Biryani & Polao", storeName: "Kacchi Bhai", imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400" },

      // Subcat 2: Burgers & Sandwiches
      { name: "Classic Gourmet Beef Burger", price: 220, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "Crispy Crunchy Chicken Zinger", price: 240, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" },
      { name: "Smoky BBQ Bacon Beef Stack", price: 340, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "Naga Blast Chicken Burger", price: 270, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" },
      { name: "Double Patty Cheese Monster", price: 390, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "Grilled Club Sandwich (3 Layers)", price: 260, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400" },
      { name: "Smoked Chicken Submarine", price: 250, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400" },
      { name: "Crispy Fish Fillet Burger", price: 310, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "Mushroom Melt Cheeseburger", price: 280, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" },
      { name: "Spicy Beef & Egg Burger Combo", price: 360, category: "Food", subcategory: "Burgers & Sandwiches", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },

      // Subcat 3: Kebabs & Tandoor
      { name: "Special Beef Boti Kebab", price: 220, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400" },
      { name: "Chicken Reshmi Kebab Skewers", price: 240, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400" },
      { name: "Tandoori Chicken Leg Roast", price: 180, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400" },
      { name: "Mutton Seekh Kebab (2 pcs)", price: 260, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Kacchi Bhai", imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400" },
      { name: "Chicken Malai Tikka Platter", price: 280, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400" },
      { name: "Special Beef Chaap Masala", price: 270, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400" },
      { name: "Chicken Chaap Fried with Luchi", price: 250, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Kacchi Bhai", imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400" },
      { name: "Garlic Butter Tandoori Naan", price: 90, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
      { name: "Kashmiri Peshwari Naan", price: 110, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
      { name: "Mixed Kebab Sizzler Feast", price: 690, category: "Food", subcategory: "Kebabs & Tandoor", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400" },

      // Subcat 4: Bengali Curries
      { name: "Special Shorshe Ilish (Hilsa)", price: 520, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400" },
      { name: "Chingri Malai Curry (Golda)", price: 480, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
      { name: "Khashir Mangsho (Mutton) Jhol", price: 440, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1545247181-516773ca838b?w=400" },
      { name: "Beef Kala Bhuna (Chittagong)", price: 360, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1545247181-516773ca838b?w=400" },
      { name: "Rui Macher Kalia with Gravy", price: 240, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400" },
      { name: "Deshi Murgir Patla Jhol", price: 290, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400" },
      { name: "Alu Posto (Classic Bankura Style)", price: 180, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
      { name: "Dhokar Dalna Traditional Gravy", price: 150, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },
      { name: "Mochar Ghonto with Coconut", price: 140, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400" },
      { name: "Grand Bengali Master Thali", price: 620, category: "Food", subcategory: "Bengali Curries", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400" },

      // Subcat 5: Chinese & Chowmein
      { name: "Chicken Hakka Chowmein Bowl", price: 220, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" },
      { name: "Egg & Chicken Fried Rice (Large)", price: 260, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400" },
      { name: "Crispy Chili Chicken Dry", price: 290, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400" },
      { name: "Sweet & Sour Prawn Curry", price: 380, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400" },
      { name: "Beef Chili Onion with Gravy", price: 340, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400" },
      { name: "Crispy Fried Wonton (8 pcs)", price: 180, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=400" },
      { name: "Chicken Thai Thick Soup (1:3)", price: 350, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400" },
      { name: "Chicken Corn Soup Bowl", price: 160, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400" },
      { name: "Szechuan Spicy Noodles", price: 240, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" },
      { name: "Chinese Combo Box (Rice+Chicken)", price: 320, category: "Food", subcategory: "Chinese & Chowmein", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400" },

      // Subcat 6: Pizza & Pasta
      { name: "Margherita Fresh Mozzarella Pizza", price: 390, category: "Food", subcategory: "Pizza & Pasta", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" },
      { name: "Spicy Chicken BBQ Crust Pizza", price: 490, category: "Food", subcategory: "Pizza & Pasta", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400" },
      { name: "Beef Pepperoni Overloaded Pizza", price: 580, category: "Food", subcategory: "Pizza & Pasta", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400" },
      { name: "Four Cheese Gourmet Pizza", price: 550, category: "Food", subcategory: "Pizza & Pasta", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" },
      { name: "Creamy Alfredo White Sauce Pasta", price: 280, category: "Food", subcategory: "Pizza & Pasta", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=400" },
      { name: "Spicy Red Sauce Chicken Penne", price: 270, category: "Food", subcategory: "Pizza & Pasta", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400" },
      { name: "Baked Cheesy Beef Pasta Bowl", price: 340, category: "Food", subcategory: "Pizza & Pasta", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281699?w=400" },
      { name: "Cheesy Garlic Herb Breadsticks", price: 150, category: "Food", subcategory: "Pizza & Pasta", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
      { name: "Mushroom & Olive Calzone Pocket", price: 310, category: "Food", subcategory: "Pizza & Pasta", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" },
      { name: "Chicken Sausage Burst Thin Pizza", price: 440, category: "Food", subcategory: "Pizza & Pasta", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400" },

      // Subcat 7: Desserts & Sweets
      { name: "Bograr Shahi Misti Doi (500g)", price: 240, category: "Food", subcategory: "Desserts & Sweets", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },
      { name: "Spongy Rosogolla (Box of 6)", price: 150, category: "Food", subcategory: "Desserts & Sweets", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" },
      { name: "Pure Ghee Gulab Jamun (4 pcs)", price: 130, category: "Food", subcategory: "Desserts & Sweets", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" },
      { name: "Kheer Mohan & Rasmalai Cup", price: 180, category: "Food", subcategory: "Desserts & Sweets", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },
      { name: "Molten Choco Lava Cake", price: 140, category: "Food", subcategory: "Desserts & Sweets", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400" },
      { name: "Red Velvet Cream Pastry", price: 160, category: "Food", subcategory: "Desserts & Sweets", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400" },
      { name: "Traditional Zarda with Baby Sweets", price: 120, category: "Food", subcategory: "Desserts & Sweets", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" },
      { name: "Creamy Royal Royal Faluda", price: 170, category: "Food", subcategory: "Desserts & Sweets", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400" },
      { name: "Rich Chocolate Fudge Brownie", price: 130, category: "Food", subcategory: "Desserts & Sweets", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400" },
      { name: "Kaju Barfi Pure Ghee (250g)", price: 340, category: "Food", subcategory: "Desserts & Sweets", storeName: "Sultan's Dine", imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400" },

      // Subcat 8: Juices & Shakes
      { name: "Oreo Thick Chocolate Milkshake", price: 180, category: "Food", subcategory: "Juices & Shakes", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
      { name: "Strawberry Cream Shake (Chilled)", price: 170, category: "Food", subcategory: "Juices & Shakes", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400" },
      { name: "Fresh Mango Pulp Smoothie", price: 160, category: "Food", subcategory: "Juices & Shakes", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400" },
      { name: "Mint Lime Mojito Splash", price: 110, category: "Food", subcategory: "Juices & Shakes", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400" },
      { name: "Special Shahi Badam Shorbot", price: 130, category: "Food", subcategory: "Juices & Shakes", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400" },
      { name: "Sweet Yogurt Lassi with Malai", price: 100, category: "Food", subcategory: "Juices & Shakes", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400" },
      { name: "Cold Pressed Orange Juice", price: 140, category: "Food", subcategory: "Juices & Shakes", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400" },
      { name: "Blue Lagoon Sparkling Soda", price: 120, category: "Food", subcategory: "Juices & Shakes", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400" },
      { name: "Vanilla Bean Classic Milkshake", price: 150, category: "Food", subcategory: "Juices & Shakes", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
      { name: "Fresh Green Coconut Water", price: 90, category: "Food", subcategory: "Juices & Shakes", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400" },

      // Subcat 9: Tea & Coffee
      { name: "Star Signature Matka Milk Tea", price: 35, category: "Food", subcategory: "Tea & Coffee", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
      { name: "Espresso Roasted Hot Coffee", price: 90, category: "Food", subcategory: "Tea & Coffee", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
      { name: "Frothy Cold Coffee with Ice Cream", price: 140, category: "Food", subcategory: "Tea & Coffee", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400" },
      { name: "Masala Chai with Cardamom & Ginger", price: 45, category: "Food", subcategory: "Tea & Coffee", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
      { name: "Cafe Caramel Macchiato", price: 160, category: "Food", subcategory: "Tea & Coffee", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
      { name: "Dark Chocolate Mocha Coffee", price: 150, category: "Food", subcategory: "Tea & Coffee", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400" },
      { name: "Green Tea Organic Leaves Cup", price: 50, category: "Food", subcategory: "Tea & Coffee", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
      { name: "Iced Peach Black Tea", price: 110, category: "Food", subcategory: "Tea & Coffee", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400" },
      { name: "Creamy Cappuccino with Cocoa", price: 130, category: "Food", subcategory: "Tea & Coffee", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
      { name: "Kashmiri Kahwa Saffron Tea", price: 70, category: "Food", subcategory: "Tea & Coffee", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },

      // Subcat 10: Rolls & Street Food
      { name: "Double Egg Chicken Kathi Roll", price: 140, category: "Food", subcategory: "Rolls & Street Food", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400" },
      { name: "Spicy Beef Bhuna Paratha Roll", price: 160, category: "Food", subcategory: "Rolls & Street Food", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400" },
      { name: "Crispy Paneer Tikka Veg Roll", price: 120, category: "Food", subcategory: "Rolls & Street Food", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400" },
      { name: "Crispy Beef Keema Samucha (4 pcs)", price: 100, category: "Food", subcategory: "Rolls & Street Food", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
      { name: "Chicken Singara Triangle (4 pcs)", price: 80, category: "Food", subcategory: "Rolls & Street Food", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
      { name: "Spicy Fuchka Platter with Tok (10 pcs)", price: 90, category: "Food", subcategory: "Rolls & Street Food", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
      { name: "Dahi Fuchka Chaat Platter", price: 130, category: "Food", subcategory: "Rolls & Street Food", storeName: "Kasturi Kitchen", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
      { name: "Crispy Fried Spring Roll (4 pcs)", price: 120, category: "Food", subcategory: "Rolls & Street Food", storeName: "Chillox", imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=400" },
      { name: "Chicken Shami Kebab Bun Roll", price: 150, category: "Food", subcategory: "Rolls & Street Food", storeName: "Star Kabab & Restaurant", imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400" },
      { name: "Potato Twister Spiral Stick", price: 70, category: "Food", subcategory: "Rolls & Street Food", storeName: "Takeout Burgers", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },

      // ==========================================
      // 2. FASHION (10 Subcategories x 10 Items = 100 Items)
      // ==========================================
      // Subcat 1: Men's Casual Shirts
      { name: "Slim Fit Oxford Cotton Shirt (Blue)", price: 890, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
      { name: "Checkered Cotton Casual Shirt (Red)", price: 790, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
      { name: "White Linen Breathable Summer Shirt", price: 990, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
      { name: "Black Mandarin Collar Casual Shirt", price: 850, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
      { name: "Denim Washed Button-Down Shirt", price: 1100, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
      { name: "Striped Olive Green Casual Shirt", price: 780, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
      { name: "Printed Hawaiian Beach Vacation Shirt", price: 690, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
      { name: "Navy Blue Formal Cotton Shirt", price: 950, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },
      { name: "Khaki Utility Dual Pocket Shirt", price: 890, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
      { name: "Charcoal Grey Slim Office Shirt", price: 920, category: "Fashion", subcategory: "Men's Casual Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400" },

      // Subcat 2: Men's T-Shirts
      { name: "Solid Navy Cotton Polo T-Shirt", price: 550, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400" },
      { name: "Pure Cotton Crew Neck Black T-Shirt", price: 380, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" },
      { name: "White Minimalist Graphic Print Tee", price: 420, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" },
      { name: "Olive Green Muscle Fit T-Shirt", price: 460, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400" },
      { name: "Vintage Oversized Drop Shoulder Tee", price: 520, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" },
      { name: "Maroon Striped Collar Polo T-Shirt", price: 580, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400" },
      { name: "Heather Grey Breathable Gym Tee", price: 390, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" },
      { name: "Henley Button Neck Cotton T-Shirt", price: 490, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400" },
      { name: "Typography Urban Streetwear Tee", price: 450, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" },
      { name: "Pack of 3 Essential Cotton T-Shirts", price: 999, category: "Fashion", subcategory: "Men's T-Shirts", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400" },

      // Subcat 3: Men's Jeans & Trousers
      { name: "Stretch Denim Slim Fit Jeans (Navy)", price: 1250, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400" },
      { name: "Jet Black Narrow Cut Denim Jeans", price: 1350, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400" },
      { name: "Khaki Cotton Chino Trousers", price: 1100, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400" },
      { name: "Olive Green Tactical Cargo Pants", price: 1450, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400" },
      { name: "Formal Charcoal Grey Office Trousers", price: 1150, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400" },
      { name: "Ripped Light Blue Casual Jeans", price: 1390, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400" },
      { name: "Beige Comfort Cotton Chinos", price: 1050, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400" },
      { name: "Men's Fleece Winter Joggers Pants", price: 650, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400" },
      { name: "Dark Grey Straight Fit Denim", price: 1200, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=400" },
      { name: "Cotton Casual Drawstring Trackpant", price: 580, category: "Fashion", subcategory: "Men's Jeans & Trousers", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400" },

      // Subcat 4: Women's Sarees & Kurtis
      { name: "Handcrafted Cotton Designer Kurti", price: 1150, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
      { name: "Traditional Silk Saree with Zari Border", price: 2850, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
      { name: "Dhakai Jamdani Pure Cotton Saree", price: 3450, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
      { name: "Embroidered Anarkali Kurti Suit", price: 1850, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400" },
      { name: "Chiffon Printed Floral Saree", price: 1650, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
      { name: "A-Line Rayon Casual Kurti (Maroon)", price: 890, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400" },
      { name: "Georgette Party Wear Saree with Blouse", price: 2250, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
      { name: "Block Print Cotton Kurti with Pants", price: 1450, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400" },
      { name: "Linen Saree with Tassel Pallu", price: 1950, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400" },
      { name: "Long Front-Slit Designer Tunic", price: 950, category: "Fashion", subcategory: "Women's Sarees & Kurtis", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400" },

      // Subcat 5: Women's Western Dresses
      { name: "Floral Print Tiered Maxi Dress", price: 1350, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },
      { name: "Classic Little Black Party Dress", price: 1490, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },
      { name: "Casual Striped Cotton Midi Dress", price: 980, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },
      { name: "Denim Buttoned Shirt Dress", price: 1650, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },
      { name: "Pleated Elegant Evening Gown", price: 2450, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },
      { name: "Boho Smocked Waist Summer Frock", price: 1100, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },
      { name: "Polka Dot Wrap Front Dress", price: 1250, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },
      { name: "Women's High Rise Skinny Jeans", price: 1290, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400" },
      { name: "Ruffled Hem Floral Sundress", price: 1050, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },
      { name: "Satin Silk Slip Cocktail Dress", price: 1850, category: "Fashion", subcategory: "Women's Western Dresses", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400" },

      // Subcat 6: Winter Wear & Jackets
      { name: "Men's Black Leather Biker Jacket", price: 2950, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400" },
      { name: "Heavyweight Fleece Hooded Sweatshirt", price: 850, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400" },
      { name: "Quilted Puffer Warm Winter Jacket", price: 2150, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=400" },
      { name: "Women's Woolen Long Trench Coat", price: 2750, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=400" },
      { name: "Denim Sherpa Collar Winter Jacket", price: 2350, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400" },
      { name: "Knitted Cashmere Blend Cardigan", price: 1250, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400" },
      { name: "Windproof Sports Track Jacket", price: 950, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400" },
      { name: "Unisex Pullover Knit Sweater", price: 790, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400" },
      { name: "Thermal Innerwear Warm Set", price: 650, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400" },
      { name: "Woolen Muffler & Winter Beanie Hat", price: 380, category: "Fashion", subcategory: "Winter Wear & Jackets", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=400" },

      // Subcat 7: Footwear & Sneakers
      { name: "Classic White Minimal Sneaker Shoes", price: 1450, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400" },
      { name: "Breathable Mesh Running Shoes", price: 1650, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
      { name: "High Top Chunky Streetwear Sneakers", price: 1850, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400" },
      { name: "Slip-on Canvas Everyday Loafers", price: 950, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400" },
      { name: "Women's Block Heel Ankle Strap Sandals", price: 1350, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400" },
      { name: "Traditional Kolhapuri Leather Chappal", price: 650, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400" },
      { name: "Lightweight Cushion Gym Trainers", price: 1550, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
      { name: "Comfort Memory Foam Slides (Navy)", price: 450, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400" },
      { name: "Women's Pointed Toe Ballet Flats", price: 990, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400" },
      { name: "Waterproof Hiking All-Terrain Boots", price: 2650, category: "Fashion", subcategory: "Footwear & Sneakers", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },

      // Subcat 8: Formal Leather Shoes
      { name: "Oxford Leather Lace-up Formal Shoes", price: 2150, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Classic Italian Leather Penny Loafers", price: 1950, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Double Monk Strap Formal Shoes", price: 2450, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Brown Derby Brogue Leather Shoes", price: 2250, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Chelsea Leather Ankle Formal Boots", price: 2750, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Black Shiny Tuxedo Patent Shoes", price: 2350, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Handmade Suede Tassel Loafers", price: 1850, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Formal Slip-on Leather Office Shoes", price: 1650, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Genuine Leather Shoe Care Wax Kit", price: 290, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },
      { name: "Formal Wingtip Tan Leather Brogues", price: 2550, category: "Fashion", subcategory: "Formal Leather Shoes", storeName: "Bata & Urban Steps", imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400" },

      // Subcat 9: Bags & Backpacks
      { name: "Water Resistant Laptop Backpack 15.6\"", price: 1250, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
      { name: "Women's Structured Leather Tote Bag", price: 1650, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400" },
      { name: "Vintage Canvas Travel Duffle Bag", price: 1450, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
      { name: "Crossbody Casual Chest Sling Bag", price: 650, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
      { name: "Women's Quilted Evening Clutch Purse", price: 890, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400" },
      { name: "Executive Leather Office Briefcase", price: 2450, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
      { name: "College Student Multi-pocket Backpack", price: 950, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
      { name: "Anti-Theft USB Charging Travel Bag", price: 1550, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
      { name: "Canvas Reusable Shopping Shoulder Bag", price: 250, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400" },
      { name: "Waterproof Gym Cylinder Sports Bag", price: 790, category: "Fashion", subcategory: "Bags & Backpacks", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },

      // Subcat 10: Watches & Accessories
      { name: "Chronograph Quartz Metal Watch (Black)", price: 1850, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400" },
      { name: "Genuine Full Grain Leather Men's Belt", price: 650, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400" },
      { name: "Classic Bifold RFID Leather Wallet", price: 590, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400" },
      { name: "Polarized UV400 Wayfarer Sunglasses", price: 750, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400" },
      { name: "Aviator Classic Metal Frame Sunglasses", price: 850, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400" },
      { name: "Women's Rose Gold Magnetic Watch", price: 1450, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Aarong Boutique", imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400" },
      { name: "Stainless Steel Cufflinks & Tie Pin Set", price: 490, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400" },
      { name: "Braided Leather Magnetic Bracelet", price: 350, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400" },
      { name: "Unisex Cotton Baseball Cap (Black)", price: 290, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400" },
      { name: "Minimalist Slim Cardholder Wallet", price: 380, category: "Fashion", subcategory: "Watches & Accessories", storeName: "Apex & Trendz", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400" },

      // ==========================================
      // 3. MEDICINE (10 Subcategories x 10 Items = 100 Items)
      // ==========================================
      // Subcat 1: Fever & Pain Relief
      { name: "Napa Extra 500mg (10 Strips Pack)", price: 250, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Ace Plus Paracetamol + Caffeine Strip", price: 30, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Fast Relief Pain Balm Ointment (50g)", price: 120, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Voltral Emulgel Pain Relief Gel (50g)", price: 190, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Brufen 400mg Ibuprofen (Strip)", price: 40, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Moov Instant Joint Pain Spray (80g)", price: 280, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Napa Suspension Baby Fever Drops", price: 45, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Disprin Water Soluble Tablets Strip", price: 25, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Cold & Hot Compression Gel Pad", price: 220, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Herbal Headache Inhaler Stick", price: 70, category: "Medicine", subcategory: "Fever & Pain Relief", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },

      // Subcat 2: Gastric & Digestion
      { name: "Seclo 20mg Omeprazole (Strip)", price: 60, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Sergel 20mg Esomeprazole (Strip)", price: 70, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Antacid Mint Chewable Tablets Strip", price: 25, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Eno Fast Relief Lemon Sachet (Pack 6)", price: 90, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Gaviscon Double Action Liquid 200ml", price: 340, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Entacyd Liquid Antacid Syrup 200ml", price: 95, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Pudin Hara Liquid Pearl Drops", price: 60, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Digene Chewable Heartburn Tablets", price: 35, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Oral Saline ORS Pack (10 Sachets)", price: 60, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Isabgol Pure Husk Digestive Powder 100g", price: 160, category: "Medicine", subcategory: "Gastric & Digestion", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },

      // Subcat 3: Cough Cold & Allergy
      { name: "Tofen 1mg Ketotifen Cough Syrup", price: 75, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Fexo 120mg Fexofenadine Allergy Strip", price: 90, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Alatrol 10mg Cetirizine (Strip)", price: 35, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Vicks VapoRub Chest Relief (50g)", price: 180, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Adryll Dry Cough Syrup 100ml", price: 85, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Strepsils Honey & Lemon Lozenges (8 pcs)", price: 65, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Otrivin 0.1% Adult Nasal Drops", price: 60, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Steam Inhaler Vaporizer Capsule Box", price: 110, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Koflet Ayurvedic Cough Syrup 100ml", price: 115, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Montene 10mg Montelukast Strip", price: 160, category: "Medicine", subcategory: "Cough Cold & Allergy", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },

      // Subcat 4: First Aid & Antiseptics
      { name: "Savlon Antiseptic Disinfectant 250ml", price: 85, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Dettol Antiseptic Liquid 500ml", price: 210, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Waterproof Adhesive Bandages (Box 50)", price: 120, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Sterile Absorbent Gauze Bandage Roll", price: 35, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Povidone Iodine Antiseptic Ointment 20g", price: 65, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Micropore Medical Tape (1 Inch)", price: 45, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Cotton Wool Pure Roll (100g)", price: 55, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Burn Cream Silver Sulfadiazine (25g)", price: 75, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Hydrogen Peroxide Antiseptic 100ml", price: 40, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Emergency Household First Aid Box Kit", price: 450, category: "Medicine", subcategory: "First Aid & Antiseptics", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },

      // Subcat 5: Vitamins & Minerals
      { name: "Vitamin C Chewable 500mg (30 Tabs)", price: 120, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=400" },
      { name: "B-50 Fortified Vitamin B-Complex Strip", price: 65, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=400" },
      { name: "Calcium 500mg + Vitamin D3 (Bottle 30)", price: 240, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400" },
      { name: "Zinc 20mg Dispersible Immunity Tabs", price: 50, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=400" },
      { name: "Vitamin E 400IU Antioxidant Softgels", price: 180, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=400" },
      { name: "Omega 3 Deep Sea Fish Oil (60 Capsules)", price: 490, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400" },
      { name: "Folic Acid + Iron Blood Health Strip", price: 55, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=400" },
      { name: "Multivitamin Daily Energy Tonic 200ml", price: 175, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=400" },
      { name: "Cod Liver Oil Rich in Vitamin A & D", price: 220, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400" },
      { name: "Effervescent Vitamin C Immune Drink 10s", price: 210, category: "Medicine", subcategory: "Vitamins & Minerals", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=400" },

      // Subcat 6: Diabetes & Blood Pressure
      { name: "Accu-Chek Instant Blood Glucose Meter", price: 1450, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Accu-Chek Test Strips Pack (25 Strips)", price: 750, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Digital Automatic BP Monitor (Arm)", price: 1850, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Alcohol Prep Swabs Box (100 pcs)", price: 140, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Insulin Syringes 31G Ultra Fine (Pack 10)", price: 150, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Zero Calorie Sugar Substitute Tablets", price: 130, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400" },
      { name: "Diabetes Foot Care Moisturizing Cream", price: 240, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Sterile Blood Lancets (Pack 50)", price: 120, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Manual Sphygmomanometer with Stethoscope", price: 950, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Sugar Free Protein Powder 400g", price: 680, category: "Medicine", subcategory: "Diabetes & Blood Pressure", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400" },

      // Subcat 7: Baby Care Essentials
      { name: "Huggies Diaper Pant L-Size (34 Pack)", price: 950, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400" },
      { name: "Gentle Pure Water Baby Wipes (80s)", price: 160, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400" },
      { name: "Zinc Oxide Baby Diaper Rash Cream", price: 210, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Baby Pure Nourishing Body Oil 200ml", price: 260, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400" },
      { name: "Tear-Free Baby Head-to-Toe Wash 250ml", price: 290, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400" },
      { name: "Baby Teething Cooling Ring Gum Soother", price: 150, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400" },
      { name: "Anti-Colic Baby Feeding Bottle 240ml", price: 340, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400" },
      { name: "Baby Nasal Aspirator Mucus Sucker", price: 180, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Gentle Baby Moisturizing Lotion 200ml", price: 280, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Gripe Water Instant Colic Relief 150ml", price: 120, category: "Medicine", subcategory: "Baby Care Essentials", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400" },

      // Subcat 8: Skin & Hair Care
      { name: "Moisturizing Ceramide Cream (100g)", price: 380, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Broad Spectrum SPF 50+ Sunscreen (50ml)", price: 450, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Anti-Dandruff Ketoconazole Shampoo 100ml", price: 190, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Hydrocortisone 1% Anti-Itch Cream 15g", price: 65, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Pure Petroleum Jelly Skin Protectant 100g", price: 110, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Aloe Vera 99% Soothing Hydration Gel", price: 180, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Antifungal Clotrimazole Dusting Powder", price: 120, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Salicylic Acid 2% Acne Cleanser 150ml", price: 340, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Hair Growth Biotin Strengthener Serum", price: 420, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },
      { name: "Intense Lip Balm with Shea Butter", price: 90, category: "Medicine", subcategory: "Skin & Hair Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400" },

      // Subcat 9: Medical Equipment & Devices
      { name: "Digital Fast Read Oral Thermometer", price: 180, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Fingertip Pulse Oximeter Oxygen SpO2", price: 790, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Mesh Handheld Portable Nebulizer Kit", price: 1450, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Hot Water Bag Leakproof Rubber", price: 210, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Adjustable Cervical Neck Collar Brace", price: 350, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Elastic Knee Support Brace (Pair)", price: 280, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Lumbo Sacral Back Support Belt", price: 650, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Infrared Forehead Non-Contact Thermometer", price: 950, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },
      { name: "Latex Examination Gloves Box (100 pcs)", price: 420, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Lightweight Folding Walking Stick", price: 390, category: "Medicine", subcategory: "Medical Equipment & Devices", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400" },

      // Subcat 10: Eye & Dental Care
      { name: "Lubricating Eye Drops for Dry Eyes", price: 140, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Antibacterial Contact Lens Solution 120ml", price: 250, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Medicated Sensitivity Relief Toothpaste 100g", price: 180, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=400" },
      { name: "Chlorhexidine Antiseptic Mouthwash 250ml", price: 120, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=400" },
      { name: "Dental Floss Waxed Mint Thread (50m)", price: 90, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=400" },
      { name: "Clove Oil Instant Toothache Drops 10ml", price: 60, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Ultra Soft Gum Care Toothbrush (Pack 3)", price: 110, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=400" },
      { name: "Eye Wash Cup & Sterile Saline Solution", price: 130, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Mouth Ulcer Anesthetic Relief Gel 15g", price: 85, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "Lazz Pharma", imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400" },
      { name: "Denture Cleansing Antibacterial Tabs 30s", price: 220, category: "Medicine", subcategory: "Eye & Dental Care", storeName: "MediQuick Pharmacy", imageUrl: "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=400" },

      // ==========================================
      // 4. GROCERY (10 Subcategories x 10 Items = 100 Items)
      // ==========================================
      // Subcat 1: Rice Dal & Flour
      { name: "Deshi Miniket Premium Rice (5kg Bag)", price: 420, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Nazirshail Polished Rice (5kg Bag)", price: 460, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Chinigura Aromatic Polao Rice (1kg)", price: 145, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Deshi Red Masoor Dal (1kg Pack)", price: 140, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Yellow Moong Dal Split (1kg)", price: 160, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Whole Grain Wheat Atta (2kg Pack)", price: 130, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
      { name: "Refined White All-Purpose Maida (1kg)", price: 75, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
      { name: "Semolina Sooji Fine Grain (500g)", price: 45, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
      { name: "Brown Chickpeas Chola Boot (1kg)", price: 110, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Kataribhog Fine Basmati Rice (5kg)", price: 490, category: "Grocery", subcategory: "Rice Dal & Flour", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },

      // Subcat 2: Cooking Oil & Ghee
      { name: "Pure Refined Soybean Oil (2L Bottle)", price: 370, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Mustard Oil Pure Deshi Ghani (500ml)", price: 175, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Pure Cow Milk Danadar Ghee (400g)", price: 490, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Refined Soybean Cooking Oil (5L Can)", price: 890, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Extra Virgin Olive Oil Cooking (500ml)", price: 680, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Sunflower Heart Healthy Oil (2L)", price: 420, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Cold Pressed Coconut Edible Oil (250ml)", price: 190, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Rice Bran Low Cholesterol Oil (2L)", price: 395, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Pure Village Buffalo Ghee (250g Jar)", price: 340, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
      { name: "Deshi Kachi Ghani Mustard Oil (1 Liter)", price: 310, category: "Grocery", subcategory: "Cooking Oil & Ghee", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },

      // Subcat 3: Spices & Masala
      { name: "Pure Turmeric Haldi Powder (200g)", price: 75, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Fiery Red Chili Morich Powder (200g)", price: 85, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Coriander Dhonia Pure Powder (200g)", price: 65, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Cumin Jeera Powder Roasted (100g)", price: 80, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Radhuni Special Biryani Masala Box", price: 65, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Meat Curry All-in-One Masala (100g)", price: 55, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Whole Cardamom Elaichi Green (50g)", price: 160, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Cinnamon Dalchini Sticks (100g)", price: 90, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Black Pepper Golmorich Whole (100g)", price: 110, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },
      { name: "Garam Masala Aromatic Powder (100g)", price: 95, category: "Grocery", subcategory: "Spices & Masala", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" },

      // Subcat 4: Dairy Milk & Eggs
      { name: "Farm Fresh Brown Eggs (1 Dozen)", price: 155, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400" },
      { name: "Pasteurized Liquid Fresh Milk (1 Liter)", price: 95, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
      { name: "Table Salted Butter Block (200g)", price: 160, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400" },
      { name: "Plain Natural Sour Curd Tok Doi (500g)", price: 110, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
      { name: "Fresh Cow Milk Paneer Block (200g)", price: 140, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400" },
      { name: "Full Cream Milk Powder (500g Pouch)", price: 420, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
      { name: "Sweetened Condensed Milk Can (397g)", price: 145, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },
      { name: "Mozzarella Grated Pizza Cheese (200g)", price: 210, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400" },
      { name: "Cheddar Processed Cheese Slices (10s)", price: 190, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400" },
      { name: "Fresh White Duck Eggs (1 Dozen)", price: 185, category: "Grocery", subcategory: "Dairy Milk & Eggs", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400" },

      // Subcat 5: Fresh Vegetables & Potatoes
      { name: "Fresh Diamond Potatoes (1kg)", price: 35, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400" },
      { name: "Deshi Red Onions (1kg Pack)", price: 75, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=400" },
      { name: "Deshi Small Garlic Rosun (500g)", price: 120, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400" },
      { name: "Fresh Ginger Ada Cleaned (250g)", price: 65, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400" },
      { name: "Crispy Spicy Green Chilis (250g)", price: 50, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1526346698789-224a733ed41d?w=400" },
      { name: "Ripe Red Farm Tomatoes (1kg)", price: 60, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400" },
      { name: "Crunchy Green Cucumbers (1kg)", price: 45, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400" },
      { name: "Fresh Eggplant Brinjal Begun (1kg)", price: 55, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400" },
      { name: "Fresh Green Coriander Leaves Bunch", price: 30, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1526346698789-224a733ed41d?w=400" },
      { name: "Scented Gondhoraj Lebu Lemon (4 pcs)", price: 40, category: "Grocery", subcategory: "Fresh Vegetables & Potatoes", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1526346698789-224a733ed41d?w=400" },

      // Subcat 6: Breakfast & Cereals
      { name: "Kellogg's Corn Flakes Original (475g)", price: 320, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400" },
      { name: "Whole Grain Rolled Oats (500g Jar)", price: 240, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400" },
      { name: "Maggi 2-Minute Masala Noodles (8 Pack)", price: 190, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" },
      { name: "White Sliced Sandwich Bread (Large)", price: 65, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
      { name: "Mixed Fruit Sweet Breakfast Jam (500g)", price: 165, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" },
      { name: "Creamy Peanut Butter Spread (350g)", price: 290, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" },
      { name: "Chocolate Chocos Breakfast Cereal 375g", price: 280, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=400" },
      { name: "Instant Semai Vermicelli (200g Pack)", price: 40, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" },
      { name: "Egg Mayonnaise Sandwich Spread 250g", price: 140, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" },
      { name: "Pure Sundarban Honey Natural (250g)", price: 220, category: "Grocery", subcategory: "Breakfast & Cereals", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400" },

      // Subcat 7: Tea Coffee & Sugar
      { name: "Ispahani Mirzapore Best Leaf Tea (400g)", price: 260, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
      { name: "Nescafe Classic Instant Coffee Jar (100g)", price: 340, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
      { name: "Refined White Table Sugar (1kg Pack)", price: 135, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Deshi Red Brown Cane Sugar (1kg)", price: 150, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Iodized Pure Vacuum Salt (1kg Pack)", price: 42, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
      { name: "Taaza Black Tea Bags Box (50 Bags)", price: 160, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
      { name: "Green Tea Pure Mint Bags (25 Pack)", price: 140, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400" },
      { name: "Horlicks Health Nutrition Drink 500g", price: 380, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
      { name: "Nestle Coffee Mate Creamer Jar 400g", price: 390, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400" },
      { name: "Pure Himalayan Pink Crystal Salt (500g)", price: 95, category: "Grocery", subcategory: "Tea Coffee & Sugar", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },

      // Subcat 8: Snacks & Biscuits
      { name: "Lays Potato Chips Spanish Tomato (100g)", price: 60, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
      { name: "Kurkure Masala Munch Crunchy (80g)", price: 40, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
      { name: "Oreo Vanilla Cream Biscuit (120g)", price: 45, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
      { name: "Lexi Butter Crackers Salted (200g)", price: 65, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
      { name: "Bombay Sweets Chanachur Spicy (300g)", price: 90, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
      { name: "KitKat 4 Finger Chocolate Bar", price: 60, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400" },
      { name: "Cadbury Dairy Milk Silk Chocolate (150g)", price: 210, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400" },
      { name: "Potato Crackers Original Pack of 4", price: 50, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
      { name: "Digestive High Fiber Biscuits 250g", price: 80, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },
      { name: "Doritos Nacho Cheese Tortilla Chips", price: 85, category: "Grocery", subcategory: "Snacks & Biscuits", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400" },

      // Subcat 9: Soft Drinks & Beverages
      { name: "Coca-Cola Original Taste (1.5 Liter)", price: 95, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
      { name: "Sprite Lemon-Lime Refresh (1.5 Liter)", price: 95, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
      { name: "Kinley Mineral Drinking Water (2 Liter)", price: 35, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400" },
      { name: "Pran Frooto Mango Fruit Drink 1 Liter", price: 80, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400" },
      { name: "Mountain Dew Citrus Energy 1 Liter", price: 75, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
      { name: "Red Bull Energy Drink Can (250ml)", price: 180, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
      { name: "Fanta Orange Sparkling Drink (1.5L)", price: 95, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
      { name: "7UP Refreshing Crisp Soda (1 Liter)", price: 70, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },
      { name: "Tang Instant Orange Powder Jar (500g)", price: 340, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400" },
      { name: "Tonic Water Sparkling Can (330ml)", price: 65, category: "Grocery", subcategory: "Soft Drinks & Beverages", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400" },

      // Subcat 10: Cleaning & Household
      { name: "Wheel 2-in-1 Clean Washing Powder 1kg", price: 145, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400" },
      { name: "Vim Dishwash Liquid Gel Bottle (500ml)", price: 125, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400" },
      { name: "Harpic Power Plus Toilet Cleaner 750ml", price: 175, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400" },
      { name: "Lizol Disinfectant Floor Cleaner 500ml", price: 160, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400" },
      { name: "Dettol Antiseptic Bathing Soap (Pack 3)", price: 180, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Head & Shoulders Anti-Dandruff 340ml", price: 390, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400" },
      { name: "Good Knight Mosquito Vaporizer Refill", price: 110, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400" },
      { name: "Bashundhara Facial Tissue Box (2 Ply)", price: 65, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400" },
      { name: "Scotch-Brite Heavy Scrub Pad (Pack 3)", price: 45, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400" },
      { name: "Odonil Room Air Freshener Block (50g)", price: 70, category: "Grocery", subcategory: "Cleaning & Household", storeName: "Kwiky SuperMart", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400" }
    ];

    await Item.deleteMany({});
    await Item.insertMany(fullCatalog);

    res.send(`
      <div style="font-family:sans-serif; text-align:center; padding-top:40px; line-height:1.6;">
        <h1 style="color:#27ae60;">SUCCESS! Database Fully Seeded!</h1>
        <h2>Total 400 Items loaded across 40 Subcategories!</h2>
        <p>100 Food Items • 100 Fashion Items • 100 Medicines • 100 Groceries</p>
        <p><a href="/" style="display:inline-block; margin-top:15px; padding:12px 25px; background:#fc8019; color:white; text-decoration:none; border-radius:8px; font-weight:bold;">Go to Storefront</a></p>
      </div>
    `);
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
