const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('>>> MongoDB Cloud Database Connected Successfully! <<<'))
  .catch((err) => console.error('Database connection failed:', err.message));

// Order Schema & Model
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  village: { type: String, required: true },
  items: Array,
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Initial Stores Data
const stores = [
  {
    id: '1',
    name: 'Tala Central Pharmacy',
    category: 'Pharmacy & Healthcare',
    area: 'Tala Bazar',
    products: [
      { name: 'Napa Extra (1 Strip)', price: 30 },
      { name: 'Saviton Antiseptic (100ml)', price: 65 },
      { name: 'Gastric Capsule (Omeprazole)', price: 70 }
    ]
  },
  {
    id: '2',
    name: 'Patkelghata Ghosh Dairy',
    category: 'Sweets & Fresh Curd',
    area: 'Patkelghata',
    products: [
      { name: 'Special Rosogolla (1 Kg)', price: 280 },
      { name: 'Sweet Curd / Mishti Doi (1 Kg)', price: 260 },
      { name: 'Pure Cow Ghee (250g)', price: 320 }
    ]
  },
  {
    id: '3',
    name: 'Biswas Variety Store',
    category: 'Daily Grocery & Staples',
    area: 'Kathbunia Mor',
    products: [
      { name: 'Miniket Rice (5 Kg)', price: 360 },
      { name: 'Soyabean Oil (1 Litre)', price: 175 },
      { name: 'Sugar (1 Kg)', price: 135 }
    ]
  }
];

// GET Stores
app.get('/api/stores', (req, res) => {
  res.json({ success: true, data: stores });
});

// POST New Order to MongoDB
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, village, items, totalAmount } = req.body;
    const orderId = 'TALA-' + Math.floor(1000 + Math.random() * 9000);

    const newOrder = new Order({
      orderId,
      customerName,
      phone,
      village,
      items,
      totalAmount
    });

    await newOrder.save();

    console.log(`[SAVED TO MONGODB]: Order ${orderId} by ${customerName}`);
    res.status(201).json({ success: true, orderId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET All Orders from MongoDB
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});