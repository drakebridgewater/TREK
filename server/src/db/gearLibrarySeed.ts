import Database from 'better-sqlite3';

// Tag name constants — used for referencing tags when assigning to items/containers
const CAT = {
  HOT_WEATHER: 'Hot Weather',
  CLEANING: 'Cleaning',
  BUGS: 'Bugs',
  POWER_120V: '120v Power',
  COOKING: 'Cooking',
  CAMPFIRE: 'Campfire',
  SAFETY: 'Safety',
  HYGIENE: 'Hygiene',
  SLEEP: 'Sleep',
  SETUP: 'Setup',
  POWER: 'Power',
  DINING: 'Dining',
  ESSENTIALS: 'Essentials',
  JOY_FUN: 'Joy/Fun',
  DOG: 'Dog',
  FESTIVAL: 'Festival',
  NIGHTTIME: 'Nighttime',
  WATER_ACTIVITIES: 'Water Activities',
  KID_TOYS: 'Kids Toys',
  PERSONAL: 'Personal',
};

const CONT = {
  COOLER: 'Cooler',
  SNACK_BIN: 'Snack Bin',
  COOKING_BIN: 'Cooking Bin',
  SAFETY_BIN: 'Safety Bin',
  POWERED_BIN: 'Powered Bin',
  FOOD_BIN: 'Food Bin',
  SETUP_BIN: 'Setup Bin',
  CARGO_CARRIER: 'Cargo Carrier',
  SEATING_BIN: 'Seating Bin',
  FUN_BIN: 'Fun Bin',
  KID_TOY_BIN: "Kids's Toy Bin",
  DOG_BIN: "Dog Bin",
  DISH_BASIN: 'Dish Washing Basin',
  DRAKE_BAG: "Personal Bag - Drake's",
  SHAWNA_BAG: "Personal Bag - Shawna's",
  KID_BAG: "Personal Bag - Kids's",
};


interface ContainerDef {
  name: string;
  description?: string;
  capacity_notes?: string;
  is_personal?: number;
  tags: string[];
}

interface ItemDef {
  name: string;
  is_food?: number;
  is_personal?: number;
  quantity_formula?: string;
  base_quantity?: number;
  tags: string[];
}

const containers: ContainerDef[] = [
  {
    name: CONT.COOLER,
    description: 'Food and beverage cold storage',
    capacity_notes: 'Temperature-managed cold storage (cooler)',
    tags: [CONT.COOLER],
  },
  { name: CONT.SNACK_BIN, tags: [CONT.SNACK_BIN] },
  { name: CONT.COOKING_BIN, tags: [CONT.COOKING_BIN] },
  { name: CONT.SAFETY_BIN, tags: [CONT.SAFETY_BIN] },
  { name: CONT.POWERED_BIN, tags: [CONT.POWERED_BIN] },
  { name: CONT.FOOD_BIN, tags: [CONT.FOOD_BIN] },
  { name: CONT.SETUP_BIN, tags: [CONT.SETUP_BIN] },
  { name: CONT.CARGO_CARRIER, tags: [CONT.CARGO_CARRIER] },
  { name: CONT.SEATING_BIN, tags: [CONT.SEATING_BIN] },
  { name: CONT.FUN_BIN, tags: [CONT.FUN_BIN] },
  { name: CONT.KID_TOY_BIN, tags: [CONT.KID_TOY_BIN] },
  { name: CONT.DOG_BIN, description: 'Dog supplies', tags: [CONT.DOG_BIN] },
  { name: CONT.DISH_BASIN, tags: [CONT.DISH_BASIN] },
  { name: CONT.DRAKE_BAG, tags: [CONT.DRAKE_BAG] },
  { name: CONT.SHAWNA_BAG, tags: [CONT.SHAWNA_BAG] },
  { name: CONT.KID_BAG, tags: [CONT.KID_BAG] },
];

