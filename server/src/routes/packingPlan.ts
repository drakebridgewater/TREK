import express, { Request, Response } from 'express';
import { db, canAccessTrip } from '../db/database';
import { authenticate } from '../middleware/auth';
import { AuthRequest, TripPackingPlan, TripPlanContainer, TripPlanItem, GearItem, GearContainer } from '../types';
import { autoAssign, resolvePartySize, resolveQuantity } from '../services/gearAutoAssign';

const router = express.Router({ mergeParams: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadPlanFull(planId: number): TripPackingPlan {
  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE id = ?').get(planId) as TripPackingPlan;

  // Vehicle
  let vehicle = null;
  if (plan.vehicle_id) {
    const v = db.prepare('SELECT * FROM gear_vehicles WHERE id = ?').get(plan.vehicle_id);
    if (v) vehicle = v;
  }

  // Containers with items
  const containers = db.prepare(`
    SELECT tpc.*, COALESCE(tpc.custom_name, gc.name) as name
    FROM trip_plan_containers tpc
    LEFT JOIN gear_containers gc ON tpc.gear_container_id = gc.id
    WHERE tpc.plan_id = ?
    ORDER BY tpc.sort_order ASC
  `).all(planId) as (TripPlanContainer & { name: string })[];

  const containerIds = containers.map(c => c.id);
  let allAssignedItems: TripPlanItem[] = [];
  if (containerIds.length > 0) {
    const placeholders = containerIds.map(() => '?').join(',');
    allAssignedItems = db.prepare(`
      SELECT tpi.*, COALESCE(tpi.custom_name, gi.name) as name
      FROM trip_plan_items tpi
      LEFT JOIN gear_items gi ON tpi.gear_item_id = gi.id
      WHERE tpi.plan_id = ? AND tpi.container_id IN (${placeholders})
      ORDER BY tpi.sort_order ASC
    `).all(planId, ...containerIds) as TripPlanItem[];
  }

  const itemsByContainer = new Map<number, TripPlanItem[]>();
  for (const item of allAssignedItems) {
    const cid = item.container_id!;
    if (!itemsByContainer.has(cid)) itemsByContainer.set(cid, []);
    itemsByContainer.get(cid)!.push(item);
  }

  const containersWithItems = containers.map(c => ({
    ...c,
    items: itemsByContainer.get(c.id) || []
  }));

  // Unassigned items (no container, not directly in vehicle)
  const unassignedItems = db.prepare(`
    SELECT tpi.*, COALESCE(tpi.custom_name, gi.name) as name
    FROM trip_plan_items tpi
    LEFT JOIN gear_items gi ON tpi.gear_item_id = gi.id
    WHERE tpi.plan_id = ? AND tpi.container_id IS NULL AND tpi.directly_in_vehicle = 0
    ORDER BY tpi.sort_order ASC
  `).all(planId) as TripPlanItem[];

  // Items directly in vehicle
  const vehicleDirectItems = db.prepare(`
    SELECT tpi.*, COALESCE(tpi.custom_name, gi.name) as name
    FROM trip_plan_items tpi
    LEFT JOIN gear_items gi ON tpi.gear_item_id = gi.id
    WHERE tpi.plan_id = ? AND tpi.directly_in_vehicle = 1
    ORDER BY tpi.sort_order ASC
  `).all(planId) as TripPlanItem[];

  return {
    ...plan,
    vehicle,
    containers: containersWithItems,
    unassigned_items: unassignedItems,
    vehicle_direct_items: vehicleDirectItems
  };
}

function getTripContext(tripId: string | number) {
  const trip = db.prepare('SELECT id, start_date, end_date, party_size FROM trips WHERE id = ?').get(tripId) as {
    id: number; start_date: string | null; end_date: string | null; party_size: number | null
  } | undefined;
  if (!trip) return null;
  const partySize = resolvePartySize(Number(tripId));
  let tripNights = 0;
  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    tripNights = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }
  return { partySize, tripNights };
}

// ─── Plan CRUD ────────────────────────────────────────────────────────────────

// GET full plan state
router.get('/', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.json({ plan: null });

  res.json({ plan: loadPlanFull(plan.id) });
});

