import express, { Request, Response } from 'express';
import { db, canAccessTrip } from '../db/database';
import { authenticate } from '../middleware/auth';
import { AuthRequest, TripMeal, TripMealItem } from '../types';

const router = express.Router({ mergeParams: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadMealItems(mealId: number): TripMealItem[] {
  const rows = db.prepare(`
    SELECT tmi.*, COALESCE(tmi.custom_food_name, gi.name) as name
    FROM trip_meal_items tmi
    LEFT JOIN gear_items gi ON tmi.gear_item_id = gi.id
    WHERE tmi.meal_id = ?
    ORDER BY tmi.sort_order ASC
  `).all(mealId) as TripMealItem[];
  return rows;
}

// ─── Meals for a day ──────────────────────────────────────────────────────────

router.get('/', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, dayId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const day = db.prepare('SELECT id FROM days WHERE id = ? AND trip_id = ?').get(dayId, tripId);
  if (!day) return res.status(404).json({ error: 'Day not found' });

  const meals = db.prepare(
    'SELECT * FROM trip_meals WHERE day_id = ? AND trip_id = ? ORDER BY sort_order ASC, meal_type ASC'
  ).all(dayId, tripId) as TripMeal[];

  const result = meals.map(m => ({ ...m, items: loadMealItems(m.id) }));
  res.json({ meals: result });
});

router.post('/', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, dayId } = req.params;
  const { meal_type, name, notes } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const day = db.prepare('SELECT id FROM days WHERE id = ? AND trip_id = ?').get(dayId, tripId);
  if (!day) return res.status(404).json({ error: 'Day not found' });

  const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (meal_type && !validTypes.includes(meal_type)) {
    return res.status(400).json({ error: 'Invalid meal_type' });
  }

  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM trip_meals WHERE day_id = ?').get(dayId) as { m: number | null }).m ?? -1;

  const result = db.prepare(`
    INSERT INTO trip_meals (trip_id, day_id, meal_type, name, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tripId, dayId, meal_type || 'dinner', name || null, notes || null, maxOrder + 1);

  const meal = db.prepare('SELECT * FROM trip_meals WHERE id = ?').get(result.lastInsertRowid) as TripMeal;
  res.status(201).json({ meal: { ...meal, items: [] } });
});

router.put('/:mealId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, dayId, mealId } = req.params;
  const { meal_type, name, notes, sort_order } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const meal = db.prepare('SELECT * FROM trip_meals WHERE id = ? AND day_id = ? AND trip_id = ?').get(mealId, dayId, tripId) as TripMeal | undefined;
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  if (meal_type) {
    const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validTypes.includes(meal_type)) return res.status(400).json({ error: 'Invalid meal_type' });
  }

  db.prepare(`
    UPDATE trip_meals SET
      meal_type = COALESCE(?, meal_type),
      name = CASE WHEN ? IS NOT NULL THEN ? ELSE name END,
      notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
      sort_order = CASE WHEN ? IS NOT NULL THEN ? ELSE sort_order END
    WHERE id = ?
  `).run(
    meal_type || null,
    name !== undefined ? name : null, name !== undefined ? name : null,
    notes !== undefined ? notes : null, notes !== undefined ? notes : null,
    sort_order !== undefined ? 1 : null, sort_order !== undefined ? sort_order : null,
    mealId
  );

  const updated = db.prepare('SELECT * FROM trip_meals WHERE id = ?').get(mealId) as TripMeal;
  res.json({ meal: { ...updated, items: loadMealItems(updated.id) } });
});

router.delete('/:mealId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, dayId, mealId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const meal = db.prepare('SELECT id FROM trip_meals WHERE id = ? AND day_id = ? AND trip_id = ?').get(mealId, dayId, tripId);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  db.prepare('DELETE FROM trip_meals WHERE id = ?').run(mealId);
  res.json({ success: true });
});

// ─── Meal items ───────────────────────────────────────────────────────────────

router.post('/:mealId/items', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, dayId, mealId } = req.params;
  const { gear_item_id, custom_food_name, quantity_per_person, unit, notes } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const meal = db.prepare('SELECT id FROM trip_meals WHERE id = ? AND day_id = ? AND trip_id = ?').get(mealId, dayId, tripId);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  if (!gear_item_id && !custom_food_name?.trim()) {
    return res.status(400).json({ error: 'Either gear_item_id or custom_food_name is required' });
  }
  if (gear_item_id) {
    const item = db.prepare('SELECT id FROM gear_items WHERE id = ?').get(gear_item_id);
    if (!item) return res.status(404).json({ error: 'Gear item not found' });
  }

  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM trip_meal_items WHERE meal_id = ?').get(mealId) as { m: number | null }).m ?? -1;

  const result = db.prepare(`
    INSERT INTO trip_meal_items (meal_id, gear_item_id, custom_food_name, quantity_per_person, unit, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    mealId, gear_item_id || null, custom_food_name?.trim() || null,
    quantity_per_person ?? 1, unit || null, notes || null, maxOrder + 1
  );

  const item = db.prepare(`
    SELECT tmi.*, COALESCE(tmi.custom_food_name, gi.name) as name
    FROM trip_meal_items tmi
    LEFT JOIN gear_items gi ON tmi.gear_item_id = gi.id
    WHERE tmi.id = ?
  `).get(result.lastInsertRowid) as TripMealItem;

  res.status(201).json({ item });
});

