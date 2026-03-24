import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Send, Bot, User, Sparkles, Zap, ChevronRight,
    Loader2, X, Play, Trophy, Target, TrendingUp, Shield,
    Calendar, MapPin, Navigation, Ruler, Weight, Flag, Star, ChevronLeft,
    BarChart2, Video, ImageIcon, Clock, Swords, Footprints
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
    CartesianGrid, Legend
} from 'recharts';
import { Player, Club } from '../types';
import { scoutService, PlayerDetail, CareerEntry } from '../services/scoutService';
import { prospectService } from '../services/prospectService';
import { EmailService } from '../utils/emailService';
import toast from 'react-hot-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    players?: Player[];
    timestamp: Date;
}

/* ─────────────────────────────────────────────
   PLAYER DETAIL MODAL
───────────────────────────────────────────── */
interface PlayerDetailModalProps {
    playerId: string;
    club: Club;
    onClose: () => void;
    onScoutSuccess?: () => void;
}

/* ─────────────────────────────────────────────
   SCOUT EMAIL MODAL
   A confirmation step to send a formal training invitation
───────────────────────────────────────────── */
interface ScoutEmailModalProps {
    player: PlayerDetail;
    club: Club;
    onConfirm: (message: string, date: string, location: string) => void;
    onCancel: () => void;
}

