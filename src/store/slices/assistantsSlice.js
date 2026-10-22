import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAllAssistant,
  getAssistantFetchExternal,
  updateAssistant,
  deleteAssistantApi,
} from '../../utils/api/assistantAPI';

const initialState = {
  // Assistants collection
  assistants: [],
  value: [], // Alias for backwards compatibility with assistantsApp.value
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  // Selected assistant detail
  currentAssistantId: null,
  activeDetail: {},
  detailStatus: 'idle', // 'idle' | 'loading' | 'saving' | 'saved' | 'failed'
  detailError: null,

  // Staged modifications waiting for save
  updateData: {},

  // Pagination
  currentPage: 1,
  itemsPerPage: 8,
};

// Async Thunk: Fetch all assistants
export const fetchAssistants = createAsyncThunk(
  'assistants/fetchAssistants',
  async (userOrgId, { rejectWithValue }) => {
    try {
      const data = await getAllAssistant(userOrgId);
      const list = data?.assistants || (Array.isArray(data) ? data : []);
      return list;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch assistants');
    }
  }
);

// Async Thunk: Fetch detail for a specific assistant
export const fetchAssistantDetail = createAsyncThunk(
  'assistants/fetchAssistantDetail',
  async (assistantId, { rejectWithValue }) => {
    try {
      if (!assistantId) throw new Error('Assistant ID is required');
      const detail = await getAssistantFetchExternal(assistantId);
      return detail;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch assistant detail');
    }
  }
);

// Async Thunk: Save staged changes to an assistant
export const saveAssistantDetail = createAsyncThunk(
  'assistants/saveAssistantDetail',
  async ({ assistantId, userOrgId }, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState();
      const updateData = state.assistants?.updateData || state.assistantsApp?.updateData || {};

      const response = await updateAssistant(assistantId, updateData);

      // Refresh detail and list
      await dispatch(fetchAssistantDetail(assistantId));
      if (userOrgId) {
        await dispatch(fetchAssistants(userOrgId));
      }

      return response;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update assistant');
    }
  }
);

// Async Thunk: Delete an assistant
export const deleteAssistant = createAsyncThunk(
  'assistants/deleteAssistant',
  async (assistantId, { rejectWithValue }) => {
    try {
      if (!assistantId) throw new Error('Assistant ID is required');
      await deleteAssistantApi(assistantId);
      return assistantId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete assistant');
    }
  }
);

const assistantsSlice = createSlice({
  name: 'assistants',
  initialState,
  reducers: {
    setCurrentAssistant: (state, action) => {
      state.currentAssistantId = action.payload;
    },
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setAssistants: (state, action) => {
      const list = Array.isArray(action.payload) ? action.payload : [];
      state.assistants = list;
      state.value = list;
    },
    appendToAssistantDetail: (state, action) => {
      const payload = action.payload || {};

      // Validate firstMessageMode if present
      if (payload.firstMessageMode) {
        const validModes = [
          'assistant-speaks-first',
          'assistant-speaks-first-with-model-generated-message',
          'assistant-waits-for-user',
        ];

        if (!validModes.includes(payload.firstMessageMode)) {
          const { firstMessageMode: _, ...validPayload } = payload;
          state.updateData = { ...state.updateData, ...validPayload };
        } else {
          state.updateData = { ...state.updateData, ...payload };
        }
      } else {
        state.updateData = { ...state.updateData, ...payload };
      }
    },
    resetUpdateData: (state) => {
      state.updateData = {};
    },
    // Backwards-compatible synchronous add
    addAssistant: (state, action) => {
      if (action.payload) {
        state.assistants.unshift(action.payload);
        state.value = state.assistants;
        state.currentAssistantId = action.payload.id;
      }
    },
    // Backwards-compatible synchronous update
    updateAssistantLocal: (state, action) => {
      const { id, updates } = action.payload || {};
      const assistant = state.assistants.find((a) => a.id === id);
      if (assistant) {
        Object.assign(assistant, updates);
      }
    },
    // Backwards-compatible synchronous delete
    deleteAssistantLocal: (state, action) => {
      const id = action.payload;
      state.assistants = state.assistants.filter((a) => a.id !== id);
      state.value = state.assistants;
      if (state.currentAssistantId === id) {
        state.currentAssistantId = state.assistants[0]?.id || null;
        state.activeDetail = {};
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Assistants
      .addCase(fetchAssistants.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAssistants.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.assistants = action.payload;
        state.value = action.payload;
        // Auto-select first assistant if none currently selected
        if (!state.currentAssistantId && action.payload.length > 0) {
          state.currentAssistantId = action.payload[0].id;
        }
      })
      .addCase(fetchAssistants.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message || 'Failed to fetch assistants';
      })

      // Fetch Assistant Detail
      .addCase(fetchAssistantDetail.pending, (state) => {
        state.detailStatus = 'loading';
        state.detailError = null;
      })
      .addCase(fetchAssistantDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.activeDetail = action.payload || {};
        state.updateData = {}; // Clear staged changes on fresh fetch
      })
      .addCase(fetchAssistantDetail.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload || action.error?.message || 'Failed to fetch assistant detail';
      })

      // Save Assistant Detail
      .addCase(saveAssistantDetail.pending, (state) => {
        state.detailStatus = 'saving';
        state.detailError = null;
      })
      .addCase(saveAssistantDetail.fulfilled, (state, action) => {
        state.detailStatus = 'saved';
        state.updateData = {};
        if (action.payload?.details) {
          state.activeDetail = {
            ...state.activeDetail,
            details: {
              ...(state.activeDetail?.details || {}),
              ...action.payload.details,
            },
          };
        }
      })
      .addCase(saveAssistantDetail.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload || action.error?.message || 'Failed to save assistant';
      })

      // Delete Assistant
      .addCase(deleteAssistant.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(deleteAssistant.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.assistants = state.assistants.filter((a) => a.id !== deletedId);
        state.value = state.assistants;
        if (state.currentAssistantId === deletedId) {
          const next = state.assistants[0] || null;
          state.currentAssistantId = next ? next.id : null;
          state.activeDetail = {};
        }
        state.detailStatus = 'succeeded';
      })
      .addCase(deleteAssistant.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload || action.error?.message || 'Failed to delete assistant';
      });
  },
});

export const {
  setCurrentAssistant,
  setPage,
  setAssistants,
  appendToAssistantDetail,
  resetUpdateData,
  addAssistant,
  updateAssistantLocal,
  deleteAssistantLocal,
} = assistantsSlice.actions;

export default assistantsSlice.reducer;
