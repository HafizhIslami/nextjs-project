import { PayloadAction, createSlice } from "@reduxjs/toolkit";
export interface AuthUser {
  _id?: string;
  name: string;
  email: string;
  role: string;
  avatar?: {
    public_id?: string;
    url?: string;
  } | null;
}

interface IUserState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: IUserState = {
  user: null,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  initialState,
  name: "userSlice",
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
    },
    setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
  },
});

export default userSlice.reducer;
export const { setUser, setIsAuthenticated } = userSlice.actions;
