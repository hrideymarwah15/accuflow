import { create } from 'zustand';
import type { Company, UserProfile } from '../lib/types';

interface AppState {
  company: Company | null;
  profile: UserProfile | null;
  setCompany: (company: Company | null) => void;
  setProfile: (profile: UserProfile | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  company: null,
  profile: null,
  setCompany: (company) => set({ company }),
  setProfile: (profile) => set({ profile }),
}));
