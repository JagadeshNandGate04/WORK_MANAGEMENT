
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from '../store';

// ========================================
// Chat Interfaces
// ========================================

export interface ChatMember {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export interface ChatMessage {
  id: number | string;
  conversation_id: number | string;
  sender_id: number;
  sender_name?: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
}

export interface ChatConversation {
  id: number;
  type: string;
  name?: string | null;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  members?: ChatMember[];
  last_message?: ChatMessage | null;
  unread_count?: number;
}

export interface SendMessagePayload {
  conversationId: number;
  content: string;
}

export interface FetchConversationsResponse {
  success: boolean;
  message: string;
  data: ChatConversation[] | { conversations: ChatConversation[] };
}

export interface FetchMessagesResponse {
  success: boolean;
  message: string;
  data: ChatMessage[] | { messages: ChatMessage[] };
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  data: ChatMessage;
}

// ========================================
// Chat State Interface
// ========================================

interface ChatState {
  conversations: ChatConversation[];
  messages: ChatMessage[];
  activeConversationId: number | null;

  // Fetch conversations
  fetchingConversations: boolean;
  fetchConversationsError: string | null;

  // Fetch messages
  fetchingMessages: boolean;
  fetchMessagesError: string | null;

  // Send message
  sendingMessage: boolean;
  sendMessageError: string | null;
}

// ========================================
// Initial State
// ========================================

const initialState: ChatState = {
  conversations: [],
  messages: [],
  activeConversationId: null,

  fetchingConversations: false,
  fetchConversationsError: null,

  fetchingMessages: false,
  fetchMessagesError: null,

  sendingMessage: false,
  sendMessageError: null,
};

// ========================================
// Chat Slice
// ========================================

const chatSlice = createSlice({
  name: 'chat',
  initialState,

  reducers: {
    // ------------------------------------
    // Set Active Conversation
    // ------------------------------------

    setActiveConversation(
      state,
      action: PayloadAction<number | null>
    ) {
      state.activeConversationId = action.payload;
      state.messages = [];
      state.fetchMessagesError = null;
      state.sendMessageError = null;
    },

    // ------------------------------------
    // Fetch Conversations Start
    // ------------------------------------

    fetchConversationsStart(state) {
      state.fetchingConversations = true;
      state.fetchConversationsError = null;
    },

    // ------------------------------------
    // Fetch Conversations Success
    // ------------------------------------

    fetchConversationsSuccess(
      state,
      action: PayloadAction<ChatConversation[]>
    ) {
      state.fetchingConversations = false;
      state.fetchConversationsError = null;
      state.conversations = action.payload;
    },

    // ------------------------------------
    // Fetch Conversations Failure
    // ------------------------------------

    fetchConversationsFailure(
      state,
      action: PayloadAction<string>
    ) {
      state.fetchingConversations = false;
      state.fetchConversationsError = action.payload;
    },

    // ------------------------------------
    // Fetch Messages Start
    // ------------------------------------

    fetchMessagesStart(state) {
      state.fetchingMessages = true;
      state.fetchMessagesError = null;
    },

    // ------------------------------------
    // Fetch Messages Success
    // ------------------------------------

    fetchMessagesSuccess(
      state,
      action: PayloadAction<{
        conversationId: number;
        messages: ChatMessage[];
      }>
    ) {
      state.fetchingMessages = false;
      state.fetchMessagesError = null;

      // Ignore results from a conversation the user has left.
      if (
        state.activeConversationId !==
        action.payload.conversationId
      ) {
        return;
      }

      state.messages = action.payload.messages;
    },

    // ------------------------------------
    // Fetch Messages Failure
    // ------------------------------------

    fetchMessagesFailure(
      state,
      action: PayloadAction<string>
    ) {
      state.fetchingMessages = false;
      state.fetchMessagesError = action.payload;
    },

    // ------------------------------------
    // Send Message Start
    // ------------------------------------

    sendMessageStart(state) {
      state.sendingMessage = true;
      state.sendMessageError = null;
    },

    // ------------------------------------
    // Send Message Success
    // ------------------------------------

    sendMessageSuccess(
      state,
      action: PayloadAction<ChatMessage>
    ) {
      state.sendingMessage = false;
      state.sendMessageError = null;

      const messageExists = state.messages.some(
        (message) =>
          String(message.id) === String(action.payload.id)
      );

      if (
        !messageExists &&
        String(action.payload.conversation_id) ===
          String(state.activeConversationId)
      ) {
        state.messages.push(action.payload);
      }

      const conversation = state.conversations.find(
        (item) =>
          String(item.id) ===
          String(action.payload.conversation_id)
      );

      if (conversation) {
        conversation.last_message = action.payload;
        conversation.updated_at = action.payload.created_at;
      }
    },

    // ------------------------------------
    // Send Message Failure
    // ------------------------------------

    sendMessageFailure(
      state,
      action: PayloadAction<string>
    ) {
      state.sendingMessage = false;
      state.sendMessageError = action.payload;
    },

    // ------------------------------------
    // Receive Real-Time Message
    // ------------------------------------

    receiveMessage(
      state,
      action: PayloadAction<ChatMessage>
    ) {
      const incomingMessage = action.payload;

      const messageExists = state.messages.some(
        (message) =>
          String(message.id) ===
          String(incomingMessage.id)
      );

      if (
        !messageExists &&
        String(incomingMessage.conversation_id) ===
          String(state.activeConversationId)
      ) {
        state.messages.push(incomingMessage);
      }

      const conversation = state.conversations.find(
        (item) =>
          String(item.id) ===
          String(incomingMessage.conversation_id)
      );

      if (conversation) {
        conversation.last_message = incomingMessage;
        conversation.updated_at = incomingMessage.created_at;

        // Move the conversation to the top of the list.
        state.conversations = [
          conversation,
          ...state.conversations.filter(
            (item) => item.id !== conversation.id
          ),
        ];
      }
    },

    // ------------------------------------
    // Clear Errors
    // ------------------------------------

    clearFetchConversationsError(state) {
      state.fetchConversationsError = null;
    },

    clearFetchMessagesError(state) {
      state.fetchMessagesError = null;
    },

    clearSendMessageError(state) {
      state.sendMessageError = null;
    },

    // ------------------------------------
    // Reset Chat State
    // ------------------------------------

    resetChatState(state) {
      state.conversations = [];
      state.messages = [];
      state.activeConversationId = null;

      state.fetchingConversations = false;
      state.fetchConversationsError = null;

      state.fetchingMessages = false;
      state.fetchMessagesError = null;

      state.sendingMessage = false;
      state.sendMessageError = null;
    },
  },
});

// ========================================
// Export Actions
// ========================================

export const {
  setActiveConversation,

  fetchConversationsStart,
  fetchConversationsSuccess,
  fetchConversationsFailure,

  fetchMessagesStart,
  fetchMessagesSuccess,
  fetchMessagesFailure,

  sendMessageStart,
  sendMessageSuccess,
  sendMessageFailure,

  receiveMessage,

  clearFetchConversationsError,
  clearFetchMessagesError,
  clearSendMessageError,

  resetChatState,
} = chatSlice.actions;

// ========================================
// Export Reducer
// ========================================

export default chatSlice.reducer;

// ========================================
// API Helper
// ========================================

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  );
}

