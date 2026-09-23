require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB Connected for Kwiky'))
    .catch(err => console.log('MongoDB Connection Warning:', err.message));
}

// In-Memory Storage for Runtime Stability
let orders = [];
let activeRiders = {};

const itemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  subcategory: String,
  storeName: String,
  imageUrl: String
});
const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

// REST API: Public Catalog
app.get('/api/public-menu', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const items = await Item.find({}).limit(100);
      if (items.length > 0) return res.json({ catalog: items });
    }
  } catch (e) {}

  res.json({
    catalog: [
      { _id: '101', name: 'Basmati Kacchi Biryani', price: 240, category: 'Food', subcategory: 'Biryani & Polao', storeName: "Sultan's Dine", imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' },
      { _id: '102', name: 'Mutton Rezala', price: 210, category: 'Food', subcategory: 'Biryani & Polao', storeName: "Sultan's Dine", imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300' },
      { _id: '103', name: 'Gourmet Beef Burger', price: 190, category: 'Food', subcategory: 'Burgers & Sandwiches', storeName: "Takeout Burgers", imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300' },
      { _id: '104', name: 'Casual Denim Shirt', price: 580, category: 'Fashion', subcategory: "Men's Casual Shirts", storeName: "Urban Style", imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300' },
      { _id: '105', name: 'Paracetamol 500mg (Strip)', price: 35, category: 'Medicine', subcategory: 'Fever & Pain Relief', storeName: "Apollo Meds", imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300' },
      { _id: '106', name: 'Miniket Premium Rice 5kg', price: 380, category: 'Grocery', subcategory: 'Rice Dal & Flour', storeName: "Kwiky Fresh", imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300' }
    ]
  });
});

// REST API: Authentication (OTP)
app.post('/api/auth/send-otp', (req, res) => {
  res.json({ success: true, message: 'OTP sent', testOtp: '1234' });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  if (otp === '1234' || otp.length === 4) {
    return res.json({ success: true, user: { name: name || 'Customer', phone } });
  }
  res.status(400).json({ success: false, message: 'Invalid OTP' });
});

// REST API: Orders
app.get('/api/orders', (req, res) => {
  res.json({ orders });
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    _id: 'ORD' + Date.now().toString().slice(-6),
    ...req.body,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  orders.unshift(newOrder);

  // Broadcast realtime event to Admin and Riders
  io.emit('order:new', newOrder);

  res.json({ success: true, order: newOrder });
});

app.post('/api/order/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find(o => o._id === id);
  if (order) {
    order.status = status;
    io.emit('order:statusUpdate', { orderId: id, status });
    return res.json({ success: true, order });
  }
  res.status(404).json({ success: false, message: 'Order not found' });
});

app.get('/api/order/:id/track', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o._id === id);
  const distanceKm = (order && order.distanceKm) ? order.distanceKm : 1.8;
  const etaMinutes = Math.max(12, Math.round(distanceKm * 3.5));

  res.json({
    success: true,
    order: {
      orderId: id,
      distanceKm,
      etaMinutes,
      riderName: 'Hero #KW-171',
      riderPhone: '+918100002156'
    }
  });
});

// Realtime WebSocket Connections
io.on('connection', (socket) => {
  socket.on('rider:locationUpdate', (data) => {
    const { riderId, orderId, lat, lng } = data;
    activeRiders[riderId] = { lat, lng, lastSeen: Date.now() };
    io.emit(`tracking:${orderId}`, { riderId, lat, lng });
  });
});

server.listen(PORT, () => {
  console.log(`Kwiky Super Server live on port ${PORT}`);
});