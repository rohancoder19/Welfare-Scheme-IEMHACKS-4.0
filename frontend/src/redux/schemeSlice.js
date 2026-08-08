import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  schemes: [],
  recommendations: [],
  selectedScheme: null,
  loading: false,
  error: null
};

const schemeSlice = createSlice({
  name: 'scheme',
  initialState,
  reducers: {
    setSchemes: (state, action) => {
      state.schemes = action.payload;
    },
    setRecommendations: (state, action) => {
      state.recommendations = action.payload;
    },
    setSelectedScheme: (state, action) => {
      state.selectedScheme = action.payload;
    }
  }
});

export const { setSchemes, setRecommendations, setSelectedScheme } = schemeSlice.actions;
export default schemeSlice.reducer;