const ScoutEmailModal: React.FC<ScoutEmailModalProps> = ({ player, club, onConfirm, onCancel }) => {
    const [message, setMessage] = useState(`We would like to invite you for a trial training session after reviewing your impressive stats and potential.`);
    const [trainingDate, setTrainingDate] = useState('');
    const [trainingLocation, setTrainingLocation] = useState(`${club.name} Training Ground`);
    const [isSending, setIsSending] = useState(false);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-gray-200">
                {/* Email Header Bar */}
                <div className="bg-[#1a73e8] p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Send size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold leading-tight">New Invitation</h3>
                            <p className="text-[10px] text-blue-100 opacity-80">Draft - Training Proposal</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[80vh]">
                    {/* Mail Metadata Section */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="w-12 text-gray-400 font-medium">To:</span>
                            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm">
                                <User size={14} className="text-blue-500" />
                                <span className="font-semibold text-gray-700">{player.name}</span>
                                <span className="text-gray-400 text-xs px-2 py-0.5 bg-gray-100 rounded">&lt;{player.email || 'no-email@provided.com'}&gt;</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <span className="w-12 text-gray-400 font-medium">From:</span>
                            <div className="flex-1 flex items-center gap-2">
                                <Shield size={14} className="text-gray-400" />
                                <span className="font-medium text-gray-600">{club.name} Management</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <span className="w-12 text-gray-400 font-medium">Subject:</span>
                            <span className="font-bold text-gray-800">🏃 Training Invitation - {club.name} is interested in you!</span>
                        </div>
                    </div>

                    {/* Email Content Area */}
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Dear <span className="font-bold text-gray-800">{player.name}</span>,</p>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full text-sm p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none min-h-[120px] resize-none leading-relaxed text-gray-700"
                                placeholder="Describe why you're interested and what to expect..."
                            />
                        </div>

                        {/* Training Logistics - "The Enhanced Part" */}
                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-4">
                            <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-2">
                                <MapPin size={14} /> Training Logistics
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-blue-600/70">Proposed Date</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                                        <input
                                            type="date"
                                            value={trainingDate}
                                            onChange={(e) => setTrainingDate(e.target.value)}
                                            className="w-full text-xs pl-9 pr-3 py-2.5 bg-white rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700 font-medium appearance-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-blue-600/70">Training Ground</label>
                                    <div className="relative">
                                        <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                                        <input
                                            type="text"
                                            value={trainingLocation}
                                            onChange={(e) => setTrainingLocation(e.target.value)}
                                            placeholder="Enter location"
                                            className="w-full text-xs pl-9 pr-3 py-2.5 bg-white rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-50">
                            <p className="text-sm text-gray-500">Best regards,</p>
                            <div className="flex items-center gap-3">
                                <img src={club.logo} alt={club.name} className="w-10 h-10 rounded-lg object-contain bg-gray-50 p-1 border border-gray-100" />
                                <div>
                                    <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{club.name} Management</p>
                                    <p className="text-[10px] text-gray-400 font-bold">NGL Scouting Advisor System</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Save as Draft
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setIsSending(true);
                                onConfirm(message, trainingDate, trainingLocation);
                            }}
                            disabled={isSending}
                            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white py-2.5 px-8 rounded-xl text-sm font-black shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Send Invitation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ playerId, club, onClose, onScoutSuccess }) => {
    const [player, setPlayer] = useState<PlayerDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'career' | 'stats' | 'media'>('overview');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [isScouting, setIsScouting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            const res = await scoutService.getPlayerDetail(playerId);
            if (res.success && res.data) {
                setPlayer(res.data);
            } else {
                toast.error(res.message || 'Could not load player details');
                onClose();
            }
            setLoading(false);
        };
        fetchDetail();
    }, [playerId]);

    const handleScoutConfirm = async (customMessage: string, date: string, location: string) => {
        if (!player) return;
        setIsScouting(true);
        try {
            // 1. Send Email
            const emailRes = await EmailService.sendScoutInvitation(
                player.email || 'test@example.com',
                player.name,
                club.name,
                customMessage,
                date,
                location
            );

            if (!emailRes) {
                toast.error('Failed to send invitation email');
                setShowEmailModal(false);
                setIsScouting(false);
                return;
            }

            // 2. Trigger Scouting Logic (Backend recruitment)
            const scoutRes = await prospectService.scoutProspect(playerId, club.id.toString());

            if (scoutRes.success) {
                toast.success(`Invitation sent and ${player.name} added to scouting list!`);
                if (onScoutSuccess) onScoutSuccess();
                onClose();
            } else {
                toast.error(scoutRes.message || 'Failed to complete scouting process');
            }
        } catch (error) {
            console.error('Error in scouting flow:', error);
            toast.error('An unexpected error occurred during scouting');
        } finally {
            setIsScouting(false);
            setShowEmailModal(false);
        }
    };

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-medium">Loading player profile…</p>
                </div>
            </div>
        );
    }

    if (!player) return null;

    const avatarSrc = player.avatarUrl || player.imageUrl || '/placeholder-player.png';

    // Radar data
    const radarData = [
        { subject: 'Pace', A: player.pace || 50, fullMark: 100 },
        { subject: 'Shoot', A: player.shooting || 50, fullMark: 100 },
        { subject: 'Pass', A: player.passing || 50, fullMark: 100 },
        { subject: 'Dribble', A: player.dribbling || 50, fullMark: 100 },
        { subject: 'Defend', A: player.defending || 50, fullMark: 100 },
        { subject: 'Phys', A: player.physicality || 50, fullMark: 100 },
    ];

    // Bar chart data from career history
    const careerBarData = (player.careerHistory || []).map((c: CareerEntry) => ({
        season: c.season,
        Goals: c.goals,
        Assists: c.assists,
        Apps: c.appearances,
    }));

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Star size={14} /> },
        { id: 'career', label: 'Career', icon: <Trophy size={14} /> },
        { id: 'stats', label: 'Statistics', icon: <BarChart2 size={14} /> },
        { id: 'media', label: 'Media', icon: <Video size={14} /> },
    ] as const;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

                {/* Hero Banner */}
                <div className="relative h-52 bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 flex-shrink-0">
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <X size={18} />
                    </button>

                    {/* Player photo */}
                    <div className="absolute bottom-0 left-6 translate-y-1/2">
                        <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gray-200">
                            <img
                                src={avatarSrc}
                                alt={player.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-player.png'; }}
                            />
                        </div>
                    </div>

                    {/* Name + position on banner */}
                    <div className="absolute bottom-4 left-44 text-white flex items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-black leading-tight">{player.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                    {player.position}
                                </span>
                                <span className="text-blue-200 text-xs">{player.nationality}</span>
                            </div>
                        </div>

                        {/* Scout Button - Now Next to Info */}
                        <button
                            onClick={() => setShowEmailModal(true)}
                            className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-full text-xs font-black shadow-xl flex items-center gap-2 transition-all active:scale-95 border border-blue-100/50"
                        >
                            Scout Player
                        </button>
                    </div>
                </div>

                {/* Spacer for avatar overlap */}
                <div className="h-16 bg-white flex-shrink-0" />

                {/* Quick stats row */}
                <div className="flex-shrink-0 grid grid-cols-4 gap-px bg-gray-100 border-t border-b border-gray-100">
                    {[
                        { label: 'Goals', value: player.totalGoals ?? 0, icon: <Target size={14} className="text-red-500" /> },
                        { label: 'Assists', value: player.totalAssists ?? 0, icon: <TrendingUp size={14} className="text-green-500" /> },
                        { label: 'Apps', value: player.totalAppearances ?? 0, icon: <Calendar size={14} className="text-blue-500" /> },
                        { label: 'Value', value: player.marketValue || 'N/A', icon: <Star size={14} className="text-yellow-500" /> },
                    ].map((s) => (
                        <div key={s.label} className="bg-white py-3 text-center">
                            <div className="flex justify-center mb-1">{s.icon}</div>
                            <p className="text-lg font-black text-gray-800">{s.value}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === t.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

                    {/* ── OVERVIEW ── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Bio */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[
                                    { icon: <Calendar size={14} />, label: 'Age', value: player.age ? `${player.age} yrs` : 'N/A' },
                                    { icon: <Flag size={14} />, label: 'Nationality', value: player.nationality },
                                    { icon: <Footprints size={14} />, label: 'Pref. Foot', value: player.preferredFoot || 'N/A' },
                                    { icon: <Ruler size={14} />, label: 'Height', value: player.height ? `${player.height} cm` : 'N/A' },
                                    { icon: <Weight size={14} />, label: 'Weight', value: player.weight ? `${player.weight} kg` : 'N/A' },
                                    { icon: <Shield size={14} />, label: 'Fitness', value: player.fitnessStatus || 'Fit' },
                                ].map((item) => (
                                    <div key={item.label} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">{item.label}</p>
                                            <p className="text-sm font-semibold text-gray-700">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Scout report */}
                            {player.scoutReport && (
                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                    <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-3">Scout Report</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{player.scoutReport}</p>
                                </div>
                            )}

                            {/* Strengths & Weaknesses */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl p-4 border border-green-100">
                                    <h4 className="text-xs uppercase font-black text-green-600 tracking-wider mb-3">Strengths</h4>
                                    <div className="space-y-1.5">
                                        {(player.strengths || []).map((s, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                                                <span className="text-xs text-gray-700">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-red-100">
                                    <h4 className="text-xs uppercase font-black text-red-500 tracking-wider mb-3">Weaknesses</h4>
                                    <div className="space-y-1.5">
                                        {(player.weaknesses || []).map((w, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                                                <span className="text-xs text-gray-700">{w}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CAREER ── */}
                    {activeTab === 'career' && (
                        <div className="space-y-4">
                            {(!player.careerHistory || player.careerHistory.length === 0) ? (
                                <div className="text-center py-10 text-gray-400">
                                    <Trophy size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No career history available.</p>
                                </div>
                            ) : (
                                player.careerHistory.map((c: CareerEntry, i: number) => (
                                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                                        {/* Club logo */}
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {c.logoUrl ? (
                                                <img src={c.logoUrl} alt={c.club} className="w-10 h-10 object-contain" />
                                            ) : (
                                                <Shield size={20} className="text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-800 truncate">{c.club}</p>
                                            <p className="text-xs text-gray-400">{c.season} • {c.role || player.position}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 text-center flex-shrink-0">
                                            {[
                                                { label: 'Apps', value: c.appearances },
                                                { label: 'G', value: c.goals },
                                                { label: 'A', value: c.assists },
                                            ].map((stat) => (
                                                <div key={stat.label}>
                                                    <p className="text-base font-black text-gray-800">{stat.value}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase">{stat.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ── STATS ── */}
                    {activeTab === 'stats' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-2">Attribute Radar</h4>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name={player.name} dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.45} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Individual stat bars */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                                <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-2">Attribute Breakdown</h4>
                                {radarData.map((stat) => (
                                    <div key={stat.subject}>
                                        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>{stat.subject}</span>
                                            <span>{stat.A}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                                                style={{ width: `${stat.A}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Goals/Assists bar chart from career */}
                            {careerBarData.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-100 p-4">
                                    <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-3">
                                        Season-by-Season Performance
                                    </h4>
                                    <div className="h-44">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={careerBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                                <XAxis dataKey="season" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Bar dataKey="Goals" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Assists" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── MEDIA ── */}
                    {activeTab === 'media' && (
                        <div className="space-y-6">
                            {/* Videos */}
                            {player.videoUrls && player.videoUrls.length > 0 ? (
                                <div>
                                    <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-3">Highlight Videos</h4>
                                    <div className="space-y-4">
                                        {player.videoUrls.map((url, i) => {
                                            // Convert YouTube watch URLs to embed
                                            const embedUrl = url
                                                .replace('watch?v=', 'embed/')
                                                .replace('youtu.be/', 'www.youtube.com/embed/');
                                            return (
                                                <div key={i} className="rounded-xl overflow-hidden bg-black aspect-video shadow-md">
                                                    <iframe
                                                        src={embedUrl}
                                                        title={`${player.name} highlight ${i + 1}`}
                                                        className="w-full h-full"
                                                        allowFullScreen
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Video size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No highlight videos available.</p>
                                </div>
                            )}

                            {/* Gallery */}
                            {player.galleryImages && player.galleryImages.length > 0 && (
                                <div>
                                    <h4 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-3">Photo Gallery</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {player.galleryImages.map((img, i) => (
                                            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-200 shadow-sm">
                                                <img
                                                    src={img}
                                                    alt={`${player.name} photo ${i + 1}`}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Confirm Email Modal */}
                {showEmailModal && (
                    <ScoutEmailModal
                        player={player}
                        club={club}
                        onConfirm={handleScoutConfirm}
                        onCancel={() => setShowEmailModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   MAIN SCOUT ADVISOR COMPONENT
───────────────────────────────────────────── */
interface ScoutAdvisorProps {
    club: Club;
    onScoutSuccess?: () => void;
}

const ScoutAdvisor: React.FC<ScoutAdvisorProps> = ({ club, onScoutSuccess }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent, directQuery?: string) => {
        if (e) e.preventDefault();
        const finalQuery = directQuery || query.trim();
        if (!finalQuery || isLoading) return;

        const userMessage: Message = { role: 'user', content: finalQuery, timestamp: new Date() };
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

    const renderMiniRadar = (player: Player) => {
        const data = [
            { subject: 'Pace', A: player.pace || 50, fullMark: 100 },
            { subject: 'Shoot', A: player.shooting || 50, fullMark: 100 },
            { subject: 'Pass', A: player.passing || 50, fullMark: 100 },
            { subject: 'Dribble', A: player.dribbling || 50, fullMark: 100 },
            { subject: 'Defend', A: player.defending || 50, fullMark: 100 },
            { subject: 'Phys', A: player.physicality || 50, fullMark: 100 },
        ];
        return (
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 9 }} />
                        <Radar name={player.name} dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.45} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <>
            {/* Player detail modal */}
            {selectedPlayerId && (
                <PlayerDetailModal
                    playerId={selectedPlayerId}
                    club={club}
                    onClose={() => setSelectedPlayerId(null)}
                    onScoutSuccess={onScoutSuccess}
                />
            )}

            <div className="flex flex-col h-[700px] bg-gray-50 rounded-2xl overflow-hidden shadow-inner border border-gray-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 flex items-center justify-between text-white shadow-md flex-shrink-0">
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
                        <div className="h-10 w-px bg-white/20" />
                        <div className="text-right">
                            <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Response Time</p>
                            <p className="text-lg font-bold">~0.8s</p>
                        </div>
                    </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border border-blue-100'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>

                                <div className="space-y-3 min-w-0">
                                    <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </div>

                                    {/* Player cards */}
                                    {msg.players && msg.players.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {msg.players.map(player => {
                                                const pid = (player as any)._id || player.id;
                                                const avatar = (player as any).avatarUrl || player.imageUrl;
                                                return (
                                                    <div
                                                        key={pid}
                                                        className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                                                        onClick={() => setSelectedPlayerId(pid)}
                                                    >
                                                        {/* Card Header & Photo */}
                                                        <div className="relative h-40 bg-gray-200 overflow-hidden">
                                                            <img
                                                                src={avatar}
                                                                alt={player.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-player.png'; }}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                                            {/* AI Match Score Badge */}
                                                            <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                                                                <Sparkles size={10} className="fill-white" />
                                                                {player.potentialScore || 85}% MATCH
                                                            </div>

                                                            <div className="absolute bottom-3 left-4 right-4 text-white">
                                                                <h4 className="font-black text-lg leading-tight tracking-tight drop-shadow-md">{player.name}</h4>
                                                                <div className="flex items-center gap-2 mt-0.5 opacity-90">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{player.position}</span>
                                                                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{player.nationality}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Card Body */}
                                                        <div className="p-4 flex-1 flex flex-col space-y-4 bg-gradient-to-b from-white to-gray-50/30">
                                                            {/* Radar Chart Container */}
                                                            <div className="relative bg-white rounded-xl p-2 border border-gray-50 shadow-inner group-hover:border-blue-100 transition-colors">
                                                                {renderMiniRadar(player)}
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="bg-blue-600/10 p-2 rounded-full backdrop-blur-[2px]">
                                                                        <Bot size={24} className="text-blue-600/20" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                {(player.strengths || []).slice(0, 3).map((s, i) => (
                                                                    <span key={i} className="text-[9px] bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-black uppercase tracking-tighter border border-blue-100/50">
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Card Footer */}
                                                        <div className="px-4 pb-4">
                                                            <button
                                                                className="w-full bg-gray-900 hover:bg-blue-700 text-white text-[11px] font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 group-hover:shadow-blue-200 group-hover:shadow-lg"
                                                                onClick={(e) => { e.stopPropagation(); setSelectedPlayerId(pid); }}
                                                            >
                                                                Review Full Profile
                                                                <ChevronRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-[85%] flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex-shrink-0 flex items-center justify-center border border-blue-100 text-blue-700">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested queries */}
                {!isLoading && messages.length < 3 && (
                    <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
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

                {/* Input area */}
                <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask anything about players… (e.g. Find fast strikers)"
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
                        Scout Advisor uses real human expert data to inform AI recommendations. Click any player card to view full profile.
                    </p>
                </div>
            </div>
        </>
    );
};

export default ScoutAdvisor;