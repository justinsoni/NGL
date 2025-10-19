import React, { useState, useEffect } from 'react';
import { Match, CreatedUser, PlayerRegistration, Club } from '../types';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { clubService, CreateClubData } from '../services/clubService';
import ClubRegistrationForm from '../components/ClubRegistrationForm';
import ClubList from '../components/ClubList';
import toast from 'react-hot-toast';
import { listFixtures, generateFixtures, startMatch, addEvent, finishMatch, simulateMatch, scheduleMatch, resetLeague, updateTeams, FixtureDTO, getMatchTime, setTimeAcceleration, setManualTime } from '../services/fixturesService';
import playerService from '../services/playerService';
import { getSocket } from '../services/socket';
import { createNews } from '@/api/news/createNews';
import { fetchNews } from '@/api/news/fetchNews';
import { deleteNewsById } from '@/api/news/deleteNewsItemById';
import { updateNewsById } from '@/api/news/updateNewsById';
import { getLeagueConfig, updateLeagueConfig, resetLeagueConfig, LeagueConfigDTO } from '../services/leagueConfigService';
import { initializeLeagueTableAdmin } from '../services/tableService';

type AdminSection = 'Dashboard' | 'Manage Clubs' | 'Manage Fixtures' | 'Manage News' | 'Latest News & Features' | 'Manage Match Reports' | 'Manage Trending News' | 'User Management' | 'League Settings';

