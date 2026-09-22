const mongoose = require('mongoose');

// MongoDB Atlas URI (Apnar Render-e thaka URI ba Localhost)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kwiky';

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

const Item = mongoose.model('Item', ItemSchema);

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
    store: "Kacchi Bhai",
    cat: "Biryani & Kebab",
    img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=60",
    items: [
      ["Basmati Kacchi with Borhani", 499], ["Chinigura Mutton Kacchi", 440], ["Chicken Chaap with Luchi", 260],
      ["Beef Chaap Masala", 280], ["Mutton Galouti Kebab", 260], ["Chicken Reshmi Kebab", 240],
      ["Kacchi Bhai Special Platter", 650], ["Spicy Beef Khichuri", 360], ["Achari Chicken Biryani", 390],
      ["Kashmiri Polao", 280], ["Rumali Roti (4 pcs)", 100], ["Tandoori Butter Roti", 45],
      ["Badam Shorbot", 120], ["Labang Special", 100], ["Laccha Paratha (2 pcs)", 90],
      ["Shahi Mutton Dalcha", 210], ["Beef Brain Masala", 310], ["Gulab Jamun (2 pcs)", 80],
      ["Kulfi Malai Cup", 90], ["Mineral Water & Borhani Combo", 140]
    ]
  },
  {
    store: "Star Kabab & Restaurant",
    cat: "Biryani & Kebab",
    img: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60",
    items: [
      ["Mutton Kacchi Star Style", 420], ["Chicken Tikka (Full Leg)", 180], ["Star Special Beef Boti", 220],
      ["Mutton Khichuri Bowl", 340], ["Chicken Biryani Star Pack", 320], ["Mutton Leg Roast", 450],
      ["Butter Chicken Curry", 280], ["Beef Shik Kebab", 170], ["Special Star Faluda", 160],
      ["Mutton Brain Fry", 290], ["Chicken Liver Fry", 190], ["Plain Tandoori Naan", 40],
      ["Special Butter Naan", 80], ["Star Firni Matka", 85], ["Star Milk Tea", 35],
      ["Chicken Karahi", 380], ["Beef Nihari Special", 260], ["Special Paratha", 35],
      ["Mixed Vegetable Curry", 110], ["Sweet Lassi Big Glass", 90]
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
  },
  {
    store: "Chillox",
    cat: "Fast Food & Burgers",
    img: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60",
    items: [
      ["Beef with Cheese Burger", 240], ["Chillox Monster Double Beef", 380], ["Chicken Pastrami Burger", 280],
      ["Naga Chicken Blast Burger", 270], ["Sausage Burst Burger", 260], ["Beef Baconator Extreme", 390],
      ["Smoky BBQ Tender Strips", 210], ["Spicy Curly Fries", 160], ["Cheesy Meat Box", 280],
      ["Naga Meat Box Extreme", 310], ["Crispy Chicken Popcorn", 170], ["Fried Calamari Bites", 240],
      ["Classic Wedges with Dip", 140], ["Mozzarella Cheese Sticks", 220], ["Oreo Thick Shake", 190],
      ["Salted Caramel Shake", 200], ["Strawberry Fizz Soda", 110], ["Peach Iced Tea", 100],
      ["Jalapeno Poppers", 170], ["Chillox Buddy Box Combo", 690]
    ]
  },
  {
    store: "Khanas Fast Food",
    cat: "Fast Food & Burgers",
    img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60",
    items: [
      ["Khanas Smoky Hot Sub", 230], ["Crunchy Chicken Submarine", 250], ["Crispy Strips Platter", 260],
      ["Cheesy Sausage Roll", 170], ["Crispy Chicken Tender Roll", 210], ["Naga Drums of Heaven", 240],
      ["Hot Chicken Chowmein", 220], ["Beef Chili Fried Noodles", 260], ["Khanas Signature Platter", 360],
      ["Crinkle Cut French Fries", 110], ["Potato Cheesy Tornado", 130], ["Fiery Chicken Rice Bowl", 240],
      ["Sweet Chili Wings", 220], ["Crispy Wonton (6 pcs)", 160], ["Fried Spring Roll (4 pcs)", 140],
      ["Khanas Special Cold Coffee", 130], ["Mango Pulp Shake", 150], ["Chocolate Brownie Sundae", 170],
      ["Lemonade Fresh Splash", 80], ["Khanas Duo Meal Platter", 550]
    ]
  },
  {
    store: "Kasturi Bengali Kitchen",
    cat: "Bengali Thali & Rice",
    img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
    items: [
      ["Special Shorshe Ilish", 520], ["Ilish Mach Bhaja with Tel", 440], ["Rui Macher Kalia", 240],
      ["Chitol Macher Muitha", 310], ["Pabda Macher Jhol", 280], ["Chingri Malai Curry", 480],
      ["Khashir Mangsho Jhol", 460], ["Deshi Murgi Bhuna", 320], ["Kasturi Master Thali", 590],
      ["Mochar Ghonto", 140], ["Chingri Diye Kochu Shak", 170], ["Dhokar Dalna", 150],
      ["Alu Posto Special", 180], ["Cholar Dal with Narkel", 110], ["Basmati Sada Bhaat", 70],
      ["Ghee Bhat Bowl", 130], ["Tomato Khejur Chutney", 70], ["Papad Bhaja (3 pcs)", 40],
      ["Aam Chutney Sweet", 80], ["Misti Doi Matka", 85]
    ]
  },
  {
    store: "Bhorta Bhaat Ghor",
    cat: "Bengali Thali & Rice",
    img: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=60",
    items: [
      ["Alu Bhorta Classic", 40], ["Begun Bhorta Smoky", 50], ["Taki Mach Bhorta", 90],
      ["Chingri Mach Bhorta", 110], ["Ilish Mach Bhorta", 130], ["Kalojeera Bhorta Health", 60],
      ["Dhonia Pata Bhorta", 50], ["Shorisha Bhorta Deshi", 50], ["Shutki Bhorta Fiery", 80],
      ["Dal Bhorta Special", 40], ["Gondhoraj Lebu Sada Bhaat", 60], ["Patla Masoor Dal", 50],
      ["Macher Matha Diye Mung Dal", 160], ["Dim Bhuna Gravy", 70], ["Beef Kala Bhuna", 360],
      ["Hath Ruti Plate (3 pcs)", 50], ["Potol Posto Bhaji", 90], ["Korola Alu Bhaji", 60],
      ["Kacha Morich Tok Doi", 60], ["Bhorta 10-Item Super Platter", 380]
    ]
  },
  {
    store: "Mithai Sweets & Bakery",
    cat: "Desserts & Sweets",
    img: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=60",
    items: [
      ["Bograr Shahi Misti Doi (Half Kg)", 240], ["Spongy Rosogolla (4 pcs)", 120], ["Cream Gulab Jamun (4 pcs)", 140],
      ["Kacha Golla Malai (4 pcs)", 160], ["Motichoor Laddu (500g)", 220], ["Ghee Kaju Barfi Box", 450],
      ["Chana Mukhi Premium", 260], ["Malai Chop Special (2 pcs)", 150], ["Rasmalai Pure Milk (Bowl)", 210],
      ["Milk Peda Box (400g)", 290], ["Sweet Boondi (500g)", 170], ["Balushahi Crispy (4 pcs)", 130],
      ["Kalojam Sweet (4 pcs)", 140], ["Shorbhaja Cream Sweet", 220], ["Black Forest Cake Slice", 150],
      ["Red Velvet Pastry", 170], ["Butter Cream Doughnut", 90], ["Chicken Curry Puff", 60],
      ["Beef Keema Samucha (4 pcs)", 100], ["Sweet & Salted Lassi", 120]
    ]
  },
  {
    store: "Kwiky Daily Grocery",
    cat: "Grocery & Essentials",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
    items: [
      ["Deshi Miniket Rice (5kg)", 420], ["Nazirshail Rice (5kg)", 460], ["Soyabean Oil Fresh (2L)", 370],
      ["Mustard Oil Pure Radhuni (500ml)", 175], ["Masoor Dal Deshi (1kg)", 140], ["Refined White Sugar (1kg)", 135],
      ["Iodized Table Salt (1kg)", 42], ["Farm Fresh Brown Eggs (1 Dozen)", 155], ["Aarong Liquid Milk (1L)", 95],
      ["Deshi Red Onions (1kg)", 75], ["Fresh Potatoes Diamond (1kg)", 35], ["Garlic Deshi Small (500g)", 120],
      ["Fresh Green Chilis (250g)", 50], ["Radhuni Biryani Masala Box", 65], ["Radhuni Meat Curry Powder", 55],
      ["Nestle Maggi Noodles (8 Pack)", 190], ["Lipton Yellow Label Tea (400g)", 260], ["Dettol Soap (Pack of 3)", 180],
      ["Rin Washing Powder (1kg)", 145], ["Kwiky Instant 10-Min Pack", 599]
    ]
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for Seeding...");

    await Item.deleteMany({});
    console.log("Cleared old empty items.");

    const bulkItems = [];
    partners.forEach(p => {
      p.items.forEach(([name, price]) => {
        bulkItems.push({
          name: name,
          price: price,
          category: p.cat,
          description: `Fresh delicious item from ${p.store}. Available on Kwiky.`,
          imageUrl: p.img,
          storeName: p.store,
          isAvailable: true
        });
      });
    });

    await Item.insertMany(bulkItems);
    console.log(`SUCCESS! ${bulkItems.length} items added across 10 partner stores!`);
    process.exit(0);
  } catch (err) {
    console.error("Seed Error:", err);
    process.exit(1);
  }
}

seedDatabase();