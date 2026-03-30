import express, { Request, Response } from 'express';
import { db } from '../db/database';
import { authenticate, gearAdmin } from '../middleware/auth';
import { AuthRequest, GearTag, GearItem, GearContainer, GearVehicle, GearTemplate, GearTemplateItem, GearTemplateContainer } from '../types';

const router = express.Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadTagsForEntity(table: string, idCol: string, id: number): GearTag[] {
  return db.prepare(`
    SELECT gt.id, gt.name, gt.color, gt.created_at
    FROM gear_tags gt
    JOIN ${table} jt ON gt.id = jt.tag_id
    WHERE jt.${idCol} = ?
    ORDER BY jt.sort_order ASC
  `).all(id) as GearTag[];
}

function setEntityTags(junctionTable: string, idCol: string, id: number, tagIds: number[]): void {
  db.transaction(() => {
    db.prepare(`DELETE FROM ${junctionTable} WHERE ${idCol} = ?`).run(id);
    const insert = db.prepare(`INSERT INTO ${junctionTable} (${idCol}, tag_id, sort_order) VALUES (?, ?, ?)`);
    tagIds.forEach((tagId, idx) => insert.run(id, tagId, idx));
  })();
}

// ─── Gear Tags ────────────────────────────────────────────────────────────────

router.get('/tags', authenticate, (_req: Request, res: Response) => {
  const tags = db.prepare('SELECT * FROM gear_tags ORDER BY name ASC').all();
  res.json({ tags });
});

router.post('/tags', authenticate, gearAdmin, (req: Request, res: Response) => {
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Tag name is required' });
  const existing = db.prepare('SELECT id FROM gear_tags WHERE name = ?').get(name.trim());
  if (existing) return res.status(409).json({ error: 'Tag name already exists' });
  const result = db.prepare('INSERT INTO gear_tags (name, color) VALUES (?, ?)').run(
    name.trim(), color?.trim() || '#6366f1'
  );
  const tag = db.prepare('SELECT * FROM gear_tags WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ tag });
});

router.put('/tags/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const { name, color } = req.body;
  const tag = db.prepare('SELECT * FROM gear_tags WHERE id = ?').get(req.params.id) as GearTag | undefined;
  if (!tag) return res.status(404).json({ error: 'Tag not found' });
  if (name && name.trim() !== tag.name) {
    const conflict = db.prepare('SELECT id FROM gear_tags WHERE name = ? AND id != ?').get(name.trim(), req.params.id);
    if (conflict) return res.status(409).json({ error: 'Tag name already exists' });
  }
  db.prepare('UPDATE gear_tags SET name = COALESCE(?, name), color = COALESCE(?, color) WHERE id = ?').run(
    name?.trim() || null, color?.trim() || null, req.params.id
  );
  const updated = db.prepare('SELECT * FROM gear_tags WHERE id = ?').get(req.params.id);
  res.json({ tag: updated });
});

router.delete('/tags/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const tag = db.prepare('SELECT id FROM gear_tags WHERE id = ?').get(req.params.id);
  if (!tag) return res.status(404).json({ error: 'Tag not found' });
  db.prepare('DELETE FROM gear_tags WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Gear Items ───────────────────────────────────────────────────────────────

router.get('/items', authenticate, (_req: Request, res: Response) => {
  const items = db.prepare('SELECT * FROM gear_items ORDER BY name ASC').all() as GearItem[];
  const result = items.map(item => ({
    ...item,
    tags: loadTagsForEntity('gear_item_tags', 'gear_item_id', item.id)
  }));
  res.json({ items: result });
});

router.get('/items/:id', authenticate, (req: Request, res: Response) => {
  const item = db.prepare('SELECT * FROM gear_items WHERE id = ?').get(req.params.id) as GearItem | undefined;
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ item: { ...item, tags: loadTagsForEntity('gear_item_tags', 'gear_item_id', item.id) } });
});

