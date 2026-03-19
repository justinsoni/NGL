import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    Send,
    Bot,
    User,
    Sparkles,
    TrendingUp,
    Zap,
    Shield,
    Target,
    ChevronRight,
    Info,
    Loader2,
    Trophy,
    History
} from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';
import { Player } from '../types';
import { scoutService } from '../services/scoutService';
import toast from 'react-hot-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    players?: Player[];
    timestamp: Date;
}

const ScoutAdvisor: React.FC = () => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I am your AI Scout Advisor. I can help you find the perfect talent for your squad using our database of professional scouting reports. What kind of player are you looking for today?",
            timestamp: new Date()
        }
    ]);
    const [suggestedQueries] = useState([
        "Find fast wingers with high potential",
        "Looking for a reliable central defender",
        "Show me technical midfielders under 21",
        "Best free agents with no injury history"
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent, directQuery?: string) => {
        if (e) e.preventDefault();

        const finalQuery = directQuery || query.trim();
        if (!finalQuery || isLoading) return;

        // Add user message
        const userMessage: Message = {
            role: 'user',
            content: finalQuery,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            const response = await scoutService.askAdvisor(finalQuery);

            if (response.success && response.data) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: response.data.answer,
                    players: response.data.recommendedPlayers,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                toast.error(response.message || "I'm having trouble connecting to my scouting brain.");
            }
        } catch (error) {
            console.error('Scout advisor error:', error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderStatsChart = (player: Player) => {
        const data = [
            { subject: 'Pace', A: player.pace || 50, fullMark: 100 },
            { subject: 'Shoot', A: player.shooting || 50, fullMark: 100 },
            { subject: 'Pass', A: player.passing || 50, fullMark: 100 },
            { subject: 'Dribble', A: player.dribbling || 50, fullMark: 100 },
            { subject: 'Defend', A: player.defending || 50, fullMark: 100 },
            { subject: 'Phys', A: player.physicality || 50, fullMark: 100 },
        ];

        return (
            <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                        <Radar
                            name={player.name}
                            dataKey="A"
                            stroke="#2563eb"
                            fill="#3b82f6"
                            fillOpacity={0.5}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[700px] bg-gray-50 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 flex items-center justify-between text-white shadow-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                        <Bot className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            AI Scout Advisor
                            <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                        </h3>
                        <p className="text-blue-100 text-sm opacity-90">Powered by Llama 3 • Generative Scouting</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Reports Analyzed</p>
                        <p className="text-lg font-bold">300,000+</p>
                    </div>
                    <div className="h-10 w-px bg-white/20"></div>
                    <div className="text-right">
                        <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Response Time</p>
                        <p className="text-lg font-bold">~0.8s</p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-100'
                                }`}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>

                            <div className="space-y-3">
                                <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {/* Recommended Players Grid */}
                                {msg.players && msg.players.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        {msg.players.map(player => (
                                            <div key={player._id || player.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all group">
                                                <div className="relative h-32 bg-gray-200 overflow-hidden">
                                                    <img
                                                        src={player.imageUrl}
                                                        alt={player.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                                    <div className="absolute bottom-3 left-3 text-white">
                                                        <h4 className="font-bold text-lg leading-tight">{player.name}</h4>
                                                        <p className="text-xs opacity-90">{player.position} • {player.nationality}</p>
                                                    </div>
                                                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                                        <Zap size={10} className="fill-white" />
                                                        {player.potentialScore}% POT
                                                    </div>
                                                </div>

                                                <div className="p-4 space-y-4">
                                                    <div className="flex gap-2">
                                                        {player.strengths?.slice(0, 2).map((s, i) => (
                                                            <span key={i} className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                                                                <Sparkles size={10} /> {s}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {renderStatsChart(player)}

                                                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                                        <button className="text-xs font-bold text-blue-700 flex items-center gap-1 hover:underline">
                                                            Full Report <ChevronRight size={12} />
                                                        </button>
                                                        <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                                            Scout
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start animate-pulse">
                        <div className="max-w-[85%] flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex-shrink-0 flex items-center justify-center border border-blue-100 text-blue-700">
                                <Loader2 size={16} className="animate-spin" />
                            </div>
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
            {!isLoading && messages.length < 3 && (
                <div className="p-4 bg-white border-t border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-widest pl-1">Suggested Inquiries</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedQueries.map((sq, i) => (
                            <button
                                key={i}
                                onClick={() => handleSendMessage(undefined, sq)}
                                className="text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 px-4 py-2 rounded-xl transition-all"
                            >
                                {sq}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask anything about players... (e.g. Find fast strikers)"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-12 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="mt-3 text-[10px] text-center text-gray-400 font-medium">
                    Scout Advisor uses real human expert data to inform AI recommendations.
                </p>
            </div>
        </div>
    );
};

export default ScoutAdvisor;
