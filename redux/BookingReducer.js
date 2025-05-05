import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedMovie: null, // Stores full movie object fetched from API
  selectedCinema: null, // Stores full cinema object
  selectedShowtime: null, // Stores full showtime object (including price, bookedSeats)
  selectedSeats: [], // Array of seat identifiers, e.g., ["A1", "B2"]
  totalPrice: 0,
};

export const BookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setMovie: (state, action) => {
      state.selectedMovie = action.payload; // payload should be the movie object
      // Reset subsequent steps when movie changes
      state.selectedCinema = null;
      state.selectedShowtime = null;
      state.selectedSeats = [];
      state.totalPrice = 0;
    },
    setCinema: (state, action) => {
      state.selectedCinema = action.payload; // payload should be the cinema object
      // Reset showtime/seats if cinema changes after movie selection
      state.selectedShowtime = null;
      state.selectedSeats = [];
      state.totalPrice = 0;
    },
    setShowtime: (state, action) => {
      state.selectedShowtime = action.payload; // payload should be the showtime object
      // Reset seats and price when showtime changes
      state.selectedSeats = [];
      state.totalPrice = 0;
    },
    addSeat: (state, action) => {
      const seatId = action.payload;
      // Ensure showtime exists, has a valid price, and seat isn't already selected
      if (
        state.selectedShowtime?.pricePerSeat != null &&
        !state.selectedSeats.includes(seatId)
      ) {
        state.selectedSeats.push(seatId);
        // Ensure price calculation is safe (check if pricePerSeat is a number)
        state.totalPrice += Number(state.selectedShowtime.pricePerSeat) || 0;
      } else {
        console.warn("Cannot add seat:", {
          seatId,
          showtime: !!state.selectedShowtime,
          price: state.selectedShowtime?.pricePerSeat,
          alreadySelected: state.selectedSeats.includes(seatId),
        });
      }
    },
    removeSeat: (state, action) => {
      const seatId = action.payload;
      const seatIndex = state.selectedSeats.indexOf(seatId);
      // Ensure showtime exists, has a valid price, and seat is actually selected
      if (seatIndex > -1 && state.selectedShowtime?.pricePerSeat != null) {
        state.selectedSeats.splice(seatIndex, 1);
        // Ensure price calculation is safe
        state.totalPrice -= Number(state.selectedShowtime.pricePerSeat) || 0;
        // Prevent negative total price due to potential floating point issues
        if (state.totalPrice < 0) state.totalPrice = 0;
      } else {
        console.warn("Cannot remove seat:", {
          seatId,
          showtime: !!state.selectedShowtime,
          price: state.selectedShowtime?.pricePerSeat,
          index: seatIndex,
        });
      }
    },
    // Action to clear the entire booking state, typically called after successful booking or cancellation
    clearBooking: (state) => {
      return initialState; // Reset state to its initial value
    },
  },
});

// Export actions
export const {
  setMovie,
  setCinema,
  setShowtime,
  addSeat,
  removeSeat,
  clearBooking,
} = BookingSlice.actions;

// Export reducer
export default BookingSlice.reducer;