router.post('/items', authenticate, gearAdmin, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { name, description, notes, is_personal, is_food, serving_unit, quantity_formula, base_quantity } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Item name is required' });
  const validFormulas = ['fixed', 'per_night', 'per_person', 'per_person_per_night'];
  if (quantity_formula && !validFormulas.includes(quantity_formula)) {
    return res.status(400).json({ error: 'Invalid quantity_formula' });
  }
  const result = db.prepare(`
    INSERT INTO gear_items (name, description, notes, is_personal, is_food, serving_unit, quantity_formula, base_quantity, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(), description || null, notes || null,
    is_personal ? 1 : 0, is_food ? 1 : 0,
    serving_unit || null, quantity_formula || 'fixed',
    base_quantity ?? 1, authReq.user.id
  );
  const item = db.prepare('SELECT * FROM gear_items WHERE id = ?').get(result.lastInsertRowid) as GearItem;
  res.status(201).json({ item: { ...item, tags: [] } });
});

router.put('/items/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const item = db.prepare('SELECT * FROM gear_items WHERE id = ?').get(req.params.id) as GearItem | undefined;
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const { name, description, notes, is_personal, is_food, serving_unit, quantity_formula, base_quantity } = req.body;
  if (quantity_formula) {
    const validFormulas = ['fixed', 'per_night', 'per_person', 'per_person_per_night'];
    if (!validFormulas.includes(quantity_formula)) return res.status(400).json({ error: 'Invalid quantity_formula' });
  }
  db.prepare(`
    UPDATE gear_items SET
      name = COALESCE(?, name),
      description = CASE WHEN ? IS NOT NULL THEN ? ELSE description END,
      notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
      is_personal = CASE WHEN ? IS NOT NULL THEN ? ELSE is_personal END,
      is_food = CASE WHEN ? IS NOT NULL THEN ? ELSE is_food END,
      serving_unit = CASE WHEN ? IS NOT NULL THEN ? ELSE serving_unit END,
      quantity_formula = COALESCE(?, quantity_formula),
      base_quantity = CASE WHEN ? IS NOT NULL THEN ? ELSE base_quantity END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name?.trim() || null,
    description !== undefined ? description : null, description !== undefined ? description : null,
    notes !== undefined ? notes : null, notes !== undefined ? notes : null,
    is_personal !== undefined ? 1 : null, is_personal ? 1 : 0,
    is_food !== undefined ? 1 : null, is_food ? 1 : 0,
    serving_unit !== undefined ? serving_unit : null, serving_unit !== undefined ? serving_unit : null,
    quantity_formula || null,
    base_quantity !== undefined ? 1 : null, base_quantity !== undefined ? base_quantity : null,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM gear_items WHERE id = ?').get(req.params.id) as GearItem;
  res.json({ item: { ...updated, tags: loadTagsForEntity('gear_item_tags', 'gear_item_id', updated.id) } });
});

