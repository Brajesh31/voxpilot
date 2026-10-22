import { configureStore } from '@reduxjs/toolkit';
import assistantsReducer from './slices/assistantsSlice';

export const store = configureStore({
  reducer: {
    assistants: assistantsReducer,
    assistantsApp: assistantsReducer,
  },
});

export default store;