// POST init plan (idempotent)
router.post('/', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  let plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) {
    const result = db.prepare('INSERT INTO trip_packing_plans (trip_id) VALUES (?)').run(tripId);
    plan = db.prepare('SELECT * FROM trip_packing_plans WHERE id = ?').get(result.lastInsertRowid) as TripPackingPlan;
  }

  // Set trip packing_mode to 'full'
  db.prepare("UPDATE trips SET packing_mode = 'full' WHERE id = ?").run(tripId);

  res.json({ plan: loadPlanFull(plan.id) });
});

// PUT update plan (set vehicle)
router.put('/', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;
  const { vehicle_id } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found. Initialize it first.' });

  if (vehicle_id !== undefined) {
    if (vehicle_id !== null) {
      const v = db.prepare('SELECT id FROM gear_vehicles WHERE id = ?').get(vehicle_id);
      if (!v) return res.status(404).json({ error: 'Vehicle not found' });
    }
    db.prepare('UPDATE trip_packing_plans SET vehicle_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      vehicle_id, plan.id
    );
  }

  res.json({ plan: loadPlanFull(plan.id) });
});

// DELETE reset plan
router.delete('/', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  db.prepare('DELETE FROM trip_packing_plans WHERE trip_id = ?').run(tripId);
  db.prepare("UPDATE trips SET packing_mode = 'simple' WHERE id = ?").run(tripId);
  res.json({ success: true });
});

// ─── Apply template ───────────────────────────────────────────────────────────

