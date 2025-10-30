import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { SendIcon, HistoryIcon, PlusIcon, TrashIcon, XIcon, ArrowLeftIcon, SparklesIcon } from '../icons';
import { Message, ColumnChatHistory, ChatSession } from '../../types';

interface AiAssistantColumnProps {
    context: string;
    chatHistory: ColumnChatHistory;
    onChatHistoryChange: (newHistory: ColumnChatHistory) => void;
    onClose: () => void;
}

// Store chat instances in a map to maintain conversation history
const chatInstances = new Map<string, Chat>();

export const AiAssistantColumn: React.FC<AiAssistantColumnProps> = ({ context, chatHistory, onChatHistoryChange, onClose }) => {
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const activeSession = chatHistory.sessions.find(s => s.id === chatHistory.activeSessionId);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [activeSession, scrollToBottom]);

    useEffect(() => {
      // Focus the textarea when the component mounts or the active session changes
      textareaRef.current?.focus();
    }, [chatHistory.activeSessionId]);

    const handleSend = async (message: string) => {
        if (isLoading || !message.trim() || !activeSession) return;
    
        setIsLoading(true);
        setError(null);
    
        const newUserMessage: Message = { role: 'user', content: message };
        const updatedMessages: Message[] = [...activeSession.messages, newUserMessage];
        
        // Optimistic update of UI
        const updatedSession: ChatSession = { ...activeSession, messages: updatedMessages };
        const newSessions = chatHistory.sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
        onChatHistoryChange({ ...chatHistory, sessions: newSessions });

        try {
            let chat = chatInstances.get(activeSession.id);
            if (!chat) {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                chat = ai.chats.create({
                  model: 'gemini-2.5-flash',
                  history: [
                      ...(activeSession?.messages.map(msg => ({
                          role: msg.role,
                          parts: [{ text: msg.content }]
                      })) || [])
                  ],
                  config: {
                      systemInstruction: `You are an expert tutor. Your goal is to help me understand the following content. Be concise and helpful. Here is the content:\n\n---\n\n${context}`
                  }
                });
                chatInstances.set(activeSession.id, chat);
            }
    
            const response = await chat.sendMessage({ message });
            const text = response.text;
    
            const newModelMessage: Message = { role: 'model', content: text };
            
            const finalSession: ChatSession = { ...activeSession, messages: [...updatedMessages, newModelMessage] };
            const finalSessions = chatHistory.sessions.map(s => s.id === finalSession.id ? finalSession : s);
            onChatHistoryChange({ ...chatHistory, sessions: finalSessions });

        } catch (err: any) {
            console.error("Gemini API error:", err);
            setError("Sorry, I encountered an error. Please try again.");
            // Revert optimistic update on error by removing the user's message
             onChatHistoryChange({ ...chatHistory, sessions: newSessions.map(s => s.id === activeSession.id ? { ...s, messages: activeSession.messages } : s) });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend(userInput);
        setUserInput('');
    };

    const handleNewChat = () => {
        const newSessionId = crypto.randomUUID();
        const newSession: ChatSession = { id: newSessionId, messages: [], createdAt: new Date().toISOString() };
        onChatHistoryChange({
            sessions: [newSession, ...chatHistory.sessions],
            activeSessionId: newSessionId,
        });
        setIsHistoryPanelOpen(false);
    };

    const handleSelectSession = (sessionId: string) => {
        onChatHistoryChange({ ...chatHistory, activeSessionId: sessionId });
        setIsHistoryPanelOpen(false);
    };

    const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        const newSessions = chatHistory.sessions.filter(s => s.id !== sessionId);
        chatInstances.delete(sessionId);
        
        // If we delete the active session, make the next one active
        let newActiveId = chatHistory.activeSessionId;
        if (newActiveId === sessionId) {
            newActiveId = newSessions[0]?.id || null;
        }

        onChatHistoryChange({
            sessions: newSessions,
            activeSessionId: newActiveId,
        });
    };

    const suggestions = [
      "Explain this topic in simple terms.",
      "Summarize the key points.",
      "Give me a real-world example.",
      "Quiz me on this content."
    ];

    return (
        <div className="w-full h-full flex flex-col bg-brand-primary">
            <header className="flex-shrink-0 flex items-center justify-between p-4 h-20 border-b border-brand-accent">
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 hover:bg-brand-secondary rounded-full md:hidden">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <h2 className="font-bold text-lg">AI Assistant</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleNewChat} title="New Chat" className="p-2 hover:bg-brand-secondary rounded-full"><PlusIcon className="w-5 h-5" /></button>
                    <button onClick={() => setIsHistoryPanelOpen(p => !p)} title="Chat History" className="p-2 hover:bg-brand-secondary rounded-full"><HistoryIcon className="w-5 h-5" /></button>
                </div>
            </header>

            <div className="flex-grow flex relative min-h-0">
                <div className="flex-grow flex flex-col">
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {activeSession?.messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-brand-text text-brand-primary rounded-br-lg' : 'bg-brand-secondary text-brand-text rounded-bl-lg'}`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {activeSession?.messages.length === 0 && (
                          <div className="text-center py-8">
                              <SparklesIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-800">How can I help?</h3>
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-lg mx-auto">
                                  {suggestions.map(s => (
                                      <button key={s} onClick={() => handleSend(s)} className="p-3 bg-brand-secondary hover:bg-brand-accent text-sm text-left rounded-lg text-gray-700">{s}</button>
                                  ))}
                              </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {isLoading && <p className="text-sm text-center text-gray-500 p-2">AI is thinking...</p>}
                    {error && <p className="text-sm text-center text-red-500 p-2">{error}</p>}

                    <div className="flex-shrink-0 p-4 border-t border-brand-accent">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-brand-secondary rounded-lg p-2">
                            <textarea
                                ref={textareaRef}
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                placeholder="Ask a question..."
                                className="w-full border-none bg-transparent resize-none focus:ring-0 p-2 text-brand-text placeholder-gray-500"
                                rows={1}
                            />
                            <button type="submit" disabled={isLoading || !userInput.trim()} className="p-2 rounded-full bg-brand-text text-brand-primary disabled:bg-gray-400">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
                {isHistoryPanelOpen && (
                    <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-brand-primary border-l border-brand-accent z-10 flex flex-col shadow-lg">
                        <div className="flex items-center justify-between p-4 border-b border-brand-accent">
                            <h3 className="font-bold">Chat History</h3>
                            <button onClick={() => setIsHistoryPanelOpen(false)} className="p-2 rounded-full hover:bg-brand-secondary"><XIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {chatHistory.sessions.map(session => (
                                <div key={session.id} onClick={() => handleSelectSession(session.id)} className={`flex justify-between items-start p-4 border-b border-brand-accent hover:bg-brand-secondary cursor-pointer ${session.id === activeSession?.id ? 'bg-brand-accent' : ''}`}>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-medium truncate">{session.messages[0]?.content || 'New Chat'}</p>
                                        <p className="text-xs text-gray-500">{new Date(session.createdAt).toLocaleString()}</p>
                                    </div>
                                    <button onClick={(e) => handleDeleteSession(e, session.id)} className="p-1 text-gray-400 hover:text-red-600 ml-2 flex-shrink-0"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
