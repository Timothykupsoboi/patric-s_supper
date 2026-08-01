import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '@/types';

export interface AuthState {
  user: UserProfile | null;
  isTerminalLocked: boolean;
  activeShiftId: string | null;
}

const initialState: AuthState = {
  user: {
    id: 'demo-user-cashier',
    name: 'Main Cashier',
    email: 'cashier@supermarket.co.ke',
    role: 'cashier',
    supermarket_id: '00000000-0000-0000-0000-000000000001',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  isTerminalLocked: false,
  activeShiftId: 'shift-001',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
    },
    lockTerminal: (state) => {
      state.isTerminalLocked = true;
    },
    unlockTerminal: (state) => {
      state.isTerminalLocked = false;
    },
  },
});

export const { setUser, lockTerminal, unlockTerminal } = authSlice.actions;

export default authSlice.reducer;
