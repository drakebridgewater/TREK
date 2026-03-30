import { create } from 'zustand'
import { gearApi } from '../api/client'
import type { GearItem, GearContainer, GearVehicle, GearTag, GearTemplate } from '../types'

interface GearStore {
  items: GearItem[]
  containers: GearContainer[]
  vehicles: GearVehicle[]
  tags: GearTag[]
  templates: GearTemplate[]
  loaded: boolean
  loading: boolean

  loadGear: () => Promise<void>
  reset: () => void
}

export const useGearStore = create<GearStore>((set, get) => ({
  items: [],
  containers: [],
  vehicles: [],
  tags: [],
  templates: [],
  loaded: false,
  loading: false,

  loadGear: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const [itemsR, containersR, vehiclesR, tagsR, templatesR] = await Promise.all([
        gearApi.listItems(),
        gearApi.listContainers(),
        gearApi.listVehicles(),
        gearApi.listTags(),
        gearApi.listTemplates(),
      ])
      set({
        items: itemsR.items || [],
        containers: containersR.containers || [],
        vehicles: vehiclesR.vehicles || [],
        tags: tagsR.tags || [],
        templates: templatesR.templates || [],
        loaded: true,
      })
    } catch {
      // silently fail — components can show error state
    } finally {
      set({ loading: false })
    }
  },

  reset: () => set({ items: [], containers: [], vehicles: [], tags: [], templates: [], loaded: false, loading: false }),
}))