router.post('/apply-template', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;
  const { template_id } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (!template_id) return res.status(400).json({ error: 'template_id is required' });
  const template = db.prepare('SELECT * FROM gear_templates WHERE id = ?').get(template_id);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  let plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) {
    const result = db.prepare('INSERT INTO trip_packing_plans (trip_id) VALUES (?)').run(tripId);
    plan = db.prepare('SELECT * FROM trip_packing_plans WHERE id = ?').get(result.lastInsertRowid) as TripPackingPlan;
    db.prepare("UPDATE trips SET packing_mode = 'full' WHERE id = ?").run(tripId);
  }

  const ctx = getTripContext(tripId);
  const partySize = ctx?.partySize ?? 1;
  const tripNights = ctx?.tripNights ?? 0;

  // Load template data
  const templateContainers = db.prepare(
    'SELECT * FROM gear_template_containers WHERE template_id = ? ORDER BY sort_order ASC'
  ).all(template_id) as { id: number; gear_container_id: number }[];

  const templateItems = db.prepare(
    'SELECT gti.*, gi.quantity_formula as item_formula, gi.base_quantity as item_base_qty, gi.is_personal FROM gear_template_items gti JOIN gear_items gi ON gti.gear_item_id = gi.id WHERE gti.template_id = ? ORDER BY gti.sort_order ASC'
  ).all(template_id) as {
    id: number; gear_item_id: number; quantity: number; quantity_formula: string | null;
    item_formula: string; item_base_qty: number; is_personal: number; sort_order: number;
  }[];

  const assignments = db.prepare(`
    SELECT template_item_id, template_container_id FROM gear_template_assignments
    WHERE template_item_id IN (SELECT id FROM gear_template_items WHERE template_id = ?)
  `).all(template_id) as { template_item_id: number; template_container_id: number }[];

  db.transaction(() => {
    // Map template_container.id → trip_plan_container.id(s) (personal containers get N instances)
    const containerIdMap = new Map<number, number[]>();

    for (const tc of templateContainers) {
      const gc = db.prepare('SELECT * FROM gear_containers WHERE id = ?').get(tc.gear_container_id) as GearContainer | undefined;
      if (!gc) continue;

      // Skip if already in plan
      const existing = db.prepare('SELECT id FROM trip_plan_containers WHERE plan_id = ? AND gear_container_id = ?').get(plan!.id, tc.gear_container_id);
      if (existing) {
        containerIdMap.set(tc.id, [(existing as { id: number }).id]);
        continue;
      }

      const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM trip_plan_containers WHERE plan_id = ?').get(plan!.id) as { m: number | null }).m ?? -1;

      if (gc.is_personal) {
        const ids: number[] = [];
        for (let i = 0; i < partySize; i++) {
          const r = db.prepare(
            'INSERT INTO trip_plan_containers (plan_id, gear_container_id, person_label, sort_order) VALUES (?, ?, ?, ?)'
          ).run(plan!.id, tc.gear_container_id, `Person ${i + 1}`, maxOrder + 1 + i);
          ids.push(Number(r.lastInsertRowid));
        }
        containerIdMap.set(tc.id, ids);
      } else {
        const r = db.prepare(
          'INSERT INTO trip_plan_containers (plan_id, gear_container_id, sort_order) VALUES (?, ?, ?)'
        ).run(plan!.id, tc.gear_container_id, maxOrder + 1);
        containerIdMap.set(tc.id, [Number(r.lastInsertRowid)]);
      }
    }

    // Build assignment lookup: template_item_id → template_container_id
    const assignmentMap = new Map<number, number>();
    for (const a of assignments) assignmentMap.set(a.template_item_id, a.template_container_id);

    for (const ti of templateItems) {
      // Skip if already in plan
      const existingItem = db.prepare('SELECT id FROM trip_plan_items WHERE plan_id = ? AND gear_item_id = ?').get(plan!.id, ti.gear_item_id);
      if (existingItem) continue;

      const formula = ti.quantity_formula || ti.item_formula;
      const baseQty = ti.quantity ?? ti.item_base_qty;
      const quantity = resolveQuantity(baseQty, formula, partySize, tripNights);

      const templateContainerId = assignmentMap.get(ti.id);
      const planContainerIds = templateContainerId ? (containerIdMap.get(templateContainerId) || []) : [];

      const maxItemOrder = (db.prepare('SELECT MAX(sort_order) as m FROM trip_plan_items WHERE plan_id = ?').get(plan!.id) as { m: number | null }).m ?? -1;

      if (planContainerIds.length > 0) {
        // Assign to first container (or all for personal items)
        const targetContainerIds = ti.is_personal && planContainerIds.length > 1
          ? planContainerIds
          : [planContainerIds[0]];

        targetContainerIds.forEach((cid, idx) => {
          db.prepare(`
            INSERT INTO trip_plan_items (plan_id, gear_item_id, quantity, container_id, sort_order)
            VALUES (?, ?, ?, ?, ?)
          `).run(plan!.id, ti.gear_item_id, quantity, cid, maxItemOrder + 1 + idx);
        });
      } else {
        db.prepare('INSERT INTO trip_plan_items (plan_id, gear_item_id, quantity, sort_order) VALUES (?, ?, ?, ?)').run(
          plan!.id, ti.gear_item_id, quantity, maxItemOrder + 1
        );
      }
    }
  })();

  res.json({ plan: loadPlanFull(plan!.id) });
});

// ─── Containers ───────────────────────────────────────────────────────────────

router.post('/containers', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;
  const { gear_container_id, custom_name } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found. Initialize it first.' });

  if (!gear_container_id && !custom_name?.trim()) {
    return res.status(400).json({ error: 'Either gear_container_id or custom_name is required' });
  }

  let containers: GearContainer | undefined;
  if (gear_container_id) {
    containers = db.prepare('SELECT * FROM gear_containers WHERE id = ?').get(gear_container_id) as GearContainer | undefined;
    if (!containers) return res.status(404).json({ error: 'Gear container not found' });
  }

  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM trip_plan_containers WHERE plan_id = ?').get(plan.id) as { m: number | null }).m ?? -1;
  const ctx = getTripContext(tripId);
  const partySize = ctx?.partySize ?? 1;

  const newContainerIds: number[] = [];

  db.transaction(() => {
    if (containers?.is_personal) {
      for (let i = 0; i < partySize; i++) {
        const r = db.prepare(
          'INSERT INTO trip_plan_containers (plan_id, gear_container_id, custom_name, person_label, sort_order) VALUES (?, ?, ?, ?, ?)'
        ).run(plan.id, gear_container_id || null, custom_name?.trim() || null, `Person ${i + 1}`, maxOrder + 1 + i);
        newContainerIds.push(Number(r.lastInsertRowid));
      }
    } else {
      const r = db.prepare(
        'INSERT INTO trip_plan_containers (plan_id, gear_container_id, custom_name, sort_order) VALUES (?, ?, ?, ?)'
      ).run(plan.id, gear_container_id || null, custom_name?.trim() || null, maxOrder + 1);
      newContainerIds.push(Number(r.lastInsertRowid));
    }
  })();

  res.status(201).json({ plan: loadPlanFull(plan.id) });
});

