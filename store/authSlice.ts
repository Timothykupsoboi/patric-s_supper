import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '@/types';

export interface AuthState {
  user: UserProfile | null;
  isTerminalLocked: boolean;
  activeShiftId: string | null;
}

const initialState: AuthState = {
  user: null,
  isTerminalLocked: false,
  activeShiftId: null,
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
