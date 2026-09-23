require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/kwiky';

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  storeName: { type: String, required: true },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300' }
});

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

const partners = [
  {
    storeName: "Sultan's Dine",
    category: "Food",
    subcategory: "Biryani & Polao",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300",
    items: [
      ["Basmati Kacchi Biryani", 240],
      ["Mutton Rezala", 210],
      ["Chicken Roast Special", 160],
      ["Traditional Zarda Sweets", 120],
      ["Bograr Shahi Misti Doi", 240]
    ]
  },
  {
    storeName: "Takeout Burgers",
    category: "Food",
    subcategory: "Burgers & Sandwiches",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
    items: [
      ["Gourmet Beef Burger", 190],
      ["Crispy Chicken Burger", 170],
      ["Cheesy French Fries", 110],
      ["Smokey BBQ Wings", 150]
    ]
  },
  {
    storeName: "Star Kabab & Restaurant",
    category: "Food",
    subcategory: "Kebabs & Tandoor",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=300",
    items: [
      ["Beef Boti Kebab", 160],
      ["Chicken Tikka Kebab", 150],
      ["Tandoori Butter Roti", 30]
    ]
  },
  {
    storeName: "Urban Style",
    category: "Fashion",
    subcategory: "Men's Casual Shirts",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300",
    items: [
      ["Casual Denim Shirt", 580],
      ["Oxford Cotton Shirt", 520]
    ]
  },
  {
    storeName: "Apollo Meds",
    category: "Medicine",
    subcategory: "Fever & Pain Relief",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
    items: [
      ["Paracetamol 500mg (Strip)", 35],
      ["Antacid Gel Syrup 200ml", 120]
    ]
  },
  {
    storeName: "Kwiky Fresh",
    category: "Grocery",
    subcategory: "Rice Dal & Flour",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300",
    items: [
      ["Miniket Premium Rice 5kg", 380],
      ["Pure Soybean Oil 2L", 340]
    ]
  }
];

async function seedDatabase() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(mongoUri);
    await Item.deleteMany({});

    const bulkItems = [];
    partners.forEach(p => {
      p.items.forEach(([name, price]) => {
        bulkItems.push({
          name,
          price,
          category: p.category,
          subcategory: p.subcategory,
          storeName: p.storeName,
          imageUrl: p.image
        });
      });
    });

    await Item.insertMany(bulkItems);
    console.log(`SUCCESS! ${bulkItems.length} items loaded into database.`);
    process.exit(0);
  } catch (err) {
    console.error("Seed Error:", err);
    process.exit(1);
  }
}

seedDatabase();