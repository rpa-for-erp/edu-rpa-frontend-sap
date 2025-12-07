import { createSlice } from '@reduxjs/toolkit';
import { Workspace } from '@/interfaces/workspace';

const initState = {
  isHiddenSidebar: false,
  currentWorkspaceId: null as string | null,
  workspaces: [] as Workspace[],
};

const homeSlice = createSlice({
  name: 'home',
  initialState: initState,
  reducers: {
    toggleSidebar: (state) => {
      state.isHiddenSidebar = !state.isHiddenSidebar;
    },
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspaceId = action.payload;
    },
    clearCurrentWorkspace: (state) => {
      state.currentWorkspaceId = null;
    },
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setCurrentWorkspace,
  clearCurrentWorkspace,
  setWorkspaces,
} = homeSlice.actions;

export default homeSlice;
