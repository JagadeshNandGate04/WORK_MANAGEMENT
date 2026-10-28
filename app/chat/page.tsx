'use client';

import React, { useState, useEffect, useMemo, useRef, FormEvent, KeyboardEvent } from 'react';
import Sidebar from '../components/SideBar';
import Header from '../components/Header';
import { SidebarProvider, useSidebar } from '../components/SidebarContext';
import { useDispatch, useSelector } from '../store/hooks';
import {
  fetchConversations,
  fetchMessages,
  sendChatMessage,
  setActiveConversation,
  type ChatConversation,
  type ChatMessage,
} from '../store/chat/chatSlice';

export interface Channel {
  id: string;
  name: string;
  type: 'squad' | 'dm';
  avatarInitials: string;
  description?: string;
  role?: string;
}

export interface Message {
  id: string;
  senderName: string;
  senderInitials: string;
  senderRole?: string;
  content: string;
  timestamp: string;
  isSelf?: boolean;
}

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

const isDirectConversation = (type: string) => {
  const normalizedType = type.toLowerCase();
  return normalizedType === 'dm' || /direct|private|one.?to.?one/.test(normalizedType);
};

const formatMessageTime = (createdAt: string) => {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime())
    ? createdAt
    : date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      });
};

const toChannel = (conversation: ChatConversation, currentUserId?: number): Channel => {
  const isDirect = isDirectConversation(conversation.type);
  const otherMembers = conversation.members?.filter((member) => member.id !== currentUserId) ?? [];
  const name =
    conversation.name?.trim() ||
    (isDirect
      ? otherMembers[0]?.name
      : conversation.members?.map((member) => member.name).filter(Boolean).join(', ')) ||
    `Conversation ${conversation.id}`;

  return {
    id: String(conversation.id),
    name,
    type: isDirect ? 'dm' : 'squad',
    avatarInitials: initialsFor(name),
    description: isDirect ? otherMembers[0]?.email : `${conversation.members?.length ?? 0} members`,
  };
};

const toMessage = (message: ChatMessage, currentUserId?: number): Message => {
  const senderName =
    message.sender_name?.trim() ||
    (message.sender_id === currentUserId ? 'You' : `Member ${message.sender_id}`);
  return {
    id: String(message.id),
    senderName,
    senderInitials: initialsFor(senderName),
    content: message.content,
    timestamp: formatMessageTime(message.created_at),
    isSelf: currentUserId !== undefined && message.sender_id === currentUserId,
  };
};

