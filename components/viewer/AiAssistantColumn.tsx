import React, { useState, useEffect, useRef } from 'react';
import type { GoogleGenAI } from '@google/genai';
import { SparklesIcon } from '../icons';

interface Message {
    role: 'user' | 'model';
    content: string;
}

export const AiAssistantColumn: React.FC<{ context: string }> = ({ context }) => {
    const [history, setHistory] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const initialGreeting: Message = { role: 'model', content: "Hello! I'm your AI assistant for this topic. How can I help you? You can ask me to summarize, explain a concept, or create practice questions." };
    const messagesForDisplay = [initialGreeting, ...history];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesForDisplay, isLoading]);

    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const newUserMessage: Message = { role: 'user', content: messageText };
        const currentHistory = [...history, newUserMessage];
        setHistory(currentHistory);
        
        setUserInput('');
        setIsLoading(true);
        setError(null);
        
        const historyForApi = currentHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        try {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({});

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: historyForApi,
                config: {
                    systemInstruction: `You are a helpful learning assistant called PrepX AI. The user is studying a specific topic. Here is the content for the topic they are currently focused on:\n\n---\n\n${context}\n\n---\n\nYour primary role is to help them understand this material better. Answer their questions based *only* on the provided content. If the question is outside the scope of the material, gently state that the question is beyond the provided context and guide them back to the topic. Format your answers clearly using markdown (e.g., bullet points with *, bold with **). Be concise and encouraging.`
                }
            });

            const modelResponse: Message = { role: 'model', content: response.text };
            setHistory(prev => [...prev, modelResponse]);

        } catch (err) {
            console.error("Gemini API call failed", err);
            const errorText = "Sorry, I couldn't get a response. Please check your connection or API key and try again.";
            setError(errorText);
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestedPrompts = [
        "Summarize this topic",
        "Explain the key concepts simply",
        "Create 3 practice questions",
    ];

    return (
        <div className="h-full w-full flex flex-col bg-brand-primary">
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messagesForDisplay.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-brand-text text-brand-primary rounded-br-none' : 'bg-brand-secondary text-brand-text rounded-bl-none'}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                         <div className="max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-brand-secondary text-brand-text rounded-bl-none flex items-center">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
	                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
	                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">{error}</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 p-2 border-t border-brand-accent bg-brand-primary">
                 <div className="flex gap-2 justify-center mb-2 px-2">
                    {suggestedPrompts.map(prompt => (
                        <button 
                            key={prompt}
                            onClick={() => handleSendMessage(prompt)}
                            disabled={isLoading}
                            className="px-3 py-1 text-xs bg-brand-secondary border border-gray-300 rounded-full hover:bg-brand-accent disabled:opacity-50"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="flex items-center gap-2">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(userInput);
                            }
                        }}
                        placeholder="Ask a question..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 outline-none resize-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim()} className="p-2 bg-brand-text text-brand-primary rounded-lg disabled:bg-gray-400">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};