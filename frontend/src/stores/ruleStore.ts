import { create } from 'zustand';
import { presetApi, type PresetInfo } from '@/services/api';

export interface Rule {
  id: string;
  name: string;
  category: 'tables' | 'formulas' | 'typography' | 'images';
  enabled: boolean;
  priority: number;
  yamlContent: string;
}

export type Preset = PresetInfo;

interface RuleState {
  rules: Rule[];
  presets: Preset[];
  selectedRuleId: string | null;
  selectedPresetId: string;
  isLoadingPresets: boolean;

  setRules: (rules: Rule[]) => void;
  toggleRule: (id: string) => void;
  selectRule: (id: string | null) => void;
  selectPreset: (id: string) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  loadPresets: () => Promise<void>;
  setPresets: (presets: Preset[]) => void;
}

export const useRuleStore = create<RuleState>((set) => ({
  rules: [],
  presets: [],
  selectedRuleId: null,
  selectedPresetId: 'default',
  isLoadingPresets: false,

  setRules: (rules) => set({ rules }),

  toggleRule: (id) =>
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ),
    })),

  selectRule: (id) => set({ selectedRuleId: id }),

  selectPreset: (id) => set({ selectedPresetId: id }),

  updateRule: (id, updates) =>
    set((state) => ({
      rules: state.rules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)),
    })),

  loadPresets: async () => {
    set({ isLoadingPresets: true });
    try {
      const response = await presetApi.getAll();
      const presets = response.presets;
      set({ presets, isLoadingPresets: false });
      // 如果当前选中的预设不在列表中，选择第一个
      if (presets.length > 0) {
        set((state) => ({
          selectedPresetId: presets.find((p: PresetInfo) => p.id === state.selectedPresetId)
            ? state.selectedPresetId
            : presets[0].id,
        }));
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
      set({ isLoadingPresets: false });
    }
  },

  setPresets: (presets) => set({ presets }),
}));
