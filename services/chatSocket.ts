
import { io, Socket } from "socket.io-client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let chatSocket: Socket | null = null;

export function connectChatSocket(token: string): Socket {
  if (chatSocket?.connected) {
    return chatSocket;
  }

  // Reuse an existing socket if it is still connecting.
  if (chatSocket) {
    chatSocket.auth = { token };
    return chatSocket;
  }

  chatSocket = io(API_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: true,
  });

  return chatSocket;
}

export function joinConversation(conversationId: number): void {
  if (!chatSocket?.connected) {
    throw new Error("Chat socket is not connected.");
  }

  chatSocket.emit(
    "conversation:join",
    { conversationId },
    (response: {
      success: boolean;
      message?: string;
      conversation_id?: number;
    }) => {
      if (!response?.success) {
        console.error(
          "Unable to join conversation:",
          response?.message || "Unknown error"
        );
      }
    }
  );
}

export function getChatSocket(): Socket | null {
  return chatSocket;
}

export function disconnectChatSocket(): void {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
}
