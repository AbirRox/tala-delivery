const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster0.abcde.mongodb.net/kwiky?retryWrites=true&w=majority';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  uses: { type: String, required: true },
  sideEffects: { type: String, required: true },
  dosage: { type: String, required: true },
  manufacturer: { type: String, required: true },
  prescriptionRequired: { type: Boolean, default: true },
  image: { type: String, default: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600' }
});

const Medicine = mongoose.model('Medicine', medicineSchema);

const masterIndianDatabase = [
  // --- 1. PAIN RELIEF, FEVER & ANTI-INFLAMMATORY ---
  {
    name: 'Dolo 650mg Tablet',
    genericName: 'Paracetamol',
    brand: 'Dolo 650 / Calpol / Crocin',
    category: 'Pain & Fever',
    subCategory: 'Antipyretics & Analgesics',
    uses: 'Widely prescribed in India for body aches, headaches, toothaches, and reducing high fever during viral infections.',
    sideEffects: 'Rare at normal doses; excessive intake can cause severe liver damage.',
    dosage: '1 tablet every 6 hours as needed. Do not exceed 4g per day.',
    manufacturer: 'Micro Labs Ltd',
    prescriptionRequired: false
  },
  {
    name: 'Combiflam Tablet',
    genericName: 'Ibuprofen & Paracetamol',
    brand: 'Combiflam / Brufen Plus',
    category: 'Pain & Fever',
    subCategory: 'NSAIDs & Analgesics',
    uses: 'Relieves moderate pain associated with muscle sprains, joint pain, headaches, and dental pain.',
    sideEffects: 'Nausea, heartburn, stomach upset, or dizziness.',
    dosage: '1 tablet twice or thrice daily after meals.',
    manufacturer: 'Sanofi India',
    prescriptionRequired: true
  },
  {
    name: 'Zerodol-P Tablet',
    genericName: 'Aceclofenac & Paracetamol',
    brand: 'Zerodol-P / Aceclo-Plus',
    category: 'Pain & Fever',
    subCategory: 'NSAIDs',
    uses: 'Treatment of inflammatory pain, osteoarthritis, rheumatoid arthritis, and lower back pain.',
    sideEffects: 'Gastric irritation, indigestion, dizziness, and elevated liver enzymes.',
    dosage: '1 tablet twice daily after food.',
    manufacturer: 'Ipca Laboratories',
    prescriptionRequired: true
  },
  {
    name: 'Voveran 50mg Tablet',
    genericName: 'Diclofenac Sodium',
    brand: 'Voveran / Diclowin',
    category: 'Pain & Fever',
    subCategory: 'NSAIDs',
    uses: 'Reduces joint pain, swelling, and stiffness caused by arthritis and acute sports injuries.',
    sideEffects: 'Stomach ulcers, heartburn, fluid retention, and headache.',
    dosage: '1 tablet 2 to 3 times daily with meals.',
    manufacturer: 'Novartis India',
    prescriptionRequired: true
  },
  {
    name: 'Disprin Tablet',
    genericName: 'Aspirin (Acetylsalicylic Acid)',
    brand: 'Disprin',
    category: 'Pain & Fever',
    subCategory: 'NSAIDs & Soluble Analgesics',
    uses: 'Effective for instant relief from headaches, mild migraines, and toothaches.',
    sideEffects: 'Gastric irritation, heartburn, increased bleeding risk.',
    dosage: '1-2 tablets dissolved in water up to 4 times a day.',
    manufacturer: 'Reckitt Benckiser',
    prescriptionRequired: false
  },
  {
    name: 'Ketorol DT 10mg Tablet',
    genericName: 'Ketorolac Tromethamine',
    brand: 'Ketorol / Acular',
    category: 'Pain & Fever',
    subCategory: 'NSAIDs (Potent)',
    uses: 'Short-term management of moderately severe acute pain, typically post-surgery or dental extraction.',
    sideEffects: 'Stomach ulcers, heartburn, drowsiness.',
    dosage: '1 tablet dissolved in water every 6 hours.',
    manufacturer: 'Dr. Reddy’s Laboratories',
    prescriptionRequired: true
  },
  {
    name: 'Nise 100mg Tablet',
    genericName: 'Nimesulide',
    brand: 'Nise / Nimulid',
    category: 'Pain & Fever',
    subCategory: 'NSAIDs',
    uses: 'Used for acute pain, painful menstruation, and osteoarthritis pain relief.',
    sideEffects: 'Liver enzyme elevation, nausea, dizziness, skin rash.',
    dosage: '1 tablet twice daily after meals (short term).',
    manufacturer: 'Panacea Biotec',
    prescriptionRequired: true
  },
  {
    name: 'Tramadol 50mg Capsule',
    genericName: 'Tramadol Hydrochloride',
    brand: 'Contramal / Tramazac',
    category: 'Pain & Fever',
    subCategory: 'Opioid Analgesics',
    uses: 'Management of moderate to severe chronic pain where non-opioid analgesics are insufficient.',
    sideEffects: 'Dizziness, drowsiness, constipation, dry mouth, nausea.',
    dosage: '1 capsule every 4 to 6 hours as directed by a physician.',
    manufacturer: 'Sun Pharma',
    prescriptionRequired: true
  },

  // --- 2. ANTIBIOTICS & ANTI-INFECTIVES ---
  {
    name: 'Augmentin 625 Duo Tablet',
    genericName: 'Amoxicillin & Potassium Clavulanate',
    brand: 'Augmentin / Moxikind-CV',
    category: 'Antibiotics',
    subCategory: 'Penicillins',
    uses: 'Treats bacterial infections of the lungs, sinuses, urinary tract, skin, and dental abscesses.',
    sideEffects: 'Diarrhea, nausea, vomiting, and skin rashes.',
    dosage: '1 tablet every 12 hours for 5 to 7 days.',
    manufacturer: 'GSK India / Mankind',
    prescriptionRequired: true
  },
  {
    name: 'Azithral 500mg Tablet',
    genericName: 'Azithromycin Dihydrate',
    brand: 'Azithral / Zithromax',
    category: 'Antibiotics',
    subCategory: 'Macrolides',
    uses: 'Used for respiratory tract infections, tonsillitis, bronchitis, and typhoid fever.',
    sideEffects: 'Mild stomach discomfort, loose motions, or nausea.',
    dosage: '1 tablet once daily for 3 to 5 days.',
    manufacturer: 'Alembic Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Taxim-O 200mg Tablet',
    genericName: 'Cefixime Dispersible',
    brand: 'Taxim-O / Cefspan',
    category: 'Antibiotics',
    subCategory: 'Cephalosporins',
    uses: 'Effective against urinary tract infections, middle ear infections, and respiratory tract infections.',
    sideEffects: 'Indigestion, diarrhea, and mild dizziness.',
    dosage: '1 tablet twice daily for 7 days.',
    manufacturer: 'Alkem Laboratories',
    prescriptionRequired: true
  },
  {
    name: 'O2 Tablet',
    genericName: 'Ofloxacin & Ornidazole',
    brand: 'O2 / Zenflox-OZ',
    category: 'Antibiotics',
    subCategory: 'Fluoroquinolones & Nitroimidazoles',
    uses: 'Treats infectious diarrhea, dysentery, and mixed abdominal bacterial infections.',
    sideEffects: 'Dry mouth, metallic taste, nausea, and headache.',
    dosage: '1 tablet twice daily for 5 days.',
    manufacturer: 'Medley Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Cifran 500mg Tablet',
    genericName: 'Ciprofloxacin',
    brand: 'Cifran / Ciplox',
    category: 'Antibiotics',
    subCategory: 'Fluoroquinolones',
    uses: 'Treats severe bacterial infections including typhoid, urinary tract, and bone infections.',
    sideEffects: 'Nausea, diarrhea, abnormal liver function tests, rash.',
    dosage: '1 tablet twice daily for 7 to 14 days.',
    manufacturer: 'Cipla Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Mox 500mg Capsule',
    genericName: 'Amoxicillin',
    brand: 'Mox / Amoxil',
    category: 'Antibiotics',
    subCategory: 'Penicillins',
    uses: 'Treats wide range of bacterial infections in ears, nose, throat, skin, and urinary tract.',
    sideEffects: 'Diarrhea, skin rash, nausea, vomiting.',
    dosage: '1 capsule every 8 hours.',
    manufacturer: 'Sun Pharma',
    prescriptionRequired: true
  },
  {
    name: 'Roxid 150mg Tablet',
    genericName: 'Roxithromycin',
    brand: 'Roxid',
    category: 'Antibiotics',
    subCategory: 'Macrolides',
    uses: 'Treats respiratory tract infections, throat infections, and skin infections.',
    sideEffects: 'Nausea, vomiting, stomach upset, diarrhea.',
    dosage: '1 tablet twice daily before meals.',
    manufacturer: 'Lupin Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Zifi 200mg Tablet',
    genericName: 'Cefixime',
    brand: 'Zifi',
    category: 'Antibiotics',
    subCategory: 'Cephalosporins',
    uses: 'Management of susceptible bacterial infections of the ear, sinus, and urinary tract.',
    sideEffects: 'Diarrhea, nausea, abdominal pain, dyspepsia.',
    dosage: '1 tablet twice daily.',
    manufacturer: 'FDC Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Supacef 500mg Tablet',
    genericName: 'Cefuroxime Axetil',
    brand: 'Supacef / Curocef',
    category: 'Antibiotics',
    subCategory: 'Cephalosporins (2nd Generation)',
    uses: 'Treats bronchitis, sinusitis, tonsillitis, and skin infections.',
    sideEffects: 'Diarrhea, headache, dizziness, abdominal discomfort.',
    dosage: '1 tablet twice daily after meals.',
    manufacturer: 'GSK India',
    prescriptionRequired: true
  },
  {
    name: 'Levoflox 500mg Tablet',
    genericName: 'Levofloxacin',
    brand: 'Levoflox / Tavanic',
    category: 'Antibiotics',
    subCategory: 'Fluoroquinolones',
    uses: 'Treats pneumonia, chronic bronchitis, sinus infections, and urinary tract infections.',
    sideEffects: 'Nausea, headache, dizziness, insomnia, diarrhea.',
    dosage: '1 tablet once daily.',
    manufacturer: 'Dr. Reddy’s Laboratories',
    prescriptionRequired: true
  },

  // --- 3. GASTROINTESTINAL & ANTACIDS ---
  {
    name: 'Pantocid 40mg Tablet',
    genericName: 'Pantoprazole',
    brand: 'Pantocid / Pan-40 / Pantodac',
    category: 'Gastrointestinal',
    subCategory: 'Proton Pump Inhibitors (PPI)',
    uses: 'Relieves acidity, acid reflux, heartburn, GERD, and stomach ulcers.',
    sideEffects: 'Headache, diarrhea, flatulence, and joint pain.',
    dosage: '1 tablet daily in the morning before breakfast.',
    manufacturer: 'Sun Pharma',
    prescriptionRequired: true
  },
  {
    name: 'Omez 20mg Capsule',
    genericName: 'Omeprazole',
    brand: 'Omez / Prilosec',
    category: 'Gastrointestinal',
    subCategory: 'Proton Pump Inhibitors (PPI)',
    uses: 'Reduces stomach acid production to treat ulcers and acid-related indigestion.',
    sideEffects: 'Stomach pain, gas, nausea, and mild dizziness.',
    dosage: '1 capsule daily before the first meal.',
    manufacturer: 'Dr. Reddy’s Laboratories',
    prescriptionRequired: true
  },
  {
    name: 'Rantac 150mg Tablet',
    genericName: 'Ranitidine Hydrochloride',
    brand: 'Rantac / Zinetac',
    category: 'Gastrointestinal',
    subCategory: 'H2 Blockers',
    uses: 'Prevents and treats stomach ulcers and acid reflux symptoms.',
    sideEffects: 'Headache, fatigue, and constipation.',
    dosage: '1 tablet twice daily or as needed for acidity.',
    manufacturer: 'J.B. Chemicals & Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Ondem 4mg Tablet',
    genericName: 'Ondansetron',
    brand: 'Ondem / Zofran',
    category: 'Gastrointestinal',
    subCategory: 'Anti-emetics',
    uses: 'Prevents nausea and vomiting caused by stomach bugs, travel sickness, or medical treatments.',
    sideEffects: 'Constipation, headache, and fatigue.',
    dosage: '1 tablet as needed when feeling nauseous.',
    manufacturer: 'Alkem Laboratories',
    prescriptionRequired: true
  },
  {
    name: 'Razo D Capsule',
    genericName: 'Rabeprazole & Domperidone',
    brand: 'Razo-D / Veloz-D',
    category: 'Gastrointestinal',
    subCategory: 'PPI & Prokinetics',
    uses: 'Treats gastroesophageal reflux disease (GERD) and peptic ulcer disease by relieving acid and nausea.',
    sideEffects: 'Headache, dry mouth, stomach pain, diarrhea.',
    dosage: '1 capsule daily before breakfast.',
    manufacturer: 'Dr. Reddy’s Laboratories',
    prescriptionRequired: true
  },
  {
    name: 'Aciloc 150mg Tablet',
    genericName: 'Ranitidine',
    brand: 'Aciloc',
    category: 'Gastrointestinal',
    subCategory: 'H2 Blockers',
    uses: 'Reduces acid secretion in stomach, treats ulcers and heartburn.',
    sideEffects: 'Headache, dizziness, constipation, diarrhea.',
    dosage: '1 tablet twice daily.',
    manufacturer: 'Cadila Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Gelusil Liquid 200ml',
    genericName: 'Magnesium Hydroxide, Aluminium Hydroxide & Simethicone',
    brand: 'Gelusil / Digene',
    category: 'Gastrointestinal',
    subCategory: 'Antacids & Antiflatulents',
    uses: 'Provides immediate relief from acidity, gas, bloating, and heartburn.',
    sideEffects: 'Diarrhea or constipation.',
    dosage: '2 teaspoons (10ml) after meals as needed.',
    manufacturer: 'Pfizer India',
    prescriptionRequired: false
  },
  {
    name: 'Eno Regular Powder Sachet',
    genericName: 'Sodium Bicarbonate, Citric Acid & Sodium Carbonate',
    brand: 'Eno',
    category: 'Gastrointestinal',
    subCategory: 'Antacids',
    uses: 'Fast relief from acidity, gastric discomfort, and sour stomach within seconds.',
    sideEffects: 'Burping, mild gas passage.',
    dosage: '1 sachet in a glass of water, repeat after 2-3 hours if needed.',
    manufacturer: 'GSK Consumer Healthcare',
    prescriptionRequired: false
  },
  {
    name: 'Cremaffin Plus Syrup 225ml',
    genericName: 'Liquid Paraffin, Milk of Magnesia & Sodium Picosulfate',
    brand: 'Cremaffin Plus',
    category: 'Gastrointestinal',
    subCategory: 'Laxatives & Constipation Relief',
    uses: 'Relieves chronic and acute constipation by softening stool and stimulating bowel movements.',
    sideEffects: 'Abdominal cramps, diarrhea, electrolyte imbalance with overuse.',
    dosage: '1-2 tablespoons at bedtime.',
    manufacturer: 'Abbott India',
    prescriptionRequired: false
  },
  {
    name: 'Pudin Hara Pearls',
    genericName: 'Mentha Piperita (Peppermint Oil)',
    brand: 'Pudin Hara',
    category: 'Gastrointestinal',
    subCategory: 'Herbal Digestion Care',
    uses: 'Natural remedy for stomach ache, gas, indigestion, and gastric trouble.',
    sideEffects: 'Mild heartburn if allergic to menthol.',
    dosage: '1-2 pearls with water after meals.',
    manufacturer: 'Dabur India',
    prescriptionRequired: false
  },

  // --- 4. DIABETES CARE ---
  {
    name: 'Glycomet-SR 500mg Tablet',
    genericName: 'Metformin Hydrochloride (Sustained Release)',
    brand: 'Glycomet / Glucophage',
    category: 'Diabetes Care',
    subCategory: 'Biguanides',
    uses: 'First-line medication for lowering blood glucose levels in Type 2 Diabetes Mellitus.',
    sideEffects: 'Nausea, stomach upset, and temporary metallic taste.',
    dosage: '1 tablet daily or twice daily with major meals.',
    manufacturer: 'USV Private Limited',
    prescriptionRequired: true
  },
  {
    name: 'Amaryl 1mg Tablet',
    genericName: 'Glimepiride',
    brand: 'Amaryl / Glimy',
    category: 'Diabetes Care',
    subCategory: 'Sulfonylureas',
    uses: 'Stimulates insulin release from the pancreas to control blood sugar in Type 2 diabetes.',
    sideEffects: 'Low blood sugar (hypoglycemia), weight gain, and dizziness.',
    dosage: '1 tablet once daily before breakfast.',
    manufacturer: 'Sanofi India',
    prescriptionRequired: true
  },
  {
    name: 'Januvia 50mg Tablet',
    genericName: 'Sitagliptin',
    brand: 'Januvia / Istavel',
    category: 'Diabetes Care',
    subCategory: 'DPP-4 Inhibitors',
    uses: 'Helps control blood sugar levels by increasing substances in the body that release insulin.',
    sideEffects: 'Upper respiratory infection, stuffy nose, headache, sore throat.',
    dosage: '1 tablet once daily.',
    manufacturer: 'MSD Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Galvus 50mg Tablet',
    genericName: 'Vildagliptin',
    brand: 'Galvus / Zomelis',
    category: 'Diabetes Care',
    subCategory: 'DPP-4 Inhibitors',
    uses: 'Improves blood sugar control in adults with type 2 diabetes.',
    sideEffects: 'Tremor, headache, dizziness, fatigue, nausea.',
    dosage: '1 tablet once or twice daily.',
    manufacturer: 'Novartis India',
    prescriptionRequired: true
  },
  {
    name: 'Glyciphage-M 500 Tablet',
    genericName: 'Metformin & Gliclazide',
    brand: 'Glyciphage-M',
    category: 'Diabetes Care',
    subCategory: 'Combination Antidiabetics',
    uses: 'Dual-action control of blood glucose in Type 2 diabetes patients.',
    sideEffects: 'Hypoglycemia, gastrointestinal disturbance, nausea.',
    dosage: '1 tablet twice daily with meals.',
    manufacturer: 'Franco-Indian Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Trajenta 5mg Tablet',
    genericName: 'Linagliptin',
    brand: 'Trajenta',
    category: 'Diabetes Care',
    subCategory: 'DPP-4 Inhibitors',
    uses: 'Manages blood sugar levels in Type 2 diabetes patients without weight gain.',
    sideEffects: 'Nasopharyngitis, cough, hypoglycemia when combined with insulin.',
    dosage: '1 tablet once daily.',
    manufacturer: 'Boehringer Ingelheim',
    prescriptionRequired: true
  },
  {
    name: 'Lantus SoloStar Pen (Insulin)',
    genericName: 'Insulin Glargine (100 IU/ml)',
    brand: 'Lantus',
    category: 'Diabetes Care',
    subCategory: 'Long-acting Insulins',
    uses: 'Provides steady, long-lasting 24-hour blood glucose control for Type 1 and Type 2 diabetes.',
    sideEffects: 'Hypoglycemia, injection site redness, weight gain.',
    dosage: 'As prescribed by an endocrinologist subcutaneously once daily.',
    manufacturer: 'Sanofi India',
    prescriptionRequired: true
  },

  // --- 5. CARDIOVASCULAR & BLOOD PRESSURE ---
  {
    name: 'Telma 40mg Tablet',
    genericName: 'Telmisartan',
    brand: 'Telma / Micardis',
    category: 'Cardiovascular',
    subCategory: 'ARBs',
    uses: 'Treats hypertension (high blood pressure) and protects against heart attacks and kidney failure.',
    sideEffects: 'Sinus congestion, back pain, and low blood pressure dizziness.',
    dosage: '1 tablet once daily.',
    manufacturer: 'Glenmark Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Atorva 10mg Tablet',
    genericName: 'Atorvastatin',
    brand: 'Atorva / Lipitor',
    category: 'Cardiovascular',
    subCategory: 'Statins',
    uses: 'Reduces LDL ("bad") cholesterol and triglycerides, preventing plaque buildup in arteries.',
    sideEffects: 'Joint pain, muscle soreness, and mild digestive upset.',
    dosage: '1 tablet once daily at night.',
    manufacturer: 'Zydus Cadila',
    prescriptionRequired: true
  },
  {
    name: 'Ecosprin 75mg Tablet',
    genericName: 'Aspirin (Acetylsalicylic Acid)',
    brand: 'Ecosprin / Disprin',
    category: 'Cardiovascular',
    subCategory: 'Antiplatelet Agents',
    uses: 'Prevents blood clots, heart attacks, and strokes in high-risk patients.',
    sideEffects: 'Heartburn, increased bleeding tendency, and gastric irritation.',
    dosage: '1 tablet daily after food as prescribed by a cardiologist.',
    manufacturer: 'USV Private Limited',
    prescriptionRequired: true
  },
  {
    name: 'Stamlo 5mg Tablet',
    genericName: 'Amlodipine Besylate',
    brand: 'Stamlo / Amlong',
    category: 'Cardiovascular',
    subCategory: 'Calcium Channel Blockers',
    uses: 'Lowers blood pressure and treats chest pain (angina) by relaxing blood vessels.',
    sideEffects: 'Ankle swelling, dizziness, flushing, tiredness.',
    dosage: '1 tablet once daily.',
    manufacturer: 'Dr. Reddy’s Laboratories',
    prescriptionRequired: true
  },
  {
    name: 'Rosuvas 10mg Tablet',
    genericName: 'Rosuvastatin Calcium',
    brand: 'Rosuvas / Crestor',
    category: 'Cardiovascular',
    subCategory: 'Statins',
    uses: 'Manages high cholesterol and reduces cardiovascular disease risks.',
    sideEffects: 'Headache, myalgia (muscle pain), asthenia, constipation.',
    dosage: '1 tablet once daily.',
    manufacturer: 'Sun Pharma',
    prescriptionRequired: true
  },
  {
    name: 'Metolar XR 50mg Capsule',
    genericName: 'Metoprolol Succinate (Extended Release)',
    brand: 'Metolar XR / Betaloc',
    category: 'Cardiovascular',
    subCategory: 'Beta Blockers',
    uses: 'Controls hypertension, angina, and prevents heart failure complications.',
    sideEffects: 'Fatigue, dizziness, cold hands and feet, slow heart rate.',
    dosage: '1 capsule daily in the morning.',
    manufacturer: 'Cipla Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Concor 5mg Tablet',
    genericName: 'Bisoprolol Fumarate',
    brand: 'Concor',
    category: 'Cardiovascular',
    subCategory: 'Beta Blockers',
    uses: 'Treats high blood pressure and chronic heart failure.',
    sideEffects: 'Dizziness, headache, feeling cold in extremities, GI upset.',
    dosage: '1 tablet once daily.',
    manufacturer: 'Merck Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Clopitab 75mg Tablet',
    genericName: 'Clopidogrel',
    brand: 'Clopitab / Plavix',
    category: 'Cardiovascular',
    subCategory: 'Antiplatelet Agents',
    uses: 'Prevents harmful blood clots in blood vessels, reducing heart attack risk after stents.',
    sideEffects: 'Increased bleeding tendency, bruising, stomach upset, diarrhea.',
    dosage: '1 tablet daily.',
    manufacturer: 'Lupin Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Cardace 5mg Tablet',
    genericName: 'Ramipril',
    brand: 'Cardace / Tritace',
    category: 'Cardiovascular',
    subCategory: 'ACE Inhibitors',
    uses: 'Treats high blood pressure and heart failure, and protects kidneys in diabetic patients.',
    sideEffects: 'Dry persistent cough, dizziness, headache, fatigue.',
    dosage: '1 tablet daily.',
    manufacturer: 'Sanofi India',
    prescriptionRequired: true
  },

  // --- 6. RESPIRATORY & ALLERGY ---
  {
    name: 'Montair-LC Tablet',
    genericName: 'Montelukast & Levocetirizine',
    brand: 'Montair-LC / Levocet-M',
    category: 'Respiratory & Allergy',
    subCategory: 'Antihistamines & Leukotriene Inhibitors',
    uses: 'Relieves sneezing, runny nose, allergic rhinitis, and chronic asthma symptoms.',
    sideEffects: 'Drowsiness, dry mouth, and fatigue.',
    dosage: '1 tablet once daily at bedtime.',
    manufacturer: 'Cipla Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Ascoril LS Syrup 100ml',
    genericName: 'Ambroxol, Guaifenesin & Levosalbutamol',
    brand: 'Ascoril LS',
    category: 'Respiratory & Allergy',
    subCategory: 'Cough Syrups & Expectorants',
    uses: 'Clears chest congestion, mucus, and relieves productive cough and bronchitis.',
    sideEffects: 'Rapid heart rate, tremors, nausea, and mild drowsiness.',
    dosage: '10ml (2 teaspoons) three times daily.',
    manufacturer: 'Glenmark Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Allegra 120mg Tablet',
    genericName: 'Fexofenadine Hydrochloride',
    brand: 'Allegra / Telfast',
    category: 'Respiratory & Allergy',
    subCategory: 'Non-sedating Antihistamines',
    uses: 'Non-drowsy relief from seasonal allergy symptoms, hives, and itchy skin.',
    sideEffects: 'Headache, drowsiness, nausea, dizziness.',
    dosage: '1 tablet once daily before meals.',
    manufacturer: 'Sanofi India',
    prescriptionRequired: false
  },
  {
    name: 'Cetrizet 10mg Tablet',
    genericName: 'Cetirizine Hydrochloride',
    brand: 'Cetrizet / Zyrtec',
    category: 'Respiratory & Allergy',
    subCategory: 'Antihistamines',
    uses: 'Relieves watery eyes, sneezing, runny nose, and allergic skin reactions.',
    sideEffects: 'Mild drowsiness, dry mouth, fatigue.',
    dosage: '1 tablet once daily at night.',
    manufacturer: 'Dr. Reddy’s Laboratories',
    prescriptionRequired: false
  },
  {
    name: 'Benadryl Cough Formula 100ml',
    genericName: 'Diphenhydramine Hydrochloride & Ammonium Chloride',
    brand: 'Benadryl',
    category: 'Respiratory & Allergy',
    subCategory: 'Cough Syrups',
    uses: 'Relieves cough, throat irritation, and allergic cold symptoms.',
    sideEffects: 'Drowsiness, dizziness, dry mouth, blurred vision.',
    dosage: '1-2 teaspoons every 4 hours.',
    manufacturer: 'Johnson & Johnson',
    prescriptionRequired: false
  },
  {
    name: 'Asthalin 2mg Tablet',
    genericName: 'Salbutamol Sulphate',
    brand: 'Asthalin / Ventolin',
    category: 'Respiratory & Allergy',
    subCategory: 'Bronchodilators',
    uses: 'Relieves bronchospasm in asthma and chronic obstructive pulmonary disease (COPD).',
    sideEffects: 'Tremors, nervousness, headache, rapid heartbeat.',
    dosage: '1 tablet 3 to 4 times daily.',
    manufacturer: 'Cipla Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Foracort 400 Inhaler',
    genericName: 'Budesonide & Formoterol Fumarate',
    brand: 'Foracort',
    category: 'Respiratory & Allergy',
    subCategory: 'Inhalers & Asthma Care',
    uses: 'Long-term maintenance treatment of asthma and chronic bronchitis.',
    sideEffects: 'Throat irritation, oral thrush (fungal infection in mouth), hoarseness, tremors.',
    dosage: '1-2 puffs twice daily as directed by pulmonologist.',
    manufacturer: 'Cipla Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Alex Syrup 100ml',
    genericName: 'Chlorpheniramine Maleate, Dextromethorphan & Phenylephrine',
    brand: 'Alex Syrup',
    category: 'Respiratory & Allergy',
    subCategory: 'Dry Cough Syrups',
    uses: 'Relieves dry, hacking cough, throat irritation, and nasal congestion due to cold.',
    sideEffects: 'Drowsiness, dizziness, dry mouth, nervousness.',
    dosage: '5-10ml twice or thrice daily.',
    manufacturer: 'Glenmark Pharmaceuticals',
    prescriptionRequired: false
  },

  // --- 7. VITAMINS, SUPPLEMENTS & NUTRITION ---
  {
    name: 'Shelcal 500 Tablet',
    genericName: 'Calcium Carbonate & Vitamin D3',
    brand: 'Shelcal 500',
    category: 'Vitamins & Supplements',
    subCategory: 'Calcium & Bone Health',
    uses: 'Strengthens bones, prevents osteoporosis, and fulfills calcium and vitamin D3 deficiencies.',
    sideEffects: 'Constipation, mild stomach upset, gas.',
    dosage: '1 tablet daily preferably after the main meal.',
    manufacturer: 'Torrent Pharmaceuticals',
    prescriptionRequired: false
  },
  {
    name: 'Becadexamin Capsule',
    genericName: 'Multivitamin, Multimineral & Antioxidants',
    brand: 'Becadexamin',
    category: 'Vitamins & Supplements',
    subCategory: 'Multivitamins',
    uses: 'Treats nutritional deficiencies, boosts immunity, and aids recovery after illnesses.',
    sideEffects: 'Dark colored stools, mild gastric discomfort.',
    dosage: '1 capsule daily after food.',
    manufacturer: 'GSK India',
    prescriptionRequired: false
  },
  {
    name: 'Neurobion Forte Tablet',
    genericName: 'Vitamin B Complex (B1, B2, B3, B5, B6, B12)',
    brand: 'Neurobion Forte',
    category: 'Vitamins & Supplements',
    subCategory: 'Vitamin B Supplements',
    uses: 'Treats nerve pain (neuropathy), vitamin B deficiencies, weakness, and fatigue.',
    sideEffects: 'Bright yellow urine (harmless), rare allergic skin reactions.',
    dosage: '1 tablet daily after food.',
    manufacturer: 'Procter & Gamble (P&G)',
    prescriptionRequired: false
  },
  {
    name: 'Supradyn Daily Tablet',
    genericName: 'Multivitamins & Minerals',
    brand: 'Supradyn',
    category: 'Vitamins & Supplements',
    subCategory: 'Multivitamins',
    uses: 'Energy booster and daily nutritional supplement for active lifestyle.',
    sideEffects: 'Stomach upset if taken on an empty stomach.',
    dosage: '1 tablet daily.',
    manufacturer: 'Bayer India',
    prescriptionRequired: false
  },
  {
    name: 'Evion 400 Capsule',
    genericName: 'Vitamin E (Tocopheryl Acetate)',
    brand: 'Evion 400',
    category: 'Vitamins & Supplements',
    subCategory: 'Antioxidants & Skin Health',
    uses: 'Powerful antioxidant for skin nourishment, hair health, and cellular protection.',
    sideEffects: 'Rare GI upset at high doses.',
    dosage: '1 capsule daily after meals.',
    manufacturer: 'Merck Ltd',
    prescriptionRequired: false
  },
  {
    name: 'Limcee 500mg Chewable Tablet',
    genericName: 'Vitamin C (Ascorbic Acid)',
    brand: 'Limcee / Celin',
    category: 'Vitamins & Supplements',
    subCategory: 'Vitamin C & Immunity',
    uses: 'Boosts immunity, prevents scurvy, and enhances iron absorption.',
    sideEffects: 'Heartburn or stomach cramps if taken in excess.',
    dosage: '1 to 2 tablets daily chewed or dissolved.',
    manufacturer: 'Abbott India',
    prescriptionRequired: false
  },
  {
    name: 'Uprise-D3 60K Capsule',
    genericName: 'Cholecalciferol (Vitamin D3 60,000 IU)',
    brand: 'Uprise-D3 / Calcirol',
    category: 'Vitamins & Supplements',
    subCategory: 'Vitamin D Supplements',
    uses: 'Treats severe Vitamin D3 deficiency, strengthens immunity and bone density.',
    sideEffects: 'Hypercalcemia if overused without medical supervision.',
    dosage: '1 capsule once a week for 8 weeks or as prescribed.',
    manufacturer: 'Alkem Laboratories',
    prescriptionRequired: true
  },
  {
    name: 'Autrin Tablet',
    genericName: 'Ferrous Fumarate, Folic Acid & Cyanocobalamin',
    brand: 'Autrin / Orofer-XT',
    category: 'Vitamins & Supplements',
    subCategory: 'Iron & Blood Builders',
    uses: 'Treats iron deficiency anemia, fatigue, and pregnancy-related nutritional gaps.',
    sideEffects: 'Black stools, constipation, nausea, metallic taste.',
    dosage: '1 tablet daily after food.',
    manufacturer: 'Pfizer India',
    prescriptionRequired: false
  },

  // --- 8. DERMATOLOGY & SKIN CREAMS ---
  {
    name: 'Candid Cream 15g',
    genericName: 'Clotrimazole (1% w/w)',
    brand: 'Candid / Clotrin',
    category: 'Dermatology',
    subCategory: 'Antifungal Topical',
    uses: 'Treats fungal skin infections such as ringworm, athlete’s foot, jock itch, and sweat rashes.',
    sideEffects: 'Local skin irritation, burning sensation, or redness at application site.',
    dosage: 'Apply gently to affected area 2 to 3 times daily.',
    manufacturer: 'Glenmark Pharmaceuticals',
    prescriptionRequired: false
  },
  {
    name: 'Betnovate-C Cream 30g',
    genericName: 'Betamethasone Valerate & Clioquinol',
    brand: 'Betnovate-C',
    category: 'Dermatology',
    subCategory: 'Topical Steroids & Antibacterials',
    uses: 'Treats inflamed, infected, or itchy skin conditions like eczema and psoriasis.',
    sideEffects: 'Thinning of skin with prolonged use, burning, irritation.',
    dosage: 'Apply a thin layer to the affected area twice daily.',
    manufacturer: 'GSK India',
    prescriptionRequired: true
  },
  {
    name: 'Soframycin Skin Cream 30g',
    genericName: 'Framycetin Sulphate',
    brand: 'Soframycin',
    category: 'Dermatology',
    subCategory: 'Topical Antibiotics',
    uses: 'Prevents and treats bacterial skin infections, minor cuts, wounds, and burns.',
    sideEffects: 'Mild localized stinging or itching.',
    dosage: 'Apply 2-3 times a day on clean wounds.',
    manufacturer: 'Sanofi India',
    prescriptionRequired: false
  },
  {
    name: 'Nadoxin Cream 15g',
    genericName: 'Nadifloxacin',
    brand: 'Nadoxin',
    category: 'Dermatology',
    subCategory: 'Topical Antibiotics for Acne',
    uses: 'Treatment of acne vulgaris and bacterial skin infections.',
    sideEffects: 'Dry skin, skin redness, burning sensation.',
    dosage: 'Apply twice daily to affected acne spots.',
    manufacturer: 'Cipla Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Moiz Cleansing Lotion 125ml',
    genericName: 'Cetyl Alcohol & Stearyl Alcohol Emollient',
    brand: 'Moiz / Cetaphil',
    category: 'Dermatology',
    subCategory: 'Moisturizers & Skincare',
    uses: 'Gentle soap-free cleanser for sensitive, dry, and acne-prone skin conditions.',
    sideEffects: 'None known (hypoallergenic).',
    dosage: 'Massage gently on skin and rinse with water.',
    manufacturer: 'Sun Pharma',
    prescriptionRequired: false
  },

  // --- 9. NEUROLOGY & PSYCHIATRY ---
  {
    name: 'Alprax 0.5mg Tablet',
    genericName: 'Alprazolam',
    brand: 'Alprax / Restyl',
    category: 'Neurology & Psychiatry',
    subCategory: 'Benzodiazepines',
    uses: 'Short-term management of anxiety disorders, panic attacks, and sleep disorders.',
    sideEffects: 'Drowsiness, lightheadedness, dry mouth, dependence risk.',
    dosage: 'As prescribed strictly by a psychiatrist.',
    manufacturer: 'Torrent Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Clonotril 0.5mg Tablet',
    genericName: 'Clonazepam',
    brand: 'Clonotril / Epitril',
    category: 'Neurology & Psychiatry',
    subCategory: 'Anticonvulsants & Benzodiazepines',
    uses: 'Prevents and controls seizures, panic disorder, and involuntary muscle spasms.',
    sideEffects: 'Drowsiness, uncoordinated body movements, fatigue.',
    dosage: 'Strictly as prescribed by a neurologist.',
    manufacturer: 'Torrent Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Gabantin 300mg Capsule',
    genericName: 'Gabapentin',
    brand: 'Gabantin / Neurontin',
    category: 'Neurology & Psychiatry',
    subCategory: 'Anticonvulsants & Nerve Pain',
    uses: 'Relieves neuropathic pain (nerve pain) associated with diabetic neuropathy and shingles.',
    sideEffects: 'Dizziness, somnolence, peripheral edema, ataxia.',
    dosage: 'As directed by physician.',
    manufacturer: 'Sun Pharma',
    prescriptionRequired: true
  },
  {
    name: 'Sertra 50mg Tablet',
    genericName: 'Sertraline Hydrochloride',
    brand: 'Sertra / Zoloft',
    category: 'Neurology & Psychiatry',
    subCategory: 'SSRIs (Antidepressants)',
    uses: 'Treatment of major depression, obsessive-compulsive disorder (OCD), and panic attacks.',
    sideEffects: 'Nausea, insomnia, diarrhea, dry mouth, sexual dysfunction.',
    dosage: '1 tablet daily as prescribed.',
    manufacturer: 'Intas Pharmaceuticals',
    prescriptionRequired: true
  },

  // --- 10. EYE, EAR & NASAL DROPS ---
  {
    name: 'Ciplox Eye/Ear Drops 10ml',
    genericName: 'Ciprofloxacin (0.3% w/v)',
    brand: 'Ciplox Drops',
    category: 'Eye & Ear Care',
    subCategory: 'Antimicrobial Drops',
    uses: 'Treats bacterial infections of the eyes (conjunctivitis) and ears.',
    sideEffects: 'Temporary burning or stinging upon instillation.',
    dosage: '1-2 drops in affected eye/ear 3 to 4 times a day.',
    manufacturer: 'Cipla Ltd',
    prescriptionRequired: true
  },
  {
    name: 'Refresh Tears Eye Drops 10ml',
    genericName: 'Carboxymethylcellulose Sodium',
    brand: 'Refresh Tears / Tear Drops',
    category: 'Eye & Ear Care',
    subCategory: 'Artificial Tears & Lubricants',
    uses: 'Provides soothing relief from dry eyes, irritation caused by computer screens, dust, or wind.',
    sideEffects: 'Temporary blurred vision immediately after instillation.',
    dosage: '1-2 drops in the eye as needed.',
    manufacturer: 'Allergan India',
    prescriptionRequired: false
  },
  {
    name: 'Otrivin Nasal Drops 10ml',
    genericName: 'Xylometazoline Hydrochloride (0.1%)',
    brand: 'Otrivin',
    category: 'Eye & Ear Care',
    subCategory: 'Nasal Decongestants',
    uses: 'Provides fast relief from nasal congestion, blocked nose due to cold, sinusitis, or allergies.',
    sideEffects: 'Temporary burning, stinging, or dryness inside nose.',
    dosage: '2-3 drops in each nostril up to 2-3 times daily (maximum 5 days).',
    manufacturer: 'GSK Consumer Healthcare',
    prescriptionRequired: false
  },

  // --- 11. WOMEN'S HEALTH & GYNECOLOGY ---
  {
    name: 'Deviry 10mg Tablet',
    genericName: 'Medroxyprogesterone Acetate',
    brand: 'Deviry / Provera',
    category: 'Gynecology',
    subCategory: 'Progesterone Hormones',
    uses: 'Regulates menstrual cycles, treats abnormal uterine bleeding, amenorrhea, and endometriosis.',
    sideEffects: 'Weight gain, headaches, breast tenderness, mood swings.',
    dosage: 'As prescribed by a gynecologist.',
    manufacturer: 'Torrent Pharmaceuticals',
    prescriptionRequired: true
  },
  {
    name: 'Duphaston 10mg Tablet',
    genericName: 'Dydrogesterone',
    brand: 'Duphaston',
    category: 'Gynecology',
    subCategory: 'Progesterone Hormones',
    uses: 'Supports pregnancy, prevents recurrent miscarriage, and treats menstrual irregularities.',
    sideEffects: 'Nausea, breakthrough bleeding, mild headache.',
    dosage: 'As prescribed by gynecologist.',
    manufacturer: 'Abbott India',
    prescriptionRequired: true
  },
  {
    name: 'Vagifem / Candid-V 6 Vaginal Gel/Tablet',
    genericName: 'Clotrimazole / Antifungal Pessaries',
    brand: 'Candid-V',
    category: 'Gynecology',
    subCategory: 'Vaginal Antifungals',
    uses: 'Treats vaginal yeast infections (candidiasis) and associated itching/discharge.',
    sideEffects: 'Local burning or mild irritation.',
    dosage: '1 tablet inserted vaginally at bedtime for 3 to 6 days.',
    manufacturer: 'Glenmark Pharmaceuticals',
    prescriptionRequired: true
  }
];

async function runMasterSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas for Master Database Seeding');
    
    await Medicine.deleteMany({}); // Purono data muche 100+ new master medicines upload korbe
    await Medicine.insertMany(masterIndianDatabase);
    
    console.log(`🎉 SUCCESS: ${masterIndianDatabase.length} Master Indian Medicines Successfully Uploaded!`);
    process.exit();
  } catch (err) {
    console.error('❌ Master Seeding Failed:', err);
    process.exit(1);
  }
}

runMasterSeed();