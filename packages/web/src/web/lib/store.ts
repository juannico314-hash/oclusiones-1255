'use client';

import { create } from 'zustand';
import { client } from './api';
import type { AppData, MoleculeScore, ViewKey } from './types';
import { calculateAllScores, calculateMoleculeScore } from './calculator';

interface AppState {
  // Datos crudos del backend
  data: AppData | null;
  loading: boolean;
  error: string | null;

  // UI state
  activeView: ViewKey;
  selectedMolecule: string;
  selectedCriteria: string | null;
  // Mapa de selección de moléculas para el Resumen comparativo
  selectedMolecules: Record<string, boolean>;

  // Acciones
  setData: (data: AppData) => void;
  setActiveView: (view: ViewKey) => void;
  setSelectedMolecule: (name: string) => void;
  setSelectedCriteria: (criteria: string | null) => void;
  toggleMoleculeSelection: (name: string) => void;
  selectAllMolecules: (names: string[]) => void;
  deselectAllMolecules: (names: string[]) => void;
  fetchData: () => Promise<void>;
  updateDiscount: (discount: number) => Promise<void>;
  updateCostInput: (
    moleculeName: string,
    updates: Partial<AppData['costInputs'][string]>,
  ) => Promise<void>;
  resetData: () => Promise<void>;

  // Selectores derivados
  getMoleculeScore: (name: string) => MoleculeScore | null;
  getAllScores: () => MoleculeScore[];
}

export const useAppStore = create<AppState>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  activeView: 'modelo-valor',
  selectedMolecule: 'Aflibercept 2 mg  Q8',
  selectedCriteria: null,
  // Por defecto todas las moléculas están seleccionadas
  selectedMolecules: {},

  setData: (data) => set({ data }),

  setActiveView: (view) => set({ activeView: view }),
  setSelectedMolecule: (name) => set({ selectedMolecule: name }),
  setSelectedCriteria: (criteria) => set({ selectedCriteria: criteria }),
  toggleMoleculeSelection: (name) =>
    set((state) => ({
      selectedMolecules: {
        ...state.selectedMolecules,
        [name]: !state.selectedMolecules[name],
      },
    })),
  selectAllMolecules: (names) =>
    set(() => {
      const next: Record<string, boolean> = {};
      names.forEach((n) => (next[n] = true));
      return { selectedMolecules: next };
    }),
  deselectAllMolecules: (names) =>
    set(() => {
      const next: Record<string, boolean> = {};
      names.forEach((n) => (next[n] = false));
      return { selectedMolecules: next };
    }),

  fetchData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await client.model.get();
      // Si la molécula seleccionada ya no existe en los datos nuevos, usar la primera
      if (data.molecules.length > 0 && !data.molecules.find(m => m.name === get().selectedMolecule)) {
        set({ data, loading: false, selectedMolecule: data.molecules[0].name });
      } else {
        set({ data, loading: false });
      }
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  },

  updateDiscount: async (discount: number) => {
    set({ loading: true, error: null });
    try {
      const data = await client.model.discount({ discount });
      set({ data, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  },

  updateCostInput: async (moleculeName, updates) => {
    try {
      const data = await client.model.costs({ moleculeName, updates });
      set({ data });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  },

  resetData: async () => {
    try {
      const data = await client.model.reset();
      // Reset también la molécula seleccionada al primer elemento
      if (data.molecules.length > 0) {
        set({ data, selectedMolecule: data.molecules[0].name, selectedCriteria: null });
      } else {
        set({ data });
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Error desconocido',
      });
    }
  },

  getMoleculeScore: (name) => {
    const { data } = get();
    if (!data) return null;
    return calculateMoleculeScore(data, name);
  },

  getAllScores: () => {
    const { data } = get();
    if (!data) return [];
    return calculateAllScores(data);
  },
}));
