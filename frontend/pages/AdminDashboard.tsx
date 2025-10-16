import React, { useState, useEffect } from 'react';
import { Match, CreatedUser, PlayerRegistration, Club } from '../types';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { clubService, CreateClubData } from '../services/clubService';
import ClubRegistrationForm from '../components/ClubRegistrationForm';
import ClubList from '../components/ClubList';
import toast from 'react-hot-toast';
import { listFixtures, generateFixtures, startMatch, addEvent, finishMatch, simulateMatch, scheduleMatch, resetLeague, updateTeams, FixtureDTO } from '../services/fixturesService';
import playerService from '../services/playerService';
import { getSocket } from '../services/socket';
import { createNews } from '@/api/news/createNews';
import { fetchNews } from '@/api/news/fetchNews';
import { deleteNewsById } from '@/api/news/deleteNewsItemById';
import { updateNewsById } from '@/api/news/updateNewsById';
import { getLeagueConfig, updateLeagueConfig, resetLeagueConfig, LeagueConfigDTO } from '../services/leagueConfigService';
import { initializeLeagueTableAdmin } from '../services/tableService';

type AdminSection = 'Dashboard' | 'Manage Clubs' | 'Manage Fixtures' | 'Manage News' | 'Manage Match Reports' | 'User Management' | 'League Settings';

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
    const [eventInput, setEventInput] = useState<{ minute: string; type: 'goal'|'yellow_card'|'red_card'|'foul'; team: 'home'|'away'; player: string; targetId?: string }>({ minute: '', type: 'goal', team: 'home', player: '' });
    const [scheduledOnce, setScheduledOnce] = useState<Record<string, boolean>>({});
    const [approvedPlayersByClub, setApprovedPlayersByClub] = useState<Record<string, { _id: string; name: string }[]>>({});

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
        } catch (err) {
            setNewsArticles([]);
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
        s.on('final:finished', refresh);
        return () => {
            s.off('match:event', refresh);
            s.off('match:finished', refresh);
            s.off('match:started', refresh);
            s.off('semi:created', refresh);
            s.off('final:created', refresh);
            s.off('final:finished', refresh);
        };
    }, []);

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

            const newArticle = {
                title: newsForm.title,
                summary: newsForm.summary,
                imageUrl: newsForm.imageUrl,
                category: newsForm.category,
                content: newsForm.content,
                createdAt: new Date().toISOString()
            };
            
            console.log('🔍 Article data:', newArticle);
            const created = await createNews(newArticle, idToken);
            console.log('🔍 Created article:', created);

            setNewsArticles(prev => [created, ...prev]);
            setNewsForm({ title: '', summary: '', imageUrl: '', category: 'Features', content: '' });
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
        setShowNewsForm(true);
    };

    const handleUpdateNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingNews(true);
        
        try {
            const updatedArticle = {
                ...editingNews,
                title: newsForm.title,
                summary: newsForm.summary,
                imageUrl: newsForm.imageUrl,
                category: newsForm.category,
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
        setEditingNews(null);
        setShowNewsForm(false);
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
                                                    {(() => { const alreadyCommitted = !!scheduledOnce[f._id]; return (
                                                    <input type="text" placeholder="Stadium name" disabled={alreadyCommitted} onBlur={async e=>{
                                                        const venueName = e.target.value.trim();
                                                        const res = validateVenueName(venueName);
                                                        if (!res.ok) { toast.error(res.message || 'Invalid venue'); return; }
                                                        try { 
                                                            await scheduleMatch(f._id, { venueName }); 
                                                            const list = await listFixtures(); setFixtures(list);
                                                        } catch { toast.error('Venue save failed'); }
                                                    }} className={`bg-theme-page-bg border border-theme-border rounded px-2 py-1 min-w-[200px] ${alreadyCommitted?'opacity-60 cursor-not-allowed':''}`}/>
                                                    ); })()}
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
                                            <div className="mt-3 flex items-end gap-2 flex-wrap">
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
                                                <button onClick={async()=>{
                                                    if (eventInput.targetId!==f._id) return;
                                                    const minuteNum = parseInt(eventInput.minute, 10);
                                                    if (isNaN(minuteNum)) { toast.error('Minute required'); return; }
                                                    try { await addEvent(f._id, { minute: minuteNum, type: eventInput.type, team: eventInput.team, player: eventInput.player }); toast.success('Event added'); setEventInput({ minute:'', type:'goal', team:'home', player:'', targetId:undefined }); } catch { toast.error('Event failed'); }
                                                }} className="bg-theme-primary text-theme-dark font-bold px-3 py-1 rounded">Add Event</button>
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
                                        <label htmlFor="newsImageUrl" className="block text-sm font-medium text-theme-text-secondary mb-1">Image URL *</label>
                                        <input 
                                            type="url" 
                                            id="newsImageUrl" 
                                            value={newsForm.imageUrl} 
                                            onChange={e => setNewsForm(prev => ({ ...prev, imageUrl: e.target.value }))} 
                                            required 
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" 
                                            placeholder="https://example.com/image.jpg"
                                        />
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

    const sections: AdminSection[] = ['Dashboard', 'Manage Clubs', 'Manage Fixtures', 'Manage News', 'Manage Match Reports', 'User Management', 'League Settings'];

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
