import { create } from "zustand";
import { currentUser } from "@/mocks/seed";
import type { User } from "@/types";

interface AuthUser {
  id: number;
  firstname: string;
  lastname?: string;
  email: string;
  avatar?: string;
  nickname?: string;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  // user: User | null;
  isAuthed: boolean;
  signIn: (u: User) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: currentUser,
  isAuthed: true,
  setUser: (user) => set({ user }),
  signIn: (u) => set({ user: u, isAuthed: true }),
  signOut: () => set({ user: null, isAuthed: false }),
}));