router.put('/containers/:containerId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, containerId } = req.params;
  const { custom_name, person_label, sort_order } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found' });

  const container = db.prepare('SELECT id FROM trip_plan_containers WHERE id = ? AND plan_id = ?').get(containerId, plan.id);
  if (!container) return res.status(404).json({ error: 'Container not found' });

  db.prepare(`
    UPDATE trip_plan_containers SET
      custom_name = CASE WHEN ? IS NOT NULL THEN ? ELSE custom_name END,
      person_label = CASE WHEN ? IS NOT NULL THEN ? ELSE person_label END,
      sort_order = CASE WHEN ? IS NOT NULL THEN ? ELSE sort_order END
    WHERE id = ?
  `).run(
    custom_name !== undefined ? custom_name : null, custom_name !== undefined ? custom_name : null,
    person_label !== undefined ? person_label : null, person_label !== undefined ? person_label : null,
    sort_order !== undefined ? 1 : null, sort_order !== undefined ? sort_order : null,
    containerId
  );

  res.json({ plan: loadPlanFull(plan.id) });
});

router.delete('/containers/:containerId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, containerId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found' });

  const container = db.prepare('SELECT id FROM trip_plan_containers WHERE id = ? AND plan_id = ?').get(containerId, plan.id);
  if (!container) return res.status(404).json({ error: 'Container not found' });

  db.prepare('DELETE FROM trip_plan_containers WHERE id = ?').run(containerId);
  res.json({ plan: loadPlanFull(plan.id) });
});

// ─── Items ────────────────────────────────────────────────────────────────────

