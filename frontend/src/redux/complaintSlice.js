import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  complaints: [],
  selectedComplaint: null,
  statusLogs: [],
  loading: false,
  error: null
};

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    setComplaints: (state, action) => {
      state.complaints = action.payload;
    },
    addComplaint: (state, action) => {
      state.complaints.unshift(action.payload);
    },
    setSelectedComplaint: (state, action) => {
      state.selectedComplaint = action.payload.complaint;
      state.statusLogs = action.payload.statusLogs || [];
    },
    updateComplaintInState: (state, action) => {
      const idx = state.complaints.findIndex(c => c._id === action.payload._id || c.id === action.payload.id);
      if (idx !== -1) {
        state.complaints[idx] = action.payload;
      }
    }
  }
});

export const { setComplaints, addComplaint, setSelectedComplaint, updateComplaintInState } = complaintSlice.actions;
export default complaintSlice.reducer;
