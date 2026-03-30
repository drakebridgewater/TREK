import { db } from '../db/database';

interface AutoAssignResult {
  item_id: number;
  proposed_container_id: number | null;
}

/**
 * Auto-assign trip plan items to containers based on first-matching tag.
 *
 * For each item (where container_override=0 and directly_in_vehicle=0):
 *   1. Get the item's gear tags in sort_order (first = highest priority)
 *   2. For each tag in order, find the first trip plan container whose gear_container has that tag
 *   3. Assign the item to that container; break on first match
 *   4. Unmatched items remain unassigned (container_id = null)
 *
 * @param planId    The trip_packing_plans.id
 * @param mode      'preview' returns proposals without writing; 'apply' commits to DB
 */
export function autoAssign(planId: number, mode: 'preview' | 'apply'): AutoAssignResult[] {
  // Load items that are eligible for auto-assignment
  const items = db.prepare(`
    SELECT tpi.id, tpi.gear_item_id
    FROM trip_plan_items tpi
    WHERE tpi.plan_id = ?
      AND tpi.container_override = 0
      AND tpi.directly_in_vehicle = 0
  `).all(planId) as { id: number; gear_item_id: number | null }[];

  // Load containers in this plan with their gear tags (ordered by sort_order on the container's tags)
  const containers = db.prepare(`
    SELECT tpc.id as plan_container_id, tpc.gear_container_id
    FROM trip_plan_containers tpc
    WHERE tpc.plan_id = ?
    ORDER BY tpc.sort_order ASC
  `).all(planId) as { plan_container_id: number; gear_container_id: number | null }[];

  // Build a map: gear_container_id → [tag_id, ...] (ordered by sort_order)
  const containerTagMap = new Map<number, number[]>();
  for (const c of containers) {
    if (!c.gear_container_id) continue;
    const tags = db.prepare(`
      SELECT tag_id FROM gear_container_tags
      WHERE gear_container_id = ?
      ORDER BY sort_order ASC
    `).all(c.gear_container_id) as { tag_id: number }[];
    containerTagMap.set(c.gear_container_id, tags.map(t => t.tag_id));
  }

  const results: AutoAssignResult[] = [];

  for (const item of items) {
    let assignedContainerId: number | null = null;

    if (item.gear_item_id) {
      // Get item's tags in sort_order
      const itemTags = db.prepare(`
        SELECT tag_id FROM gear_item_tags
        WHERE gear_item_id = ?
        ORDER BY sort_order ASC
      `).all(item.gear_item_id) as { tag_id: number }[];

      // Try each of the item's tags in priority order
      outer: for (const { tag_id } of itemTags) {
        // Find the first container (in plan order) that has this tag
        for (const c of containers) {
          if (!c.gear_container_id) continue;
          const containerTags = containerTagMap.get(c.gear_container_id) || [];
          if (containerTags.includes(tag_id)) {
            assignedContainerId = c.plan_container_id;
            break outer;
          }
        }
      }
    }

    results.push({ item_id: item.id, proposed_container_id: assignedContainerId });
  }

  if (mode === 'apply') {
    const update = db.prepare('UPDATE trip_plan_items SET container_id = ? WHERE id = ?');
    db.transaction(() => {
      for (const r of results) {
        update.run(r.proposed_container_id, r.item_id);
      }
    })();
  }

  return results;
}

/**
 * Resolve the effective party_size for a trip.
 * Uses trip.party_size if set, otherwise counts trip members.
 */
export function resolvePartySize(tripId: number): number {
  const trip = db.prepare('SELECT party_size FROM trips WHERE id = ?').get(tripId) as { party_size: number | null } | undefined;
  if (trip?.party_size) return trip.party_size;
  const memberCount = (db.prepare('SELECT COUNT(*) as c FROM trip_members WHERE trip_id = ?').get(tripId) as { c: number }).c;
  // Always at least 1 (the trip owner)
  return Math.max(1, memberCount);
}

/**
 * Resolve item quantity based on formula + trip context.
 */
export function resolveQuantity(
  baseQuantity: number,
  formula: string,
  partySize: number,
  tripNights: number
): number {
  switch (formula) {
    case 'per_night': return baseQuantity * tripNights;
    case 'per_person': return baseQuantity * partySize;
    case 'per_person_per_night': return baseQuantity * partySize * tripNights;
    default: return baseQuantity;
  }
}