function extractArray<T>(
  data: T[] | { conversations?: T[]; messages?: T[] }
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if ('conversations' in data && Array.isArray(data.conversations)) {
    return data.conversations;
  }

  if ('messages' in data && Array.isArray(data.messages)) {
    return data.messages;
  }

  return [];
}

// ========================================
// Fetch Conversations Thunk
// ========================================

export const fetchConversations =
  () =>
  async (
    dispatch: AppDispatch,
    getState: () => RootState
  ) => {
    dispatch(fetchConversationsStart());

    try {
      const token = getState().auth.token;

      if (!token) {
        const message = 'Please sign in to access chat.';
        dispatch(fetchConversationsFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/conversations`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result: FetchConversationsResponse =
        await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.message || 'Failed to fetch conversations.';

        dispatch(fetchConversationsFailure(message));
        return { success: false, message };
      }

      const conversations = extractArray<ChatConversation>(
        result.data
      );

      dispatch(fetchConversationsSuccess(conversations));

      return {
        success: true,
        message: result.message,
        data: conversations,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(fetchConversationsFailure(message));
      return { success: false, message };
    }
  };

// ========================================
// Fetch Messages Thunk
// ========================================

export const fetchMessages =
  (conversationId: number) =>
  async (
    dispatch: AppDispatch,
    getState: () => RootState
  ) => {
    dispatch(fetchMessagesStart());

    try {
      const token = getState().auth.token;

      if (!token) {
        const message = 'Please sign in to view messages.';
        dispatch(fetchMessagesFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/conversations/${conversationId}/messages`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result: FetchMessagesResponse =
        await response.json();

      if (!response.ok || !result.success) {
        const message =
          result.message || 'Failed to fetch messages.';

        dispatch(fetchMessagesFailure(message));
        return { success: false, message };
      }

      const messages = extractArray<ChatMessage>(
        result.data
      );

      dispatch(
        fetchMessagesSuccess({
          conversationId,
          messages,
        })
      );

      return {
        success: true,
        message: result.message,
        data: messages,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(fetchMessagesFailure(message));
      return { success: false, message };
    }
  };

// ========================================
// Send Message Thunk
// ========================================

export const sendChatMessage =
  (messageData: SendMessagePayload) =>
  async (
    dispatch: AppDispatch,
    getState: () => RootState
  ) => {
    dispatch(sendMessageStart());

    try {
      const token = getState().auth.token;

      if (!token) {
        const message = 'Please sign in to send messages.';
        dispatch(sendMessageFailure(message));
        return { success: false, message };
      }

      const content = messageData.content.trim();

      if (!content) {
        const message = 'Message cannot be empty.';
        dispatch(sendMessageFailure(message));
        return { success: false, message };
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/chat/conversations/${messageData.conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      const result: SendMessageResponse =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        const message =
          result.message || 'Failed to send message.';

        dispatch(sendMessageFailure(message));
        return { success: false, message };
      }

      dispatch(sendMessageSuccess(result.data));

      return {
        success: true,
        message: result.message || 'Message sent successfully.',
        data: result.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      dispatch(sendMessageFailure(message));
      return { success: false, message };
    }
  };