function ChatContent() {
  const { collapsed } = useSidebar();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const conversations = useSelector((state) => state.chat.conversations);
  const chatMessages = useSelector((state) => state.chat.messages);
  const activeConversationId = useSelector((state) => state.chat.activeConversationId);
  const fetchingConversations = useSelector((state) => state.chat.fetchingConversations);
  const fetchConversationsError = useSelector((state) => state.chat.fetchConversationsError);
  const fetchingMessages = useSelector((state) => state.chat.fetchingMessages);
  const fetchMessagesError = useSelector((state) => state.chat.fetchMessagesError);
  const sending = useSelector((state) => state.chat.sendingMessage);
  const sendError = useSelector((state) => state.chat.sendMessageError);

  const channels = useMemo(
    () => conversations.map((conversation) => toChannel(conversation, user?.id)),
    [conversations, user?.id]
  );
  const messages = useMemo(
    () => chatMessages.map((message) => toMessage(message, user?.id)),
    [chatMessages, user?.id]
  );
  const activeChannelId = activeConversationId === null ? null : String(activeConversationId);

  useEffect(() => {
    if (token) void dispatch(fetchConversations());
  }, [dispatch, token]);

  useEffect(() => {
    if (activeConversationId === null && conversations.length > 0) {
      dispatch(setActiveConversation(conversations[0].id));
    }
  }, [activeConversationId, conversations, dispatch]);

  useEffect(() => {
    if (activeConversationId !== null) {
      void dispatch(fetchMessages(activeConversationId));
    }
  }, [activeConversationId, dispatch]);

  const [filterTab, setFilterTab] = useState<'all' | 'dms' | 'squads'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Mascot: /cartoon-dev.png -> /loginlogo.png -> smile icon
  const [mascotSrc, setMascotSrc] = useState<string | null>('/cartoon-dev.png');

  const feedEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;
  const allMessages = messages;

  const visibleMessages = useMemo(() => {
    const q = messageSearch.trim().toLowerCase();
    if (!q) return allMessages;
    return allMessages.filter(
      (m) => m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q)
    );
  }, [allMessages, messageSearch]);

  // Keep the newest message in view
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [visibleMessages.length, activeChannelId]);

  const filteredChannels = channels.filter((channel) => {
    const matchesQuery = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'dms') return matchesQuery && channel.type === 'dm';
    if (filterTab === 'squads') return matchesQuery && channel.type === 'squad';
    return matchesQuery;
  });
  const squadChannels = filteredChannels.filter((c) => c.type === 'squad');
  const dmChannels = filteredChannels.filter((c) => c.type === 'dm');

  const selectChannel = (channelId: string) => {
    const conversationId = Number(channelId);
    if (!Number.isSafeInteger(conversationId) || conversationId === activeConversationId) return;
    setMessageSearch('');
    setMessageInput('');
    dispatch(setActiveConversation(conversationId));
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const content = messageInput.trim();
    if (!content || !activeChannel || activeConversationId === null || sending) return;

    const result = await dispatch(sendChatMessage({ conversationId: activeConversationId, content }));
    if (result.success) {
      setMessageInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift + Enter adds a new line (ignored while typing with an input method editor)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const channelButtonClass = (isSelected: boolean) =>
    `w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2.5 transition-all ${
      isSelected ? 'bg-[#eaf4ea] border border-[#cbe0cb] text-[#091e13]' : 'hover:bg-[#f2f7f2] text-slate-700'
    }`;

  const canSend = !!messageInput.trim() && !!activeChannel && !sending;

  return (
    <div className="min-h-screen w-full bg-[#e2ede0] text-slate-800 font-sans antialiased">
      <Sidebar />
      <div
        className={`min-h-screen pt-14 lg:pt-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="px-4 pt-4 sm:px-6 lg:px-7">
          <Header
            userName={user?.name?.trim() || user?.email?.split('@')[0] || 'Guest User'}
            userRole={user?.designation || user?.role || 'Team member'}
            userEmail={user?.email || ''}
            userInitials={initialsFor(user?.name?.trim() || user?.email?.split('@')[0] || 'Guest User')}
            activeTab="Chat"
          />
        </div>
        <main className="w-full px-4 py-4 sm:px-6 lg:px-7">
      <div className="w-full max-w-[1520px] h-[calc(100vh-10rem)] min-h-[400px] lg:h-[calc(100vh-7rem)] bg-white rounded-[24px] sm:rounded-[28px] border border-[#d2ded2] shadow-sm flex flex-col overflow-hidden mx-auto">
        {/* Top header navigation */}
        <header className="h-16 border-b border-[#e2ece2] px-4 sm:px-6 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center">
            <h1 className="text-sm font-bold text-[#091e13]">Team Chat</h1>
          </div>

          {/* Center: search messages in the open channel */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                placeholder="Search messages in this channel..."
                aria-label="Search messages"
                className="w-full pl-9 pr-10 py-1.5 text-xs bg-[#f4f7f4] border border-[#dce6dc] rounded-full text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#059669] focus:bg-white transition-all"
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="text-[10px] text-slate-400 font-mono bg-white border border-[#d6e2d6] rounded px-1.5 py-0.5 shadow-sm">⌘K</kbd>
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              className="inline-flex items-center space-x-1.5 bg-[#091e13] hover:bg-[#122e20] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Main body: 2-column chat layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar: channels & DMs */}
          <aside className="w-72 sm:w-80 border-r border-[#e2ece2] bg-[#fbfdfb] flex flex-col shrink-0">
            {/* Jump to a channel */}
            <div className="p-3.5 pb-2">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Jump to squad or DM..."
                  aria-label="Jump to squad or DM"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#dce6dc] rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#059669]"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="px-3.5 py-1.5 flex space-x-1 border-b border-[#e9f0e9]">
              {(['all', 'dms', 'squads'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  aria-pressed={filterTab === tab}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md capitalize transition-colors ${
                    filterTab === tab ? 'bg-[#edf3ec] text-[#091e13] shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'dms' ? 'DMs' : tab}
                </button>
              ))}
            </div>

            {/* Channels & DMs list */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
              {!token ? (
                <div role="alert" className="px-3 py-6 text-center text-xs text-rose-600">
                  Please sign in to access chat.
                </div>
              ) : fetchConversationsError ? (
                <div role="alert" className="px-3 py-6 text-center text-xs text-rose-600">
                  {fetchConversationsError}
                </div>
              ) : fetchingConversations ? (
                <div className="px-3 py-6 text-center text-xs text-slate-400">Loading conversations...</div>
              ) : channels.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-400">No squads or direct messages yet.</div>
              ) : filteredChannels.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-400">No results for your search.</div>
              ) : (
                <>
                  {/* Squad channels */}
                  {squadChannels.length > 0 && (
                    <div>
                      <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Squad Channels</p>
                      <div className="space-y-1">
                        {squadChannels.map((channel) => {
                          const isSelected = activeChannelId === channel.id;
                          return (
                            <button
                              key={channel.id}
                              type="button"
                              onClick={() => selectChannel(channel.id)}
                              aria-current={isSelected ? 'true' : undefined}
                              className={channelButtonClass(isSelected)}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected ? 'bg-[#059669] text-white' : 'bg-[#e6efe6] text-[#091e13]'
                                }`}
                              >
                                {channel.avatarInitials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate leading-tight">{channel.name}</p>
                                {channel.description && (
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{channel.description}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Direct messages */}
                  {dmChannels.length > 0 && (
                    <div>
                      <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Direct Messages</p>
                      <div className="space-y-1">
                        {dmChannels.map((channel) => {
                          const isSelected = activeChannelId === channel.id;
                          return (
                            <button
                              key={channel.id}
                              type="button"
                              onClick={() => selectChannel(channel.id)}
                              aria-current={isSelected ? 'true' : undefined}
                              className={channelButtonClass(isSelected)}
                            >
                              <div className="w-8 h-8 rounded-full bg-[#f0f4f0] border border-[#d6e2d6] text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {channel.avatarInitials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate leading-tight">{channel.name}</p>
                                {channel.description && (
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{channel.description}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* Right area: active chat feed & input */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Chat room sub-header */}
            <div className="h-14 border-b border-[#e2ece2] px-6 flex items-center justify-between shrink-0 bg-white">
              {activeChannel ? (
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-[#059669] text-white flex items-center justify-center font-bold text-xs">
                    {activeChannel.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h2 className="text-xs font-bold text-[#091e13]">{activeChannel.name}</h2>
                      <span className="text-[#059669]">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                      <span>Active Channel</span>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-400">No channel selected</span>
              )}

              {/* Utility icons */}
              <div className="flex items-center space-x-2 text-slate-400">
                <button type="button" aria-label="Add members" className="p-1.5 hover:bg-[#edf3ec] hover:text-slate-700 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </button>
                <button type="button" aria-label="Channel settings" className="p-1.5 hover:bg-[#edf3ec] hover:text-slate-700 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable message feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
              {/* Mascot welcome card */}
              <div className="bg-[#f8faf8] border border-[#dce6dc] rounded-2xl p-5 flex items-center space-x-5 shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl border border-[#d2ded2] p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                  {mascotSrc ? (
                    <img
                      src={mascotSrc}
                      alt="Developer mascot"
                      className="w-full h-full object-contain"
                      onError={() => setMascotSrc((prev) => (prev === '/cartoon-dev.png' ? '/loginlogo.png' : null))}
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-[#eaf4ea] flex items-center justify-center text-[#059669]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaf4ea] text-[#059669] border border-[#cce2cc]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                      <span>Dev Chat Active</span>
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#091e13] mt-1.5">
                    {activeChannel ? `Welcome to the ${activeChannel.name} channel!` : 'Welcome to Team Chat!'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    {activeChannel
                      ? 'Start a conversation with your squad or share an update with the team.'
                      : 'Pick a squad or direct message on the left to start chatting.'}
                  </p>
                </div>
              </div>

              {/* Messages or empty state */}
              {fetchMessagesError ? (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                  {fetchMessagesError}
                </div>
              ) : fetchingMessages ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  Loading messages...
                </div>
              ) : !activeChannel ? null : visibleMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-[#edf3ec] flex items-center justify-center text-slate-400 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    {allMessages.length > 0 ? 'No messages match your search' : 'No messages yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                    {allMessages.length > 0
                      ? 'Try a different word or clear the search.'
                      : 'This channel is ready for conversation. Type your update below.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 flex-1" role="log" aria-live="polite">
                  {visibleMessages.map((msg) => (
                    <div key={msg.id} className={`flex items-start space-x-3 ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
                      {!msg.isSelf && (
                        <div className="w-8 h-8 rounded-full bg-[#e8efe8] border border-[#d2ded2] text-xs font-bold text-slate-700 flex items-center justify-center shrink-0">
                          {msg.senderInitials}
                        </div>
                      )}
                      <div
                        className={`max-w-xl rounded-2xl p-3.5 text-xs leading-relaxed ${
                          msg.isSelf
                            ? 'bg-[#091e13] text-white rounded-br-md'
                            : 'bg-[#f4f7f4] border border-[#dce6dc] text-slate-800 rounded-bl-md'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`font-bold ${msg.isSelf ? 'text-white' : 'text-[#091e13]'}`}>{msg.senderName}</span>
                          <span className={`text-[10px] ${msg.isSelf ? 'text-slate-300' : 'text-slate-400'}`}>{msg.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      {msg.isSelf && (
                        <div className="w-8 h-8 rounded-full bg-[#091e13] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {msg.senderInitials}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div ref={feedEndRef} />
            </div>

            {/* Bottom input composer */}
            <div className="p-4 sm:p-5 border-t border-[#e2ece2] bg-white shrink-0">
              {sendError && (
                <div role="alert" className="mb-2 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs text-rose-700">
                  {sendError}
                </div>
              )}
              <form
                onSubmit={handleSendMessage}
                className="border border-[#d2ded2] rounded-2xl p-3 bg-white focus-within:ring-2 focus-within:ring-[#059669] focus-within:border-transparent transition-all shadow-sm"
              >
                <textarea
                  rows={2}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!activeChannel}
                  placeholder={
                    activeChannel
                      ? 'Type a message... (Shift + Enter for new line, ↵ to send)'
                      : 'Select a channel to start typing...'
                  }
                  aria-label="Message"
                  className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none bg-transparent disabled:cursor-not-allowed"
                />
                <div className="flex items-center justify-between pt-2 border-t border-[#f0f4f0] mt-1">
                  {/* Formatting controls */}
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <button type="button" aria-label="Code snippet" className="p-1 hover:text-slate-700 hover:bg-[#edf3ec] rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </button>
                    <button type="button" aria-label="Emoji picker" className="p-1 hover:text-slate-700 hover:bg-[#edf3ec] rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button type="button" aria-label="Attach file" className="p-1 hover:text-slate-700 hover:bg-[#edf3ec] rounded transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Send action */}
                  <button
                    type="submit"
                    disabled={!canSend}
                    className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      canSend
                        ? 'bg-[#059669] hover:bg-[#047857] text-white shadow-sm cursor-pointer'
                        : 'bg-[#dce6dc] text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{sending ? 'Sending...' : 'Send'}</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <SidebarProvider>
      <ChatContent />
    </SidebarProvider>
  );
}