interface AdminDashboardProps {
    matches: Match[];
    onMatchUpdate: (matchId: number, homeScore: number, awayScore: number) => void;
    onMatchFinish: (matchId: number) => void;
    createdUsers: CreatedUser[];
    onCreateUser: (newUser: Omit<CreatedUser, 'password' | 'id'>) => CreatedUser;
    playerRegistrations: PlayerRegistration[];
    onApprovePlayerRegistration: (registrationId: number) => void;
    onRejectPlayerRegistration: (registrationId: number, reason: string) => void;
    clubs: Club[];
    onAddClub: (newClub: Club) => void;
    onUpdateClub: (updatedClub: Club) => void;
    onDeleteClub: (clubId: number | string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    matches,
    onMatchUpdate,
    onMatchFinish,
    createdUsers,
    onCreateUser,
    playerRegistrations,
    onApprovePlayerRegistration,
    onRejectPlayerRegistration,
    clubs: initialClubs,
    onAddClub,
    onUpdateClub,
    onDeleteClub
}) => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<AdminSection>('User Management');
    const [matchScores, setMatchScores] = useState<Record<number, { home: string; away: string }>>({});
    const [fixtures, setFixtures] = useState<FixtureDTO[]>([]);
    const [eventInput, setEventInput] = useState<{ 
        minute: string; 
        type: 'goal'|'yellow_card'|'red_card'|'foul'; 
        team: 'home'|'away'; 
        player: string; 
        assist?: string;
        goalType?: 'open_play'|'penalty'|'free_kick';
        fieldSide?: 'mid'|'rw'|'lw';
        targetId?: string 
    }>({ 
        minute: '', 
        type: 'goal', 
        team: 'home', 
        player: '',
        assist: '',
        goalType: 'open_play',
        fieldSide: 'mid'
    });
    const [scheduledOnce, setScheduledOnce] = useState<Record<string, boolean>>({});
    const [approvedPlayersByClub, setApprovedPlayersByClub] = useState<Record<string, { _id: string; name: string }[]>>({});
    const [stadiumsByClub, setStadiumsByClub] = useState<Record<string, { stadium: string; city: string; fullStadiumName: string }>>({});
    const [matchTimes, setMatchTimes] = useState<Record<string, { minute: number; display: string; phase?: string; stoppageTime?: number }>>({});

    const loadApprovedPlayers = async (clubId?: string) => {
        if (!clubId) return;
        if (approvedPlayersByClub[clubId]) return; // cached
        try {
            const res = await playerService.getApprovedPlayers(clubId);
            const players = (res.data || []).map((p: any) => ({ _id: String(p._id || p.id || p.email), name: p.name || p.fullName || p.email }));
            setApprovedPlayersByClub(prev => ({ ...prev, [clubId]: players }));
        } catch (e) {
            // ignore silently in admin UI; fallback to manual entry
        }
    };

    const loadStadiumData = async (clubId?: string) => {
        if (!clubId) return;
        if (stadiumsByClub[clubId]) return; // cached
        try {
            const club = clubs.find(c => String(c.id) === String(clubId));
            if (club && club.stadium) {
                const stadiumData = {
                    stadium: club.stadium,
                    city: club.city || '',
                    fullStadiumName: `${club.stadium}${club.city ? `, ${club.city}` : ''}`
                };
                setStadiumsByClub(prev => ({ ...prev, [clubId]: stadiumData }));
            }
        } catch (e) {
            // ignore silently in admin UI
        }
    };

    const getStadiumOptionsForMatch = (homeId: string, awayId: string): Array<{ value: string; label: string; clubName: string }> => {
        const options: Array<{ value: string; label: string; clubName: string }> = [];
        
        // Add home team stadium
        if (homeId && stadiumsByClub[homeId]) {
            const homeClub = clubs.find(c => String(c.id) === String(homeId));
            const homeStadium = stadiumsByClub[homeId];
            options.push({
                value: homeStadium.fullStadiumName,
                label: `${homeStadium.fullStadiumName} (${homeClub?.name || 'Home'})`,
                clubName: homeClub?.name || 'Home'
            });
        }
        
        // Add away team stadium
        if (awayId && stadiumsByClub[awayId]) {
            const awayClub = clubs.find(c => String(c.id) === String(awayId));
            const awayStadium = stadiumsByClub[awayId];
            options.push({
                value: awayStadium.fullStadiumName,
                label: `${awayStadium.fullStadiumName} (${awayClub?.name || 'Away'})`,
                clubName: awayClub?.name || 'Away'
            });
        }
        
        return options;
    };

    const updateMatchTimes = async () => {
        const liveFixtures = fixtures.filter(f => f.status === 'live');
        if (liveFixtures.length === 0) return;

        const timeUpdates = await Promise.all(
            liveFixtures.map(async (fixture) => {
                try {
                    const timeInfo = await getMatchTime(fixture._id);
                    return { fixtureId: fixture._id, timeInfo };
                } catch (error) {
                    console.error('Failed to get match time for fixture:', fixture._id);
                    return null;
                }
            })
        );

        const newMatchTimes: Record<string, { minute: number; display: string }> = {};
        timeUpdates.forEach(update => {
            if (update) {
                newMatchTimes[update.fixtureId] = update.timeInfo;
            }
        });

        setMatchTimes(prev => ({ ...prev, ...newMatchTimes }));
    };

    // News management state
    const [showNewsForm, setShowNewsForm] = useState(false);
    const [isSubmittingNews, setIsSubmittingNews] = useState(false);
    const [newsArticles, setNewsArticles] = useState<Array<{ _id: string; title: string; imageUrl: string, summary: string, content: string, createdAt: string, category: string }>>([]);
    const [editingNews, setEditingNews] = useState<any>(null);
    
    // News form state
    const [newsForm, setNewsForm] = useState({
        title: '',
        summary: '',
        imageUrl: '',
        category: 'Features',
        content: ''
    });
    const [newsImageFile, setNewsImageFile] = useState<File | null>(null);
    const [newsImagePreview, setNewsImagePreview] = useState<string>('');

    // Latest News & Features specific state
    const [showLatestNewsForm, setShowLatestNewsForm] = useState(false);
    const [isSubmittingLatestNews, setIsSubmittingLatestNews] = useState(false);
    const [latestNewsArticles, setLatestNewsArticles] = useState<Array<{ _id: string; title: string; imageUrl: string, summary: string, content: string, createdAt: string, category: string, authorRole: string }>>([]);
    const [editingLatestNews, setEditingLatestNews] = useState<any>(null);
    
    // Latest News form state
    const [latestNewsForm, setLatestNewsForm] = useState({
        title: '',
        summary: '',
        imageUrl: '',
        category: 'Features',
        content: ''
    });
    const [latestNewsImageFile, setLatestNewsImageFile] = useState<File | null>(null);
    const [latestNewsImagePreview, setLatestNewsImagePreview] = useState<string>('');

    // Club management state
    const [showClubForm, setShowClubForm] = useState(false);
    const [isSubmittingClub, setIsSubmittingClub] = useState(false);
    const [isLoadingClubs, setIsLoadingClubs] = useState(false);

    // Form states for manager creation
    const [newManagerName, setNewManagerName] = useState('');
    const [newManagerEmail, setNewManagerEmail] = useState('');
    const [newManagerClubId, setNewManagerClubId] = useState<string>('');
    const [lastCreatedUser, setLastCreatedUser] = useState<any>(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [clubs, setClubs] = useState<Club[]>(initialClubs || []);

    // Validation helpers for fixture scheduling
    const isValidFutureIso = (iso: string): boolean => {
        try {
            const dt = new Date(iso);
            if (Number.isNaN(dt.getTime())) return false;
            // Allow slight clock skew: 60 seconds tolerance
            const now = new Date(Date.now() - 60 * 1000);
            return dt > now;
        } catch {
            return false;
        }
    };
    const validateVenueName = (name: string): { ok: boolean; message?: string } => {
        const value = (name || '').trim();
        if (value.length < 3) return { ok: false, message: 'Venue must be at least 3 characters' };
        if (value.length > 100) return { ok: false, message: 'Venue must be 100 characters or less' };
        // Allow letters (no digits), spaces, and common punctuation
        const allowed = /^[A-Za-z .,&'\-()]+$/;
        if (!allowed.test(value)) return { ok: false, message: 'Only letters, spaces, and . , & ( ) - \' are allowed' };
        return { ok: true };
    };

    // Scheduling conflict helpers
    const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours window per match
    const SLOT_STEP_MS = 15 * 60 * 1000; // 15 minutes step for auto-reschedule
    const hasConflict = (teamId: string, kickoffIso: string, excludeFixtureId?: string) => {
        if (!teamId || !kickoffIso) return false;
        const start = new Date(kickoffIso).getTime();
        return fixtures.some(other => {
            if (!other.kickoffAt) return false;
            if (excludeFixtureId && other._id === excludeFixtureId) return false;
            const otherStart = new Date(other.kickoffAt).getTime();
            const involvesTeam = [other.homeTeam, other.awayTeam].some(t => (typeof t==='string'?t:(t?._id)) === teamId);
            if (!involvesTeam) return false;
            const a1 = start, a2 = start + MATCH_DURATION_MS;
            const b1 = otherStart, b2 = otherStart + MATCH_DURATION_MS;
            return Math.max(a1, b1) < Math.min(a2, b2);
        });
    };
    const findNextFreeSlot = (homeId: string, awayId: string, kickoffIso: string, excludeFixtureId?: string): string | null => {
        if (!kickoffIso) return null;
        let t = new Date(kickoffIso).getTime();
        // search up to 2 days ahead to find a slot
        const limit = t + 2 * 24 * 60 * 60 * 1000;
        while (t < limit) {
            const iso = new Date(t).toISOString();
            if (!hasConflict(homeId, iso, excludeFixtureId) && !hasConflict(awayId, iso, excludeFixtureId)) return iso;
            t += SLOT_STEP_MS;
        }
        return null;
    };

    // Helper: show ISO kickoff in datetime-local input format (YYYY-MM-DDTHH:mm)
    const toLocalInputValue = (iso?: string): string => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const tzOffset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - tzOffset * 60000);
        return local.toISOString().slice(0,16);
    };

    // Match Reports management state
    type MatchReportItem = { id: string; title: string; imageUrl: string; createdAt: string };
    const [matchReportForm, setMatchReportForm] = useState<{ title: string; imageUrl: string }>({ title: '', imageUrl: '' });
    const [matchReports, setMatchReports] = useState<MatchReportItem[]>([]);
    const [matchReportImageFile, setMatchReportImageFile] = useState<File | null>(null);
    const [matchReportImagePreview, setMatchReportImagePreview] = useState<string>('');

    // Trending News management state
    type TrendingNewsItem = { id: string; title: string; imageUrl: string; icon: string; createdAt: string };
    const [trendingNewsForm, setTrendingNewsForm] = useState<{ title: string; imageUrl: string; icon: string }>({ title: '', imageUrl: '', icon: '🔥' });
    const [trendingNews, setTrendingNews] = useState<TrendingNewsItem[]>([]);
    const [trendingNewsImageFile, setTrendingNewsImageFile] = useState<File | null>(null);
    const [trendingNewsImagePreview, setTrendingNewsImagePreview] = useState<string>('');
    const [showTrendingNewsForm, setShowTrendingNewsForm] = useState(false);
    const [isSubmittingTrendingNews, setIsSubmittingTrendingNews] = useState(false);
    const [editingTrendingNews, setEditingTrendingNews] = useState<any>(null);

    // League configuration state
    const [leagueConfig, setLeagueConfig] = useState<LeagueConfigDTO | null>(null);
    const [isLoadingLeagueConfig, setIsLoadingLeagueConfig] = useState(false);
    const [isUpdatingLeagueConfig, setIsUpdatingLeagueConfig] = useState(false);
    const [leagueConfigForm, setLeagueConfigForm] = useState({
        startDate: '',
        endDate: '',
        name: 'NGL',
        description: ''
    });


    
        
    useEffect(() => {
        async function getNews() {
        try {
            const data = await fetchNews();
            setNewsArticles(data);
            
            // Filter latest news articles (admin-created, not match reports or trending)
            const latestNews = data
                .filter((item: any) => item.authorRole === 'admin' && item.type !== 'match-report' && item.type !== 'trending')
                .map((item: any) => ({
                    _id: item._id,
                    title: item.title,
                    imageUrl: item.imageUrl,
                    summary: item.summary,
                    content: item.content,
                    createdAt: item.createdAt,
                    category: item.category,
                    authorRole: item.authorRole
                }));
            setLatestNewsArticles(latestNews);
        } catch (err) {
            setNewsArticles([]);
            setLatestNewsArticles([]);
        }
        }
        getNews();
    }, []);

    // Load league configuration
    useEffect(() => {
        const loadLeagueConfig = async () => {
            setIsLoadingLeagueConfig(true);
            try {
                const config = await getLeagueConfig();
                setLeagueConfig(config);
                setLeagueConfigForm({
                    startDate: config.startDate ? new Date(config.startDate).toISOString().slice(0, 16) : '',
                    endDate: config.endDate ? new Date(config.endDate).toISOString().slice(0, 16) : '',
                    name: config.name || '',
                    description: config.description || ''
                });
            } catch (error) {
                console.error('Failed to load league config:', error);
                toast.error('Failed to load league configuration');
            } finally {
                setIsLoadingLeagueConfig(false);
            }
        };
        loadLeagueConfig();
    }, []);

    const uploadMatchImage = async (file: File, uploadPreset: string): Promise<string> => {
        const url = `https://api.cloudinary.com/v1_1/dmuilu78u/auto/upload`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        const res = await fetch(url, { method: 'POST', body: formData });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload failed: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        if (!data.secure_url) throw new Error('No secure_url returned');
        return data.secure_url as string;
    };

    const handleScoreChange = (matchId: number, team: 'home' | 'away', score: string) => {
        setMatchScores(prev => ({
            ...prev,
            [matchId]: {
                ...prev[matchId],
                [team]: score,
            }
        }));
    };

    const handleUpdateScoreClick = (match: Match) => {
        const scores = matchScores[match.id];
        const homeScore = scores?.home !== undefined && scores.home !== '' ? parseInt(scores.home, 10) : match.homeScore;
        const awayScore = scores?.away !== undefined && scores.away !== '' ? parseInt(scores.away, 10) : match.awayScore;
        
        if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
            alert('Please enter valid, non-negative scores.');
            return;
        }
        
        onMatchUpdate(match.id, homeScore, awayScore);
    };

    const handleFinalizeMatchClick = (match: Match) => {
        const scores = matchScores[match.id];
        const homeScore = scores?.home !== undefined && scores.home !== '' ? parseInt(scores.home, 10) : match.homeScore;
        const awayScore = scores?.away !== undefined && scores.away !== '' ? parseInt(scores.away, 10) : match.awayScore;
        
        if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
            alert('Please enter valid, non-negative scores before finalizing.');
            return;
        }
        
        onMatchUpdate(match.id, homeScore, awayScore);
        onMatchFinish(match.id);
    };
    
    const handleCreateManagerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (!newManagerName.trim() || !newManagerEmail.trim()) {
            setErrorMessage('Please fill in all required fields.');
            return;
        }

        // Find club by id
        const selectedClub = clubs.find(c => String(c.id) === newManagerClubId);

        // Check if club already has a manager
        const existingManager = createdUsers.find((u: CreatedUser) => u.role === 'clubManager' && String(u.clubId) === newManagerClubId && u.isActive);
        if (existingManager) {
            setErrorMessage(`${selectedClub?.name} already has an active manager.`);
            return;
        }

        // Check if email already exists
        const existingUser = createdUsers.find((u: CreatedUser) => u.email.toLowerCase() === newManagerEmail.toLowerCase());
        if (existingUser) {
            setErrorMessage('An account with this email already exists.');
            return;
        }

        setIsCreatingUser(true);

        try {
            // Get Firebase ID token for authentication
            const idToken = await user?.firebaseUser?.getIdToken();
            
            if (!idToken) {
                throw new Error('Authentication required. Please login again.');
            }

            // Call backend API to create manager
            const response = await axios.post('http://localhost:5000/api/auth/create-manager', {
                managerName: newManagerName,
                managerEmail: newManagerEmail,
                clubName: selectedClub?.name,
                clubId: newManagerClubId
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            });

            if (response.data.success) {
                const managerData = response.data.data.manager;

                // Show success message based on email delivery status
                if (response.data.data.emailSent) {
                    const emailProvider = response.data.data.emailProvider || 'email';
                    alert(`✅ Manager Account Created Successfully!\n\n📧 Login credentials have been sent via ${emailProvider.toUpperCase()} to:\n${managerData.email}\n\n👤 Manager Details:\n• Email: ${managerData.email}\n• Role: Club Manager\n• Club: ${managerData.club}\n\n🎯 Next Steps:\nThe manager can now login and create coaches for their club.\n\n⚠️ Security Note:\nCredentials are sent securely via email. Admin cannot see the generated password.`);
                } else {
                    // Only show password if email failed (for manual delivery)
                    const password = response.data.data.password;
                    alert(`✅ Manager Account Created Successfully!\n\n⚠️ Email delivery failed - Please provide credentials manually:\n\n👤 Manager Credentials:\n• Email: ${managerData.email}\n• Password: ${password}\n• Club: ${managerData.club}\n\n🎯 Next Steps:\n1. Manually send these credentials to the manager\n2. Manager can login and create coaches for their club\n\n🔐 Security Note:\nPlease ensure secure delivery of these credentials.`);
                }

                // Update UI state
                setLastCreatedUser({
                    ...managerData,
                    emailSent: response.data.data.emailSent,
                    emailProvider: response.data.data.emailProvider
                });
                setNewManagerName('');
                setNewManagerEmail('');
                // Use first club from API clubs array, fallback to ''
                setNewManagerClubId(clubs[0]?.id ? String(clubs[0].id) : '');
            } else {
                setErrorMessage(response.data.message || 'Failed to create manager account.');
            }
        } catch (error: any) {
            console.error('Error creating manager:', error);
            
            if (error.response?.data?.message) {
                setErrorMessage(error.response.data.message);
            } else if (error.response?.status === 409) {
                setErrorMessage('A user with this email already exists.');
            } else if (error.response?.status === 400) {
                setErrorMessage('Please check your input and try again.');
            } else if (error.response?.status === 401) {
                setErrorMessage('Authentication required. Please login again.');
            } else {
                setErrorMessage('Failed to create manager account. Please try again.');
            }
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleDeactivateUser = (userId: number) => {
        // This would need to be passed as a prop from App.tsx
        console.log('Deactivate user:', userId);
    };

    useEffect(() => {
        const fetchClubs = async () => {
            setIsLoadingClubs(true);
            try {
                const res = await clubService.getClubs();
                // Map _id to id for all clubs
                const clubsWithId = (res.data || []).map((club: any) => ({
                    ...club,
                    id: club._id
                }));
                setClubs(clubsWithId);
                
                // Pre-load stadium data for all clubs
                clubsWithId.forEach((club: Club) => {
                    if (club.stadium) {
                        const stadiumData = {
                            stadium: club.stadium,
                            city: club.city || '',
                            fullStadiumName: `${club.stadium}${club.city ? `, ${club.city}` : ''}`
                        };
                        setStadiumsByClub(prev => ({ ...prev, [club.id]: stadiumData }));
                    }
                });
                
                // Set default club for manager creation if not set and clubs exist
                if (clubsWithId.length > 0 && !clubsWithId.find((c: Club) => String(c.id) === newManagerClubId)) {
                    setNewManagerClubId(clubsWithId[0].id);
                }
            } catch (err) {
                toast.error('Failed to load clubs from API');
            } finally {
                setIsLoadingClubs(false);
            }
        };
        fetchClubs();
        // Load fixtures initially and subscribe to socket updates
        listFixtures().then(setFixtures).catch(()=>{});
        const s = getSocket();
        const refresh = async () => { try { const list = await listFixtures(); setFixtures(list); } catch {} };
        s.on('match:event', refresh);
        s.on('match:finished', refresh);
        s.on('match:started', refresh);
        s.on('semi:created', refresh);
        s.on('final:created', refresh);
        s.on('semi:created', refresh);
        s.on('final:finished', refresh);
        
        // Update match times every 30 seconds for live matches
        const timeInterval = setInterval(updateMatchTimes, 30000);
        
        return () => {
            s.off('match:event', refresh);
            s.off('match:finished', refresh);
            s.off('match:started', refresh);
            s.off('semi:created', refresh);
            s.off('final:created', refresh);
            s.off('semi:created', refresh);
            s.off('final:finished', refresh);
            clearInterval(timeInterval);
        };
    }, []);

    // Update match times when fixtures change
    useEffect(() => {
        updateMatchTimes();
    }, [fixtures]);

    // Load existing match reports from MongoDB on mount
    useEffect(() => {
        async function loadMatchReports() {
            try {
                const data = await fetchNews();
                const reports = data
                    .filter((item: any) => item.type === 'match-report')
                    .map((item: any) => ({
                        id: item._id,
                        title: item.title,
                        imageUrl: item.imageUrl,
                        createdAt: item.createdAt
                    }));
                setMatchReports(reports);
            } catch (error) {
                console.error('Failed to load match reports:', error);
                setMatchReports([]);
            }
        }
        loadMatchReports();
    }, []);

    // Load existing trending news from MongoDB on mount
    useEffect(() => {
        async function loadTrendingNews() {
            try {
                const data = await fetchNews();
                const trending = data
                    .filter((item: any) => item.type === 'trending')
                    .map((item: any) => ({
                        id: item._id,
                        title: item.title,
                        imageUrl: item.imageUrl,
                        icon: item.icon || '🔥',
                        createdAt: item.createdAt
                    }));
                setTrendingNews(trending);
            } catch (error) {
                console.error('Failed to load trending news:', error);
                setTrendingNews([]);
            }
        }
        loadTrendingNews();
    }, []);

    const addMatchReport = async () => {
        const title = matchReportForm.title.trim();
        if (!title) { toast.error('Please enter a report title'); return; }
        if (!matchReportImageFile) { toast.error('Please select an image to upload'); return; }
        let imageUrl = '';
        try {
            const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowed.includes(matchReportImageFile.type)) { toast.error('Invalid image type. Use JPG, PNG, or WEBP.'); return; }
            if (matchReportImageFile.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }
            imageUrl = await uploadMatchImage(matchReportImageFile, 'ml_default');
        } catch (e: any) {
            toast.error(e.message || 'Upload failed');
            return;
        }
        
        // Save to MongoDB instead of localStorage
        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            if (!idToken) {
                toast.error('Authentication required');
                return;
            }
            
            const matchReportData = {
                title,
                imageUrl,
                category: 'Match Reports',
                type: 'match-report',
                content: title,
                summary: title,
                createdAt: new Date().toISOString()
            };
            
            const created = await createNews(matchReportData, idToken);
            setMatchReports(prev => [{ id: created._id, title: created.title, imageUrl: created.imageUrl, createdAt: created.createdAt }, ...prev]);
            setMatchReportForm({ title: '', imageUrl: '' });
            setMatchReportImageFile(null);
            setMatchReportImagePreview('');
            toast.success('Match report published to homepage');
        } catch (error: any) {
            console.error('Error saving match report:', error);
            toast.error('Failed to save match report: ' + (error.response?.data?.message || error.message));
        }
    };

    const removeMatchReport = async (id: string) => {
        if (!confirm('Remove this match report?')) return;
        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            if (!idToken) {
                toast.error('Authentication required');
                return;
            }
            
            await deleteNewsById(id, idToken);
            setMatchReports(prev => prev.filter(r => r.id !== id));
            toast.success('Match report removed successfully');
        } catch (error: any) {
            console.error('Error removing match report:', error);
            toast.error('Failed to remove match report');
        }
    };

    // Trending News handler functions
    const addTrendingNews = async () => {
        const title = trendingNewsForm.title.trim();
        const icon = trendingNewsForm.icon.trim();
        if (!title) { toast.error('Please enter a trending news title'); return; }
        if (!trendingNewsImageFile) { toast.error('Please select an image to upload'); return; }
        
        let imageUrl = '';
        try {
            const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowed.includes(trendingNewsImageFile.type)) { toast.error('Invalid image type. Use JPG, PNG, or WEBP.'); return; }
            if (trendingNewsImageFile.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }
            imageUrl = await uploadMatchImage(trendingNewsImageFile, 'ml_default');
        } catch (e: any) {
            toast.error(e.message || 'Upload failed');
            return;
        }
        
        // Save to MongoDB
        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            if (!idToken) {
                toast.error('Authentication required');
                return;
            }
            
            const trendingData = {
                title,
                imageUrl,
                icon,
                category: 'Trending',
                type: 'trending',
                content: title,
                summary: title
            };
            
            const created = await createNews(trendingData, idToken);
            setTrendingNews(prev => [{ id: created._id, title: created.title, imageUrl: created.imageUrl, icon: created.icon, createdAt: created.createdAt }, ...prev]);
            setTrendingNewsForm({ title: '', imageUrl: '', icon: '🔥' });
            setTrendingNewsImageFile(null);
            setTrendingNewsImagePreview('');
            toast.success('Trending news published to homepage');
        } catch (error: any) {
            console.error('Error saving trending news:', error);
            toast.error('Failed to save trending news: ' + (error.response?.data?.message || error.message));
        }
    };

    const removeTrendingNews = async (id: string) => {
        if (!confirm('Remove this trending news item?')) return;
        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            if (!idToken) {
                toast.error('Authentication required');
                return;
            }
            
            await deleteNewsById(id, idToken);
            setTrendingNews(prev => prev.filter(t => t.id !== id));
            toast.success('Trending news removed successfully');
        } catch (error: any) {
            console.error('Error removing trending news:', error);
            toast.error('Failed to remove trending news');
        }
    };

    const handleEditTrendingNews = (item: any) => {
        setEditingTrendingNews(item);
        setTrendingNewsForm({
            title: item.title,
            imageUrl: item.imageUrl,
            icon: item.icon
        });
        setTrendingNewsImageFile(null);
        setTrendingNewsImagePreview('');
        setShowTrendingNewsForm(true);
    };

    const handleUpdateTrendingNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingTrendingNews(true);
        
        try {
            let imageUrl = editingTrendingNews.imageUrl; // Keep existing image by default
            
            // If a new image file is selected, upload it
            if (trendingNewsImageFile) {
                const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowed.includes(trendingNewsImageFile.type)) {
                    toast.error('Invalid image type. Use JPG, PNG, or WEBP.');
                    setIsSubmittingTrendingNews(false);
                    return;
                }
                if (trendingNewsImageFile.size > 5 * 1024 * 1024) {
                    toast.error('Image too large. Max 5MB.');
                    setIsSubmittingTrendingNews(false);
                    return;
                }
                imageUrl = await uploadMatchImage(trendingNewsImageFile, 'ml_default');
            }

            const updatedTrendingNews = {
                ...editingTrendingNews,
                title: trendingNewsForm.title,
                imageUrl: imageUrl,
                icon: trendingNewsForm.icon,
                updatedAt: new Date().toISOString()
            };

            const idToken = await user?.firebaseUser?.getIdToken();

            if (!idToken) {
                toast.error('Failed to get ID token');
                setIsSubmittingTrendingNews(false);
                return;
            }

            const updated = await updateNewsById(editingTrendingNews._id, updatedTrendingNews, idToken);

            setTrendingNews(prev => prev.map(item => item.id === updated._id ? { ...item, title: updated.title, imageUrl: updated.imageUrl, icon: updated.icon } : item));
            
            setTrendingNewsForm({ title: '', imageUrl: '', icon: '🔥' });
            setTrendingNewsImageFile(null);
            setTrendingNewsImagePreview('');
            setEditingTrendingNews(null);
            setShowTrendingNewsForm(false);
            toast.success('Trending news updated successfully!');
        } catch (error: any) {
            toast.error('Failed to update trending news');
        } finally {
            setIsSubmittingTrendingNews(false);
        }
    };

    const resetTrendingNewsForm = () => {
        setTrendingNewsForm({ title: '', imageUrl: '', icon: '🔥' });
        setTrendingNewsImageFile(null);
        setTrendingNewsImagePreview('');
        setEditingTrendingNews(null);
        setShowTrendingNewsForm(false);
    };

    const handleCreateClub = async (clubData: CreateClubData) => {
        setIsSubmittingClub(true);
        try {
            const response = await clubService.createClub(clubData);
            // Map _id to id for the new club
            const created = response.data;
            const newClub = {
                ...created,
                id: (created as any)._id
            };
            setClubs(prev => [...prev, newClub]);
            
            // Load stadium data for the new club
            if (newClub.stadium) {
                const stadiumData = {
                    stadium: newClub.stadium,
                    city: newClub.city || '',
                    fullStadiumName: `${newClub.stadium}${newClub.city ? `, ${newClub.city}` : ''}`
                };
                setStadiumsByClub(prev => ({ ...prev, [newClub.id]: stadiumData }));
            }
            
            onAddClub(newClub); // If you want to keep parent in sync
            setShowClubForm(false);
            toast.success('Club created successfully!');
            
            // Automatically initialize/update the league table with the new club
            try {
                await initializeLeagueTableAdmin();
                toast.success('League table updated with new club');
            } catch (tableError) {
                console.error('Failed to update league table:', tableError);
                // Don't show error to user as club was created successfully
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to create club';
            toast.error(errorMessage);
            throw error;
        } finally {
            setIsSubmittingClub(false);
        }
    };

    const handleDeleteClubLocal = async (clubId: string | number) => {
        if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
            return;
        }
        try {
            await clubService.deleteClub(clubId);
            setClubs(prev => prev.filter(c => c.id !== clubId));
            
            // Clean up stadium data for the deleted club
            setStadiumsByClub(prev => {
                const updated = { ...prev };
                delete updated[clubId];
                return updated;
            });
            
            onDeleteClub(clubId); // If you want to keep parent in sync
            toast.success('Club deleted successfully');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to delete club';
            toast.error(errorMessage);
        }
    };

    const handleCreateNews = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔍 Starting news creation process...');
        console.log('🔍 User:', user);
        console.log('🔍 Firebase user:', user?.firebaseUser);
        
        setIsSubmittingNews(true);

        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            console.log('🔍 ID Token obtained:', idToken ? 'Yes' : 'No');

            if (!idToken) {
                console.error('❌ No ID token available');
                toast.error('Failed to get ID token');
                setIsSubmittingNews(false);
                return;
            }

            if (!newsImageFile) {
                toast.error('Please select an image to upload');
                setIsSubmittingNews(false);
                return;
            }

            // Upload image first
            const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowed.includes(newsImageFile.type)) {
                toast.error('Invalid image type. Use JPG, PNG, or WEBP.');
                setIsSubmittingNews(false);
                return;
            }
            if (newsImageFile.size > 5 * 1024 * 1024) {
                toast.error('Image too large. Max 5MB.');
                setIsSubmittingNews(false);
                return;
            }

            const imageUrl = await uploadMatchImage(newsImageFile, 'ml_default');

            // Determine type based on category
            let articleType = 'news';
            if (newsForm.category === 'Match Reports') {
                articleType = 'match-report';
            } else if (newsForm.category === 'Transfers') {
                articleType = 'transfer';
            } else if (newsForm.category === 'Best Goals') {
                articleType = 'best-goal';
            }

            const newArticle = {
                title: newsForm.title,
                summary: newsForm.summary,
                imageUrl: imageUrl,
                category: newsForm.category,
                type: articleType,
                content: newsForm.content,
                createdAt: new Date().toISOString()
            };
            
            console.log('🔍 Article data:', newArticle);
            const created = await createNews(newArticle, idToken);
            console.log('🔍 Created article:', created);

            setNewsArticles(prev => [created, ...prev]);
            setNewsForm({ title: '', summary: '', imageUrl: '', category: 'Features', content: '' });
            setNewsImageFile(null);
            setNewsImagePreview('');
            setShowNewsForm(false);
            toast.success('News article created successfully!');
        } catch (error: any) {
            console.error('❌ Error in handleCreateNews:', error);
            toast.error('Failed to create news article: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmittingNews(false);
        }
    };

    const handleEditNews = (article: any) => {
        setEditingNews(article);
        setNewsForm({
            title: article.title,
            summary: article.summary,
            imageUrl: article.imageUrl,
            category: article.category,
            content: article.content
        });
        setNewsImageFile(null);
        setNewsImagePreview('');
        setShowNewsForm(true);
    };

    const handleUpdateNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingNews(true);
        
        try {
            let imageUrl = editingNews.imageUrl; // Keep existing image by default
            
            // If a new image file is selected, upload it
            if (newsImageFile) {
                const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowed.includes(newsImageFile.type)) {
                    toast.error('Invalid image type. Use JPG, PNG, or WEBP.');
                    setIsSubmittingNews(false);
                    return;
                }
                if (newsImageFile.size > 5 * 1024 * 1024) {
                    toast.error('Image too large. Max 5MB.');
                    setIsSubmittingNews(false);
                    return;
                }
                imageUrl = await uploadMatchImage(newsImageFile, 'ml_default');
            }

            // Determine type based on category
            let articleType = 'news';
            if (newsForm.category === 'Match Reports') {
                articleType = 'match-report';
            } else if (newsForm.category === 'Transfers') {
                articleType = 'transfer';
            } else if (newsForm.category === 'Best Goals') {
                articleType = 'best-goal';
            }

            const updatedArticle = {
                ...editingNews,
                title: newsForm.title,
                summary: newsForm.summary,
                imageUrl: imageUrl,
                category: newsForm.category,
                type: articleType,
                content: newsForm.content,
                updatedAt: new Date().toISOString()
            };

            const idToken = await user?.firebaseUser?.getIdToken();

            if (!idToken) {
                toast.error('Failed to get ID token');
                setIsSubmittingNews(false);
                return;
            }

            const updated = await updateNewsById(editingNews._id, updatedArticle, idToken);

            setNewsArticles(prev => prev.map(article => article._id === updated._id ? updated : article));
            
            setNewsForm({ title: '', summary: '', imageUrl: '', category: 'Features', content: '' });
            setNewsImageFile(null);
            setNewsImagePreview('');
            setEditingNews(null);
            setShowNewsForm(false);
            toast.success('News article updated successfully!');
        } catch (error: any) {
            toast.error('Failed to update news article');
        } finally {
            setIsSubmittingNews(false);
        }
    };

    const handleDeleteNews = async (articleId: string) => {
        if (!confirm('Are you sure you want to delete this news article?')) {
            return;
        }
        const idToken = await user?.firebaseUser?.getIdToken();
        if (!idToken) {
            toast.error('Failed to get ID token');
            return;
        }
        await deleteNewsById(articleId, idToken);
        setNewsArticles(prev => prev.filter(article => article._id !== articleId));
        toast.success('News article deleted successfully');
    };

    const resetNewsForm = () => {
        setNewsForm({ title: '', summary: '', imageUrl: '', category: 'Features', content: '' });
        setNewsImageFile(null);
        setNewsImagePreview('');
        setEditingNews(null);
        setShowNewsForm(false);
    };

    // Latest News & Features handler functions
    const handleLatestNewsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        
        if (!file) {
            setLatestNewsImageFile(null);
            setLatestNewsImagePreview('');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size too large. Please upload a file smaller than 5MB.');
            return;
        }

        setLatestNewsImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setLatestNewsImagePreview(previewUrl);
    };

    const handleCreateLatestNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingLatestNews(true);

        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            if (!idToken) {
                toast.error('Failed to get ID token');
                setIsSubmittingLatestNews(false);
                return;
            }

            if (!latestNewsImageFile) {
                toast.error('Please select an image to upload');
                setIsSubmittingLatestNews(false);
                return;
            }

            // Upload image first
            const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowed.includes(latestNewsImageFile.type)) {
                toast.error('Invalid image type. Use JPG, PNG, or WEBP.');
                setIsSubmittingLatestNews(false);
                return;
            }
            if (latestNewsImageFile.size > 5 * 1024 * 1024) {
                toast.error('Image too large. Max 5MB.');
                setIsSubmittingLatestNews(false);
                return;
            }

            const imageUrl = await uploadMatchImage(latestNewsImageFile, 'ml_default');

            const newArticle = {
                title: latestNewsForm.title,
                summary: latestNewsForm.summary,
                imageUrl: imageUrl,
                category: latestNewsForm.category,
                type: 'article', // Regular article type for latest news
                content: latestNewsForm.content
            };
            
            const created = await createNews(newArticle, idToken);
            setLatestNewsArticles(prev => [created, ...prev]);
            setLatestNewsForm({ title: '', summary: '', imageUrl: '', category: 'Features', content: '' });
            setLatestNewsImageFile(null);
            setLatestNewsImagePreview('');
            setShowLatestNewsForm(false);
            toast.success('Latest News article created successfully!');
        } catch (error: any) {
            console.error('Error in handleCreateLatestNews:', error);
            toast.error('Failed to create latest news article: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmittingLatestNews(false);
        }
    };

    const handleEditLatestNews = (article: any) => {
        setEditingLatestNews(article);
        setLatestNewsForm({
            title: article.title,
            summary: article.summary,
            imageUrl: article.imageUrl,
            category: article.category,
            content: article.content
        });
        setLatestNewsImageFile(null);
        setLatestNewsImagePreview('');
        setShowLatestNewsForm(true);
    };

    const handleUpdateLatestNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingLatestNews(true);
        
        try {
            let imageUrl = editingLatestNews.imageUrl; // Keep existing image by default
            
            // If a new image file is selected, upload it
            if (latestNewsImageFile) {
                const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowed.includes(latestNewsImageFile.type)) {
                    toast.error('Invalid image type. Use JPG, PNG, or WEBP.');
                    setIsSubmittingLatestNews(false);
                    return;
                }
                if (latestNewsImageFile.size > 5 * 1024 * 1024) {
                    toast.error('Image too large. Max 5MB.');
                    setIsSubmittingLatestNews(false);
                    return;
                }
                imageUrl = await uploadMatchImage(latestNewsImageFile, 'ml_default');
            }

            const updatedArticle = {
                ...editingLatestNews,
                title: latestNewsForm.title,
                summary: latestNewsForm.summary,
                imageUrl: imageUrl,
                category: latestNewsForm.category,
                content: latestNewsForm.content,
                updatedAt: new Date().toISOString()
            };

            const idToken = await user?.firebaseUser?.getIdToken();
            if (!idToken) {
                toast.error('Failed to get ID token');
                setIsSubmittingLatestNews(false);
                return;
            }

            const updated = await updateNewsById(editingLatestNews._id, updatedArticle, idToken);
            setLatestNewsArticles(prev => prev.map(article => article._id === updated._id ? updated : article));
            
            setLatestNewsForm({ title: '', summary: '', imageUrl: '', category: 'Features', content: '' });
            setLatestNewsImageFile(null);
            setLatestNewsImagePreview('');
            setEditingLatestNews(null);
            setShowLatestNewsForm(false);
            toast.success('Latest News article updated successfully!');
        } catch (error: any) {
            toast.error('Failed to update latest news article');
        } finally {
            setIsSubmittingLatestNews(false);
        }
    };

    const handleDeleteLatestNews = async (articleId: string) => {
        if (!confirm('Are you sure you want to delete this latest news article?')) {
            return;
        }
        const idToken = await user?.firebaseUser?.getIdToken();
        if (!idToken) {
            toast.error('Failed to get ID token');
            return;
        }
        await deleteNewsById(articleId, idToken);
        setLatestNewsArticles(prev => prev.filter(article => article._id !== articleId));
        toast.success('Latest News article deleted successfully');
    };

    const resetLatestNewsForm = () => {
        setLatestNewsForm({ title: '', summary: '', imageUrl: '', category: 'Features', content: '' });
        setLatestNewsImageFile(null);
        setLatestNewsImagePreview('');
        setEditingLatestNews(null);
        setShowLatestNewsForm(false);
    };

    // League configuration management functions
    const handleUpdateLeagueConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingLeagueConfig(true);

        try {
            const updatedConfig = await updateLeagueConfig({
                startDate: new Date(leagueConfigForm.startDate).toISOString(),
                endDate: new Date(leagueConfigForm.endDate).toISOString(),
                name: leagueConfigForm.name,
                description: leagueConfigForm.description
            });
            
            setLeagueConfig(updatedConfig);
            toast.success('League configuration updated successfully');
        } catch (error: any) {
            console.error('Failed to update league config:', error);
            toast.error(error.response?.data?.message || 'Failed to update league configuration');
        } finally {
            setIsUpdatingLeagueConfig(false);
        }
    };

    const handleResetLeagueConfig = async () => {
        if (!confirm('Are you sure you want to reset the league configuration? This will create a new default configuration.')) {
            return;
        }

        setIsUpdatingLeagueConfig(true);
        try {
            const resetConfig = await resetLeagueConfig();
            setLeagueConfig(resetConfig);
            setLeagueConfigForm({
                startDate: resetConfig.startDate ? new Date(resetConfig.startDate).toISOString().slice(0, 16) : '',
                endDate: resetConfig.endDate ? new Date(resetConfig.endDate).toISOString().slice(0, 16) : '',
                name: resetConfig.name || '',
                description: resetConfig.description || ''
            });
            toast.success('League configuration reset successfully');
        } catch (error: any) {
            console.error('Failed to reset league config:', error);
            toast.error(error.response?.data?.message || 'Failed to reset league configuration');
        } finally {
            setIsUpdatingLeagueConfig(false);
        }
    };

    const renderSection = () => {
        switch(activeSection) {
            case 'Dashboard':
                return <div>
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">Dashboard Overview</h2>
                    <p className="text-theme-text-secondary">Analytics placeholders for league-wide stats, ticket sales, and store revenue would go here.</p>
                    <div className="mt-6 p-6 bg-theme-secondary-bg rounded-lg text-theme-text-secondary">Placeholder for Chart.js</div>
                </div>;
            case 'Manage Fixtures':
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-theme-dark">Manage Fixtures</h2>
                        {user?.role !== 'admin' && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm mb-4">Admin access required.</div>
                        )}
                        
                        {/* League Period Display */}
                        {leagueConfig && (
                            <div className="bg-gradient-to-r from-theme-primary to-theme-accent text-white p-4 rounded-lg shadow-lg mb-6">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold mb-2">{leagueConfig.name} League</h3>
                                    <p className="text-lg opacity-90">
                                        League runs from{' '}
                                        <span className="font-semibold">
                                            {new Date(leagueConfig.startDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                        </span>
                                        {' '}to{' '}
                                        <span className="font-semibold">
                                            {new Date(leagueConfig.endDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                        </span>
                                    </p>
                                    {leagueConfig.description && (
                                        <p className="text-sm opacity-75 mt-1">{leagueConfig.description}</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <button onClick={async () => { try { await initializeLeagueTableAdmin(); toast.success('League table initialized with all clubs'); } catch (e: any) { toast.error('Failed to initialize table: ' + (e.response?.data?.message || e.message)); } }} className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700">Initialize Table</button>
                            <button onClick={async () => { try { await generateFixtures(); toast.success('Fixtures generated'); const list = await listFixtures(); setFixtures(list); } catch { toast.error('Failed to generate'); } }} className="bg-theme-primary text-theme-dark font-bold py-2 px-4 rounded-md">Generate Fixtures</button>
                            <button onClick={async () => { try { const list = await listFixtures(); setFixtures(list); toast.success('Refreshed'); } catch { toast.error('Refresh failed'); } }} className="bg-theme-secondary-bg text-theme-dark font-bold py-2 px-4 rounded-md">Refresh</button>
                            <button onClick={async () => { if (!confirm('Reset league? This clears fixtures and table.')) return; try { await resetLeague(); toast.success('League reset'); const list = await listFixtures(); setFixtures(list); } catch { toast.error('Reset failed'); } }} className="bg-red-50 text-red-700 font-bold py-2 px-4 rounded-md border border-red-200">Reset League</button>
                        </div>
                        <div className="grid gap-4">
                            {fixtures.sort((a, b) => {
                                // Priority: live > scheduled > finished
                                const getPriority = (f: FixtureDTO) => {
                                    if (f.status === 'live') return 1;
                                    if (f.status === 'scheduled' && f.isScheduled) return 2;
                                    if (f.status === 'scheduled' && !f.isScheduled) return 3;
                                    if (f.status === 'finished') return 4;
                                    return 5;
                                };
                                
                                const priorityA = getPriority(a);
                                const priorityB = getPriority(b);
                                
                                if (priorityA !== priorityB) {
                                    return priorityA - priorityB;
                                }
                                
                                // Within same priority, sort by kickoff time
                                const kickoffA = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0;
                                const kickoffB = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0;
                                
                                if (kickoffA !== kickoffB) {
                                    return kickoffA - kickoffB;
                                }
                                
                                // If no kickoff time, maintain original order (by _id)
                                return 0;
                            }).map(f => {
                                const home = typeof f.homeTeam === 'string' ? undefined : f.homeTeam;
                                const away = typeof f.awayTeam === 'string' ? undefined : f.awayTeam;
                                return (
                                    <div key={f._id} className="bg-theme-secondary-bg p-4 rounded-lg shadow-sm">
                                        <div className="grid grid-cols-12 items-center gap-3">
                                            <div className="col-span-5 flex items-center gap-3 min-w-0">
                                                {(() => { const isFinalStage = (f.stage==='final') || (!!f.isFinal); const isSemi = f.stage==='semi'; const label = isFinalStage ? 'FINAL' : (isSemi ? 'SEMIFINAL' : 'LEAGUE'); const cls = isFinalStage ? 'bg-yellow-500 text-white' : (isSemi ? 'bg-purple-600 text-white' : 'bg-gray-300'); return (<span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${cls}`}>{label}</span>); })()}
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {home?.logo && <img src={home.logo} className="h-6 w-6" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                                                    <span className="font-semibold truncate max-w-[140px]">{home?.name || 'Home'}</span>
                                                </div>
                                                <span className="text-lg font-extrabold">{f.score.home} - {f.score.away}</span>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {away?.logo && <img src={away.logo} className="h-6 w-6" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                                                    <span className="font-semibold truncate max-w-[140px]">{away?.name || 'Away'}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                {(() => {
                                                    const homeId = (typeof f.homeTeam==='string'?f.homeTeam:f.homeTeam?._id);
                                                    const awayId = (typeof f.awayTeam==='string'?f.awayTeam:f.awayTeam?._id);
                                                    const isReady = !!(homeId && awayId && f.kickoffAt && f.venueName && f.venueName.trim().length>0);
                                                    // Only display SCHEDULED badge when ready AND explicitly committed/saved
                                                    const isCommitted = (f.status==='scheduled') || !!scheduledOnce[f._id];
                                                    const showScheduled = isReady && isCommitted;
                                                    const label = f.status==='live' ? 'LIVE' : (f.status==='finished' ? 'FINISHED' : (showScheduled ? 'SCHEDULED' : ''));
                                                    const cls = f.status==='live' ? 'bg-red-500 text-white' : (f.status==='finished' ? 'bg-gray-800 text-white' : (showScheduled ? 'bg-gray-200' : ''));
                                                    
                                                    // For live matches, show enhanced PES-style time display
                                                    if (f.status === 'live') {
                                                        const currentTime = matchTimes[f._id];
                                                        return (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`px-2 py-1 rounded text-xs ${cls}`}>{label}</span>
                                                                {currentTime && (
                                                                    <div className="text-center">
                                                                        <span className="text-xs font-semibold text-red-600">
                                                                            {currentTime.display}
                                                                        </span>
                                                                        {currentTime.phase && (
                                                                            <div className="text-xs text-gray-600 mt-1">
                                                                                {currentTime.phase === 'extra_time' ? 'EXTRA TIME' : currentTime.phase.replace('_', ' ').toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    // If ready but not committed, show a subtle hint
                                                    if (!label && isReady) {
                                                        return <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">READY</span>;
                                                    }
                                                    return label ? <span className={`px-2 py-1 rounded text-xs ${cls}`}>{label}</span> : null;
                                                })()}
                                            </div>
                                            <div className="col-span-5 flex justify-end items-center gap-2">
                                                {f.status==='scheduled' && (
                                                    <>
                                                        <button onClick={async()=>{ 
                                                            try { 
                                                                if (!((typeof f.homeTeam==='string'?f.homeTeam:f.homeTeam?._id) && (typeof f.awayTeam==='string'?f.awayTeam:f.awayTeam?._id) && f.kickoffAt && (f.venueName && f.venueName.trim().length>0))) {
                                                                    toast.error('Please set teams, kickoff, and venue before starting');
                                                                    return;
                                                                }
                                                                await startMatch(f._id); 
                                                                toast.success('Match started'); 
                                                                const list=await listFixtures(); setFixtures(list);
                                                            } catch (e:any) { toast.error('Start failed'); } 
                                                        }} className="h-9 px-3 rounded bg-green-600 text-white">Start</button>
                                                        <button onClick={async()=>{ try { await simulateMatch(f._id); toast.success('Simulated'); const list=await listFixtures(); setFixtures(list);} catch { toast.error('Sim failed'); } }} className="h-9 px-3 rounded bg-blue-600 text-white">Simulate</button>
                                                    </>
                                                )}
                                                {f.status==='live' && (
                                                    <button onClick={async()=>{ try { await finishMatch(f._id); toast.success('Finished'); const list=await listFixtures(); setFixtures(list);} catch { toast.error('Finish failed'); } }} className="h-9 px-3 rounded bg-red-600 text-white">Finish</button>
                                                )}
                                            </div>
                                        </div>
                                        {f.status==='scheduled' && (
                                            <div className="mt-3 grid grid-cols-12 items-center gap-3">
                                                <div className="col-span-6 flex items-center gap-2">
                                                    <label className="text-xs text-theme-text-secondary">Kickoff</label>
                                                    {(() => { const alreadyCommitted = !!scheduledOnce[f._id]; return (
                                                    <input type="datetime-local" disabled={alreadyCommitted} defaultValue={toLocalInputValue(f.kickoffAt)} onChange={async e=>{
                                                        const raw = e.target.value;
                                                        const kickoffAt = raw ? new Date(raw).toISOString() : '';
                                                        if (!kickoffAt) return;
                                                        if (!isValidFutureIso(kickoffAt)) { toast.error('Kickoff must be a valid future date/time'); return; }
                                                        try { 
                                                            await scheduleMatch(f._id, { kickoffAt }); 
                                                            const list = await listFixtures(); setFixtures(list);
                                                        } catch { toast.error('Schedule failed'); }
                                                    }} className={`bg-theme-page-bg border border-theme-border rounded px-2 py-1 ${alreadyCommitted?'opacity-60 cursor-not-allowed':''}`}/>
                                                    ); })()}
                                                    <label className="text-xs text-theme-text-secondary ml-3">Venue</label>
                                                    {(() => { 
                                                        const alreadyCommitted = !!scheduledOnce[f._id];
                                                        const homeId = (typeof f.homeTeam==='string'?f.homeTeam:f.homeTeam?._id);
                                                        const awayId = (typeof f.awayTeam==='string'?f.awayTeam:f.awayTeam?._id);
                                                        const stadiumOptions = getStadiumOptionsForMatch(homeId, awayId);
                                                        
                                                        // Load stadium data for both clubs when dropdown is shown
                                                        if (homeId && awayId && stadiumOptions.length === 0) {
                                                            loadStadiumData(homeId);
                                                            loadStadiumData(awayId);
                                                        }
                                                        
                                                        return (
                                                            <select 
                                                                disabled={alreadyCommitted || stadiumOptions.length === 0} 
                                                                value={f.venueName || ''}
                                                                onChange={async e => {
                                                                    const venueName = e.target.value;
                                                                    if (!venueName) return;
                                                                    try { 
                                                                        await scheduleMatch(f._id, { venueName }); 
                                                                        const list = await listFixtures(); setFixtures(list);
                                                                    } catch { toast.error('Venue save failed'); }
                                                                }}
                                                                className={`bg-theme-page-bg border border-theme-border rounded px-2 py-1 min-w-[200px] ${alreadyCommitted || stadiumOptions.length === 0?'opacity-60 cursor-not-allowed':''}`}
                                                            >
                                                                <option value="">
                                                                    {stadiumOptions.length === 0 ? 'Loading stadiums...' : 'Select Stadium'}
                                                                </option>
                                                                {stadiumOptions.map((option, index) => (
                                                                    <option key={index} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        );
                                                    })()}
                                                    {(() => {
                                                        const homeId = (typeof f.homeTeam==='string'?f.homeTeam:f.homeTeam?._id);
                                                        const awayId = (typeof f.awayTeam==='string'?f.awayTeam:f.awayTeam?._id);
                                                        const isReady = !!(homeId && awayId && f.kickoffAt && f.venueName && f.venueName.trim().length>0);
                                                        const alreadyCommitted = !!scheduledOnce[f._id];
                                                        if (!isReady) {
                                                            return (
                                                                <button
                                                                    disabled
                                                                    className="h-9 px-3 rounded font-bold bg-theme-secondary-bg text-theme-text-secondary opacity-60 cursor-not-allowed"
                                                                >
                                                                    Schedule
                                                                </button>
                                                            );
                                                        }
                                                        if (alreadyCommitted) {
                                                            return (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-400 rounded-sm uppercase tracking-wide">
                                                                        SCHEDULED
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                onClick={async()=>{ 
                                                                    try { 
                                                                        // Double-check all required fields are present before scheduling
                                                                        const homeId = (typeof f.homeTeam==='string'?f.homeTeam:f.homeTeam?._id);
                                                                        const awayId = (typeof f.awayTeam==='string'?f.awayTeam:f.awayTeam?._id);
                                                                        const hasKickoff = !!f.kickoffAt;
                                                                        const hasVenue = !!(f.venueName && f.venueName.trim().length > 0);
                                                                        
                                                                        if (!homeId || !awayId || !hasKickoff || !hasVenue) {
                                                                            toast.error('Please fill in teams, kickoff time, and venue before scheduling');
                                                                            return;
                                                                        }
                                                                        
                                                                        if (homeId === awayId) {
                                                                            toast.error('Home and away teams must be different');
                                                                            return;
                                                                        }
                                                                        // Validate kickoff again (future date)
                                                                        if (!isValidFutureIso(String(f.kickoffAt))) { toast.error('Kickoff must be a future date/time'); return; }
                                                                        const venueValidation = validateVenueName(f.venueName || '');
                                                                        if (!venueValidation.ok) { toast.error(venueValidation.message || 'Invalid venue'); return; }
                                                                        
                                                                        const result = await scheduleMatch(f._id, {}); 
                                                                        
                                                                        // Only mark as scheduled if the backend confirms it's ready
                                                                        if (result.isScheduled) {
                                                                            setScheduledOnce(prev=>({ ...prev, [f._id]: true }));
                                                                            const list=await listFixtures(); setFixtures(list);
                                                                        } else {
                                                                            toast.error('Match could not be scheduled. Please check all fields.');
                                                                        }
                                                                    } catch (e: any) { 
                                                                        toast.error(e.response?.data?.message || 'Schedule failed'); 
                                                                    } 
                                                                }} 
                                                                className="h-9 px-3 rounded bg-green-600 text-white font-bold"
                                                            >
                                                                Schedule
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="col-span-6 flex items-center gap-2 justify-end">
                                                    <label className="text-xs text-theme-text-secondary">Set Teams</label>
                                                    {(() => {
                                                        const homeId = (typeof f.homeTeam==='string'?f.homeTeam:f.homeTeam?._id)||'';
                                                        const awayId = (typeof f.awayTeam==='string'?f.awayTeam:f.awayTeam?._id)||'';
                                                        // Determine the two clubs for this pairing from the fixture itself
                                                        const pairIds = Array.from(new Set([homeId, awayId].filter(Boolean)));
                                                        let pairClubs: { id: string; name: string }[] = [];
                                                        if (pairIds.length === 2) {
                                                            pairClubs = pairIds.map(id => {
                                                                const found = clubs.find(c => String(c.id) === String(id));
                                                                if (found) return { id: String(found.id), name: found.name };
                                                                // Fallback to populated names from fixture
                                                                if (String(id) === String(homeId) && typeof f.homeTeam !== 'string' && f.homeTeam) return { id: String(homeId), name: f.homeTeam.name } as any;
                                                                if (String(id) === String(awayId) && typeof f.awayTeam !== 'string' && f.awayTeam) return { id: String(awayId), name: f.awayTeam.name } as any;
                                                                return { id: String(id), name: 'Club' };
                                                            });
                                                        }
                                                        // If we don't have two, don't allow changing yet (generator should provide both)
                                                        const options = pairClubs.length === 2 ? pairClubs : [];
                                                        const alreadyCommitted = !!scheduledOnce[f._id];
                                                        return (
                                                            <>
                                                                <select disabled={options.length!==2 || alreadyCommitted} value={homeId} onChange={async e=>{ const newHome=e.target.value; if (!newHome || !awayId) return; if (newHome===awayId) { toast.error('Teams must be different'); return; } try { 
                                                                    const kickoffIso = f.kickoffAt || '';
                                                                    if (kickoffIso && (hasConflict(newHome, kickoffIso, f._id) || hasConflict(awayId, kickoffIso, f._id))) {
                                                                        const nextSlot = findNextFreeSlot(newHome, awayId, kickoffIso, f._id);
                                                                        if (nextSlot) {
                                                                            await scheduleMatch(f._id,{homeTeamId:newHome,awayTeamId:awayId,kickoffAt:nextSlot});
                                                                            toast.success('Home set with auto-reschedule');
                                                                        } else {
                                                                            toast.error('No free slot available in next 48h. Choose another time.');
                                                                            return;
                                                                        }
                                                                    } else {
                                                                        await scheduleMatch(f._id,{homeTeamId:newHome,awayTeamId:awayId});
                                                                        toast.success('Home set');
                                                                    }
                                                                    const list=await listFixtures(); setFixtures(list);} catch{ toast.error('Update failed'); } }} className={`bg-theme-page-bg border border-theme-border rounded px-2 py-1 ${(options.length!==2||alreadyCommitted)?'opacity-50 cursor-not-allowed':''}`}>
                                                                    <option value="">Home Team</option>
                                                                    {options.map(c=> (<option key={c.id} value={c.id}>{c.name}</option>))}
                                                                </select>
                                                                <select disabled={options.length!==2 || alreadyCommitted} value={awayId} onChange={async e=>{ const newAway=e.target.value; if (!newAway || !homeId) return; if (newAway===homeId) { toast.error('Teams must be different'); return; } try { 
                                                                    const kickoffIso = f.kickoffAt || '';
                                                                    if (kickoffIso && (hasConflict(homeId, kickoffIso, f._id) || hasConflict(newAway, kickoffIso, f._id))) {
                                                                        const nextSlot = findNextFreeSlot(homeId, newAway, kickoffIso, f._id);
                                                                        if (nextSlot) {
                                                                            await scheduleMatch(f._id,{homeTeamId:homeId,awayTeamId:newAway,kickoffAt:nextSlot});
                                                                            toast.success('Away set with auto-reschedule');
                                                                        } else {
                                                                            toast.error('No free slot available in next 48h. Choose another time.');
                                                                            return;
                                                                        }
                                                                    } else {
                                                                        await scheduleMatch(f._id,{homeTeamId:homeId,awayTeamId:newAway});
                                                                        toast.success('Away set');
                                                                    }
                                                                    const list=await listFixtures(); setFixtures(list);} catch{ toast.error('Update failed'); } }} className={`bg-theme-page-bg border border-theme-border rounded px-2 py-1 ${(options.length!==2||alreadyCommitted)?'opacity-50 cursor-not-allowed':''}`}>
                                                                    <option value="">Away Team</option>
                                                                    {options.map(c=> (<option key={c.id} value={c.id}>{c.name}</option>))}
                                                                </select>
                                                                <button disabled={options.length!==2 || alreadyCommitted} onClick={async()=>{ 
                                                                    if (!homeId || !awayId || homeId===awayId) return; 
                                                                    try { 
                                                                        // If swapping causes a conflict for either team, auto-reschedule to next free slot
                                                                        let kickoffIso = f.kickoffAt || '';
                                                                        if (!kickoffIso) { toast.error('Set kickoff time before swapping'); return; }
                                                                        const nextSlot = findNextFreeSlot(awayId, homeId, kickoffIso, f._id);
                                                                        if (hasConflict(awayId, kickoffIso, f._id) || hasConflict(homeId, kickoffIso, f._id)) {
                                                                            if (nextSlot) {
                                                                                await scheduleMatch(f._id,{ homeTeamId: awayId, awayTeamId: homeId, kickoffAt: nextSlot });
                                                                                toast.success('Swapped and auto-rescheduled to avoid conflict');
                                                                            } else {
                                                                                toast.error('No free slot found in the next 48 hours. Please pick a different time.');
                                                                                return;
                                                                            }
                                                                        } else {
                                                                            await scheduleMatch(f._id,{ homeTeamId: awayId, awayTeamId: homeId });
                                                                            toast.success('Swapped');
                                                                        }
                                                                        const list=await listFixtures(); setFixtures(list);
                                                                    } catch { toast.error('Swap failed'); } 
                                                                }} className={`h-9 px-3 rounded bg-theme-secondary-bg ${(options.length!==2||alreadyCommitted)?'opacity-50 cursor-not-allowed':''}`}>Swap</button>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                    </div>
                                        )}
                                        {f.status==='live' && (
                                            <div className="mt-3 space-y-4">
                                                {/* PES-style Timing Controls */}
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <h4 className="text-sm font-semibold text-blue-800 mb-2">⚡ PES-Style Match Timing</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-blue-700">Time Speed:</label>
                                                            <select 
                                                                value={f.timeAcceleration || 1} 
                                                                onChange={async (e) => {
                                                                    const acceleration = parseInt(e.target.value);
                                                                    try {
                                                                        await setTimeAcceleration(f._id, acceleration);
                                                                        toast.success(`Time speed set to ${acceleration}x`);
                                                                        const list = await listFixtures(); 
                                                                        setFixtures(list);
                                                                    } catch (error) {
                                                                        toast.error('Failed to set time speed');
                                                                    }
                                                                }}
                                                                className="text-xs bg-white border border-blue-300 rounded px-2 py-1"
                                                            >
                                                                <option value={1}>1x (1 sec = 1 min)</option>
                                                                <option value={2}>2x (2 sec = 1 min)</option>
                                                                <option value={5}>5x (5 sec = 1 min)</option>
                                                                <option value={10}>10x (10 sec = 1 min)</option>
                                                                <option value={30}>30x (30 sec = 1 min)</option>
                                                                <option value={60}>60x (1 min = 1 min)</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-blue-700">Phase:</label>
                                                            <span className="text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-1 rounded">
                                                                {f.matchPhase === 'extra_time' ? 'EXTRA TIME' : f.matchPhase?.replace('_', ' ').toUpperCase() || 'FIRST HALF'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await setManualTime(f._id, 45, 'half_time');
                                                                    toast.success('Set to half-time');
                                                                    const list = await listFixtures(); 
                                                                    setFixtures(list);
                                                                } catch (error) {
                                                                    toast.error('Failed to set half-time');
                                                                }
                                                            }}
                                                            className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                                                        >
                                                            Set Half-Time
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await setManualTime(f._id, 90, 'extra_time');
                                                                    toast.success('Set to extra time break');
                                                                    const list = await listFixtures(); 
                                                                    setFixtures(list);
                                                                } catch (error) {
                                                                    toast.error('Failed to set extra time');
                                                                }
                                                            }}
                                                            className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                                                        >
                                                            Set Extra Time
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await setManualTime(f._id, 90, 'full_time');
                                                                    toast.success('Set to full-time');
                                                                    const list = await listFixtures(); 
                                                                    setFixtures(list);
                                                                } catch (error) {
                                                                    toast.error('Failed to set full-time');
                                                                }
                                                            }}
                                                            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                                        >
                                                            Set Full-Time
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Event Input Section */}
                                                <div className="flex items-end gap-2 flex-wrap">
                                                    <div className="flex items-end gap-2">
                                                        <label className="text-xs text-theme-text-secondary">Minute</label>
                                                        <input type="number" min={0} max={120} value={eventInput.targetId===f._id?eventInput.minute:''} onChange={e=>setEventInput(prev=>({...prev, targetId:f._id, minute:e.target.value}))} placeholder="e.g. 34" className="w-24 bg-theme-page-bg border border-theme-border rounded px-2 py-1"/>
                                                    </div>
                                                <div className="flex items-end gap-2">
                                                    <label className="text-xs text-theme-text-secondary">Type</label>
                                                    <select value={eventInput.targetId===f._id?eventInput.type:'goal'} onChange={e=>setEventInput(prev=>({...prev, targetId:f._id, type:e.target.value as any}))} className="bg-theme-page-bg border border-theme-border rounded px-2 py-1">
                                                        <option value="goal">Goal</option>
                                                        <option value="yellow_card">Yellow Card</option>
                                                        <option value="red_card">Red Card</option>
                                                        <option value="foul">Foul</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <label className="text-xs text-theme-text-secondary">Team</label>
                                                    <select
                                                        value={eventInput.targetId===f._id?eventInput.team:'home'}
                                                        onChange={async e=>{
                                                            const team = e.target.value as 'home'|'away';
                                                            const clubId = team === 'home'
                                                                ? (typeof f.homeTeam==='string'? f.homeTeam : f.homeTeam?._id)
                                                                : (typeof f.awayTeam==='string'? f.awayTeam : f.awayTeam?._id);
                                                            setEventInput(prev=>({ ...prev, targetId: f._id, team, player: '' }));
                                                            await loadApprovedPlayers(clubId);
                                                        }}
                                                        className="bg-theme-page-bg border border-theme-border rounded px-2 py-1"
                                                    >
                                                        <option value="home">Home</option>
                                                        <option value="away">Away</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <label className="text-xs text-theme-text-secondary">Player</label>
                                                    {(() => {
                                                        const team = (eventInput.targetId===f._id?eventInput.team:'home') as 'home'|'away';
                                                        const clubId = team === 'home'
                                                            ? (typeof f.homeTeam==='string'? f.homeTeam : f.homeTeam?._id)
                                                            : (typeof f.awayTeam==='string'? f.awayTeam : f.awayTeam?._id);
                                                        const options = (clubId && approvedPlayersByClub[clubId]) || [];
                                                        return (
                                                            <select
                                                                value={eventInput.targetId===f._id?eventInput.player:''}
                                                                onFocus={async ()=>{ await loadApprovedPlayers(clubId); }}
                                                                onChange={e=>setEventInput(prev=>({...prev, targetId:f._id, player: e.target.value }))}
                                                                className="bg-theme-page-bg border border-theme-border rounded px-2 py-1 min-w-[200px]"
                                                            >
                                                                <option value="">Select Player</option>
                                                                {options.map(p => (
                                                                    <option key={p._id} value={p.name}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        );
                                                    })()}
                                                </div>
                                                
                                                {/* Additional fields for goals only */}
                                                {eventInput.targetId===f._id && eventInput.type === 'goal' && (
                                                    <>
                                                        <div className="flex items-end gap-2">
                                                            <label className="text-xs text-theme-text-secondary">Assist</label>
                                                            {(() => {
                                                                const team = (eventInput.targetId===f._id?eventInput.team:'home') as 'home'|'away';
                                                                const clubId = team === 'home'
                                                                    ? (typeof f.homeTeam==='string'? f.homeTeam : f.homeTeam?._id)
                                                                    : (typeof f.awayTeam==='string'? f.awayTeam : f.awayTeam?._id);
                                                                const options = (clubId && approvedPlayersByClub[clubId]) || [];
                                                                return (
                                                                    <select
                                                                        value={eventInput.targetId===f._id?eventInput.assist:''}
                                                                        onFocus={async ()=>{ await loadApprovedPlayers(clubId); }}
                                                                        onChange={e=>setEventInput(prev=>({...prev, targetId:f._id, assist: e.target.value }))}
                                                                        className="bg-theme-page-bg border border-theme-border rounded px-2 py-1 min-w-[200px]"
                                                                    >
                                                                        <option value="">No Assist</option>
                                                                        {options.map(p => (
                                                                            <option key={p._id} value={p.name}>{p.name}</option>
                                                                        ))}
                                                                    </select>
                                                                );
                                                            })()}
                                                        </div>
                                                        
                                                        <div className="flex items-end gap-2">
                                                            <label className="text-xs text-theme-text-secondary">Goal Type</label>
                                                            <select
                                                                value={eventInput.targetId===f._id?eventInput.goalType:'open_play'}
                                                                onChange={e=>setEventInput(prev=>({...prev, targetId:f._id, goalType: e.target.value as any}))}
                                                                className="bg-theme-page-bg border border-theme-border rounded px-2 py-1"
                                                            >
                                                                <option value="open_play">Open Play</option>
                                                                <option value="penalty">Penalty</option>
                                                                <option value="free_kick">Free Kick</option>
                                                            </select>
                                                        </div>
                                                        
                                                        <div className="flex items-end gap-2">
                                                            <label className="text-xs text-theme-text-secondary">Field Side</label>
                                                            <select
                                                                value={eventInput.targetId===f._id?eventInput.fieldSide:'mid'}
                                                                onChange={e=>setEventInput(prev=>({...prev, targetId:f._id, fieldSide: e.target.value as any}))}
                                                                className="bg-theme-page-bg border border-theme-border rounded px-2 py-1"
                                                            >
                                                                <option value="mid">Mid</option>
                                                                <option value="rw">Right Wing (RW)</option>
                                                                <option value="lw">Left Wing (LW)</option>
                                                            </select>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                <button onClick={async()=>{
                                                    if (eventInput.targetId!==f._id) return;
                                                    const minuteNum = parseInt(eventInput.minute, 10);
                                                    if (isNaN(minuteNum)) { toast.error('Minute required'); return; }
                                                    try { 
                                                        const eventData: any = { 
                                                            minute: minuteNum, 
                                                            type: eventInput.type, 
                                                            team: eventInput.team, 
                                                            player: eventInput.player 
                                                        };
                                                        
                                                        // Add goal-specific fields only if it's a goal
                                                        if (eventInput.type === 'goal') {
                                                            if (eventInput.assist) eventData.assist = eventInput.assist;
                                                            if (eventInput.goalType) eventData.goalType = eventInput.goalType;
                                                            if (eventInput.fieldSide) eventData.fieldSide = eventInput.fieldSide;
                                                        }
                                                        
                                                        await addEvent(f._id, eventData); 
                                                        toast.success('Event added'); 
                                                        setEventInput({ 
                                                            minute:'', 
                                                            type:'goal', 
                                                            team:'home', 
                                                            player:'', 
                                                            assist: '',
                                                            goalType: 'open_play',
                                                            fieldSide: 'mid',
                                                            targetId:undefined 
                                                        }); 
                                                    } catch { toast.error('Event failed'); }
                                                }} className="bg-theme-primary text-theme-dark font-bold px-3 py-1 rounded">Add Event</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {fixtures.length===0 && (
                                <div className="text-sm text-theme-text-secondary">No fixtures yet. Click Generate Fixtures.</div>
                            )}
                        </div>
                    </div>
                );
            case 'Manage Clubs':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-theme-dark">Manage Clubs</h2>
                            <button
                                onClick={() => setShowClubForm(true)}
                                className="px-4 py-2 bg-theme-primary text-theme-dark rounded-md hover:bg-theme-primary/80 transition-colors"
                            >
                                Add New Club
                            </button>
                        </div>

                        {showClubForm ? (
                            <ClubRegistrationForm
                                onSubmit={handleCreateClub}
                                onCancel={() => setShowClubForm(false)}
                                isLoading={isSubmittingClub}
                            />
                        ) : (
                            <div>
                                <div className="mb-4 text-theme-text-secondary">
                                    <p>Manage all clubs in the league. You can add new clubs, view details, and remove clubs as needed.</p>
                                </div>

                                <ClubList
                                    clubs={clubs}
                                    onDelete={handleDeleteClubLocal}
                                    isLoading={isLoadingClubs}
                                />
                            </div>
                        )}
                    </div>
                );
            case 'Manage News':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-theme-dark">Manage League News</h2>
                            <button
                                onClick={() => setShowNewsForm(true)}
                                className="px-4 py-2 bg-theme-primary text-theme-dark rounded-md hover:bg-theme-primary/80 transition-colors"
                            >
                                Add New Article
                            </button>
                        </div>

                        {showNewsForm ? (
                            <div className="bg-theme-secondary-bg p-6 rounded-lg mb-6">
                                <h3 className="text-xl font-semibold mb-4 text-theme-dark border-b-2 border-theme-primary pb-2">
                                    {editingNews ? 'Edit News Article' : 'Create New News Article'}
                                </h3>
                                
                                <form onSubmit={editingNews ? handleUpdateNews : handleCreateNews} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="newsTitle" className="block text-sm font-medium text-theme-text-secondary mb-1">Article Title *</label>
                                            <input 
                                                type="text" 
                                                id="newsTitle" 
                                                value={newsForm.title} 
                                                onChange={e => setNewsForm(prev => ({ ...prev, title: e.target.value }))} 
                                                required 
                                                className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                                placeholder="Enter article title"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="newsCategory" className="block text-sm font-medium text-theme-text-secondary mb-1">Category *</label>
                                            <select 
                                                id="newsCategory" 
                                                value={newsForm.category}
                                                onChange={e => setNewsForm(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                            >
                                                <option value="Features">Features</option>
                                                <option value="News">News</option>
                                                <option value="Analysis">Analysis</option>
                                                <option value="Transfers">Transfers</option>
                                                <option value="Match Reports">Match Reports</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="newsImageFile" className="block text-sm font-medium text-theme-text-secondary mb-1">Image *</label>
                                        <input 
                                            type="file" 
                                            id="newsImageFile" 
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setNewsImageFile(file);
                                                if (file && file.type.startsWith('image/')) {
                                                    setNewsImagePreview(URL.createObjectURL(file));
                                                } else {
                                                    setNewsImagePreview('');
                                                }
                                            }}
                                            required={!editingNews}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                        />
                                        {newsImagePreview && (
                                            <img src={newsImagePreview} alt="Preview" className="mt-2 h-32 w-full object-cover rounded"/>
                                        )}
                                        {editingNews && !newsImagePreview && (
                                            <div className="mt-2">
                                                <p className="text-sm text-theme-text-secondary mb-2">Current image:</p>
                                                <img src={editingNews.imageUrl} alt="Current" className="h-32 w-full object-cover rounded"/>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="newsSummary" className="block text-sm font-medium text-theme-text-secondary mb-1">Summary *</label>
                                        <textarea 
                                            id="newsSummary" 
                                            value={newsForm.summary} 
                                            onChange={e => setNewsForm(prev => ({ ...prev, summary: e.target.value }))} 
                                            required 
                                            rows={3}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                            placeholder="Brief summary of the article"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="newsContent" className="block text-sm font-medium text-theme-text-secondary mb-1">Full Content</label>
                                        <textarea 
                                            id="newsContent" 
                                            value={newsForm.content} 
                                            onChange={e => setNewsForm(prev => ({ ...prev, content: e.target.value }))} 
                                            rows={6}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                            placeholder="Full article content (optional)"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmittingNews}
                                            className="bg-theme-primary text-theme-dark font-bold py-2 px-6 rounded-md hover:bg-theme-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingNews ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-theme-dark border-t-transparent"></div>
                                                    {editingNews ? 'Updating...' : 'Creating...'}
                                                </>
                                            ) : (
                                                <>
                                                    📰 {editingNews ? 'Update Article' : 'Create Article'}
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetNewsForm}
                                            className="bg-theme-secondary-bg text-theme-dark font-bold py-2 px-6 rounded-md hover:bg-theme-secondary-bg/80 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                                </div>
                                </form>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-4 text-theme-text-secondary">
                                    <p>Manage all news articles that appear in the "Latest News & Features" section on the homepage.</p>
                                </div>

                                {/* News Articles Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {newsArticles.map(article => (
                                        <div key={article._id} className="bg-theme-secondary-bg rounded-lg overflow-hidden shadow-lg">
                                            <div className="relative h-48">
                                                <img 
                                                    src={article.imageUrl} 
                                                    alt={article.title} 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <span className="bg-theme-primary text-theme-dark text-xs font-bold px-2 py-1 rounded">
                                                        {article.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-theme-dark mb-2 line-clamp-2">{article.title}</h3>
                                                <p className="text-sm text-theme-text-secondary mb-3 line-clamp-3">{article.summary}</p>
                                                <div className="flex justify-between items-center text-xs text-theme-text-secondary">
                                                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                                <div className="flex gap-2">
                                                    <button
                                                            onClick={() => handleEditNews(article)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                    >
                                                            Edit
                                                    </button>
                                                    <button
                                                            onClick={() => handleDeleteNews(article._id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                    ))}
                                </div>

                                {newsArticles.length === 0 && (
                                    <div className="text-center py-12 bg-theme-secondary-bg rounded-lg">
                                        <div className="text-6xl mb-4">📰</div>
                                        <h3 className="text-xl font-semibold text-theme-dark mb-2">No News Articles Yet</h3>
                                        <p className="text-theme-text-secondary mb-4">Create your first news article to get started.</p>
                                        <button
                                            onClick={() => setShowNewsForm(true)}
                                            className="bg-theme-primary text-theme-dark font-bold py-2 px-6 rounded-md hover:bg-theme-primary-dark transition-colors"
                                        >
                                            Create First Article
                                        </button>
                                    </div>
                            )}
                        </div>
                        )}
                    </div>
                );
            case 'Latest News & Features':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-theme-dark">Latest News & Features</h2>
                            <button
                                onClick={() => setShowLatestNewsForm(true)}
                                className="px-4 py-2 bg-theme-primary text-theme-dark rounded-md hover:bg-theme-primary/80 transition-colors"
                            >
                                Add New Article
                            </button>
                        </div>

                        {showLatestNewsForm ? (
                            <div className="bg-theme-secondary-bg p-6 rounded-lg mb-6">
                                <h3 className="text-xl font-semibold mb-4 text-theme-dark border-b-2 border-theme-primary pb-2">
                                    {editingLatestNews ? 'Edit Latest News Article' : 'Create New Latest News Article'}
                                </h3>
                                
                                <form onSubmit={editingLatestNews ? handleUpdateLatestNews : handleCreateLatestNews} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="latestNewsTitle" className="block text-sm font-medium text-theme-text-secondary mb-2">Article Title *</label>
                                            <input 
                                                type="text" 
                                                id="latestNewsTitle" 
                                                value={latestNewsForm.title} 
                                                onChange={e => setLatestNewsForm(prev => ({ ...prev, title: e.target.value }))} 
                                                required 
                                                className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary text-lg" 
                                                placeholder="Enter compelling article title"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="latestNewsCategory" className="block text-sm font-medium text-theme-text-secondary mb-2">Category *</label>
                                            <select 
                                                id="latestNewsCategory" 
                                                value={latestNewsForm.category}
                                                onChange={e => setLatestNewsForm(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary text-lg"
                                            >
                                                <option value="Features">Features</option>
                                                <option value="News">News</option>
                                                <option value="Analysis">Analysis</option>
                                                <option value="Transfers">Transfers</option>
                                                <option value="Best Goals">Best Goals</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="latestNewsImageFile" className="block text-sm font-medium text-theme-text-secondary mb-2">Featured Image *</label>
                                        <div className="border-2 border-dashed border-theme-border rounded-lg p-6 text-center hover:border-theme-primary transition-colors">
                                            <input 
                                                type="file" 
                                                id="latestNewsImageFile" 
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={handleLatestNewsImageUpload}
                                                required={!editingLatestNews}
                                                className="hidden"
                                            />
                                            <label htmlFor="latestNewsImageFile" className="cursor-pointer">
                                                {latestNewsImagePreview ? (
                                                    <div className="space-y-2">
                                                        <img src={latestNewsImagePreview} alt="Preview" className="mx-auto h-48 w-full object-cover rounded-lg"/>
                                                        <p className="text-sm text-theme-text-secondary">Click to change image</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="text-4xl text-theme-text-secondary">📷</div>
                                                        <p className="text-theme-text-secondary">Click to upload featured image</p>
                                                        <p className="text-xs text-theme-text-secondary">JPG, PNG, WEBP up to 5MB</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                        {editingLatestNews && !latestNewsImagePreview && (
                                            <div className="mt-4">
                                                <p className="text-sm text-theme-text-secondary mb-2">Current image:</p>
                                                <img src={editingLatestNews.imageUrl} alt="Current" className="h-48 w-full object-cover rounded-lg"/>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="latestNewsSummary" className="block text-sm font-medium text-theme-text-secondary mb-2">Article Summary *</label>
                                        <textarea 
                                            id="latestNewsSummary" 
                                            value={latestNewsForm.summary} 
                                            onChange={e => setLatestNewsForm(prev => ({ ...prev, summary: e.target.value }))} 
                                            required 
                                            rows={4}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary resize-none" 
                                            placeholder="Write a compelling summary that will appear on the homepage..."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="latestNewsContent" className="block text-sm font-medium text-theme-text-secondary mb-2">Full Article Content</label>
                                        <textarea 
                                            id="latestNewsContent" 
                                            value={latestNewsForm.content} 
                                            onChange={e => setLatestNewsForm(prev => ({ ...prev, content: e.target.value }))} 
                                            rows={8}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary resize-none" 
                                            placeholder="Write the full article content here..."
                                        />
                                    </div>
                                    
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmittingLatestNews}
                                            className="bg-theme-primary text-theme-dark font-bold py-3 px-8 rounded-md hover:bg-theme-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                                        >
                                            {isSubmittingLatestNews ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-theme-dark border-t-transparent"></div>
                                                    {editingLatestNews ? 'Updating...' : 'Creating...'}
                                                </>
                                            ) : (
                                                <>
                                                    📰 {editingLatestNews ? 'Update Article' : 'Create Article'}
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetLatestNewsForm}
                                            className="bg-theme-secondary-bg text-theme-dark font-bold py-3 px-8 rounded-md hover:bg-theme-secondary-bg/80 transition-colors text-lg"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-lg">
                                    <p className="font-semibold mb-1">📰 Latest News & Features</p>
                                    <p className="text-sm">These articles will appear in the "Latest News & Features" section on the homepage. Only admin-created articles with type "article" are displayed here.</p>
                                </div>

                                {/* Latest News Articles Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {latestNewsArticles.map(article => (
                                        <div key={article._id} className="bg-theme-secondary-bg rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                            <div className="relative h-48">
                                                <img 
                                                    src={article.imageUrl} 
                                                    alt={article.title} 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <span className="bg-theme-primary text-theme-dark text-xs font-bold px-2 py-1 rounded">
                                                        {article.category}
                                                    </span>
                                                </div>
                                                <div className="absolute top-2 right-2">
                                                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                        Latest
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-theme-dark mb-2 line-clamp-2">{article.title}</h3>
                                                <p className="text-sm text-theme-text-secondary mb-3 line-clamp-3">{article.summary}</p>
                                                <div className="flex justify-between items-center text-xs text-theme-text-secondary">
                                                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditLatestNews(article)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLatestNews(article._id)}
                                                            className="text-red-600 hover:text-red-800 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {latestNewsArticles.length === 0 && (
                                    <div className="text-center py-12 bg-theme-secondary-bg rounded-lg">
                                        <div className="text-6xl mb-4">📰</div>
                                        <h3 className="text-xl font-semibold text-theme-dark mb-2">No Latest News Articles Yet</h3>
                                        <p className="text-theme-text-secondary mb-4">Create your first latest news article to get started.</p>
                                        <button
                                            onClick={() => setShowLatestNewsForm(true)}
                                            className="bg-theme-primary text-theme-dark font-bold py-2 px-6 rounded-md hover:bg-theme-primary-dark transition-colors"
                                        >
                                            Create First Article
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'Manage Match Reports':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-theme-dark">Manage Match Reports</h2>
                        </div>

                        <div className="max-w-4xl mx-auto bg-theme-secondary-bg p-6 rounded-xl shadow-lg mb-6">
                            <h3 className="text-xl font-semibold mb-4 text-theme-dark border-b-2 border-theme-primary pb-2">Add Match Report</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-theme-text-secondary mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={matchReportForm.title}
                                        onChange={e=>setMatchReportForm(prev=>({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Late header seals comeback win"
                                        className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-theme-text-secondary mb-1">Image *</label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={(e)=>{
                                            const f = e.target.files?.[0] || null;
                                            setMatchReportImageFile(f);
                                            if (f && f.type.startsWith('image/')) setMatchReportImagePreview(URL.createObjectURL(f)); else setMatchReportImagePreview('');
                                        }}
                                        className="w-full"
                                    />
                                    {matchReportImagePreview && (
                                        <img src={matchReportImagePreview} alt="Preview" className="mt-2 h-20 w-full object-cover rounded"/>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-end">
                                <button onClick={addMatchReport} className="bg-theme-primary text-theme-dark font-bold py-2 px-5 rounded-md">Publish</button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-theme-dark">Published Reports</h3>
                            {matchReports.length === 0 ? (
                                <div className="bg-theme-secondary-bg p-8 rounded-lg text-center text-theme-text-secondary">No reports yet. Add your first one above.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {matchReports.map(r => (
                                        <div key={r.id} className="bg-theme-secondary-bg rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow">
                                            <div className="relative h-44">
                                                <img src={r.imageUrl} alt={r.title} className="w-full h-full object-cover"/>
                                                <span className="absolute top-2 left-2 bg-theme-accent text-white text-xs font-bold px-2 py-1 rounded">Match report</span>
                                            </div>
                                            <div className="p-4">
                                                <h4 className="font-semibold text-theme-dark mb-1 line-clamp-2">{r.title}</h4>
                                                <p className="text-xs text-theme-text-secondary">{new Date(r.createdAt).toLocaleDateString()}</p>
                                                <div className="mt-3 flex justify-end">
                                                    <button onClick={()=>removeMatchReport(r.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'Manage Trending News':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-theme-dark">Manage Trending News</h2>
                            <button
                                onClick={() => setShowTrendingNewsForm(true)}
                                className="px-4 py-2 bg-theme-primary text-theme-dark rounded-md hover:bg-theme-primary/80 transition-colors"
                            >
                                Add Trending News
                            </button>
                        </div>

                        {showTrendingNewsForm ? (
                            <div className="bg-theme-secondary-bg p-6 rounded-lg mb-6">
                                <h3 className="text-xl font-semibold mb-4 text-theme-dark border-b-2 border-theme-primary pb-2">
                                    {editingTrendingNews ? 'Edit Trending News' : 'Add New Trending News'}
                                </h3>
                                
                                <form onSubmit={editingTrendingNews ? handleUpdateTrendingNews : (e) => { e.preventDefault(); addTrendingNews(); }} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="trendingTitle" className="block text-sm font-medium text-theme-text-secondary mb-1">Title *</label>
                                            <input 
                                                type="text" 
                                                id="trendingTitle" 
                                                value={trendingNewsForm.title} 
                                                onChange={e => setTrendingNewsForm(prev => ({ ...prev, title: e.target.value }))} 
                                                required 
                                                className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                                placeholder="e.g., Best of Madueke 24/25"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="trendingIcon" className="block text-sm font-medium text-theme-text-secondary mb-1">Icon *</label>
                                            <select 
                                                id="trendingIcon" 
                                                value={trendingNewsForm.icon}
                                                onChange={e => setTrendingNewsForm(prev => ({ ...prev, icon: e.target.value }))}
                                                className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                            >
                                                <option value="🔥">🔥 Fire</option>
                                                <option value="⚡️">⚡️ Lightning</option>
                                                <option value="✨">✨ Sparkles</option>
                                                <option value="⚽️">⚽️ Football</option>
                                                <option value="💪">💪 Flex</option>
                                                <option value="🧤">🧤 Gloves</option>
                                                <option value="🟣">🟣 Purple</option>
                                                <option value="🏃‍♂️">🏃‍♂️ Running</option>
                                                <option value="⭐">⭐ Star</option>
                                                <option value="🎯">🎯 Target</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="trendingImageFile" className="block text-sm font-medium text-theme-text-secondary mb-1">Image *</label>
                                        <input 
                                            type="file" 
                                            id="trendingImageFile" 
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setTrendingNewsImageFile(file);
                                                if (file && file.type.startsWith('image/')) {
                                                    setTrendingNewsImagePreview(URL.createObjectURL(file));
                                                } else {
                                                    setTrendingNewsImagePreview('');
                                                }
                                            }}
                                            required={!editingTrendingNews}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                        />
                                        {trendingNewsImagePreview && (
                                            <img src={trendingNewsImagePreview} alt="Preview" className="mt-2 h-32 w-full object-cover rounded"/>
                                        )}
                                        {editingTrendingNews && !trendingNewsImagePreview && (
                                            <div className="mt-2">
                                                <p className="text-sm text-theme-text-secondary mb-2">Current image:</p>
                                                <img src={editingTrendingNews.imageUrl} alt="Current" className="h-32 w-full object-cover rounded"/>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmittingTrendingNews}
                                            className="bg-theme-primary text-theme-dark font-bold py-2 px-6 rounded-md hover:bg-theme-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingTrendingNews ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-theme-dark border-t-transparent"></div>
                                                    {editingTrendingNews ? 'Updating...' : 'Creating...'}
                                                </>
                                            ) : (
                                                <>
                                                    🔥 {editingTrendingNews ? 'Update Trending News' : 'Create Trending News'}
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetTrendingNewsForm}
                                            className="bg-theme-secondary-bg text-theme-dark font-bold py-2 px-6 rounded-md hover:bg-theme-secondary-bg/80 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-4 text-theme-text-secondary">
                                    <p>Manage trending news items that appear in the "Trending Now" section on the homepage.</p>
                                </div>

                                {/* Trending News Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {trendingNews.map(item => (
                                        <div key={item.id} className="bg-theme-secondary-bg rounded-lg overflow-hidden shadow-lg">
                                            <div className="relative h-48">
                                                <img 
                                                    src={item.imageUrl} 
                                                    alt={item.title} 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <span className="bg-theme-primary text-theme-dark text-xs font-bold px-2 py-1 rounded">
                                                        {item.icon} Trending
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-theme-dark mb-2 line-clamp-2">{item.title}</h3>
                                                <div className="flex justify-between items-center text-xs text-theme-text-secondary">
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditTrendingNews(item)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => removeTrendingNews(item.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {trendingNews.length === 0 && (
                                    <div className="text-center py-12 bg-theme-secondary-bg rounded-lg">
                                        <div className="text-6xl mb-4">🔥</div>
                                        <h3 className="text-xl font-semibold text-theme-dark mb-2">No Trending News Yet</h3>
                                        <p className="text-theme-text-secondary mb-4">Create your first trending news item to get started.</p>
                                        <button
                                            onClick={() => setShowTrendingNewsForm(true)}
                                            className="bg-theme-primary text-theme-dark font-bold py-2 px-6 rounded-md hover:bg-theme-primary-dark transition-colors"
                                        >
                                            Create First Trending News
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'User Management':
                 return (
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-theme-dark">User Management</h2>
                        
                        {/* Create Manager Form */}
                        <div className="max-w-2xl mb-8">
                            <div className="bg-theme-secondary-bg p-6 rounded-lg">
                                <h3 className="text-xl font-semibold mb-4 text-theme-dark border-b-2 border-theme-primary pb-2">Create Club Manager</h3>

                                <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-3 rounded-lg text-sm">
                                    <p className="font-semibold mb-1">🔐 Real-Time Security Features:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>✅ <strong>Auto-generated secure password</strong> (12+ characters with mixed case, numbers, symbols)</li>
                                        <li>✅ <strong>Real email delivery</strong> via Brevo (primary) or Gmail (fallback)</li>
                                        <li>✅ <strong>MongoDB database storage</strong> with Firebase authentication</li>
                                        <li>✅ <strong>Admin cannot see passwords</strong> - sent directly to manager's email</li>
                                        <li>✅ <strong>No demo accounts</strong> - all accounts are real and functional</li>
                                    </ul>
                                </div>
                                
                                {errorMessage && (
                                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg">
                                        <p className="font-bold">Error:</p>
                                        <p>{errorMessage}</p>
                                    </div>
                                )}
                                
                                <form onSubmit={handleCreateManagerSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="newManagerName" className="block text-sm font-medium text-theme-text-secondary mb-1">Manager Name *</label>
                                        <input 
                                            type="text" 
                                            id="newManagerName" 
                                            value={newManagerName} 
                                            onChange={e => setNewManagerName(e.target.value)} 
                                            required 
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                            placeholder="Enter manager's full name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newManagerEmail" className="block text-sm font-medium text-theme-text-secondary mb-1">Manager Email *</label>
                                        <input 
                                            type="email" 
                                            id="newManagerEmail" 
                                            value={newManagerEmail} 
                                            onChange={e => setNewManagerEmail(e.target.value)} 
                                            required 
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                            placeholder="manager@club.com"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newManagerClub" className="block text-sm font-medium text-theme-text-secondary mb-1">Assign to Club *</label>
                                        <select 
                                            id="newManagerClub" 
                                            value={newManagerClubId}
                                            onChange={e => {
                                                setNewManagerClubId(e.target.value);
                                            }}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                        >
                                            {clubs.map(club => (
                                                <option key={club.id} value={club.id}>{club.name}</option>
                                            ))}
                                        </select>

                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isCreatingUser}
                                        className="w-full bg-theme-primary text-theme-dark font-bold py-2 px-4 rounded-md hover:bg-theme-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isCreatingUser ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-theme-dark border-t-transparent"></div>
                                                Creating Manager & Sending Email...
                                            </>
                                        ) : (
                                            <>
                                                🎯 Create Manager Account
                                            </>
                                        )}
                                    </button>
                                </form>
                                
                                {lastCreatedUser && (
                                    <div className="mt-6 bg-green-50 border-l-4 border-green-400 text-green-700 p-4 rounded-lg">
                                        <h4 className="font-bold flex items-center gap-2">
                                            ✅ Manager Account Created Successfully!
                                            {lastCreatedUser.emailSent && (
                                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                                                    📧 Email Sent via {(lastCreatedUser.emailProvider || 'email').toUpperCase()}
                                                </span>
                                            )}
                                        </h4>

                                        {lastCreatedUser.emailSent ? (
                                            <div className="text-sm mt-2">
                                                <p className="mb-2">🎯 <strong>Login credentials have been sent securely via email to:</strong></p>
                                                <div className="bg-white border border-green-200 rounded p-3 mb-2">
                                                    <ul className="space-y-1">
                                                        <li><strong>📧 Email:</strong> {lastCreatedUser.email}</li>
                                                        <li><strong>👤 Role:</strong> Club Manager</li>
                                                        <li><strong>⚽ Club:</strong> {lastCreatedUser.club}</li>
                                                    </ul>
                                                </div>
                                                <p className="font-semibold text-green-800">🔐 Security: Password was auto-generated and sent securely. Admin cannot see the password.</p>
                                                <p className="mt-1 font-semibold">🎯 Next: Manager can now login and create coaches for their club.</p>
                                            </div>
                                        ) : (
                                            <div className="text-sm mt-2">
                                                <p className="mb-2 text-orange-700">⚠️ <strong>Email delivery failed - Manual credential delivery required</strong></p>
                                                <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-2">
                                                    <p className="text-orange-800 font-semibold mb-2">Please securely provide these credentials to the manager:</p>
                                                    <ul className="space-y-1 text-orange-900">
                                                        <li><strong>📧 Email:</strong> {lastCreatedUser.email}</li>
                                                        <li><strong>👤 Role:</strong> Club Manager</li>
                                                        <li><strong>⚽ Club:</strong> {lastCreatedUser.club}</li>
                                                    </ul>
                                                </div>
                                                <p className="font-semibold text-green-800">🎯 Next: Manager can login and create coaches for their club.</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setLastCreatedUser(null)}
                                            className="mt-3 text-xs text-green-600 hover:text-green-800 underline"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Users List */}
                        <div>
                            <h3 className="text-xl font-semibold mb-3 text-theme-dark border-b-2 border-theme-primary pb-2">All Users</h3>
                            <div className="bg-theme-secondary-bg rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-theme-primary text-theme-dark">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Email</th>
                                            <th className="px-4 py-3 text-left">Role</th>
                                            <th className="px-4 py-3 text-left">Club</th>
                                            <th className="px-4 py-3 text-left">Status</th>
                                            <th className="px-4 py-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {createdUsers.map(user => (
                                            <tr key={user.id} className="border-b border-theme-border">
                                                <td className="px-4 py-3 text-theme-dark">{user.email}</td>
                                                <td className="px-4 py-3 text-theme-dark capitalize">{user.role.replace('-', ' ')}</td>
                                                <td className="px-4 py-3 text-theme-dark">{user.clubName || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {user.role !== 'admin' && (
                                                        <button 
                                                            onClick={() => handleDeactivateUser(user.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                        >
                                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'League Settings':
                return (
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-theme-dark">League Settings</h2>
                        
                        {isLoadingLeagueConfig ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-theme-primary border-t-transparent"></div>
                                <span className="ml-3 text-theme-text-secondary">Loading league configuration...</span>
                            </div>
                        ) : (
                            <div className="max-w-4xl">
                                {/* Current League Configuration Display */}
                                {leagueConfig && (
                                    <div className="bg-theme-secondary-bg p-6 rounded-lg mb-6">
                                        <h3 className="text-xl font-semibold mb-4 text-theme-dark border-b-2 border-theme-primary pb-2">
                                            Current League Configuration
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">League Name</label>
                                                <p className="text-theme-dark font-semibold">{leagueConfig.name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">Season</label>
                                                <p className="text-theme-dark font-semibold">{leagueConfig.season}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">Start Date</label>
                                                <p className="text-theme-dark font-semibold">
                                                    {new Date(leagueConfig.startDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-theme-text-secondary mb-1">End Date</label>
                                                <p className="text-theme-dark font-semibold">
                                                    {new Date(leagueConfig.endDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            {leagueConfig.description && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-theme-text-secondary mb-1">Description</label>
                                                    <p className="text-theme-dark">{leagueConfig.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* League Configuration Form */}
                                <div className="bg-theme-secondary-bg p-6 rounded-lg">
                                    <h3 className="text-xl font-semibold mb-4 text-theme-dark border-b-2 border-theme-primary pb-2">
                                        Update League Configuration
                                    </h3>
                                    
                                    <form onSubmit={handleUpdateLeagueConfig} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="leagueName" className="block text-sm font-medium text-theme-text-secondary mb-1">League Name *</label>
                                                <input
                                                    type="text"
                                                    id="leagueName"
                                                    value={leagueConfigForm.name}
                                                    onChange={e => setLeagueConfigForm(prev => ({ ...prev, name: e.target.value }))}
                                                    required
                                                    className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                                    placeholder="Enter league name"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="leagueDescription" className="block text-sm font-medium text-theme-text-secondary mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    id="leagueDescription"
                                                    value={leagueConfigForm.description}
                                                    onChange={e => setLeagueConfigForm(prev => ({ ...prev, description: e.target.value }))}
                                                    className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                                    placeholder="Enter league description (optional)"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="startDate" className="block text-sm font-medium text-theme-text-secondary mb-1">Start Date *</label>
                                                <input
                                                    type="datetime-local"
                                                    id="startDate"
                                                    value={leagueConfigForm.startDate}
                                                    onChange={e => setLeagueConfigForm(prev => ({ ...prev, startDate: e.target.value }))}
                                                    required
                                                    className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="endDate" className="block text-sm font-medium text-theme-text-secondary mb-1">End Date *</label>
                                                <input
                                                    type="datetime-local"
                                                    id="endDate"
                                                    value={leagueConfigForm.endDate}
                                                    onChange={e => setLeagueConfigForm(prev => ({ ...prev, endDate: e.target.value }))}
                                                    required
                                                    className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 rounded-lg text-sm">
                                            <p className="font-semibold mb-1">📅 League Period Information:</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                <li>All league matches will be scheduled within this time period</li>
                                                <li>Fixture generation will respect these dates</li>
                                                <li>Matches cannot be scheduled outside this period</li>
                                                <li>Start date cannot be in the past</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={isUpdatingLeagueConfig}
                                                className="bg-theme-primary text-theme-dark font-bold py-2 px-6 rounded-md hover:bg-theme-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isUpdatingLeagueConfig ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-theme-dark border-t-transparent"></div>
                                                        Updating...
                                                    </>
                                                ) : (
                                                    'Update League Configuration'
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleResetLeagueConfig}
                                                disabled={isUpdatingLeagueConfig}
                                                className="bg-red-50 text-red-700 font-bold py-2 px-6 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Reset to Default
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const sections: AdminSection[] = ['Dashboard', 'Manage Clubs', 'Manage Fixtures', 'Manage News', 'Latest News & Features', 'Manage Match Reports', 'Manage Trending News', 'User Management', 'League Settings'];

    return (
        <div className="flex min-h-screen bg-theme-light">
            {/* Sidebar */}
            <aside className="w-64 bg-theme-light flex flex-col">
                <div className="h-20 flex items-center justify-center font-bold text-xl border-b border-theme-border">NGL ADMIN</div>
                <nav className="flex-grow">
                    <ul className="space-y-2 p-4">
                        {sections.map(section => (
                             <li key={section}>
                                <button
                                    onClick={() => setActiveSection(section)}
                                    className={`w-full text-left px-4 py-2 rounded transition-colors ${activeSection === section ? 'bg-theme-primary text-theme-dark' : 'hover:bg-theme-secondary-bg'}`}
                                >
                                    {section}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg">
                    {renderSection()}
                    {/* AI Placeholder for Heatmaps */}
                    {activeSection === 'Dashboard' && (
                        <div className="mt-8 bg-blue-900/50 border-l-4 border-blue-400 text-blue-200 p-4 rounded-lg" role="alert">
                            <p className="font-bold">AI Analytics (Phase 2)</p>
                            <p>This area will display AI-generated heatmaps and performance visualizations from a central analytics API.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};


export default AdminDashboard;
