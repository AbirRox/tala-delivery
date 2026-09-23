const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster0.abcde.mongodb.net/kwiky?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');
  await seedProfessionalMedicalDatabase();
})
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Professional Medicine Schema with Sub-Categories
const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },    // Main Category (e.g. Antibiotics, Pain & Fever)
  subCategory: { type: String, required: true }, // Sub-Category (e.g. Penicillins, NSAIDs, Antacids)
  uses: { type: String, required: true },
  sideEffects: { type: String, required: true },
  dosage: { type: String, required: true },
  manufacturer: { type: String, required: true },
  prescriptionRequired: { type: Boolean, default: true },
  image: { type: String, default: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600' }
});

const Medicine = mongoose.model('Medicine', medicineSchema);

// Comprehensive Professional Database Seeder
async function seedProfessionalMedicalDatabase() {
  try {
    const count = await Medicine.countDocuments();
    if (count < 10) {
      const professionalMedicines = [
        // --- 1. ANTIBIOTICS & ANTI-INFECTIVES ---
        {
          name: 'Augmentin 625 Duo',
          genericName: 'Amoxicillin & Potassium Clavulanate',
          brand: 'Augmentin / Moxikind-CV',
          category: 'Antibiotics',
          subCategory: 'Penicillins & Beta-Lactamase Inhibitors',
          uses: 'Treats severe bacterial infections of the respiratory tract, urinary tract, sinus, skin, and dental tissues.',
          sideEffects: 'Diarrhea, nausea, vomiting, skin rash, and vaginal yeast infection.',
          dosage: '1 tablet every 12 hours for 5 to 7 days strictly as prescribed by a physician.',
          manufacturer: 'GSK / Mankind Pharma',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600'
        },
        {
          name: 'Azithromycin 500mg',
          genericName: 'Azithromycin Dihydrate',
          brand: 'Azithral / Zithromax / Azimax',
          category: 'Antibiotics',
          subCategory: 'Macrolides',
          uses: 'Effective against respiratory infections, pneumonia, typhoid fever, tonsillitis, and sexually transmitted infections.',
          sideEffects: 'Stomach upset, mild diarrhea, nausea, and abdominal pain.',
          dosage: '1 tablet once daily for 3 to 5 days (Z-Pak schedule).',
          manufacturer: 'Cipla / Pfizer',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'
        },
        {
          name: 'Cefixime 200mg',
          genericName: 'Cefixime Dispersible',
          brand: 'Taxim-O / Cefspan',
          category: 'Antibiotics',
          subCategory: 'Cephalosporins (3rd Generation)',
          uses: 'Treats bronchitis, gonorrhea, urinary tract infections, and ear infections.',
          sideEffects: 'Loose stools, indigestion, headache, and mild dizziness.',
          dosage: '1 tablet twice daily for 7 days.',
          manufacturer: 'Alkem Laboratories',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600'
        },

        // --- 2. PAIN RELIEF & FEVER (ANALGESICS & NSAIDs) ---
        {
          name: 'Panadol Advance 500mg',
          genericName: 'Paracetamol / Acetaminophen',
          brand: 'Crocin 650 / Calpol / Tylenol',
          category: 'Pain & Fever',
          subCategory: 'Antipyretics & Non-Opioid Analgesics',
          uses: 'First-line treatment for reducing mild-to-moderate body pain, headaches, toothaches, and fevers.',
          sideEffects: 'Rare when used correctly; high overdose can cause severe liver damage.',
          dosage: '1 tablet every 4 to 6 hours. Maximum 4,000mg (4g) per day.',
          manufacturer: 'GSK / GlaxoSmithKline',
          prescriptionRequired: false,
          image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600'
        },
        {
          name: 'Ketorol DT 10mg',
          genericName: 'Ketorolac Tromethamine',
          brand: 'Ketorol / Acular',
          category: 'Pain & Fever',
          subCategory: 'NSAIDs (Potent)',
          uses: 'Short-term management of moderately severe acute pain, typically post-surgical pain.',
          sideEffects: 'Stomach ulcers, heartburn, drowsiness, and nausea.',
          dosage: '1 tablet dissolved in water every 6 hours as needed (not to exceed 5 days).',
          manufacturer: 'Dr. Reddy’s Laboratories',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600'
        },

        // --- 3. GASTROINTESTINAL & ANTACIDS ---
        {
          name: 'Pantocid 40mg',
          genericName: 'Pantoprazole Sodium Sesquihydrate',
          brand: 'Pantocid / Protonix / Pan-40',
          category: 'Gastrointestinal',
          subCategory: 'Proton Pump Inhibitors (PPIs)',
          uses: 'Treats acid reflux, GERD, Zollinger-Ellison syndrome, and stomach ulcers by reducing gastric acid secretion.',
          sideEffects: 'Headache, diarrhea, stomach pain, and flatulence.',
          dosage: '1 tablet daily in the morning 30 minutes before breakfast.',
          manufacturer: 'Sun Pharma',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=600'
        },
        {
          name: 'Ondem 4mg Syrup/Tablet',
          genericName: 'Ondansetron Hydrochloride',
          brand: 'Ondem / Zofran',
          category: 'Gastrointestinal',
          subCategory: 'Anti-emetics (Nausea & Vomiting)',
          uses: 'Prevents nausea and vomiting caused by chemotherapy, radiation therapy, or post-surgery recovery.',
          sideEffects: 'Constipation, headache, fatigue, and flushing.',
          dosage: '1 tablet or 5ml syrup as prescribed at the onset of nausea.',
          manufacturer: 'Alkem Laboratories',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1583912267670-6575cb47254e?w=600'
        },

        // --- 4. DIABETES & METABOLIC CARE ---
        {
          name: 'Glycomet-SR 500',
          genericName: 'Metformin Hydrochloride (Sustained Release)',
          brand: 'Glycomet / Glucophage',
          category: 'Diabetes Care',
          subCategory: 'Biguanides',
          uses: 'Controls high blood sugar levels in Type 2 Diabetes Mellitus patients by improving insulin sensitivity.',
          sideEffects: 'Mild nausea, stomach discomfort, metallic taste, and decreased vitamin B12 absorption over long-term use.',
          dosage: '1 tablet daily or twice daily with evening meals.',
          manufacturer: 'USV Private Limited',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600'
        },

        // --- 5. CARDIOVASCULAR & BLOOD PRESSURE ---
        {
          name: 'Telma 40',
          genericName: 'Telmisartan',
          brand: 'Telma / Micardis',
          category: 'Cardiovascular',
          subCategory: 'ARBs (Angiotensin II Receptor Blockers)',
          uses: 'Manages high blood pressure (hypertension) and reduces the risk of heart attacks and strokes.',
          sideEffects: 'Upper respiratory tract infections, back pain, sinus congestion, and low blood pressure dizziness.',
          dosage: '1 tablet once daily with or without food.',
          manufacturer: 'Glenmark Pharmaceuticals',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'
        },
        {
          name: 'Atorva 10mg',
          genericName: 'Atorvastatin Calcium',
          brand: 'Atorva / Lipitor',
          category: 'Cardiovascular',
          subCategory: 'Statins (Cholesterol Lowering)',
          uses: 'Lowers "bad" cholesterol (LDL) and triglycerides while increasing "good" cholesterol (HDL) to protect blood vessels.',
          sideEffects: 'Joint pain, mild muscle soreness, diarrhea, and elevated liver enzymes.',
          dosage: '1 tablet once daily, usually taken at night.',
          manufacturer: 'Zydus Cadila / Pfizer',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600'
        },

        // --- 6. RESPIRATORY & ALLERGY ---
        {
          name: 'Montair-LC',
          genericName: 'Montelukast & Levocetirizine Hydrochloride',
          brand: 'Montair-LC / Levocet-M',
          category: 'Respiratory & Allergy',
          subCategory: 'Antihistamines & Leukotriene Receptor Antagonists',
          uses: 'Relieves chronic asthma symptoms, allergic rhinitis, sneezing, runny nose, and seasonal allergy congestion.',
          sideEffects: 'Drowsiness, dry mouth, fatigue, and mild headache.',
          dosage: '1 tablet once daily at bedtime.',
          manufacturer: 'Cipla',
          prescriptionRequired: true,
          image: 'https://images.unsplash.com/photo-1583912267670-6575cb47254e?w=600'
        }
      ];

      await Medicine.insertMany(professionalMedicines);
      console.log('✨ Professional Medical Encyclopedia Database with Sub-Categories Seeded Successfully!');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

// API Endpoints
app.get('/api/medicines', async (req, res) => {
  try {
    const { search = '', category = '', subCategory = '' } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search,$options: 'i' } },
        { genericName: { $regex: search,$options: 'i' } },
        { brand: { $regex: search,$options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }
    if (subCategory) {
      query.subCategory = subCategory;
    }

    const medicines = await Medicine.find(query);
    res.json({ success: true, medicines });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Medicine.aggregate([
      {
        $group: {
          _id: "$category",
          subCategories: { $addToSet: "$subCategory" },
          count: { $sum: 1 }
        }
      }
    ]);
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
  console.log(`🚀 Professional Medical Encyclopedia Server running on port ${PORT}`);
});