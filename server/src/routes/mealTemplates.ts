import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, gearAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Helper — fetch template with items
function getTemplateDetail(id: number) {
  const template = db
    .prepare('SELECT * FROM meal_templates WHERE id = ?')
    .get(id) as Record<string, unknown> | undefined;
  if (!template) return null;

  const items = db
    .prepare(`
      SELECT mti.*, COALESCE(mti.custom_food_name, gi.name) AS name
      FROM meal_template_items mti
      LEFT JOIN gear_items gi ON gi.id = mti.gear_item_id
      WHERE mti.meal_template_id = ?
      ORDER BY mti.sort_order
    `)
    .all(id);

  return { ...template, items };
}

// GET /meal-templates — list all with item count
router.get('/', authenticate, (_req: AuthRequest, res: Response) => {
  const templates = db
    .prepare(`
      SELECT mt.*, COUNT(mti.id) AS item_count
      FROM meal_templates mt
      LEFT JOIN meal_template_items mti ON mti.meal_template_id = mt.id
      GROUP BY mt.id
      ORDER BY mt.meal_type, mt.name
    `)
    .all();
  res.json({ templates });
});

// GET /meal-templates/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  const template = getTemplateDetail(Number(req.params.id));
  if (!template) return res.status(404).json({ error: 'Not found' });
  res.json({ template });
});