const items: ItemDef[] = [
  // ── Cabin items (category tags only, no container) ──────────────────────
  { name: 'Aluminet 10x6', tags: [CAT.HOT_WEATHER] },
  { name: 'Aluminet 10x20', tags: [CAT.HOT_WEATHER] },
  { name: 'Cots', tags: [CAT.SLEEP] },
  { name: 'Water Cooler', tags: [CAT.DINING] },
  { name: "Dog dog bed", tags: [CAT.DOG] },
  { name: 'Backup Clothes for Kids', tags: [CAT.SAFETY] },
  { name: 'Camp Stove', tags: [CAT.COOKING] },
  { name: 'Cast Iron Griddle', tags: [CAT.COOKING] },
  { name: 'Chair (dual seater)', tags: [CAT.ESSENTIALS] },
  { name: 'Chair - Rocking', tags: [CAT.JOY_FUN] },
  { name: 'Dish Washing Basins (soaking bins)', tags: [CAT.COOKING] },
  { name: 'Dog Fence', tags: [CAT.DOG] },
  { name: 'Dolly', tags: [CAT.SETUP] },
  { name: "Drake's Scooter", tags: [CAT.JOY_FUN] },
  { name: "Kids's blue bike", tags: [CAT.KID_TOYS] },
  { name: "Kids's Chair", tags: [CAT.ESSENTIALS] },
  { name: 'Folding Table (height adjustable)', tags: [CAT.DINING] },
  { name: 'Gazebo', tags: [CAT.ESSENTIALS] },
  { name: 'Guitar', tags: [CAT.JOY_FUN] },
  { name: 'Pillows', tags: [CAT.SLEEP] },
  { name: 'Poles (tarps/aluminet)', tags: [CAT.HOT_WEATHER] },
  { name: 'Propane Tank', tags: [CAT.COOKING] },
  { name: 'Table - Camping Aluminum', tags: [CAT.SETUP] },
  { name: 'Tarp 10x10 (blue)', tags: [CAT.ESSENTIALS] },
  { name: 'Tarp 10x10 (grey/black)', tags: [CAT.ESSENTIALS] },
  { name: 'Tarp 10x15 (blue)', tags: [CAT.ESSENTIALS] },
  { name: 'Blanket - Drake', tags: [CAT.SLEEP] },
  { name: 'Blanket - Kids', tags: [CAT.SLEEP] },
  { name: 'Blanket - Shawna', tags: [CAT.SLEEP] },

  // ── Cooler (food/beverage) ───────────────────────────────────────────────
  { name: 'Bacon (pre-cooked)', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Chicken Breast', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Coffee - Cold Brew', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Corn (frozen)', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Fruit (Seasonal)', is_food: 1, tags: [CONT.COOLER] },
  { name: 'GF Tortillas', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Goat Cheese', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Half & Half', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Peas (frozen)', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Salsa', is_food: 1, tags: [CONT.COOLER] },
  { name: 'String Cheese', is_food: 1, tags: [CONT.COOLER] },
  { name: 'American Cheese', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Arugula', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Asparagus', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Bacon', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Bell Peppers', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Berries', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Bread - GF', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Breakfast Sausage Links', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Breakfast Sausage Patties (Tyson)', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Bulk Breakfast Sausage', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Butter', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Celery', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Chicken', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Chicken Burger', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Chocolate', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Cilantro', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Coffee Creamer', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Corn Cobs', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Cucumber', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Dijon Mustard', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Egg Bites', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Eggs', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Fresh Green Beans', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Fruit Juice Concentrate', is_food: 1, tags: [CONT.COOLER] },
  { name: 'GF Biscuits', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Hamburger Patties', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Hot Dogs', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Ketchup', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Lettuce', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Lunch Meat', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Maple Syrup', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Mayo', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Milk (half gallon jugs)', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Mushrooms', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Mustard', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Onions (raw)', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Peppers', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Salami', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Sausage (Dinner)', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Sliced Cheese', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Sour Cream', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Steak', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Sweet Italian Sausage', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Taco Meat', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Tamales', is_food: 1, tags: [CONT.COOLER] },
  { name: 'Yogurt', is_food: 1, tags: [CONT.COOLER] },

  // ── Food Bin ─────────────────────────────────────────────────────────────
  { name: 'Coffee Instant', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Olive Oil (finishing)', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Soups (canned)', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Apple', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Avocado', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Avocado Toast Seasoning', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Bagels', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Bread (1 loaf)', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Cherries', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Chili (beanless)', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Coffee', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'English Muffins', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Flour - GF', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Granola', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Grape Tomatoes', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Grapes', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Hamburger Buns', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Hamburger Buns - GF', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Hashbrowns', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Hot Sauce', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Hotdog Buns', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Hotdog Buns - GF', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Lemon', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Lidded Coffee Cups (3x)', tags: [CONT.FOOD_BIN, CAT.DINING] },
  { name: 'Oats', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Olive Oil', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Onion', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Pancake Mix - GF', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Pepper Flakes', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Salmon (canned)', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Sardines', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Skewers', tags: [CONT.FOOD_BIN] },
  { name: 'Spray Oil', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Steak Seasoning', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Taco Seasoning', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Tomato', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Tuna (canned in oil)', is_food: 1, tags: [CONT.FOOD_BIN] },
  { name: 'Whiskey', is_food: 1, tags: [CONT.FOOD_BIN] },

  // ── Snack Bin ────────────────────────────────────────────────────────────
  { name: 'Apple Sauce', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Cookies (homemade)', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Crystal Light Lemonade', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Nuts/Peanuts', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Chips', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Tortilla Chips', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Drambuie', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Graham Crackers', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Lime Powder', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Liquid IV', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Marshmallows', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Napkins', tags: [CONT.SNACK_BIN, CAT.DINING] },
  { name: 'Rum', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Simple Syrup', is_food: 1, tags: [CONT.SNACK_BIN] },
  { name: 'Tequila', is_food: 1, tags: [CONT.SNACK_BIN] },

  // ── Cooking Bin ──────────────────────────────────────────────────────────
  { name: 'Bonami (cleanser)', tags: [CONT.COOKING_BIN, CAT.CLEANING] },
  { name: 'Cocktail Shaker', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Bottle Opener', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Can Opener', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Coffee Cup (Drake)', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Coffee Cup (Shawna)', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Coffee Filters', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Coffee Pot', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Cutting Board - Large', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Cutting Board - Mini', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Dish Soap', tags: [CONT.COOKING_BIN, CAT.CLEANING] },
  { name: 'Dispenser - Grill Water', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Dispenser - Olive Oil', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Grill Brush', tags: [CONT.COOKING_BIN] },
  { name: 'Knife (cooking)', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Oven Mitts', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Paper Plates', tags: [CONT.COOKING_BIN] },
  { name: 'Plates', tags: [CONT.COOKING_BIN, CAT.DINING] },
  { name: 'Pot with Lid', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  {
    name: 'Salt & Pepper',
    is_food: 1,
    tags: [CONT.COOKING_BIN, CAT.COOKING],
  },
  { name: 'Spatula', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Spatula - Wood', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Steam Basket', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Strainer', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Table Cloth', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Tongs', tags: [CONT.COOKING_BIN, CAT.COOKING] },
  { name: 'Water Dispenser Pump', tags: [CONT.COOKING_BIN, CAT.DINING] },
  { name: 'Water Jug (collapsible)', tags: [CONT.COOKING_BIN, CAT.DINING] },

  // ── Safety Bin ───────────────────────────────────────────────────────────
  { name: 'Advil', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'After Burn Cream', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Anti Itch Cream', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Bleach & Towels & Bucket', tags: [CONT.SAFETY_BIN, CAT.CLEANING] },
  { name: 'Body Wipes', tags: [CONT.SAFETY_BIN, CAT.HYGIENE] },
  { name: 'Bugs - Citronella Candles', tags: [CONT.SAFETY_BIN, CAT.BUGS] },
  { name: 'Dish Towels', tags: [CONT.SAFETY_BIN, CAT.COOKING] },
  { name: 'Emergency Space Blanket', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'General First Aid Kit', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Gloves - Latex', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Hand Sanitizer', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Hand Sanitizer/Soap', tags: [CONT.SAFETY_BIN, CAT.HYGIENE] },
  { name: 'Hearing Protection', tags: [CONT.SAFETY_BIN, CAT.FESTIVAL] },
  { name: 'Ibuprofen', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Inhaler', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Kleenex', tags: [CONT.SAFETY_BIN, CAT.HYGIENE] },
  { name: 'Laundry Detergent (Kids)', tags: [CONT.SAFETY_BIN, CAT.CLEANING] },
  { name: 'Paper Towels', tags: [CONT.SAFETY_BIN, CAT.COOKING] },
  { name: 'Safety Bracelets', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Scrub Brush', tags: [CONT.SAFETY_BIN, CAT.CLEANING] },
  { name: 'Soap Paper (washing hands)', tags: [CONT.SAFETY_BIN, CAT.HYGIENE] },
  { name: 'Sponges', tags: [CONT.SAFETY_BIN, CAT.CLEANING] },
  { name: 'Spray Cleaner', tags: [CONT.SAFETY_BIN, CAT.CLEANING] },
  { name: 'Sunscreen', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Sunscreen Stickers', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Towels - Drying', tags: [CONT.SAFETY_BIN, CAT.CLEANING] },
  { name: 'Towels - Hand', tags: [CONT.SAFETY_BIN, CAT.HYGIENE] },
  { name: 'Towels - Wash Cloths', tags: [CONT.SAFETY_BIN, CAT.HYGIENE] },
  { name: 'Tylenol', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Walkie Talkies + Charger', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Water Bottles - With Filters', tags: [CONT.SAFETY_BIN, CAT.SAFETY] },
  { name: 'Wet Ones / Wet Wipes', tags: [CONT.SAFETY_BIN, CAT.HYGIENE] },

  // ── Powered Bin ──────────────────────────────────────────────────────────
  { name: 'Cable - Extension Cord (25ft+)', tags: [CONT.POWERED_BIN, CAT.POWER_120V] },
  { name: 'Charger - Dewalt Batteries', tags: [CONT.POWERED_BIN, CAT.POWER_120V] },
  { name: 'Fan - Pink & Blue Misting', tags: [CONT.POWERED_BIN, CAT.HOT_WEATHER] },
  { name: 'Fan (Dewalt) Batteries Only', tags: [CONT.POWERED_BIN, CAT.HOT_WEATHER] },
  { name: 'Fan (Dewalt) w/o Batteries', tags: [CONT.POWERED_BIN, CAT.HOT_WEATHER] },
  { name: 'Fan Personal Lanyard Fans', tags: [CONT.POWERED_BIN, CAT.HOT_WEATHER] },
  { name: 'Swamp Cooler', tags: [CONT.POWERED_BIN, CAT.HOT_WEATHER] },
  { name: 'Watch - Apple Charger', tags: [CONT.POWERED_BIN, CAT.POWER] },
  { name: 'Watch - Garmin Charger', tags: [CONT.POWERED_BIN, CAT.POWER] },
  { name: 'Batteries - AA', tags: [CONT.POWERED_BIN, CAT.POWER] },
  { name: 'Batteries - AAA', tags: [CONT.POWERED_BIN, CAT.POWER] },
  { name: 'Batteries - Portable Chargers', tags: [CONT.POWERED_BIN, CAT.POWER] },
  { name: 'Batteries - Solar Panel', tags: [CONT.POWERED_BIN, CAT.POWER] },
  { name: 'Cable - Micro USB', tags: [CONT.POWERED_BIN, CAT.POWER] },
  { name: 'Cable - USB C', tags: [CONT.POWERED_BIN, CAT.POWER] },
  { name: 'Lights - Flashlights', tags: [CONT.POWERED_BIN, CAT.NIGHTTIME] },
  { name: 'Lights - Ground Lights', tags: [CONT.POWERED_BIN, CAT.NIGHTTIME] },
  { name: 'Lights - Lanterns', tags: [CONT.POWERED_BIN, CAT.NIGHTTIME] },
  { name: 'Lights - LED String Lights', tags: [CONT.POWERED_BIN, CAT.NIGHTTIME] },
  { name: 'Lights - Pathway', tags: [CONT.POWERED_BIN, CAT.NIGHTTIME] },

  // ── Setup Bin ────────────────────────────────────────────────────────────
  { name: 'Drill', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Drill - For Ground Screw Stakes', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Hammer', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Nails', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Stakes (screw in)', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Stakes (Screw Stakes) - Tent/Tarp', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Air Pump', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Bags - Bottle Drop', tags: [CONT.SETUP_BIN, CAT.CLEANING] },
  { name: 'Bags - Garbage Bags', tags: [CONT.SETUP_BIN, CAT.CLEANING] },
  { name: 'Binder Clips', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Broom and Dust Pan', tags: [CONT.SETUP_BIN, CAT.CLEANING] },
  { name: 'Brown Paper Bag', tags: [CONT.SETUP_BIN, CAT.CLEANING] },
  { name: 'Butane for Refills', tags: [CONT.SETUP_BIN, CAT.CAMPFIRE] },
  { name: 'Hatchet/Ax', tags: [CONT.SETUP_BIN, CAT.CAMPFIRE] },
  { name: 'Hooks', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Lighter', tags: [CONT.SETUP_BIN, CAT.ESSENTIALS] },
  { name: 'Matches', tags: [CONT.SETUP_BIN, CAT.ESSENTIALS] },
  { name: 'Newspaper', tags: [CONT.SETUP_BIN, CAT.CAMPFIRE] },
  { name: 'Paper Bags', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Paracord', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Red Bike Flag', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Rope - Nylon cord/clothesline', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Tape - Duct', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Temperature Gauge', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Twist Ties', tags: [CONT.SETUP_BIN, CAT.SETUP] },
  { name: 'Ziplock Bags', tags: [CONT.SETUP_BIN, CAT.ESSENTIALS] },
  { name: 'Zipties', tags: [CONT.SETUP_BIN, CAT.SETUP] },

  // ── Cargo Carrier ────────────────────────────────────────────────────────
  { name: 'Air Mattress (Exped) - Drake', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Air Mattress (Exped) - Shawna', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Air Mattress (White/Blue) - Kids', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Carpet', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Exped Sheets', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Rumple', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Sleeping Bag - Drake', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Sleeping Bag - Kids', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Sleeping Bag - Shawna', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },
  { name: 'Tarp 10x10 (grey)', tags: [CONT.CARGO_CARRIER, CAT.ESSENTIALS] },
  { name: 'Tarp 10x15 (blue) (Cargo)', tags: [CONT.CARGO_CARRIER, CAT.ESSENTIALS] },
  { name: 'Tent', tags: [CONT.CARGO_CARRIER, CAT.SLEEP] },

  // ── Seating Bin ──────────────────────────────────────────────────────────
  { name: 'Chairs (sm blue/black)', tags: [CONT.SEATING_BIN, CAT.ESSENTIALS] },
  { name: 'Hammock', tags: [CONT.SEATING_BIN, CAT.JOY_FUN] },
  { name: 'Purple Air Couch', tags: [CONT.SEATING_BIN, CAT.JOY_FUN] },
  { name: 'Tripod Chair', tags: [CONT.SEATING_BIN, CAT.ESSENTIALS] },

  // ── Fun Bin ──────────────────────────────────────────────────────────────
  { name: 'Ball (football/kickball)', tags: [CONT.FUN_BIN, CAT.JOY_FUN] },
  { name: 'Binoculars', tags: [CONT.FUN_BIN, CAT.JOY_FUN] },
  { name: 'Boardgame - Compile', tags: [CONT.FUN_BIN, CAT.JOY_FUN] },
  { name: 'Boardgame - Doomlings', tags: [CONT.FUN_BIN, CAT.JOY_FUN] },
  { name: 'Boardgame - Welcome To', tags: [CONT.FUN_BIN, CAT.JOY_FUN] },
  { name: 'Playing Cards / Card Games', tags: [CONT.FUN_BIN, CAT.JOY_FUN] },

  // ── Kids's Toy Bin ──────────────────────────────────────────────────────
  { name: 'Bubbles (rope, solution, bucket)', tags: [CONT.KID_TOY_BIN, CAT.KID_TOYS] },
  { name: 'Coloring Books', tags: [CONT.KID_TOY_BIN, CAT.KID_TOYS] },
  { name: "Kids's Tablet", tags: [CONT.KID_TOY_BIN, CAT.KID_TOYS] },
  { name: 'Markers', tags: [CONT.KID_TOY_BIN, CAT.KID_TOYS] },
  { name: 'Swimming Pool', tags: [CONT.KID_TOY_BIN, CAT.KID_TOYS] },
  { name: 'Water Guns', tags: [CONT.KID_TOY_BIN, CAT.KID_TOYS] },

  // ── Dog Bin ───────────────────────────────────────────────────────────
  { name: 'Dog Bones', tags: [CONT.DOG_BIN, CAT.DOG] },
  { name: 'Dog First Aid Kit', tags: [CONT.DOG_BIN, CAT.DOG] },
  { name: 'Dog Food', tags: [CONT.DOG_BIN, CAT.DOG] },
  { name: 'Dog Leash', tags: [CONT.DOG_BIN, CAT.DOG] },
  { name: 'Dog Treats', tags: [CONT.DOG_BIN, CAT.DOG] },
  { name: 'Tie Out', tags: [CONT.DOG_BIN, CAT.DOG] },
  { name: 'Water Bowl', tags: [CONT.DOG_BIN, CAT.DOG] },

  // ── Dish Washing Basin ───────────────────────────────────────────────────
  { name: 'Cast Iron Scrubber', tags: [CONT.DISH_BASIN, CAT.CLEANING] },
  { name: 'Hot Dog Roasters', tags: [CONT.DISH_BASIN, CAT.CAMPFIRE] },
  { name: 'Silverware (loose)', tags: [CONT.DISH_BASIN, CAT.DINING] },
  { name: 'Silverware (sets)', tags: [CONT.DISH_BASIN, CAT.DINING] },

  // ── Personal items — unique to one person ────────────────────────────────
  { name: 'Baby Blankets', tags: [CONT.KID_BAG, CAT.SLEEP] },
  { name: 'Baby Wipes', tags: [CONT.KID_BAG, CAT.HYGIENE] },
  { name: 'Diaper Cream', tags: [CONT.KID_BAG, CAT.HYGIENE] },
  { name: 'Pullup/Diapers', tags: [CONT.KID_BAG, CAT.HYGIENE] },
  { name: 'White Noise Machine', tags: [CONT.KID_BAG, CAT.SLEEP] },
  { name: 'Ear Plugs (sleeping)', tags: [CONT.DRAKE_BAG, CAT.SLEEP] },
  { name: 'Eye Mask', tags: [CONT.DRAKE_BAG, CAT.SLEEP] },
  { name: 'Floss', tags: [CONT.DRAKE_BAG, CAT.HYGIENE] },
  { name: 'Foot/Face Mask (moisturizer)', tags: [CONT.DRAKE_BAG, CAT.JOY_FUN] },
  { name: 'Lip Balm', tags: [CONT.DRAKE_BAG, CAT.HYGIENE] },
  { name: 'Toothbrush', tags: [CONT.DRAKE_BAG, CAT.HYGIENE] },
  { name: 'Toothpaste', tags: [CONT.DRAKE_BAG, CAT.HYGIENE] },
  { name: 'Lip Balm and Sunscreen', tags: [CONT.SHAWNA_BAG, CAT.HYGIENE] },
  { name: 'Make Up', tags: [CONT.SHAWNA_BAG, CAT.HYGIENE] },
  { name: 'Pillow', tags: [CONT.SHAWNA_BAG] },
  { name: 'Toothbrush, Toothpaste & Floss', tags: [CONT.SHAWNA_BAG, CAT.HYGIENE] },

  // ── Personal items — shared across bags (is_personal=1, deduped) ─────────
  // Primary container tag is Drake's (first occurrence), also tagged with others
  {
    name: 'Athletic Shoes',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Beach Towel / Bath Towel',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.SHAWNA_BAG, CONT.KID_BAG],
  },
  {
    name: 'Comb and Brush',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG, CAT.HYGIENE],
  },
  {
    name: 'Deodorant',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.SHAWNA_BAG, CAT.HYGIENE],
  },
  {
    name: 'Extra Glasses/Contacts & Prescription',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.SHAWNA_BAG, CAT.HYGIENE],
  },
  {
    name: 'Hand Towels',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Jeans/Pants',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Medications',
    is_personal: 1,
    tags: [CONT.KID_BAG, CONT.DRAKE_BAG, CONT.SHAWNA_BAG, CAT.HYGIENE],
  },
  {
    name: 'Pajamas',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Sandals',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Shampoo/Soap',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.SHAWNA_BAG, CAT.HYGIENE],
  },
  {
    name: 'Shorts',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Socks',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Sunglasses',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG, CAT.SAFETY],
  },
  {
    name: 'Sweatshirt',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Swimsuit',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG, CAT.WATER_ACTIVITIES],
  },
  {
    name: 'T-Shirts',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Underwear',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG],
  },
  {
    name: 'Water Socks',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.KID_BAG, CONT.SHAWNA_BAG, CAT.WATER_ACTIVITIES],
  },
  {
    name: 'Wicking Shirts',
    is_personal: 1,
    tags: [CONT.DRAKE_BAG, CONT.SHAWNA_BAG, CAT.HOT_WEATHER],
  },
];

export function seedGearLibrary(db: Database.Database): void {
  try {
    const existing = db.prepare('SELECT COUNT(*) as count FROM gear_items').get() as { count: number };
    if (existing.count > 0) return;

    // Collect all unique tag names
    const categoryTagNames = Object.values(CAT);
    const containerTagNames = Object.values(CONT);

    const insertTag = db.prepare(
      'INSERT OR IGNORE INTO gear_tags (name, color) VALUES (?, ?)'
    );
    const getTagId = db.prepare('SELECT id FROM gear_tags WHERE name = ?');

    const seedAll = db.transaction(() => {
      // Insert tags
      for (const name of categoryTagNames) insertTag.run(name, '#6366f1');
      for (const name of containerTagNames) insertTag.run(name, '#f59e0b');

      // Build tag name → id map
      const tagMap = new Map<string, number>();
      const allTagNames = [...categoryTagNames, ...containerTagNames];
      for (const name of allTagNames) {
        const row = getTagId.get(name) as { id: number } | undefined;
        if (row) tagMap.set(name, row.id);
      }

      // Insert containers and link their container-name tags
      const insertContainer = db.prepare(
        'INSERT INTO gear_containers (name, description, capacity_notes, is_personal) VALUES (?, ?, ?, ?)'
      );
      const insertContainerTag = db.prepare(
        'INSERT OR IGNORE INTO gear_container_tags (gear_container_id, tag_id, sort_order) VALUES (?, ?, ?)'
      );

      for (const c of containers) {
        const info = insertContainer.run(
          c.name,
          c.description ?? null,
          c.capacity_notes ?? null,
          c.is_personal ?? 0
        );
        const containerId = info.lastInsertRowid as number;
        for (let i = 0; i < c.tags.length; i++) {
          const tid = tagMap.get(c.tags[i]);
          if (tid) insertContainerTag.run(containerId, tid, i);
        }
      }

      // Insert items and link their tags
      const insertItem = db.prepare(
        'INSERT INTO gear_items (name, is_food, is_personal, quantity_formula, base_quantity) VALUES (?, ?, ?, ?, ?)'
      );
      const insertItemTag = db.prepare(
        'INSERT OR IGNORE INTO gear_item_tags (gear_item_id, tag_id, sort_order) VALUES (?, ?, ?)'
      );

      for (const item of items) {
        const info = insertItem.run(
          item.name,
          item.is_food ?? 0,
          item.is_personal ?? 0,
          item.quantity_formula ?? 'fixed',
          item.base_quantity ?? 1
        );
        const itemId = info.lastInsertRowid as number;
        for (let i = 0; i < item.tags.length; i++) {
          const tid = tagMap.get(item.tags[i]);
          if (tid) insertItemTag.run(itemId, tid, i);
        }
      }
    });

    seedAll();
    console.log(`[Seeds] Gear library seeded: ${containers.length} containers, ${items.length} items`);
  } catch (err: unknown) {
    console.error('[Seeds] Error seeding gear library:', err instanceof Error ? err.message : err);
  }
}
