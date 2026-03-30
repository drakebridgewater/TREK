import Database from 'better-sqlite3';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealTemplateDef {
  name: string;
  meal_type: MealType;
  ingredients: string[];  // gear_item names — matched by name after gear seed
}

const mealTemplates: MealTemplateDef[] = [
  // ── Breakfast ────────────────────────────────────────────────────────────
  {
    name: 'Egg Bites & Bacon & Toast',
    meal_type: 'breakfast',
    ingredients: ['Egg Bites', 'Bacon (pre-cooked)', 'Bread (1 loaf)'],
  },
  {
    name: 'Bacon Breakfast Sandwiches',
    meal_type: 'breakfast',
    ingredients: [
      'Bacon (pre-cooked)',
      'Eggs',
      'American Cheese',
      'Sliced Cheese',
      'English Muffins',
      'GF Tortillas',
      'Bread - GF',
    ],
  },
  {
    name: 'Ethan (Breakfast)',
    meal_type: 'breakfast',
    ingredients: ['Bacon (pre-cooked)', 'Corn (frozen)', 'Peas (frozen)'],
  },
  {
    name: 'Sausage Breakfast Sandwiches',
    meal_type: 'breakfast',
    ingredients: [
      'Breakfast Sausage Patties (Tyson)',
      'Eggs',
      'Sliced Cheese',
      'American Cheese',
      'English Muffins',
      'GF Tortillas',
      'Bread - GF',
    ],
  },
  {
    name: 'Biscuits & Gravy',
    meal_type: 'breakfast',
    ingredients: ['Bulk Breakfast Sausage', 'Milk (half gallon jugs)', 'Flour - GF', 'Bread - GF'],
  },
  {
    name: 'Pancakes',
    meal_type: 'breakfast',
    ingredients: ['Pancake Mix - GF', 'Butter', 'Maple Syrup'],
  },
  {
    name: 'Overnight Oats',
    meal_type: 'breakfast',
    ingredients: ['Oats', 'Milk (half gallon jugs)', 'Berries'],
  },
  {
    name: 'Yogurt Parfait',
    meal_type: 'breakfast',
    ingredients: ['Yogurt', 'Granola', 'Berries'],
  },
  {
    name: 'Skillet Meal',
    meal_type: 'breakfast',
    ingredients: ['Bulk Breakfast Sausage', 'Eggs', 'Hashbrowns', 'Peppers'],
  },
  {
    name: 'Sausage & Veggie Skillet',
    meal_type: 'breakfast',
    ingredients: ['Sausage (Dinner)', 'Brats', 'Bell Peppers', 'Onion'],
  },
  {
    name: 'Avocado Toast',
    meal_type: 'breakfast',
    ingredients: ['Avocado', 'Avocado Toast Seasoning', 'Bread (1 loaf)', 'Bread - GF'],
  },
  {
    name: 'Bagels w/Salmon',
    meal_type: 'breakfast',
    ingredients: ['Bagels', 'Salmon (canned)', 'Goat Cheese', 'Bread - GF'],
  },
  {
    name: 'Bagel Sandwiches',
    meal_type: 'breakfast',
    ingredients: [
      'Bagels',
      'Bacon (pre-cooked)',
      'Eggs',
      'American Cheese',
      'Sliced Cheese',
      'Goat Cheese',
      'Bread - GF',
    ],
  },
  {
    name: 'Essentials (Breakfast)',
    meal_type: 'breakfast',
    ingredients: [
      'Coffee',
      'Coffee Instant',
      'Coffee - Cold Brew',
      'Half & Half',
      'Coffee Creamer',
      'Olive Oil',
      'Spray Oil',
      'Salt & Pepper',
    ],
  },

  // ── Lunch ────────────────────────────────────────────────────────────────
  {
    name: 'Tuna Salad',
    meal_type: 'lunch',
    ingredients: [
      'Tuna (canned in oil)',
      'Sardines',
      'Apple',
      'Celery',
      'Cucumber',
      'Cilantro',
      'Grape Tomatoes',
      'Parsley',
      'Lemon',
    ],
  },
  {
    name: 'Sandwiches',
    meal_type: 'lunch',
    ingredients: [
      'Bread (1 loaf)',
      'Bread - GF',
      'Lunch Meat',
      'Sliced Cheese',
      'Lettuce',
      'Tomato',
      'Mayo',
      'Mustard',
      'Dijon Mustard',
    ],
  },
  {
    name: 'Grilled Cheese',
    meal_type: 'lunch',
    ingredients: ['Bread (1 loaf)', 'Bread - GF', 'Sliced Cheese', 'Lunch Meat'],
  },
  {
    name: 'Cold Cuts Roll ups',
    meal_type: 'lunch',
    ingredients: [
      'Lunch Meat',
      'Sliced Cheese',
      'Lettuce',
      'Avocado',
      'Mustard',
    ],
  },
  {
    name: 'Essentials (Lunch)',
    meal_type: 'lunch',
    ingredients: [
      'Soups (canned)',
      'Chips',
      'Tortilla Chips',
      'Salsa',
    ],
  },

  // ── Dinner ───────────────────────────────────────────────────────────────
  {
    name: 'Burgers & Grilled Veggies',
    meal_type: 'dinner',
    ingredients: [
      'Hamburger Patties',
      'Chicken Burger',
      'Hamburger Buns',
      'Hamburger Buns - GF',
      'Sliced Cheese',
      'American Cheese',
      'Lettuce',
      'Tomato',
      'Onion',
      'Ketchup',
      'Mustard',
      'Dijon Mustard',
      'Mayo',
      'Corn (frozen)',
      'Peas (frozen)',
      'Steak Seasoning',
    ],
  },
  {
    name: 'Hot Dogs & Chili',
    meal_type: 'dinner',
    ingredients: [
      'Hot Dogs',
      'Hotdog Buns',
      'Hotdog Buns - GF',
      'Chili (beanless)',
      'Ketchup',
      'Mustard',
      'Dijon Mustard',
      'Corn (frozen)',
      'Peas (frozen)',
    ],
  },
  {
    name: 'Tacos',
    meal_type: 'dinner',
    ingredients: [
      'Taco Meat',
      'GF Tortillas',
      'Tortilla Chips',
      'Lettuce',
      'Tomato',
      'Avocado',
      'Salsa',
      'Sour Cream',
      'Hot Sauce',
      'Taco Seasoning',
      'Onion',
    ],
  },
  {
    name: 'Tamales & Chips/Salsa',
    meal_type: 'dinner',
    ingredients: ['Tamales', 'Tortilla Chips', 'Salsa', 'Sour Cream', 'Hot Sauce'],
  },
  {
    name: 'Steak & Salad',
    meal_type: 'dinner',
    ingredients: [
      'Steak',
      'Steak Seasoning',
      'Arugula',
      'Goat Cheese',
      'Grapes',
      'Mushrooms',
      'Lemon',
      'Olive Oil',
    ],
  },
  {
    name: 'Kababs',
    meal_type: 'dinner',
    ingredients: ['Chicken', 'Onions (raw)', 'Peppers', 'Skewers'],
  },
  {
    name: 'Essentials (Dinner)',
    meal_type: 'dinner',
    ingredients: ['Olive Oil', 'Olive Oil (finishing)', 'Spray Oil', 'Salt & Pepper', 'Pepper Flakes'],
  },

  // ── Snacks / Drinks ──────────────────────────────────────────────────────
  {
    name: 'Essentials (Snacks)',
    meal_type: 'snack',
    ingredients: [
      'Apple Sauce',
      'Cookies (homemade)',
      'Crystal Light Lemonade',
      'Nuts/Peanuts',
      'Chips',
      'Liquid IV',
      'Salsa',
      'String Cheese',
    ],
  },
  {
    name: 'Fruit',
    meal_type: 'snack',
    ingredients: ['Fruit (Seasonal)', 'Berries', 'Grapes', 'Apple', 'Cherries'],
  },
  {
    name: "S'mores",
    meal_type: 'snack',
    ingredients: ['Marshmallows', 'Graham Crackers', 'Chocolate'],
  },
  {
    name: 'Margarita',
    meal_type: 'snack',
    ingredients: ['Tequila', 'Lime Powder', 'Simple Syrup'],
  },
  {
    name: 'Fruity Cocktails',
    meal_type: 'snack',
    ingredients: ['Rum', 'Fruit Juice Concentrate'],
  },
  {
    name: 'Rusty Nail Cocktail',
    meal_type: 'snack',
    ingredients: ['Whiskey', 'Drambuie'],
  },
  {
    name: 'Drinks',
    meal_type: 'snack',
    ingredients: ['Milk (half gallon jugs)', 'Coffee', 'Coffee - Cold Brew', 'Crystal Light Lemonade'],
  },
];

