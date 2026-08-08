import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import complaintReducer from './complaintSlice';
import schemeReducer from './schemeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    complaint: complaintReducer,
    scheme: schemeReducer
  }
});