// POST /meal-templates
router.post('/', authenticate, gearAdmin, (req: AuthRequest, res: Response) => {
  const { name, description, meal_type, notes } = req.body as Record<string, string>;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const result = db
    .prepare(
      'INSERT INTO meal_templates (name, description, meal_type, notes, created_by) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name, description ?? null, meal_type ?? 'dinner', notes ?? null, req.user.id);
  const template = getTemplateDetail(result.lastInsertRowid as number);
  res.status(201).json({ template });
});

// PUT /meal-templates/:id
router.put('/:id', authenticate, gearAdmin, (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM meal_templates WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, description, meal_type, notes } = req.body as Record<string, string>;
  db.prepare(`
    UPDATE meal_templates
    SET name = COALESCE(?, name),
        description = ?,
        meal_type = COALESCE(?, meal_type),
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name ?? null, description ?? null, meal_type ?? null, notes ?? null, id);
  res.json({ template: getTemplateDetail(id) });
});

// DELETE /meal-templates/:id
router.delete('/:id', authenticate, gearAdmin, (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM meal_templates WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM meal_templates WHERE id = ?').run(id);
  res.json({ success: true });
});

// POST /meal-templates/:id/items
router.post('/:id/items', authenticate, gearAdmin, (req: AuthRequest, res: Response) => {
  const templateId = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM meal_templates WHERE id = ?').get(templateId);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { gear_item_id, custom_food_name, quantity_per_person, unit, notes } = req.body as {
    gear_item_id?: number;
    custom_food_name?: string;
    quantity_per_person?: number;
    unit?: string;
    notes?: string;
  };

  if (!gear_item_id && !custom_food_name) {
    return res.status(400).json({ error: 'gear_item_id or custom_food_name required' });
  }

  const maxSort = db
    .prepare('SELECT MAX(sort_order) AS m FROM meal_template_items WHERE meal_template_id = ?')
    .get(templateId) as { m: number | null };
  const sort_order = (maxSort.m ?? -1) + 1;

  const result = db
    .prepare(`
      INSERT INTO meal_template_items
        (meal_template_id, gear_item_id, custom_food_name, quantity_per_person, unit, notes, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      templateId,
      gear_item_id ?? null,
      custom_food_name ?? null,
      quantity_per_person ?? 1,
      unit ?? null,
      notes ?? null,
      sort_order
    );

  const item = db
    .prepare(`
      SELECT mti.*, COALESCE(mti.custom_food_name, gi.name) AS name
      FROM meal_template_items mti
      LEFT JOIN gear_items gi ON gi.id = mti.gear_item_id
      WHERE mti.id = ?
    `)
    .get(result.lastInsertRowid as number);

  res.status(201).json({ item });
});

// PUT /meal-templates/:id/items/:itemId
router.put('/:id/items/:itemId', authenticate, gearAdmin, (req: AuthRequest, res: Response) => {
  const itemId = Number(req.params.itemId);
  const existing = db
    .prepare('SELECT id FROM meal_template_items WHERE id = ? AND meal_template_id = ?')
    .get(itemId, Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { quantity_per_person, unit, notes, custom_food_name, sort_order } = req.body as {
    quantity_per_person?: number;
    unit?: string;
    notes?: string;
    custom_food_name?: string;
    sort_order?: number;
  };

  db.prepare(`
    UPDATE meal_template_items
    SET quantity_per_person = COALESCE(?, quantity_per_person),
        unit = ?,
        notes = ?,
        custom_food_name = COALESCE(?, custom_food_name),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    quantity_per_person ?? null,
    unit ?? null,
    notes ?? null,
    custom_food_name ?? null,
    sort_order ?? null,
    itemId
  );

  const item = db
    .prepare(`
      SELECT mti.*, COALESCE(mti.custom_food_name, gi.name) AS name
      FROM meal_template_items mti
      LEFT JOIN gear_items gi ON gi.id = mti.gear_item_id
      WHERE mti.id = ?
    `)
    .get(itemId);

  res.json({ item });
});

// DELETE /meal-templates/:id/items/:itemId
router.delete('/:id/items/:itemId', authenticate, gearAdmin, (req: AuthRequest, res: Response) => {
  const itemId = Number(req.params.itemId);
  const existing = db
    .prepare('SELECT id FROM meal_template_items WHERE id = ? AND meal_template_id = ?')
    .get(itemId, Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM meal_template_items WHERE id = ?').run(itemId);
  res.json({ success: true });
});

// POST /trips/:tripId/days/:dayId/meals/apply-template/:templateId
// (Registered separately in index.ts under trip routes)
export function applyMealTemplate(req: AuthRequest, res: Response) {
  const tripId = Number(req.params.tripId);
  const dayId = Number(req.params.dayId);
  const templateId = Number(req.params.templateId);

  const template = db
    .prepare('SELECT * FROM meal_templates WHERE id = ?')
    .get(templateId) as { id: number; name: string; meal_type: string } | undefined;
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const templateItems = db
    .prepare('SELECT * FROM meal_template_items WHERE meal_template_id = ? ORDER BY sort_order')
    .all(templateId) as Array<{
      gear_item_id: number | null;
      custom_food_name: string | null;
      quantity_per_person: number;
      unit: string | null;
      notes: string | null;
      sort_order: number;
    }>;

  const apply = db.transaction(() => {
    const maxSort = db
      .prepare('SELECT MAX(sort_order) AS m FROM trip_meals WHERE day_id = ?')
      .get(dayId) as { m: number | null };
    const sort_order = (maxSort.m ?? -1) + 1;

    const mealResult = db
      .prepare(`
        INSERT INTO trip_meals (trip_id, day_id, meal_template_id, meal_type, name, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(tripId, dayId, templateId, template.meal_type, template.name, sort_order);

    const mealId = mealResult.lastInsertRowid as number;

    for (const ti of templateItems) {
      db.prepare(`
        INSERT INTO trip_meal_items
          (meal_id, gear_item_id, custom_food_name, quantity_per_person, unit, notes, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        mealId,
        ti.gear_item_id ?? null,
        ti.custom_food_name ?? null,
        ti.quantity_per_person,
        ti.unit ?? null,
        ti.notes ?? null,
        ti.sort_order
      );
    }

    return mealId;
  });

  const mealId = apply();

  const meal = db
    .prepare('SELECT * FROM trip_meals WHERE id = ?')
    .get(mealId) as Record<string, unknown>;
  const items = db
    .prepare(`
      SELECT tmi.*, COALESCE(tmi.custom_food_name, gi.name) AS name
      FROM trip_meal_items tmi
      LEFT JOIN gear_items gi ON gi.id = tmi.gear_item_id
      WHERE tmi.meal_id = ?
      ORDER BY tmi.sort_order
    `)
    .all(mealId);

  res.status(201).json({ meal: { ...meal, items } });
}

export default router;
