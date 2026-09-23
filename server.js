const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster0.abcde.mongodb.net/kwiky?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');
  await seedDatabaseWithAgeAndMg();
})
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Updated Schema with Strength (mg) and Age Group
const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  strength: { type: String, required: true },     // e.g., "500mg", "650mg", "40mg/5ml"
  ageGroup: { type: String, required: true },      // e.g., "Adult", "Pediatric (Children)", "All Age Groups"
  uses: { type: String, required: true },
  sideEffects: { type: String, required: true },
  dosage: { type: String, required: true },
  manufacturer: { type: String, required: true },
  prescriptionRequired: { type: Boolean, default: true }
});

const Medicine = mongoose.model('Medicine', medicineSchema);

async function seedDatabaseWithAgeAndMg() {
  try {
    const count = await Medicine.countDocuments();
    if (count < 5) {
      const advancedMedicines = [
        {
          name: 'Dolo 650mg Tablet',
          genericName: 'Paracetamol',
          brand: 'Dolo 650 / Calpol',
          category: 'Pain & Fever',
          subCategory: 'Antipyretics',
          strength: '650mg',
          ageGroup: 'Adult (Above 12 Years)',
          uses: 'High fever, body ache, headache, and viral flu symptoms.',
          sideEffects: 'Rare; excessive dosage can cause liver toxicity.',
          dosage: '1 tablet every 6 hours as needed.',
          manufacturer: 'Micro Labs Ltd',
          prescriptionRequired: false
        },
        {
          name: 'Calpol 250mg Suspension',
          genericName: 'Paracetamol Pediatric Syrup',
          brand: 'Calpol Paediatric Drops / Syrup',
          category: 'Pain & Fever',
          subCategory: 'Pediatric Antipyretics',
          strength: '250mg/5ml',
          ageGroup: 'Pediatric (1 to 12 Years)',
          uses: 'Fever and pain relief in infants and children.',
          sideEffects: 'Mild allergic reactions (rare).',
          dosage: 'Based on body weight (10-15 mg/kg per dose) every 6 hours under pediatric guidance.',
          manufacturer: 'GSK India',
          prescriptionRequired: false
        },
        {
          name: 'Augmentin 625 Duo',
          genericName: 'Amoxicillin & Potassium Clavulanate',
          brand: 'Augmentin / Moxikind-CV',
          category: 'Antibiotics',
          subCategory: 'Penicillins',
          strength: '625mg',
          ageGroup: 'Adult & Teens (Above 12 Years)',
          uses: 'Bacterial infections of respiratory tract, lungs, and sinus.',
          sideEffects: 'Diarrhea, nausea, skin rash.',
          dosage: '1 tablet every 12 hours for 5-7 days.',
          manufacturer: 'GSK India',
          prescriptionRequired: true
        },
        {
          name: 'Pantocid 40mg Tablet',
          genericName: 'Pantoprazole',
          brand: 'Pantocid / Pan-40',
          category: 'Gastrointestinal',
          subCategory: 'Proton Pump Inhibitors',
          strength: '40mg',
          ageGroup: 'Adult',
          uses: 'Acid reflux, GERD, heartburn, and peptic ulcers.',
          sideEffects: 'Headache, diarrhea, flatulence.',
          dosage: '1 tablet daily in the morning before breakfast.',
          manufacturer: 'Sun Pharma',
          prescriptionRequired: true
        }
      ];
      await Medicine.insertMany(advancedMedicines);
      console.log('✨ Database Seeded with Strength & Age Group Data!');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

// API Routes
app.get('/api/medicines', async (req, res) => {
  try {
    const { search = '', category = '', ageGroup = '' } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search,$options: 'i' } },
        { genericName: { $regex: search,$options: 'i' } },
        { brand: { $regex: search,$options: 'i' } },
        { strength: { $regex: search,$options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (ageGroup) query.ageGroup = { $regex: ageGroup,$options: 'i' };

    const medicines = await Medicine.find(query);
    res.json({ success: true, medicines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Medicine.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/medicines', async (req, res) => {
  try {
    const newMed = new Medicine(req.body);
    await newMed.save();
    res.json({ success: true, medicine: newMed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});