router.post('/items', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;
  const { gear_item_id, custom_name, custom_notes, quantity, container_id, directly_in_vehicle } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found. Initialize it first.' });

  if (!gear_item_id && !custom_name?.trim()) {
    return res.status(400).json({ error: 'Either gear_item_id or custom_name is required' });
  }

  let resolvedQuantity = quantity ?? 1;
  let gearItem: GearItem | undefined;

  if (gear_item_id) {
    gearItem = db.prepare('SELECT * FROM gear_items WHERE id = ?').get(gear_item_id) as GearItem | undefined;
    if (!gearItem) return res.status(404).json({ error: 'Gear item not found' });
    if (quantity === undefined) {
      const ctx = getTripContext(tripId);
      resolvedQuantity = resolveQuantity(gearItem.base_quantity, gearItem.quantity_formula, ctx?.partySize ?? 1, ctx?.tripNights ?? 0);
    }
  }

  if (container_id) {
    const c = db.prepare('SELECT id FROM trip_plan_containers WHERE id = ? AND plan_id = ?').get(container_id, plan.id);
    if (!c) return res.status(404).json({ error: 'Container not found in this plan' });
  }

  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM trip_plan_items WHERE plan_id = ?').get(plan.id) as { m: number | null }).m ?? -1;

  const result = db.prepare(`
    INSERT INTO trip_plan_items (plan_id, gear_item_id, custom_name, custom_notes, quantity, container_id, directly_in_vehicle, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    plan.id, gear_item_id || null, custom_name?.trim() || null, custom_notes || null,
    resolvedQuantity, container_id || null, directly_in_vehicle ? 1 : 0, maxOrder + 1
  );

  res.status(201).json({ plan: loadPlanFull(plan.id) });
});

router.put('/items/:itemId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, itemId } = req.params;
  const { custom_name, custom_notes, checked, quantity, container_id, container_override, directly_in_vehicle, sort_order } = req.body;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found' });

  const item = db.prepare('SELECT id FROM trip_plan_items WHERE id = ? AND plan_id = ?').get(itemId, plan.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  if (container_id !== undefined && container_id !== null) {
    const c = db.prepare('SELECT id FROM trip_plan_containers WHERE id = ? AND plan_id = ?').get(container_id, plan.id);
    if (!c) return res.status(404).json({ error: 'Container not found in this plan' });
  }

  db.prepare(`
    UPDATE trip_plan_items SET
      custom_name = CASE WHEN ? IS NOT NULL THEN ? ELSE custom_name END,
      custom_notes = CASE WHEN ? IS NOT NULL THEN ? ELSE custom_notes END,
      checked = CASE WHEN ? IS NOT NULL THEN ? ELSE checked END,
      quantity = CASE WHEN ? IS NOT NULL THEN ? ELSE quantity END,
      container_id = CASE WHEN ? = 1 THEN ? ELSE container_id END,
      container_override = CASE WHEN ? IS NOT NULL THEN ? ELSE container_override END,
      directly_in_vehicle = CASE WHEN ? IS NOT NULL THEN ? ELSE directly_in_vehicle END,
      sort_order = CASE WHEN ? IS NOT NULL THEN ? ELSE sort_order END
    WHERE id = ?
  `).run(
    custom_name !== undefined ? custom_name : null, custom_name !== undefined ? custom_name : null,
    custom_notes !== undefined ? custom_notes : null, custom_notes !== undefined ? custom_notes : null,
    checked !== undefined ? 1 : null, checked !== undefined ? (checked ? 1 : 0) : null,
    quantity !== undefined ? 1 : null, quantity !== undefined ? quantity : null,
    container_id !== undefined ? 1 : 0, container_id !== undefined ? container_id : null,
    container_override !== undefined ? 1 : null, container_override !== undefined ? (container_override ? 1 : 0) : null,
    directly_in_vehicle !== undefined ? 1 : null, directly_in_vehicle !== undefined ? (directly_in_vehicle ? 1 : 0) : null,
    sort_order !== undefined ? 1 : null, sort_order !== undefined ? sort_order : null,
    itemId
  );

  res.json({ plan: loadPlanFull(plan.id) });
});

router.delete('/items/:itemId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, itemId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found' });

  const item = db.prepare('SELECT id FROM trip_plan_items WHERE id = ? AND plan_id = ?').get(itemId, plan.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  db.prepare('DELETE FROM trip_plan_items WHERE id = ?').run(itemId);
  res.json({ plan: loadPlanFull(plan.id) });
});

// ─── Auto-assign ──────────────────────────────────────────────────────────────

router.post('/auto-assign', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found' });

  const proposals = autoAssign(plan.id, 'preview');
  const changes = proposals.filter(p => p.proposed_container_id !== null).length;
  res.json({ proposals, changes });
});

router.post('/apply-auto-assign', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found' });

  autoAssign(plan.id, 'apply');
  res.json({ plan: loadPlanFull(plan.id) });
});

// ─── Sync food from meal plan ─────────────────────────────────────────────────

router.post('/sync-food', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;

  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const plan = db.prepare('SELECT * FROM trip_packing_plans WHERE trip_id = ?').get(tripId) as TripPackingPlan | undefined;
  if (!plan) return res.status(404).json({ error: 'Packing plan not found. Initialize it first.' });

  const ctx = getTripContext(tripId);
  const partySize = ctx?.partySize ?? 1;

  // Sum food items across all meals (group by gear_item_id)
  const mealItems = db.prepare(`
    SELECT tmi.gear_item_id, SUM(tmi.quantity_per_person) as total_qty_per_person,
           COALESCE(tmi.unit, gi.serving_unit) as unit,
           gi.name as item_name
    FROM trip_meal_items tmi
    JOIN trip_meals tm ON tmi.meal_id = tm.id
    LEFT JOIN gear_items gi ON tmi.gear_item_id = gi.id
    WHERE tm.trip_id = ? AND tmi.gear_item_id IS NOT NULL
    GROUP BY tmi.gear_item_id
  `).all(tripId) as { gear_item_id: number; total_qty_per_person: number; unit: string | null; item_name: string }[];

  let added = 0;
  let updated = 0;

  // Get guests info for the note (informational only)
  const guests = db.prepare('SELECT name, days_present, meals_count FROM trip_guests WHERE trip_id = ?').all(tripId) as {
    name: string; days_present: number; meals_count: number
  }[];

  db.transaction(() => {
    for (const mi of mealItems) {
      const resolvedQty = Math.ceil(mi.total_qty_per_person * partySize);
      const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM trip_plan_items WHERE plan_id = ?').get(plan.id) as { m: number | null }).m ?? -1;

      const existing = db.prepare(
        'SELECT id, container_override FROM trip_plan_items WHERE plan_id = ? AND gear_item_id = ?'
      ).get(plan.id, mi.gear_item_id) as { id: number; container_override: number } | undefined;

      if (existing) {
        // Only update quantity if not manually overridden
        if (!existing.container_override) {
          db.prepare('UPDATE trip_plan_items SET quantity = ? WHERE id = ?').run(resolvedQty, existing.id);
          updated++;
        }
      } else {
        db.prepare(`
          INSERT INTO trip_plan_items (plan_id, gear_item_id, quantity, sort_order)
          VALUES (?, ?, ?, ?)
        `).run(plan.id, mi.gear_item_id, resolvedQty, maxOrder + 1);
        added++;
      }
    }
  })();

  res.json({
    added,
    updated,
    party_size: partySize,
    guests_note: guests.length > 0 ? guests : null
  });
});

// ─── Trip guests ──────────────────────────────────────────────────────────────

router.get('/guests', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;
  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const guests = db.prepare('SELECT * FROM trip_guests WHERE trip_id = ? ORDER BY created_at ASC').all(tripId);
  res.json({ guests });
});

router.post('/guests', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId } = req.params;
  const { name, days_present, meals_count, notes } = req.body;
  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (!name?.trim()) return res.status(400).json({ error: 'Guest name is required' });
  const result = db.prepare(
    'INSERT INTO trip_guests (trip_id, name, days_present, meals_count, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(tripId, name.trim(), days_present ?? 1, meals_count ?? 0, notes || null);
  const guest = db.prepare('SELECT * FROM trip_guests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ guest });
});

router.put('/guests/:guestId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, guestId } = req.params;
  const { name, days_present, meals_count, notes } = req.body;
  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const guest = db.prepare('SELECT id FROM trip_guests WHERE id = ? AND trip_id = ?').get(guestId, tripId);
  if (!guest) return res.status(404).json({ error: 'Guest not found' });
  db.prepare(`
    UPDATE trip_guests SET
      name = COALESCE(?, name),
      days_present = CASE WHEN ? IS NOT NULL THEN ? ELSE days_present END,
      meals_count = CASE WHEN ? IS NOT NULL THEN ? ELSE meals_count END,
      notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END
    WHERE id = ?
  `).run(
    name?.trim() || null,
    days_present !== undefined ? 1 : null, days_present !== undefined ? days_present : null,
    meals_count !== undefined ? 1 : null, meals_count !== undefined ? meals_count : null,
    notes !== undefined ? notes : null, notes !== undefined ? notes : null,
    guestId
  );
  const updated = db.prepare('SELECT * FROM trip_guests WHERE id = ?').get(guestId);
  res.json({ guest: updated });
});

router.delete('/guests/:guestId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { tripId, guestId } = req.params;
  const trip = canAccessTrip(tripId, authReq.user.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  const guest = db.prepare('SELECT id FROM trip_guests WHERE id = ? AND trip_id = ?').get(guestId, tripId);
  if (!guest) return res.status(404).json({ error: 'Guest not found' });
  db.prepare('DELETE FROM trip_guests WHERE id = ?').run(guestId);
  res.json({ success: true });
});

export default router;