router.put('/:mealId/items/:itemId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, dayId, mealId, itemId } = req.params;
  const { quantity_per_person, unit, notes, custom_food_name, sort_order } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const meal = db.prepare('SELECT id FROM trip_meals WHERE id = ? AND day_id = ? AND trip_id = ?').get(mealId, dayId, tripId);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  const mealItem = db.prepare('SELECT id FROM trip_meal_items WHERE id = ? AND meal_id = ?').get(itemId, mealId);
  if (!mealItem) return res.status(404).json({ error: 'Meal item not found' });

  db.prepare(`
    UPDATE trip_meal_items SET
      custom_food_name = CASE WHEN ? IS NOT NULL THEN ? ELSE custom_food_name END,
      quantity_per_person = CASE WHEN ? IS NOT NULL THEN ? ELSE quantity_per_person END,
      unit = CASE WHEN ? IS NOT NULL THEN ? ELSE unit END,
      notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
      sort_order = CASE WHEN ? IS NOT NULL THEN ? ELSE sort_order END
    WHERE id = ?
  `).run(
    custom_food_name !== undefined ? custom_food_name : null, custom_food_name !== undefined ? custom_food_name : null,
    quantity_per_person !== undefined ? 1 : null, quantity_per_person !== undefined ? quantity_per_person : null,
    unit !== undefined ? unit : null, unit !== undefined ? unit : null,
    notes !== undefined ? notes : null, notes !== undefined ? notes : null,
    sort_order !== undefined ? 1 : null, sort_order !== undefined ? sort_order : null,
    itemId
  );

  const updated = db.prepare(`
    SELECT tmi.*, COALESCE(tmi.custom_food_name, gi.name) as name
    FROM trip_meal_items tmi
    LEFT JOIN gear_items gi ON tmi.gear_item_id = gi.id
    WHERE tmi.id = ?
  `).get(itemId) as TripMealItem;

  res.json({ item: updated });
});

router.delete('/:mealId/items/:itemId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, dayId, mealId, itemId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const meal = db.prepare('SELECT id FROM trip_meals WHERE id = ? AND day_id = ? AND trip_id = ?').get(mealId, dayId, tripId);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  const mealItem = db.prepare('SELECT id FROM trip_meal_items WHERE id = ? AND meal_id = ?').get(itemId, mealId);
  if (!mealItem) return res.status(404).json({ error: 'Meal item not found' });

  db.prepare('DELETE FROM trip_meal_items WHERE id = ?').run(itemId);
  res.json({ success: true });
});

export default router;