export function seedMealTemplates(db: Database.Database): void {
  try {
    const existing = db.prepare('SELECT COUNT(*) as count FROM meal_templates').get() as { count: number };
    if (existing.count > 0) return;

    const insertTemplate = db.prepare(
      'INSERT INTO meal_templates (name, meal_type) VALUES (?, ?)'
    );
    const insertTemplateItem = db.prepare(
      'INSERT INTO meal_template_items (meal_template_id, gear_item_id, custom_food_name, quantity_per_person, sort_order) VALUES (?, ?, ?, 1, ?)'
    );
    const findItem = db.prepare('SELECT id FROM gear_items WHERE name = ? LIMIT 1');

    const seedAll = db.transaction(() => {
      for (const tmpl of mealTemplates) {
        const result = insertTemplate.run(tmpl.name, tmpl.meal_type);
        const templateId = result.lastInsertRowid as number;

        for (let i = 0; i < tmpl.ingredients.length; i++) {
          const ingredientName = tmpl.ingredients[i];
          const itemRow = findItem.get(ingredientName) as { id: number } | undefined;
          if (itemRow) {
            insertTemplateItem.run(templateId, itemRow.id, null, i);
          } else {
            // Insert as custom_food_name if gear item not found
            insertTemplateItem.run(templateId, null, ingredientName, i);
          }
        }
      }
    });

    seedAll();
    console.log(`[Seeds] Meal templates seeded: ${mealTemplates.length} templates`);
  } catch (err: unknown) {
    console.error('[Seeds] Error seeding meal templates:', err instanceof Error ? err.message : err);
  }
}