router.post('/items/:id/tags', authenticate, gearAdmin, (req: Request, res: Response) => {
  const item = db.prepare('SELECT id FROM gear_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const { tag_ids } = req.body;
  if (!Array.isArray(tag_ids)) return res.status(400).json({ error: 'tag_ids must be an array' });
  setEntityTags('gear_item_tags', 'gear_item_id', Number(req.params.id), tag_ids);
  const tags = loadTagsForEntity('gear_item_tags', 'gear_item_id', Number(req.params.id));
  res.json({ tags });
});

router.delete('/items/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const item = db.prepare('SELECT id FROM gear_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  db.prepare('DELETE FROM gear_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Gear Containers ──────────────────────────────────────────────────────────

router.get('/containers', authenticate, (_req: Request, res: Response) => {
  const containers = db.prepare('SELECT * FROM gear_containers ORDER BY name ASC').all() as GearContainer[];
  const result = containers.map(c => ({
    ...c,
    tags: loadTagsForEntity('gear_container_tags', 'gear_container_id', c.id)
  }));
  res.json({ containers: result });
});

router.get('/containers/:id', authenticate, (req: Request, res: Response) => {
  const container = db.prepare('SELECT * FROM gear_containers WHERE id = ?').get(req.params.id) as GearContainer | undefined;
  if (!container) return res.status(404).json({ error: 'Container not found' });
  res.json({ container: { ...container, tags: loadTagsForEntity('gear_container_tags', 'gear_container_id', container.id) } });
});

router.post('/containers', authenticate, gearAdmin, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { name, description, capacity_notes, is_personal } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Container name is required' });
  const result = db.prepare(`
    INSERT INTO gear_containers (name, description, capacity_notes, is_personal, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), description || null, capacity_notes || null, is_personal ? 1 : 0, authReq.user.id);
  const container = db.prepare('SELECT * FROM gear_containers WHERE id = ?').get(result.lastInsertRowid) as GearContainer;
  res.status(201).json({ container: { ...container, tags: [] } });
});

router.put('/containers/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const container = db.prepare('SELECT * FROM gear_containers WHERE id = ?').get(req.params.id) as GearContainer | undefined;
  if (!container) return res.status(404).json({ error: 'Container not found' });
  const { name, description, capacity_notes, is_personal } = req.body;
  db.prepare(`
    UPDATE gear_containers SET
      name = COALESCE(?, name),
      description = CASE WHEN ? IS NOT NULL THEN ? ELSE description END,
      capacity_notes = CASE WHEN ? IS NOT NULL THEN ? ELSE capacity_notes END,
      is_personal = CASE WHEN ? IS NOT NULL THEN ? ELSE is_personal END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name?.trim() || null,
    description !== undefined ? description : null, description !== undefined ? description : null,
    capacity_notes !== undefined ? capacity_notes : null, capacity_notes !== undefined ? capacity_notes : null,
    is_personal !== undefined ? 1 : null, is_personal ? 1 : 0,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM gear_containers WHERE id = ?').get(req.params.id) as GearContainer;
  res.json({ container: { ...updated, tags: loadTagsForEntity('gear_container_tags', 'gear_container_id', updated.id) } });
});

router.post('/containers/:id/tags', authenticate, gearAdmin, (req: Request, res: Response) => {
  const container = db.prepare('SELECT id FROM gear_containers WHERE id = ?').get(req.params.id);
  if (!container) return res.status(404).json({ error: 'Container not found' });
  const { tag_ids } = req.body;
  if (!Array.isArray(tag_ids)) return res.status(400).json({ error: 'tag_ids must be an array' });
  setEntityTags('gear_container_tags', 'gear_container_id', Number(req.params.id), tag_ids);
  const tags = loadTagsForEntity('gear_container_tags', 'gear_container_id', Number(req.params.id));
  res.json({ tags });
});

router.delete('/containers/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const container = db.prepare('SELECT id FROM gear_containers WHERE id = ?').get(req.params.id);
  if (!container) return res.status(404).json({ error: 'Container not found' });
  db.prepare('DELETE FROM gear_containers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Gear Vehicles ────────────────────────────────────────────────────────────

router.get('/vehicles', authenticate, (_req: Request, res: Response) => {
  const vehicles = db.prepare('SELECT * FROM gear_vehicles ORDER BY name ASC').all() as GearVehicle[];
  const result = vehicles.map(v => ({
    ...v,
    tags: loadTagsForEntity('gear_vehicle_tags', 'gear_vehicle_id', v.id)
  }));
  res.json({ vehicles: result });
});

router.get('/vehicles/:id', authenticate, (req: Request, res: Response) => {
  const vehicle = db.prepare('SELECT * FROM gear_vehicles WHERE id = ?').get(req.params.id) as GearVehicle | undefined;
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({ vehicle: { ...vehicle, tags: loadTagsForEntity('gear_vehicle_tags', 'gear_vehicle_id', vehicle.id) } });
});

router.post('/vehicles', authenticate, gearAdmin, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Vehicle name is required' });
  const result = db.prepare('INSERT INTO gear_vehicles (name, description, created_by) VALUES (?, ?, ?)').run(
    name.trim(), description || null, authReq.user.id
  );
  const vehicle = db.prepare('SELECT * FROM gear_vehicles WHERE id = ?').get(result.lastInsertRowid) as GearVehicle;
  res.status(201).json({ vehicle: { ...vehicle, tags: [] } });
});

router.put('/vehicles/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const vehicle = db.prepare('SELECT * FROM gear_vehicles WHERE id = ?').get(req.params.id) as GearVehicle | undefined;
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  const { name, description } = req.body;
  db.prepare(`
    UPDATE gear_vehicles SET
      name = COALESCE(?, name),
      description = CASE WHEN ? IS NOT NULL THEN ? ELSE description END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name?.trim() || null,
    description !== undefined ? description : null, description !== undefined ? description : null,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM gear_vehicles WHERE id = ?').get(req.params.id) as GearVehicle;
  res.json({ vehicle: { ...updated, tags: loadTagsForEntity('gear_vehicle_tags', 'gear_vehicle_id', updated.id) } });
});

router.post('/vehicles/:id/tags', authenticate, gearAdmin, (req: Request, res: Response) => {
  const vehicle = db.prepare('SELECT id FROM gear_vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  const { tag_ids } = req.body;
  if (!Array.isArray(tag_ids)) return res.status(400).json({ error: 'tag_ids must be an array' });
  setEntityTags('gear_vehicle_tags', 'gear_vehicle_id', Number(req.params.id), tag_ids);
  const tags = loadTagsForEntity('gear_vehicle_tags', 'gear_vehicle_id', Number(req.params.id));
  res.json({ tags });
});

router.delete('/vehicles/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const vehicle = db.prepare('SELECT id FROM gear_vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  db.prepare('DELETE FROM gear_vehicles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Gear Templates ───────────────────────────────────────────────────────────

router.get('/templates', authenticate, (_req: Request, res: Response) => {
  const templates = db.prepare('SELECT * FROM gear_templates ORDER BY name ASC').all() as GearTemplate[];
  const result = templates.map(t => {
    const item_count = (db.prepare('SELECT COUNT(*) as c FROM gear_template_items WHERE template_id = ?').get(t.id) as { c: number }).c;
    const container_count = (db.prepare('SELECT COUNT(*) as c FROM gear_template_containers WHERE template_id = ?').get(t.id) as { c: number }).c;
    return {
      ...t,
      tags: loadTagsForEntity('gear_template_tags', 'gear_template_id', t.id),
      item_count,
      container_count
    };
  });
  res.json({ templates: result });
});

router.get('/templates/:id', authenticate, (req: Request, res: Response) => {
  const template = db.prepare('SELECT * FROM gear_templates WHERE id = ?').get(req.params.id) as GearTemplate | undefined;
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const templateItems = db.prepare(`
    SELECT gti.*, gi.name as item_name, gi.is_personal, gi.is_food, gi.serving_unit,
           gi.quantity_formula as item_formula, gi.base_quantity as item_base_qty
    FROM gear_template_items gti
    JOIN gear_items gi ON gti.gear_item_id = gi.id
    WHERE gti.template_id = ?
    ORDER BY gti.sort_order ASC
  `).all(req.params.id) as (GearTemplateItem & { item_name: string; is_personal: number; is_food: number })[];

  const templateContainers = db.prepare(`
    SELECT gtc.*, gc.name as container_name, gc.is_personal, gc.description as container_desc
    FROM gear_template_containers gtc
    JOIN gear_containers gc ON gtc.gear_container_id = gc.id
    WHERE gtc.template_id = ?
    ORDER BY gtc.sort_order ASC
  `).all(req.params.id) as (GearTemplateContainer & { container_name: string; is_personal: number })[];

  // Load assignments (item → container)
  const assignments = db.prepare(`
    SELECT template_item_id, template_container_id
    FROM gear_template_assignments
    WHERE template_item_id IN (
      SELECT id FROM gear_template_items WHERE template_id = ?
    )
  `).all(req.params.id) as { template_item_id: number; template_container_id: number }[];

  const assignmentsByContainer: Record<number, number[]> = {};
  for (const a of assignments) {
    if (!assignmentsByContainer[a.template_container_id]) assignmentsByContainer[a.template_container_id] = [];
    assignmentsByContainer[a.template_container_id].push(a.template_item_id);
  }

  res.json({
    template: {
      ...template,
      tags: loadTagsForEntity('gear_template_tags', 'gear_template_id', template.id),
      items: templateItems.map(ti => ({
        id: ti.id, template_id: ti.template_id, gear_item_id: ti.gear_item_id,
        quantity: ti.quantity, quantity_formula: ti.quantity_formula, sort_order: ti.sort_order,
        item: { id: ti.gear_item_id, name: ti.item_name, is_personal: ti.is_personal, is_food: ti.is_food }
      })),
      containers: templateContainers.map(tc => ({
        id: tc.id, template_id: tc.template_id, gear_container_id: tc.gear_container_id,
        sort_order: tc.sort_order,
        container: { id: tc.gear_container_id, name: tc.container_name, is_personal: tc.is_personal },
        assignments: assignmentsByContainer[tc.id] || []
      }))
    }
  });
});

router.post('/templates', authenticate, gearAdmin, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Template name is required' });
  const result = db.prepare('INSERT INTO gear_templates (name, description, created_by) VALUES (?, ?, ?)').run(
    name.trim(), description || null, authReq.user.id
  );
  const template = db.prepare('SELECT * FROM gear_templates WHERE id = ?').get(result.lastInsertRowid) as GearTemplate;
  res.status(201).json({ template: { ...template, tags: [], items: [], containers: [] } });
});

router.put('/templates/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const template = db.prepare('SELECT * FROM gear_templates WHERE id = ?').get(req.params.id) as GearTemplate | undefined;
  if (!template) return res.status(404).json({ error: 'Template not found' });
  const { name, description } = req.body;
  db.prepare(`
    UPDATE gear_templates SET
      name = COALESCE(?, name),
      description = CASE WHEN ? IS NOT NULL THEN ? ELSE description END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name?.trim() || null, description !== undefined ? description : null, description !== undefined ? description : null, req.params.id);
  const updated = db.prepare('SELECT * FROM gear_templates WHERE id = ?').get(req.params.id) as GearTemplate;
  res.json({ template: { ...updated, tags: loadTagsForEntity('gear_template_tags', 'gear_template_id', updated.id) } });
});

router.post('/templates/:id/tags', authenticate, gearAdmin, (req: Request, res: Response) => {
  const template = db.prepare('SELECT id FROM gear_templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  const { tag_ids } = req.body;
  if (!Array.isArray(tag_ids)) return res.status(400).json({ error: 'tag_ids must be an array' });
  setEntityTags('gear_template_tags', 'gear_template_id', Number(req.params.id), tag_ids);
  const tags = loadTagsForEntity('gear_template_tags', 'gear_template_id', Number(req.params.id));
  res.json({ tags });
});

router.delete('/templates/:id', authenticate, gearAdmin, (req: Request, res: Response) => {
  const template = db.prepare('SELECT id FROM gear_templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  db.prepare('DELETE FROM gear_templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Template items
router.post('/templates/:id/items', authenticate, gearAdmin, (req: Request, res: Response) => {
  const template = db.prepare('SELECT id FROM gear_templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  const { gear_item_id, quantity, quantity_formula } = req.body;
  if (!gear_item_id) return res.status(400).json({ error: 'gear_item_id is required' });
  const item = db.prepare('SELECT id FROM gear_items WHERE id = ?').get(gear_item_id);
  if (!item) return res.status(404).json({ error: 'Gear item not found' });
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM gear_template_items WHERE template_id = ?').get(req.params.id) as { m: number | null }).m ?? -1;
  const result = db.prepare(
    'INSERT INTO gear_template_items (template_id, gear_item_id, quantity, quantity_formula, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.id, gear_item_id, quantity ?? 1, quantity_formula || null, maxOrder + 1);
  const ti = db.prepare('SELECT * FROM gear_template_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ item: ti });
});

router.put('/templates/:id/items/:itemId', authenticate, gearAdmin, (req: Request, res: Response) => {
  const ti = db.prepare('SELECT * FROM gear_template_items WHERE id = ? AND template_id = ?').get(req.params.itemId, req.params.id) as GearTemplateItem | undefined;
  if (!ti) return res.status(404).json({ error: 'Template item not found' });
  const { quantity, quantity_formula, sort_order } = req.body;
  db.prepare(`UPDATE gear_template_items SET
    quantity = CASE WHEN ? IS NOT NULL THEN ? ELSE quantity END,
    quantity_formula = CASE WHEN ? IS NOT NULL THEN ? ELSE quantity_formula END,
    sort_order = CASE WHEN ? IS NOT NULL THEN ? ELSE sort_order END
    WHERE id = ?
  `).run(
    quantity !== undefined ? 1 : null, quantity !== undefined ? quantity : null,
    quantity_formula !== undefined ? 1 : null, quantity_formula !== undefined ? quantity_formula : null,
    sort_order !== undefined ? 1 : null, sort_order !== undefined ? sort_order : null,
    req.params.itemId
  );
  const updated = db.prepare('SELECT * FROM gear_template_items WHERE id = ?').get(req.params.itemId);
  res.json({ item: updated });
});

router.delete('/templates/:id/items/:itemId', authenticate, gearAdmin, (req: Request, res: Response) => {
  const ti = db.prepare('SELECT id FROM gear_template_items WHERE id = ? AND template_id = ?').get(req.params.itemId, req.params.id);
  if (!ti) return res.status(404).json({ error: 'Template item not found' });
  db.prepare('DELETE FROM gear_template_items WHERE id = ?').run(req.params.itemId);
  res.json({ success: true });
});

// Template containers
router.post('/templates/:id/containers', authenticate, gearAdmin, (req: Request, res: Response) => {
  const template = db.prepare('SELECT id FROM gear_templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  const { gear_container_id } = req.body;
  if (!gear_container_id) return res.status(400).json({ error: 'gear_container_id is required' });
  const container = db.prepare('SELECT id FROM gear_containers WHERE id = ?').get(gear_container_id);
  if (!container) return res.status(404).json({ error: 'Gear container not found' });
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM gear_template_containers WHERE template_id = ?').get(req.params.id) as { m: number | null }).m ?? -1;
  const result = db.prepare(
    'INSERT INTO gear_template_containers (template_id, gear_container_id, sort_order) VALUES (?, ?, ?)'
  ).run(req.params.id, gear_container_id, maxOrder + 1);
  const tc = db.prepare('SELECT * FROM gear_template_containers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ container: tc });
});

router.put('/templates/:id/containers/:containerId', authenticate, gearAdmin, (req: Request, res: Response) => {
  const tc = db.prepare('SELECT * FROM gear_template_containers WHERE id = ? AND template_id = ?').get(req.params.containerId, req.params.id) as GearTemplateContainer | undefined;
  if (!tc) return res.status(404).json({ error: 'Template container not found' });
  const { sort_order } = req.body;
  if (sort_order !== undefined) {
    db.prepare('UPDATE gear_template_containers SET sort_order = ? WHERE id = ?').run(sort_order, req.params.containerId);
  }
  const updated = db.prepare('SELECT * FROM gear_template_containers WHERE id = ?').get(req.params.containerId);
  res.json({ container: updated });
});

router.delete('/templates/:id/containers/:containerId', authenticate, gearAdmin, (req: Request, res: Response) => {
  const tc = db.prepare('SELECT id FROM gear_template_containers WHERE id = ? AND template_id = ?').get(req.params.containerId, req.params.id);
  if (!tc) return res.status(404).json({ error: 'Template container not found' });
  db.prepare('DELETE FROM gear_template_containers WHERE id = ?').run(req.params.containerId);
  res.json({ success: true });
});

// Template assignments (replace all for a template)
router.put('/templates/:id/assignments', authenticate, gearAdmin, (req: Request, res: Response) => {
  const template = db.prepare('SELECT id FROM gear_templates WHERE id = ?').get(req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  const { assignments } = req.body;
  if (!Array.isArray(assignments)) return res.status(400).json({ error: 'assignments must be an array' });

  db.transaction(() => {
    // Delete all existing assignments for this template's items
    db.prepare(`
      DELETE FROM gear_template_assignments
      WHERE template_item_id IN (SELECT id FROM gear_template_items WHERE template_id = ?)
    `).run(req.params.id);
    const insert = db.prepare('INSERT OR IGNORE INTO gear_template_assignments (template_item_id, template_container_id) VALUES (?, ?)');
    for (const a of assignments as { template_item_id: number; template_container_id: number }[]) {
      if (a.template_item_id && a.template_container_id) {
        insert.run(a.template_item_id, a.template_container_id);
      }
    }
  })();

  res.json({ success: true });
});

export default router;
