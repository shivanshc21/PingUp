import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const initialState = {
  messages: [],
  suggestions: [],
  loadingSuggestions: false,
};

export const fetchMessages = createAsyncThunk(
  "messages/fetchMessages",
  async ({ token, userId }) => {
    const { data } = await api.post(
      "/api/message/get",
      { to_user_id: userId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return data.success ? data : null;
  },
);

export const fetchSuggestions = createAsyncThunk(
  "messages/fetchSuggestions",
  async ({ token, messages }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/api/ai/reply-suggestions",
        { messages },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        return data.suggestions;
      } else {
        return rejectWithValue(
          data.message || "Failed to generate suggestions",
        );
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages = [...state.messages, action.payload];
    },
    resetMessages: (state) => {
      state.messages = [];
    },
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      if (action.payload) {
        state.messages = action.payload.messages;
      }
    });
    builder.addCase(fetchSuggestions.pending, (state) => {
      state.loadingSuggestions = true;
    });
    builder.addCase(fetchSuggestions.fulfilled, (state, action) => {
      state.suggestions = action.payload;
      state.loadingSuggestions = false;
    });
    builder.addCase(fetchSuggestions.rejected, (state) => {
      state.loadingSuggestions = false;
    });
  },
});

export const {
  setMessages,
  addMessage,
  resetMessages,
  setSuggestions,
  clearSuggestions,
} = messagesSlice.actions;

export default messagesSlice.reducer;
