import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Club, Player, ClubVideo, Position, CreatedUser, PlayerRegistration, UserRole } from '../types';
import { POSITIONS, CLUBS, LEAGUES } from '../constants';
import { EmailService } from '../utils/emailService';
import { useAuth } from '../contexts/AuthContext';
import { coachService, CreateCoachData } from '../services/coachService';
import { countryService, type CountryOption } from '../services/countryService';
import { playerService } from '../services/playerService';
import { createNews } from '@/api/news/createNews';
import { fetchNews } from '@/api/news/fetchNews';
import { deleteNewsById } from '@/api/news/deleteNewsItemById';
import { updateNewsById } from '@/api/news/updateNewsById';
import toast from 'react-hot-toast';

interface ClubManagerDashboardProps {
    club: Club;
    players: Player[];
    onAddPlayer: (player: Player) => void;
    onEditPlayer: (player: Player) => void;
    onDeletePlayer: (playerId: number) => void;
    competitionStage: 'League Stage' | 'Semi-Finals' | 'Final' | 'Finished';
    onPlayerSelect: (playerId: number) => void;
    coaches: CreatedUser[];
    onCreateCoach: (coach: Omit<CreatedUser, 'password' | 'id'>) => CreatedUser;
    playerRegistrations: PlayerRegistration[];
    onApprovePlayerRegistration: (registrationId: number) => void;
    onRejectPlayerRegistration: (registrationId: number, reason: string) => void;
}

type ManagerSection = 'Dashboard' | 'Manage Players' | 'Player Scouting' | 'Direct Recruitment' | 'Manage Coaches' | 'Manage Transfers' | 'Manage Best Goals' | 'Manage News' | 'Profile';

const ClubManagerDashboard: React.FC<ClubManagerDashboardProps> = ({
    club,
    players,
    onAddPlayer,
    onEditPlayer,
    onDeletePlayer,
    competitionStage,
    onPlayerSelect,
    coaches,
    onCreateCoach,
    playerRegistrations,
    onApprovePlayerRegistration,
    onRejectPlayerRegistration,
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<ManagerSection>('Manage Players');

    // Professional Coach Form State
    const [professionalCoachData, setProfessionalCoachData] = useState({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
        imageUrl: '',
        bio: '',
        coachingLicense: '',
        licenseExpiryDate: '',
        specializations: '',
        languages: '',
        yearsOfExperience: '',
        position: '',
        contractStartDate: '',
        contractEndDate: '',
        salary: '',
        previousClubs: [{ clubName: '', startDate: '', endDate: '', achievements: '' }],
        trophies: [{ name: '', year: '', club: '', level: '' }],
        documents: [{ type: '', name: '', url: '' }]
    });

    // Player form with identity card
    const initialFormState = {
        name: '',
        email: '',
        phone: '',
        dob: '',
        age: 15,
        position: POSITIONS[0],
        nationality: '',
        previousClub: '',
        leaguesPlayed: [] as string[],
        bio: '',
        imageUrl: '',
        identityCardUrl: '',
        hasInjuryHistory: false,
        injuryNature: '',
        lastInjuryDate: '',
        fitnessStatus: '',
        minimumSalary: 0
    };
    const [formData, setFormData] = useState(initialFormState);
    const [recruitUploadedFiles, setRecruitUploadedFiles] = useState<{
        profilePhoto: File | null;
        identityCard: File | null;
    }>({
        profilePhoto: null,
        identityCard: null
    });
    const [recruitPreviewUrls, setRecruitPreviewUrls] = useState<{
        profilePhoto: string | null;
        identityCard: string | null;
    }>({
        profilePhoto: null,
        identityCard: null
    });
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [clubVideos, setClubVideos] = useState<ClubVideo[]>([]);
    const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: number]: File }>({});
    const [documentPreviews, setDocumentPreviews] = useState<{ [key: number]: string }>({});
    const [uploadedCoachPhoto, setUploadedCoachPhoto] = useState<File | null>(null);
    const [coachPhotoPreview, setCoachPhotoPreview] = useState<string>('');
    const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);
    const [approvedPlayers, setApprovedPlayers] = useState<Player[]>([]);

    // News management state
    const [showNewsForm, setShowNewsForm] = useState(false);
    const [isSubmittingNews, setIsSubmittingNews] = useState(false);
    const [newsArticles, setNewsArticles] = useState<Array<{ _id: string; title: string; imageUrl: string, summary: string, content: string, createdAt: string, category: string, author: string, club: string }>>([]);
    const [editingNews, setEditingNews] = useState<any>(null);

    // News form state
    const [newsForm, setNewsForm] = useState({
        title: '',
        summary: '',
        imageUrl: '',
        category: 'Features',
        content: ''
    });

    // News image upload state
    const [newsImageFile, setNewsImageFile] = useState<File | null>(null);
    const [newsImagePreview, setNewsImagePreview] = useState<string>('');

    // Transfer news state (manager-managed)
    type TransferItem = { id: string; title: string; imageUrl: string; clubName: string; createdAt: string };
    const [transferForm, setTransferForm] = useState<{ title: string; imageUrl: string }>({ title: '', imageUrl: '' });
    const [transfers, setTransfers] = useState<TransferItem[]>([]);
    const [transferImageFile, setTransferImageFile] = useState<File | null>(null);
    const [transferImagePreview, setTransferImagePreview] = useState<string>('');

    // Best goals state (manager-managed)
    type BestGoalItem = { id: string; title: string; imageUrl: string; clubName: string; createdAt: string };
    const [bestGoalForm, setBestGoalForm] = useState<{ title: string; imageUrl: string }>({ title: '', imageUrl: '' });
    const [bestGoals, setBestGoals] = useState<BestGoalItem[]>([]);
    const [bestGoalImageFile, setBestGoalImageFile] = useState<File | null>(null);
    const [bestGoalImagePreview, setBestGoalImagePreview] = useState<string>('');

    // Countries for dropdown
    const [countries, setCountries] = useState<CountryOption[]>([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState<boolean>(false);

    // Profile management state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || 'Club Manager',
        profilePicture: (import.meta as any).env.VITE_PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/150'
    });
    const [uploadedProfilePic, setUploadedProfilePic] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string>('');

    // Update profile data when user changes
    useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                name: user.name || 'Club Manager'
            }));
        }
    }, [user]);

    const fetchPendingPlayers = async () => {
        try {
            // Fetch all pending players (General Pool/Free Agents) by passing undefined
            const response = await playerService.getPendingPlayers(undefined, undefined);
            if (response.success) {
                setPendingPlayers(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch pending players:', error);
        }
    };

    useEffect(() => {
        fetchPendingPlayers();
    }, [club.id]);

    const clubPendingPlayers = pendingPlayers.filter(p => p.clubId === club.id || (p.clubId as any)?._id === club.id);
    const generalPoolPlayers = pendingPlayers.filter(p => !p.clubId);

    // Load countries once for nationality dropdown
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                setIsLoadingCountries(true);
                const data = await countryService.getCountries();
                if (isMounted) setCountries(data);
            } catch (err) {
                // countryService already logs and falls back
            } finally {
                if (isMounted) setIsLoadingCountries(false);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    const fetchApprovedPlayers = async () => {
        try {
            const response = await playerService.getApprovedPlayers(undefined, club.name);
            if (response.success) {
                const normalized = (response.data as any[]).map((p: any, index: number) => ({
                    _id: p._id,
                    id: Number(p.id) || Number(p._id?.toString().slice(-6)) || Date.now() + index,
                    name: p.name,
                    email: p.email,
                    phone: p.phone,
                    dob: typeof p.dob === 'string' ? p.dob : new Date(p.dob).toISOString(),
                    position: p.position,
                    nationality: p.nationality,
                    flag: p.flag || '',
                    club: club.name,
                    clubLogo: club.logo,
                    previousClub: p.previousClub || '',
                    leaguesPlayed: p.leaguesPlayed || [],
                    imageUrl: p.imageUrl || '',
                    identityCardUrl: p.identityCardUrl || '',
                    bio: p.bio || '',
                    isVerified: true,
                    addedBy: 0,
                    stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
                }));
                setApprovedPlayers(normalized as any);
            }
        } catch (error) {
            console.error('Failed to fetch approved players:', error);
        }
    };

    useEffect(() => {
        fetchApprovedPlayers();
    }, [club.id]);

    // Load news articles
    useEffect(() => {
        async function getNews() {
            try {
                const data = await fetchNews();
                // Filter news articles to show only those from this club or all if admin
                const filteredData = user?.role === 'admin'
                    ? data
                    : data.filter((article: any) => article.club === club.name);
                setNewsArticles(filteredData);
            } catch (err) {
                setNewsArticles([]);
            }
        }
        getNews();
    }, [club.name, user?.role]);

    // Load existing transfers for this manager's club from MongoDB
    useEffect(() => {
        async function loadTransfers() {
            try {
                const data = await fetchNews();
                const transfers = data
                    .filter((item: any) => item.type === 'transfer' && item.club === club.name)
                    .map((item: any) => ({
                        id: item._id,
                        title: item.title,
                        imageUrl: item.imageUrl,
                        clubName: item.club,
                        createdAt: item.createdAt
                    }));
                setTransfers(transfers);
            } catch (error) {
                console.error('Failed to load transfers:', error);
                setTransfers([]);
            }
        }
        loadTransfers();
    }, [club.name]);

    useEffect(() => {
        async function loadBestGoals() {
            try {
                const data = await fetchNews();
                const bestGoals = data
                    .filter((item: any) => item.type === 'best-goal' && item.club === club.name)
                    .map((item: any) => ({
                        id: item._id,
                        title: item.title,
                        imageUrl: item.imageUrl,
                        clubName: item.club,
                        createdAt: item.createdAt
                    }));
                setBestGoals(bestGoals);
            } catch (error) {
                console.error('Failed to load best goals:', error);
                setBestGoals([]);
            }
        }
        loadBestGoals();
    }, [club.name]);

    const clubPlayers = players.filter(p => p.club === club.name);
    const clubCoaches = coaches.filter(c => c.clubId === club.id && c.role === 'coach');
    // pendingRegistrations now comes from the API filtered by club ID
    const pendingRegistrations = pendingPlayers.map(player => ({
        id: player.id || Date.now(),
        name: player.name,
        email: player.email,
        phone: player.phone,
        dob: player.dob,
        position: player.position,
        nationality: player.nationality,
        previousClub: player.previousClub || '',
        leaguesPlayed: player.leaguesPlayed || [],
        imageUrl: player.imageUrl || '',
        identityCardUrl: player.identityCardUrl || '',
        bio: player.bio || '',
        status: 'pending' as const,
        clubId: club.id,
        submittedAt: player.submittedAt || new Date().toISOString(),
        reviewedAt: undefined,
        reviewedBy: undefined,
        rejectionReason: undefined
    }));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checkbox = e.target as HTMLInputElement;
            const currentLeagues = formData.leaguesPlayed || [];
            const updatedLeagues = checkbox.checked
                ? [...currentLeagues, value]
                : currentLeagues.filter(l => l !== value);
            setFormData(prev => ({ ...prev, leaguesPlayed: updatedLeagues }));
        } else if (name === 'name') {
            const sanitized = value.replace(/[^A-Za-z\s'\-]/g, '').replace(/\s{2,}/g, ' ');
            setFormData(prev => ({ ...prev, [name]: sanitized }));
        } else if (name === 'phone') {
            const digitsOnly = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: digitsOnly }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleRecruitFileUpload = (field: 'profilePhoto' | 'identityCard', file: File) => {
        // Validate file types and sizes as in PlayerRegistrationPage
        const isImage = file.type.startsWith('image/');
        const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

        if (file.size > maxSize) {
            toast.error(`File too large. Max ${isImage ? '5MB' : '10MB'}`);
            return;
        }

        setRecruitUploadedFiles(prev => ({ ...prev, [field]: file }));

        if (isImage) {
            const previewUrl = URL.createObjectURL(file);
            setRecruitPreviewUrls(prev => ({ ...prev, [field]: previewUrl }));
        } else {
            setRecruitPreviewUrls(prev => ({ ...prev, [field]: file.name }));
        }
    };

    const recruitUploadToCloudinary = async (file: File, uploadPreset: string): Promise<string> => {
        const url = `${(import.meta as any).env.VITE_CLOUDINARY_URL || 'https://api.cloudinary.com/v1_1/dmuilu78u/auto/upload'}`;
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", uploadPreset);

        try {
            const res = await fetch(url, { method: "POST", body: data });
            if (!res.ok) throw new Error("Upload failed");
            const result = await res.json();
            return result.secure_url;
        } catch (err) {
            console.error("Cloudinary upload error:", err);
            throw err;
        }
    };



    // Professional Coach Form Handlers
    const formatName = (name: string) => {
        return name
            .trim() // Remove leading/trailing spaces
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .split(' ')
            .filter(word => word.length > 0) // Remove empty strings
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const handleProfessionalCoachInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Field-level sanitization
        if (name === 'name') {
            // Allow normal typing with spaces, only sanitize invalid characters
            const sanitized = value.replace(/[^A-Za-z\s]/g, '');
            setProfessionalCoachData(prev => ({ ...prev, name: sanitized }));
            return;
        }
        if (name === 'phone') {
            const digitsOnly = value.replace(/[^0-9]/g, '');
            setProfessionalCoachData(prev => ({ ...prev, phone: digitsOnly }));
            return;
        }
        if (name === 'nationality') {
            const sanitized = value.replace(/[^A-Za-z\s]/g, '');
            setProfessionalCoachData(prev => ({ ...prev, nationality: sanitized }));
            return;
        }
        if (name === 'languages') {
            // Allow letters, spaces, commas, and hyphens
            const sanitized = value.replace(/[^A-Za-z,\s\-]/g, '');
            setProfessionalCoachData(prev => ({ ...prev, languages: sanitized }));
            return;
        }
        if (name === 'yearsOfExperience') {
            // Digits only, clamp 0-60
            let digits = value.replace(/[^0-9]/g, '');
            let num = digits === '' ? '' : String(Math.max(0, Math.min(60, parseInt(digits))));
            setProfessionalCoachData(prev => ({ ...prev, yearsOfExperience: num as any }));
            return;
        }
        if (name === 'salary') {
            // Digits only
            const digits = value.replace(/[^0-9]/g, '');
            setProfessionalCoachData(prev => ({ ...prev, salary: digits }));
            return;
        }
        setProfessionalCoachData(prev => ({ ...prev, [name]: value }));
    };

    const addPreviousClub = () => {
        setProfessionalCoachData(prev => ({
            ...prev,
            previousClubs: [...prev.previousClubs, { clubName: '', startDate: '', endDate: '', achievements: '' }]
        }));
    };

    const updatePreviousClub = (index: number, field: string, value: string) => {
        // Sanitize club name to avoid numbers; achievements allow no digits
        let sanitizedValue = value;
        if (field === 'clubName') sanitizedValue = value.replace(/[^A-Za-z\s'\-]/g, '');
        if (field === 'achievements') sanitizedValue = value.replace(/[0-9]/g, '');
        setProfessionalCoachData(prev => ({
            ...prev,
            previousClubs: prev.previousClubs.map((club, i) =>
                i === index ? { ...club, [field]: sanitizedValue } : club
            )
        }));
    };

    const removePreviousClub = (index: number) => {
        setProfessionalCoachData(prev => ({
            ...prev,
            previousClubs: prev.previousClubs.filter((_, i) => i !== index)
        }));
    };

    const addTrophy = () => {
        setProfessionalCoachData(prev => ({
            ...prev,
            trophies: [...prev.trophies, { name: '', year: '', club: '', level: '' }]
        }));
    };

    const updateTrophy = (index: number, field: string, value: string) => {
        // Sanitize fields: name/club letters only; year digits only
        let sanitized = value;
        if (field === 'name' || field === 'club') sanitized = value.replace(/[^A-Za-z\s'\-]/g, '');
        if (field === 'year') sanitized = value.replace(/[^0-9]/g, '').slice(0, 4);
        setProfessionalCoachData(prev => ({
            ...prev,
            trophies: prev.trophies.map((trophy, i) =>
                i === index ? { ...trophy, [field]: sanitized } : trophy
            )
        }));
    };

    const removeTrophy = (index: number) => {
        setProfessionalCoachData(prev => ({
            ...prev,
            trophies: prev.trophies.filter((_, i) => i !== index)
        }));
    };



    const addDocument = () => {
        setProfessionalCoachData(prev => ({
            ...prev,
            documents: [...prev.documents, { type: '', name: '', url: '' }]
        }));
    };

    const updateDocument = (index: number, field: string, value: string) => {
        setProfessionalCoachData(prev => ({
            ...prev,
            documents: prev.documents.map((doc, i) =>
                i === index ? { ...doc, [field]: value } : doc
            )
        }));
    };

    const removeDocument = (index: number) => {
        setProfessionalCoachData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
        // Clean up uploaded file and preview
        setUploadedDocuments(prev => {
            const newUploaded = { ...prev };
            delete newUploaded[index];
            return newUploaded;
        });
        setDocumentPreviews(prev => {
            const newPreviews = { ...prev };
            delete newPreviews[index];
            return newPreviews;
        });
    };

    const handleDocumentUpload = (index: number, file: File) => {
        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload a PDF or Word document.');
            return;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('File size too large. Please upload a file smaller than 10MB.');
            return;
        }

        // Store the file
        setUploadedDocuments(prev => ({
            ...prev,
            [index]: file
        }));

        // Create preview (filename only for documents)
        setDocumentPreviews(prev => ({
            ...prev,
            [index]: file.name
        }));

        // Update the document URL in the form data (simulate upload)
        const fakeUrl = `${(import.meta as any).env.VITE_UPLOADS_BASE_URL || 'https://uploads.ngl.com'}/documents/${Date.now()}-${file.name}`;
        updateDocument(index, 'url', fakeUrl);
    };

    const handleCoachPhotoUpload = (file: File) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload an image (JPG, PNG, WEBP).');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File size too large. Please upload a file smaller than 5MB.');
            return;
        }

        // Store the file
        setUploadedCoachPhoto(file);

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setCoachPhotoPreview(previewUrl);

        // Update the imageUrl in the form data (simulate upload)
        const fakeUrl = `${(import.meta as any).env.VITE_UPLOADS_BASE_URL || 'https://uploads.ngl.com'}/photos/${Date.now()}-${file.name}`;
        setProfessionalCoachData(prev => ({
            ...prev,
            imageUrl: fakeUrl
        }));
    };

    const handleProfilePictureUpload = (file: File) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload an image (JPG, PNG, WEBP).');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File size too large. Please upload a file smaller than 5MB.');
            return;
        }

        // Store the file
        setUploadedProfilePic(file);

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setProfilePicPreview(previewUrl);

        // Update the profile picture in the form data (simulate upload)
        const fakeUrl = `${(import.meta as any).env.VITE_UPLOADS_BASE_URL || 'https://uploads.ngl.com'}/profiles/${Date.now()}-${file.name}`;
        setProfileData(prev => ({
            ...prev,
            profilePicture: fakeUrl
        }));
    };

    const handleNewsImageUpload = (file: File) => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload an image (JPG, PNG, WEBP).');
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File size too large. Please upload a file smaller than 5MB.');
            return;
        }

        // Store the file
        setNewsImageFile(file);

        // Create preview
        const previewUrl = URL.createObjectURL(file);
        setNewsImagePreview(previewUrl);

        // Update the imageUrl in the form data (simulate upload)
        const fakeUrl = `${(import.meta as any).env.VITE_UPLOADS_BASE_URL || 'https://uploads.ngl.com'}/news/${Date.now()}-${file.name}`;
        setNewsForm(prev => ({
            ...prev,
            imageUrl: fakeUrl
        }));
    };

    const handleProfileSave = () => {
        // Here you would typically send the data to your backend
        console.log('Profile Data:', profileData);
        alert('Profile updated successfully!');
        setIsEditingProfile(false);
    };

    const handleProfileCancel = () => {
        setIsEditingProfile(false);
        setUploadedProfilePic(null);
        setProfilePicPreview('');
        // Reset profile data to original values
        setProfileData({
            name: user?.name || 'Club Manager',
            profilePicture: (import.meta as any).env.VITE_PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/150'
        });
    };

    // News management functions
    const handleCreateNews = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔍 [Club Manager] Starting news creation process...');
        console.log('🔍 [Club Manager] User:', user);
        console.log('🔍 [Club Manager] Firebase user:', user?.firebaseUser);

        setIsSubmittingNews(true);

        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            console.log('🔍 [Club Manager] ID Token obtained:', idToken ? 'Yes' : 'No');

            if (!idToken) {
                console.error('❌ [Club Manager] No ID token available');
                toast.error('Failed to get ID token');
                setIsSubmittingNews(false);
                return;
            }

            let imageUrl = newsForm.imageUrl;

            // Handle file upload if a file was selected
            if (newsImageFile) {
                try {
                    imageUrl = await uploadToCloudinary(newsImageFile, 'ml_default');
                } catch (uploadError: any) {
                    console.error('❌ [Club Manager] Upload error:', uploadError);
                    toast.error('Failed to upload image: ' + uploadError.message);
                    setIsSubmittingNews(false);
                    return;
                }
            } else if (!imageUrl) {
                toast.error('Please upload an image or provide an image URL');
                setIsSubmittingNews(false);
                return;
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

            const newArticle = {
                title: newsForm.title,
                summary: newsForm.summary,
                imageUrl: imageUrl,
                category: newsForm.category,
                type: articleType,
                content: newsForm.content,
                createdAt: new Date().toISOString()
            };

            console.log('🔍 [Club Manager] Article data:', newArticle);
            const created = await createNews(newArticle, idToken);
            console.log('🔍 [Club Manager] Created article:', created);

            setNewsArticles(prev => [created, ...prev]);
            setNewsForm({ title: '', summary: '', imageUrl: '', category: 'Features', content: '' });
            setNewsImageFile(null);
            setNewsImagePreview('');
            setShowNewsForm(false);
            toast.success('News article created successfully!');
        } catch (error: any) {
            console.error('❌ [Club Manager] Error in handleCreateNews:', error);
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
            let imageUrl = newsForm.imageUrl;

            // Handle file upload if a new file was selected
            if (newsImageFile) {
                try {
                    imageUrl = await uploadToCloudinary(newsImageFile, 'ml_default');
                } catch (uploadError: any) {
                    console.error('❌ [Club Manager] Upload error:', uploadError);
                    toast.error('Failed to upload image: ' + uploadError.message);
                    setIsSubmittingNews(false);
                    return;
                }
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

    const handleProfessionalCoachSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Validate required fields
            if (!professionalCoachData.name || !professionalCoachData.email || !professionalCoachData.phone) {
                alert('Please fill in all required fields (Name, Email, Phone).');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(professionalCoachData.email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Name letters-only validation
            const namePattern = /^[A-Za-z][A-Za-z\s'\-]*$/;
            if (!namePattern.test(professionalCoachData.name.trim())) {
                alert("Name can contain letters, spaces, apostrophes, and hyphens only.");
                return;
            }

            // Phone digits-only validation (7-15)
            const phoneDigits = professionalCoachData.phone.replace(/\D/g, '');
            if (!/^[0-9]{7,15}$/.test(phoneDigits)) {
                alert('Phone number must be digits only (7 to 15 numbers).');
                return;
            }

            // Nationality letters and spaces only if provided
            if (professionalCoachData.nationality && !/^[A-Za-z\s]+$/.test(professionalCoachData.nationality.trim())) {
                alert('Nationality must contain letters and spaces only.');
                return;
            }

            // DOB logical check (coach age 18-75 if provided)
            if (professionalCoachData.dateOfBirth) {
                const today = new Date();
                const minDate = new Date(today.getFullYear() - 75, today.getMonth(), today.getDate());
                const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                const dob = new Date(professionalCoachData.dateOfBirth);
                if (Number.isNaN(dob.getTime()) || dob < minDate || dob > maxDate) {
                    alert('Please enter a valid date of birth: age must be between 18 and 75.');
                    return;
                }
            }

            // License expiry date should be in the future if provided
            if (professionalCoachData.licenseExpiryDate) {
                const exp = new Date(professionalCoachData.licenseExpiryDate);
                const today = new Date();
                if (Number.isNaN(exp.getTime()) || exp < today) {
                    alert('License expiry date must be in the future.');
                    return;
                }
            }

            // Experience logical range already constrained by min/max, double-check
            if (professionalCoachData.yearsOfExperience && (Number(professionalCoachData.yearsOfExperience) < 0 || Number(professionalCoachData.yearsOfExperience) > 60)) {
                alert('Years of experience looks invalid. Please enter 0-60.');
                return;
            }

            // Languages validation: only letters, spaces, commas, hyphens
            if (professionalCoachData.languages && /[^A-Za-z,\s\-]/.test(professionalCoachData.languages)) {
                alert('Languages can include only letters, spaces, commas, and hyphens.');
                return;
            }

            // Contract dates logic if provided
            if (professionalCoachData.contractStartDate && professionalCoachData.contractEndDate) {
                const start = new Date(professionalCoachData.contractStartDate);
                const end = new Date(professionalCoachData.contractEndDate);
                if (start > end) {
                    alert('Contract end date must be after start date.');
                    return;
                }
            }

            // Validate previous clubs fields
            for (const c of professionalCoachData.previousClubs) {
                if (c.clubName && /[^A-Za-z\s'\-]/.test(c.clubName)) {
                    alert('Previous club names can only include letters, spaces, apostrophes and hyphens.');
                    return;
                }
                if (c.achievements && /[0-9]/.test(c.achievements)) {
                    alert('Key achievements should not include numbers.');
                    return;
                }
                if (c.startDate && c.endDate) {
                    const s = new Date(c.startDate);
                    const e = new Date(c.endDate);
                    if (s > e) {
                        alert('Previous club end date must be after start date.');
                        return;
                    }
                }
            }

            // Validate documents: require type and name if a file/url present; name letters only
            for (const d of professionalCoachData.documents) {
                if (d.url && (!d.type || !d.name)) {
                    alert('Please specify document type and name for each uploaded document.');
                    return;
                }
                if (d.name && /[^A-Za-z\s'\-]/.test(d.name)) {
                    alert('Document name can include only letters, spaces, apostrophes and hyphens.');
                    return;
                }
            }

            // Prepare coach data for API
            const coachData: CreateCoachData = {
                name: professionalCoachData.name,
                email: professionalCoachData.email,
                phone: phoneDigits || professionalCoachData.phone,
                clubId: club.id.toString(),
                dateOfBirth: professionalCoachData.dateOfBirth,
                nationality: professionalCoachData.nationality,
                bio: professionalCoachData.bio,
                coachingLicense: professionalCoachData.coachingLicense,
                licenseExpiryDate: professionalCoachData.licenseExpiryDate,
                specializations: professionalCoachData.specializations,
                languages: professionalCoachData.languages,
                yearsOfExperience: professionalCoachData.yearsOfExperience,
                position: professionalCoachData.position,
                contractStartDate: professionalCoachData.contractStartDate,
                contractEndDate: professionalCoachData.contractEndDate,
                salary: professionalCoachData.salary,
                previousClubs: professionalCoachData.previousClubs,
                trophies: professionalCoachData.trophies,
                documents: professionalCoachData.documents
            };

            // Show loading state
            const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Creating Coach Account...';
            }

            // Create coach account via API
            const response = await coachService.createCoach(coachData);

            if (response.success) {
                alert(`✅ Coach account created successfully!\n\nLogin credentials have been sent to ${professionalCoachData.email}.\n\nThe coach can now log in to their dashboard using the provided password.`);

                // Reset form
                setProfessionalCoachData({
                    name: '',
                    email: '',
                    phone: '',
                    dateOfBirth: '',
                    nationality: '',
                    imageUrl: '',
                    bio: '',
                    coachingLicense: '',
                    licenseExpiryDate: '',
                    specializations: '',
                    languages: '',
                    yearsOfExperience: '',
                    position: '',
                    contractStartDate: '',
                    contractEndDate: '',
                    salary: '',
                    previousClubs: [{ clubName: '', startDate: '', endDate: '', achievements: '' }],
                    trophies: [{ name: '', year: '', club: '', level: '' }],
                    documents: [{ type: '', name: '', url: '' }]
                });

                // Clear uploaded files
                setUploadedDocuments({});
                setDocumentPreviews({});
                setUploadedCoachPhoto(null);
                setCoachPhotoPreview('');
            } else {
                throw new Error(response.message || 'Failed to create coach account');
            }

        } catch (error: any) {
            console.error('Error creating professional coach:', error);

            // Show specific error messages
            if (error.message.includes('email already exists')) {
                alert('❌ A user with this email address already exists. Please use a different email.');
            } else if (error.message.includes('Invalid email')) {
                alert('❌ Please enter a valid email address.');
            } else {
                alert(`❌ Failed to create coach account: ${error.message || 'Please try again.'}`);
            }
        } finally {
            // Reset button state
            const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Create Professional Coach Profile';
            }
        }
    };

    const handlePlayerFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            if (editingPlayer) {
                const updatedData = {
                    ...formData,
                    imageUrl: formData.imageUrl || editingPlayer.imageUrl,
                    identityCardUrl: formData.identityCardUrl || editingPlayer.identityCardUrl
                };

                const response = await playerService.update(editingPlayer._id || editingPlayer.id, updatedData as any);
                if (response.success) {
                    toast.success('Player updated successfully');
                    await fetchApprovedPlayers();
                    setEditingPlayer(null);
                } else {
                    toast.error(response.message || 'Failed to update player');
                }
            } else {
                // Add new player logic (if needed here, though usually separate)
                toast.error('Add functionality not fully implemented in this context');
            }
        } catch (error) {
            console.error('Error updating player:', error);
            toast.error('Failed to update player');
        }
    };

    const handleEditClick = (player: Player) => {
        setFormData({
            name: player.name,
            email: player.email,
            phone: player.phone,
            dob: player.dob ? new Date(player.dob).toISOString().split('T')[0] : '',
            age: player.age || 15,
            position: player.position,
            nationality: player.nationality,
            previousClub: player.previousClub || '',
            leaguesPlayed: player.leaguesPlayed || [],
            imageUrl: player.imageUrl || '',
            identityCardUrl: player.identityCardUrl || '',
            bio: player.bio || '',
            hasInjuryHistory: player.hasInjuryHistory || false,
            injuryNature: player.injuryNature || '',
            lastInjuryDate: player.lastInjuryDate || '',
            fitnessStatus: player.fitnessStatus || '',
            minimumSalary: player.minimumSalary || 0
        });
        setEditingPlayer(player);
    };

    const handleCancelEdit = () => {
        setEditingPlayer(null);
        setFormData(initialFormState);
    };

    const renderEditPlayerModal = () => {
        if (!editingPlayer) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-2xl font-bold text-gray-800">Edit Player: {editingPlayer.name}</h2>
                        <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <form onSubmit={handlePlayerFormSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
                                <InputField label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
                                <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                <InputField label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                                <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                    <select name="position" value={formData.position} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <InputField label="Nationality" name="nationality" value={formData.nationality} onChange={handleInputChange} required />
                            </div>

                            {/* Football Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Football Details</h3>
                                <InputField label="Previous Club" name="previousClub" value={formData.previousClub} onChange={handleInputChange} />

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Images & Documents</label>
                                    <InputField label="Profile Image URL" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
                                    {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-full border" />}

                                    <InputField label="Identity Document URL" name="identityCardUrl" value={formData.identityCardUrl} onChange={handleInputChange} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-100">
                            <button type="submit" className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                                Save Changes
                            </button>
                            <button type="button" onClick={handleCancelEdit} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const handleDeleteClick = (playerId: number) => {
        if (window.confirm('Are you sure you want to remove this player? This action is permanent.')) {
            onDeletePlayer(playerId);
        }
    };

    const handleAddVideo = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newVideo: ClubVideo = {
            id: clubVideos.length + 1 + Math.random(),
            title: formData.get('title') as string,
            url: formData.get('url') as string,
            thumbnail: formData.get('thumbnail') as string || `${(import.meta as any).env.VITE_PLACEHOLDER_IMAGE_URL || 'https://picsum.photos'}/seed/${formData.get('title')}/400`,
        };
        setClubVideos(prev => [...prev, newVideo]);
        e.currentTarget.reset();
    };


    const handleApprovePlayer = async (playerId: string | number) => {
        try {
            const response = await playerService.approve(playerId);
            if (response.success) {
                setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
                await fetchPendingPlayers();
                await fetchApprovedPlayers();
                alert('Player approved and added to squad!');
                navigate('/players');
            } else {
                alert(response.message || 'Failed to approve player.');
            }
        } catch (error) {
            alert('Error approving player. Please try again.');
        }
    };

    const handleRejectPlayer = async (playerId: string | number, reason: string) => {
        try {
            const response = await playerService.reject(playerId, reason);
            if (response.success) {
                setPendingPlayers(prev => prev.filter(p => p.id !== playerId));
                await fetchPendingPlayers();
                await fetchApprovedPlayers();
                alert('Player registration rejected.');
            } else {
                alert(response.message || 'Failed to reject player.');
            }
        } catch (error) {
            alert('Error rejecting player. Please try again.');
        }
    };



    const handleDirectRecruitmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const loadingToast = toast.loading('Processing recruitment...');
        try {
            let imageUrl = formData.imageUrl;
            let identityCardUrl = formData.identityCardUrl;

            // Upload files to Cloudinary if selected
            if (recruitUploadedFiles.profilePhoto) {
                imageUrl = await recruitUploadToCloudinary(recruitUploadedFiles.profilePhoto, 'ml_default');
            }
            if (recruitUploadedFiles.identityCard) {
                identityCardUrl = await recruitUploadToCloudinary(recruitUploadedFiles.identityCard, 'ml_default');
            }

            if (!identityCardUrl && !recruitUploadedFiles.identityCard) {
                toast.error('Identity document is required', { id: loadingToast });
                return;
            }

            const recruitmentData = {
                ...formData,
                imageUrl,
                identityCardUrl,
                clubId: club.id,
                club: club.name,
                clubLogo: club.logo,
                status: 'approved',
                isVerified: true
            };

            const response = await playerService.recruit(recruitmentData);
            if (response.success) {
                toast.success('Player recruited successfully and added to squad!', { id: loadingToast });
                await fetchApprovedPlayers();
                setFormData(initialFormState);
                setRecruitUploadedFiles({ profilePhoto: null, identityCard: null });
                setRecruitPreviewUrls({ profilePhoto: null, identityCard: null });
                setActiveSection('Manage Players');
            } else {
                toast.error(response.message || 'Failed to recruit player', { id: loadingToast });
            }
        } catch (error: any) {
            console.error('Error in direct recruitment:', error);
            toast.error(error.response?.data?.message || 'Failed to recruit player', { id: loadingToast });
        }
    };

    const renderDirectRecruitment = () => {
        // Date boundaries for logical DOB
        const today = new Date();
        const maxDobDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
        const minDobDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate());
        const formatDate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        const minDobStr = formatDate(minDobDate);
        const maxDobStr = formatDate(maxDobDate);

        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header - Matching Registration Form */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-white">
                        <h1 className="text-4xl font-bold text-center mb-2">Direct Player Recruitment</h1>
                        <p className="text-center text-blue-100 text-lg">
                            Manually add a player directly to your squad bypassing the standard registration process
                        </p>
                    </div>

                    <div className="p-8 space-y-8">
                        <form onSubmit={handleDirectRecruitmentSubmit} className="space-y-8">
                            {/* Personal Information */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleInputChange}
                                            min={15}
                                            max={45}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="15"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={formData.dob}
                                            onChange={handleInputChange}
                                            min={minDobStr}
                                            max={maxDobStr}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality *</label>
                                        <select
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-black"
                                        >
                                            <option value="">Select nationality</option>
                                            {countries.map(country => (
                                                <option key={country.code} value={country.name} className="text-black">
                                                    {country.flag} {country.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Gaming Information */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Gaming Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Position *</label>
                                        <select
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-black"
                                        >
                                            {POSITIONS.map(position => (
                                                <option key={position} value={position} className="text-black">{position}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Previous Club</label>
                                        <input
                                            name="previousClub"
                                            value={formData.previousClub}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Enter previous club (if any)"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Salary Expectation ($) *</label>
                                        <input
                                            type="number"
                                            name="minimumSalary"
                                            value={formData.minimumSalary}
                                            onChange={handleInputChange}
                                            min="0"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Leagues Played */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Leagues Played *</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {LEAGUES.map(league => (
                                        <label key={league} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="leaguesPlayed"
                                                value={league}
                                                checked={(formData.leaguesPlayed || []).includes(league)}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">{league}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Medical and Fitness History */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Medical and Fitness History</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Injury History (Yes / No) *</label>
                                        <div className="flex space-x-6">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={formData.hasInjuryHistory === true}
                                                    onChange={() => setFormData(p => ({ ...p, hasInjuryHistory: true }))}
                                                    className="form-radio h-5 w-5 text-red-600"
                                                />
                                                <span className="ml-2 text-gray-700 font-medium">Yes</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={formData.hasInjuryHistory === false}
                                                    onChange={() => setFormData(p => ({ ...p, hasInjuryHistory: false }))}
                                                    className="form-radio h-5 w-5 text-green-600"
                                                />
                                                <span className="ml-2 text-gray-700 font-medium">No</span>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.hasInjuryHistory && (
                                        <>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nature of Previous Injuries *</label>
                                                <textarea
                                                    name="injuryNature"
                                                    value={formData.injuryNature}
                                                    onChange={handleInputChange}
                                                    rows={3}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    placeholder="Describe previous injuries..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Last Injury *</label>
                                                <input
                                                    type="date"
                                                    name="lastInjuryDate"
                                                    value={formData.lastInjuryDate}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className={formData.hasInjuryHistory ? "" : "md:col-span-2"}>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Fitness Status *</label>
                                        <select
                                            name="fitnessStatus"
                                            value={formData.fitnessStatus}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white text-black"
                                        >
                                            <option value="">Select status</option>
                                            <option value="Fully Fit">Fully Fit</option>
                                            <option value="Match Fit">Match Fit</option>
                                            <option value="Returning from Injury">Returning from Injury</option>
                                            <option value="Injured">Injured</option>
                                            <option value="Recovering">Recovering</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Documents & Photo */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Documents & Photo</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-4">Profile Photo</label>
                                        {recruitPreviewUrls.profilePhoto ? (
                                            <div className="relative group">
                                                <img src={recruitPreviewUrls.profilePhoto} alt="Profile" className="w-full h-48 object-cover rounded-xl border-2 border-green-300 shadow-md" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setRecruitPreviewUrls(p => ({ ...p, profilePhoto: null }));
                                                        setRecruitUploadedFiles(p => ({ ...p, profilePhoto: null }));
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                                <p className="mt-2 text-center text-sm font-medium text-green-600">✓ Photo Selected</p>
                                            </div>
                                        ) : (
                                            <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => e.target.files?.[0] && handleRecruitFileUpload('profilePhoto', e.target.files[0])}
                                                />
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                                                    <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                </div>
                                                <span className="text-sm font-medium text-gray-600">Upload Profile Photo</span>
                                                <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 5MB</span>
                                            </label>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-4">Identity Card / Player Card * (PDF, JPG, PNG)</label>
                                        {recruitPreviewUrls.identityCard ? (
                                            <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    </div>
                                                    <div className="truncate max-w-[150px]">
                                                        <p className="text-sm font-bold text-blue-800 truncate">{recruitPreviewUrls.identityCard}</p>
                                                        <p className="text-xs text-blue-600">Document Selected</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setRecruitPreviewUrls(p => ({ ...p, identityCard: null }));
                                                        setRecruitUploadedFiles(p => ({ ...p, identityCard: null }));
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all group">
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/*"
                                                    className="hidden"
                                                    onChange={(e) => e.target.files?.[0] && handleRecruitFileUpload('identityCard', e.target.files[0])}
                                                />
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                                                    <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                                                </div>
                                                <span className="text-sm font-medium text-gray-600">Upload Identity Document *</span>
                                                <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* About You */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">About You</h2>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio / Description *</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows={4}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Tell us about the player's gaming experience, achievements, etc."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-6 pt-10">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:opacity-90 transition-all shadow-xl text-lg transform hover:-translate-y-1"
                                >
                                    Complete Recruitment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData(initialFormState);
                                        setActiveSection('Manage Players');
                                    }}
                                    className="px-8 py-4 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all text-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const renderManageCoaches = () => (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-theme-dark text-center">Professional Coach Management</h2>

            {/* Professional Coach Profile Form */}
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-semibold text-theme-dark">Add Professional Coach</h3>
                    <p className="text-theme-text-secondary mt-2">Create a comprehensive professional coach profile with qualifications, experience, and achievements</p>
                </div>
                <form onSubmit={handleProfessionalCoachSubmit} className="bg-theme-secondary-bg p-8 rounded-xl shadow-xl">

                    {/* Basic Information Section */}
                    <div className="mb-8 p-6 bg-theme-page-bg rounded-lg border-l-4 border-blue-500">
                        <h4 className="text-xl font-semibold mb-6 text-theme-dark flex items-center">
                            <span className="text-2xl mr-3">👤</span>
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={professionalCoachData.name}
                                    onChange={handleProfessionalCoachInputChange}
                                    onBlur={(e) => {
                                        const formatted = formatName(e.target.value);
                                        setProfessionalCoachData(prev => ({ ...prev, name: formatted }));
                                    }}
                                    title="Enter first name, last name, and middle name (if applicable). Each name will be properly capitalized when you finish typing."
                                    required
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={professionalCoachData.email}
                                    onChange={handleProfessionalCoachInputChange}
                                    required
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="john.doe@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={professionalCoachData.phone}
                                    onChange={handleProfessionalCoachInputChange}
                                    pattern="[0-9]{7,15}"
                                    title="Digits only, 7 to 15 numbers"
                                    required
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={professionalCoachData.dateOfBirth}
                                    onChange={handleProfessionalCoachInputChange}
                                    min={(d => { const t = new Date(); const m = new Date(t.getFullYear() - 75, t.getMonth(), t.getDate()); return new Date(m.getTime() - m.getTimezoneOffset() * 60000).toISOString().split('T')[0]; })()}
                                    max={(d => { const t = new Date(); const m = new Date(t.getFullYear() - 18, t.getMonth(), t.getDate()); return new Date(m.getTime() - m.getTimezoneOffset() * 60000).toISOString().split('T')[0]; })()}
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Nationality</label>
                                <select
                                    name="nationality"
                                    value={professionalCoachData.nationality}
                                    onChange={handleProfessionalCoachInputChange}
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                >
                                    <option value="">{isLoadingCountries ? 'Loading countries...' : 'Select nationality'}</option>
                                    {countries.map((c) => (
                                        <option key={c.code} value={c.name}>
                                            {c.flag} {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Profile Photo</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleCoachPhotoUpload(file);
                                            }
                                        }}
                                        className="hidden"
                                        id="coach-photo-upload"
                                    />
                                    <label
                                        htmlFor="coach-photo-upload"
                                        className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer flex items-center justify-center hover:bg-theme-page-bg"
                                    >
                                        {coachPhotoPreview ? (
                                            <div className="flex items-center gap-2">
                                                <img src={coachPhotoPreview} alt="Preview" className="w-8 h-8 rounded-full object-cover" />
                                                <span className="text-sm text-green-600">Photo uploaded</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">
                                                📷 Upload Profile Photo
                                            </span>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-theme-text-secondary mb-2">Professional Biography</label>
                            <textarea
                                name="bio"
                                value={professionalCoachData.bio}
                                onChange={handleProfessionalCoachInputChange}
                                rows={4}
                                className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="Brief professional biography highlighting coaching philosophy, experience, and achievements..."
                            />
                        </div>
                    </div>

                    {/* Professional Qualifications Section */}
                    <div className="mb-8 p-6 bg-theme-page-bg rounded-lg border-l-4 border-green-500">
                        <h4 className="text-xl font-semibold mb-6 text-theme-dark flex items-center">
                            <span className="text-2xl mr-3">🏆</span>
                            Professional Qualifications
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Coaching License</label>
                                <select
                                    name="coachingLicense"
                                    value={professionalCoachData.coachingLicense}
                                    onChange={handleProfessionalCoachInputChange}
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                >
                                    <option value="">Select License</option>
                                    <option value="UEFA Pro">UEFA Pro License</option>
                                    <option value="UEFA A">UEFA A License</option>
                                    <option value="UEFA B">UEFA B License</option>
                                    <option value="UEFA C">UEFA C License</option>
                                    <option value="CAF A">CAF A License</option>
                                    <option value="CAF B">CAF B License</option>
                                    <option value="CAF C">CAF C License</option>
                                    <option value="USSF A">USSF A License</option>
                                    <option value="USSF B">USSF B License</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">License Expiry Date</label>
                                <input
                                    type="date"
                                    name="licenseExpiryDate"
                                    value={professionalCoachData.licenseExpiryDate}
                                    onChange={handleProfessionalCoachInputChange}
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Years of Experience</label>
                                <input
                                    type="number"
                                    name="yearsOfExperience"
                                    value={professionalCoachData.yearsOfExperience}
                                    onChange={handleProfessionalCoachInputChange}
                                    min="0"
                                    max="50"
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    placeholder="10"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Current Position</label>
                                <select
                                    name="position"
                                    value={professionalCoachData.position}
                                    onChange={handleProfessionalCoachInputChange}
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                >
                                    <option value="">Select Position</option>
                                    <option value="Head Coach">Head Coach</option>
                                    <option value="Assistant Coach">Assistant Coach</option>
                                    <option value="Youth Coach">Youth Coach</option>
                                    <option value="Goalkeeping Coach">Goalkeeping Coach</option>
                                    <option value="Fitness Coach">Fitness Coach</option>
                                    <option value="Technical Director">Technical Director</option>
                                    <option value="Scout">Scout</option>
                                    <option value="Academy Director">Academy Director</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Specializations</label>
                                <input
                                    type="text"
                                    name="specializations"
                                    value={professionalCoachData.specializations}
                                    onChange={handleProfessionalCoachInputChange}
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    placeholder="Youth Development, Tactics, Set Pieces"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Languages</label>
                                <input
                                    type="text"
                                    name="languages"
                                    value={professionalCoachData.languages}
                                    onChange={handleProfessionalCoachInputChange}
                                    pattern="[A-Za-z,\s\-]+"
                                    title="Letters, spaces, commas and hyphens only"
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    placeholder="English, Spanish, French"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Previous Clubs Experience */}
                    <div className="mb-8 p-6 bg-theme-page-bg rounded-lg border-l-4 border-purple-500">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-semibold text-theme-dark flex items-center">
                                <span className="text-2xl mr-3">🏟️</span>
                                Previous Clubs Experience
                            </h4>
                            <button
                                type="button"
                                onClick={addPreviousClub}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                            >
                                + Add Club
                            </button>
                        </div>
                        {professionalCoachData.previousClubs.map((club, index) => (
                            <div key={index} className="bg-theme-secondary-bg p-4 rounded-lg mb-4 border border-theme-border">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Club Name"
                                        value={club.clubName}
                                        onChange={(e) => updatePreviousClub(index, 'clubName', e.target.value)}
                                        pattern="[A-Za-z\s'\-]*"
                                        title="Letters, spaces, apostrophes and hyphens only"
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="date"
                                        placeholder="Start Date"
                                        value={club.startDate}
                                        onChange={(e) => updatePreviousClub(index, 'startDate', e.target.value)}
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <input
                                        type="date"
                                        placeholder="End Date"
                                        value={club.endDate}
                                        onChange={(e) => updatePreviousClub(index, 'endDate', e.target.value)}
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div className="mt-3">
                                    <input
                                        type="text"
                                        placeholder="Key Achievements (optional)"
                                        value={club.achievements}
                                        onChange={(e) => updatePreviousClub(index, 'achievements', e.target.value)}
                                        pattern="[^0-9]*"
                                        title="Numbers are not allowed"
                                        className="w-full bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                {professionalCoachData.previousClubs.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removePreviousClub(index)}
                                        className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Remove Club
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Trophies & Achievements */}
                    <div className="mb-8 p-6 bg-theme-page-bg rounded-lg border-l-4 border-yellow-500">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-semibold text-theme-dark flex items-center">
                                <span className="text-2xl mr-3">🏆</span>
                                Trophies & Achievements
                            </h4>
                            <button
                                type="button"
                                onClick={addTrophy}
                                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                            >
                                + Add Trophy
                            </button>
                        </div>
                        {professionalCoachData.trophies.map((trophy, index) => (
                            <div key={index} className="bg-theme-secondary-bg p-4 rounded-lg mb-4 border border-theme-border">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Trophy Name"
                                        value={trophy.name}
                                        onChange={(e) => updateTrophy(index, 'name', e.target.value)}
                                        pattern="[A-Za-z\s'\-]+"
                                        title="Letters, spaces, apostrophes and hyphens only"
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Year"
                                        value={trophy.year}
                                        onChange={(e) => updateTrophy(index, 'year', e.target.value)}
                                        min="1950"
                                        max="2030"
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Club"
                                        value={trophy.club}
                                        onChange={(e) => updateTrophy(index, 'club', e.target.value)}
                                        pattern="[A-Za-z\s'\-]+"
                                        title="Letters, spaces, apostrophes and hyphens only"
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                    <select
                                        value={trophy.level}
                                        onChange={(e) => updateTrophy(index, 'level', e.target.value)}
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    >
                                        <option value="">Select Level</option>
                                        <option value="Professional">Professional</option>
                                        <option value="Youth">Youth</option>
                                        <option value="Amateur">Amateur</option>
                                        <option value="International">International</option>
                                        <option value="National">National</option>
                                        <option value="Regional">Regional</option>
                                    </select>
                                </div>
                                {professionalCoachData.trophies.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeTrophy(index)}
                                        className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Remove Trophy
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>



                    {/* Documents */}
                    <div className="mb-8 p-6 bg-theme-page-bg rounded-lg border-l-4 border-pink-500">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-xl font-semibold text-theme-dark flex items-center">
                                <span className="text-2xl mr-3">📄</span>
                                Documents
                            </h4>
                            <button
                                type="button"
                                onClick={addDocument}
                                className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors font-medium"
                            >
                                + Add Document
                            </button>
                        </div>
                        {professionalCoachData.documents.map((doc, index) => (
                            <div key={index} className="bg-theme-secondary-bg p-4 rounded-lg mb-4 border border-theme-border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <select
                                        value={doc.type}
                                        onChange={(e) => updateDocument(index, 'type', e.target.value)}
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    >
                                        <option value="">Document Type</option>
                                        <option value="CV">CV/Resume</option>
                                        <option value="License">Coaching License</option>
                                        <option value="Certificate">Certificate</option>
                                        <option value="ID">ID Document</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Reference">Reference Letter</option>
                                        <option value="Medical">Medical Certificate</option>
                                        <option value="Background Check">Background Check</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Document Name"
                                        value={doc.name}
                                        onChange={(e) => updateDocument(index, 'name', e.target.value)}
                                        pattern="[A-Za-z\s'\-]+"
                                        title="Letters, spaces, apostrophes and hyphens only"
                                        className="bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleDocumentUpload(index, file);
                                                }
                                            }}
                                            className="hidden"
                                            id={`document-upload-${index}`}
                                        />
                                        <label
                                            htmlFor={`document-upload-${index}`}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-lg py-2 px-3 text-theme-dark focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer flex items-center justify-center hover:bg-theme-secondary-bg transition-colors"
                                        >
                                            {documentPreviews[index] ? (
                                                <span className="text-sm text-green-600">
                                                    📄 {documentPreviews[index].length > 30 ? documentPreviews[index].substring(0, 30) + '...' : documentPreviews[index]}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-500">
                                                    📁 Upload Document
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                {professionalCoachData.documents.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeDocument(index)}
                                        className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Remove Document
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Contract Information */}
                    <div className="mb-8 p-6 bg-theme-page-bg rounded-lg border-l-4 border-teal-500">
                        <h4 className="text-xl font-semibold mb-6 text-theme-dark flex items-center">
                            <span className="text-2xl mr-3">📋</span>
                            Contract Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Contract Start Date</label>
                                <input
                                    type="date"
                                    name="contractStartDate"
                                    value={professionalCoachData.contractStartDate}
                                    onChange={handleProfessionalCoachInputChange}
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Contract End Date</label>
                                <input
                                    type="date"
                                    name="contractEndDate"
                                    value={professionalCoachData.contractEndDate}
                                    onChange={handleProfessionalCoachInputChange}
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">Annual Salary (Optional)</label>
                                <input
                                    type="number"
                                    name="salary"
                                    value={professionalCoachData.salary}
                                    onChange={handleProfessionalCoachInputChange}
                                    min="0"
                                    step="1"
                                    className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                                    placeholder="50000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-theme-primary to-theme-primary-dark text-theme-dark font-bold py-4 px-12 rounded-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center text-lg"
                        >
                            <span className="text-2xl mr-3">✨</span>
                            Create Professional Coach Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const uploadToCloudinary = async (file: File, uploadPreset: string): Promise<string> => {
        const url = `${(import.meta as any).env.VITE_CLOUDINARY_URL || 'https://api.cloudinary.com/v1_1/dmuilu78u/auto/upload'}`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        const res = await fetch(url, { method: 'POST', body: formData });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload failed: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        if (!data.secure_url) throw new Error('No secure_url returned from Cloudinary');
        return data.secure_url as string;
    };

    const addTransfer = async () => {
        const title = transferForm.title.trim();
        let imageUrl = transferForm.imageUrl.trim();
        if (!title) { toast.error('Please enter a transfer headline'); return; }

        try {
            if (transferImageFile) {
                const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowed.includes(transferImageFile.type)) { toast.error('Invalid image type. JPG, PNG or WEBP only.'); return; }
                if (transferImageFile.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }
                imageUrl = await uploadToCloudinary(transferImageFile, 'ml_default');
            } else {
                if (!/^https?:\/\//i.test(imageUrl)) { toast.error('Please upload an image or provide a valid image URL'); return; }
            }
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

            const transferData = {
                title,
                imageUrl,
                category: 'Transfer News',
                type: 'transfer',
                content: title,
                summary: title,
                createdAt: new Date().toISOString()
            };

            const created = await createNews(transferData, idToken);
            setTransfers(prev => [{ id: created._id, title: created.title, imageUrl: created.imageUrl, clubName: club.name, createdAt: created.createdAt }, ...prev]);
            setTransferForm({ title: '', imageUrl: '' });
            setTransferImageFile(null);
            setTransferImagePreview('');
            toast.success('Transfer news published to homepage');
        } catch (error: any) {
            console.error('Error saving transfer:', error);
            toast.error('Failed to save transfer: ' + (error.response?.data?.message || error.message));
        }
    };

    const removeTransfer = async (id: string) => {
        if (!confirm('Remove this transfer news item?')) return;
        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            if (!idToken) {
                toast.error('Authentication required');
                return;
            }

            await deleteNewsById(id, idToken);
            setTransfers(prev => prev.filter(t => t.id !== id));
            toast.success('Transfer removed successfully');
        } catch (error: any) {
            console.error('Error removing transfer:', error);
            toast.error('Failed to remove transfer');
        }
    };

    const renderManageTransfers = () => (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-theme-dark text-center">Manage Transfers</h2>
            <div className="max-w-3xl mx-auto bg-theme-secondary-bg p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-theme-dark mb-4">Add Transfer News</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-theme-text-secondary mb-1">Headline</label>
                        <input
                            type="text"
                            value={transferForm.title}
                            onChange={e => setTransferForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Club signs Striker from XYZ"
                            className="w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-theme-text-secondary mb-1">Image</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                setTransferImageFile(f);
                                if (f && f.type.startsWith('image/')) setTransferImagePreview(URL.createObjectURL(f)); else setTransferImagePreview('');
                            }}
                            className="w-full"
                        />
                        {!transferImageFile && (
                            <input
                                type="url"
                                value={transferForm.imageUrl}
                                onChange={e => setTransferForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                placeholder="or paste an image URL"
                                className="mt-2 w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                            />
                        )}
                        {transferImagePreview && (
                            <img src={transferImagePreview} alt="Preview" className="mt-2 h-16 w-full object-cover rounded" />
                        )}
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={addTransfer} className="bg-theme-primary text-theme-dark font-bold py-2 px-4 rounded-md">Publish</button>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-semibold text-theme-dark mb-3">Your Club Transfers</h3>
                {transfers.length === 0 ? (
                    <div className="bg-theme-secondary-bg p-6 rounded-lg text-center text-theme-text-secondary">No transfers yet. Add your first one above.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {transfers.map(t => (
                            <div key={t.id} className="bg-theme-secondary-bg rounded-lg overflow-hidden shadow">
                                <img src={t.imageUrl} alt={t.title} className="w-full h-40 object-cover" />
                                <div className="p-4">
                                    <h4 className="font-semibold text-theme-dark mb-1 line-clamp-2">{t.title}</h4>
                                    <p className="text-xs text-theme-text-secondary">{new Date(t.createdAt).toLocaleDateString()} • {t.clubName}</p>
                                    <div className="mt-3 flex justify-end">
                                        <button onClick={() => removeTransfer(t.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const addBestGoal = async () => {
        const title = bestGoalForm.title.trim();
        let imageUrl = bestGoalForm.imageUrl.trim();
        if (!title) { toast.error('Please enter a goal highlight title'); return; }

        try {
            if (bestGoalImageFile) {
                const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowed.includes(bestGoalImageFile.type)) { toast.error('Invalid image type. JPG, PNG or WEBP only.'); return; }
                if (bestGoalImageFile.size > 5 * 1024 * 1024) { toast.error('Image too large. Max 5MB.'); return; }
                imageUrl = await uploadToCloudinary(bestGoalImageFile, 'ml_default');
            } else {
                if (!/^https?:\/\//i.test(imageUrl)) { toast.error('Please upload an image or provide a valid image URL'); return; }
            }
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

            const bestGoalData = {
                title,
                imageUrl,
                category: 'Best Goals',
                type: 'best-goal',
                content: title,
                summary: title,
                createdAt: new Date().toISOString()
            };

            const created = await createNews(bestGoalData, idToken);
            setBestGoals(prev => [{ id: created._id, title: created.title, imageUrl: created.imageUrl, clubName: club.name, createdAt: created.createdAt }, ...prev]);
            setBestGoalForm({ title: '', imageUrl: '' });
            setBestGoalImageFile(null);
            setBestGoalImagePreview('');
            toast.success('Best goal added to homepage');
        } catch (error: any) {
            console.error('Error saving best goal:', error);
            toast.error('Failed to save goal: ' + (error.response?.data?.message || error.message));
        }
    };

    const removeBestGoal = async (id: string) => {
        if (!confirm('Remove this best goal item?')) return;
        try {
            const idToken = await user?.firebaseUser?.getIdToken();
            if (!idToken) {
                toast.error('Authentication required');
                return;
            }

            await deleteNewsById(id, idToken);
            setBestGoals(prev => prev.filter(g => g.id !== id));
            toast.success('Best goal removed successfully');
        } catch (error: any) {
            console.error('Error removing best goal:', error);
            toast.error('Failed to remove goal');
        }
    };

    const renderManageBestGoals = () => (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-theme-dark text-center">Manage Best Goals</h2>
            <div className="max-w-4xl mx-auto bg-theme-secondary-bg p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-theme-dark mb-4">Add Best Goal</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-theme-text-secondary mb-1">Title</label>
                        <input
                            type="text"
                            value={bestGoalForm.title}
                            onChange={e => setBestGoalForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Player v Opponent"
                            className="w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-theme-text-secondary mb-1">Image</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                setBestGoalImageFile(f);
                                if (f && f.type.startsWith('image/')) setBestGoalImagePreview(URL.createObjectURL(f)); else setBestGoalImagePreview('');
                            }}
                            className="w-full"
                        />
                        {!bestGoalImageFile && (
                            <input
                                type="url"
                                value={bestGoalForm.imageUrl}
                                onChange={e => setBestGoalForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                placeholder="or paste an image URL"
                                className="mt-2 w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                            />
                        )}
                        {bestGoalImagePreview && (
                            <img src={bestGoalImagePreview} alt="Preview" className="mt-2 h-16 w-full object-cover rounded" />
                        )}
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-theme-text-secondary">Tip: Use a public image link (JPG, PNG, WEBP).</p>
                    <button onClick={addBestGoal} className="bg-theme-primary text-theme-dark font-bold py-2 px-5 rounded-md">Publish</button>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-semibold text-theme-dark mb-3">Your Best Goals</h3>
                {bestGoals.length === 0 ? (
                    <div className="bg-theme-secondary-bg p-8 rounded-lg text-center text-theme-text-secondary">No goals yet. Add your first one above.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {bestGoals.map(g => (
                            <div key={g.id} className="bg-theme-secondary-bg rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow">
                                <div className="relative h-44">
                                    <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                                    <span className="absolute top-2 left-2 bg-theme-accent text-white text-xs font-bold px-2 py-1 rounded">New</span>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-semibold text-theme-dark mb-1 line-clamp-2">{g.title}</h4>
                                    <p className="text-xs text-theme-text-secondary">{new Date(g.createdAt).toLocaleDateString()} • {g.clubName}</p>
                                    <div className="mt-3 flex justify-end">
                                        <button onClick={() => removeBestGoal(g.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderManageNews = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-theme-dark">Manage Club News</h2>
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
                            <label htmlFor="newsImageUpload" className="block text-sm font-medium text-theme-text-secondary mb-1">Article Image *</label>
                            <div className="space-y-3">
                                <input
                                    type="file"
                                    id="newsImageUpload"
                                    accept=".jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleNewsImageUpload(file);
                                        }
                                    }}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="newsImageUpload"
                                    className="w-full bg-theme-page-bg border-2 border-dashed border-theme-border rounded-lg py-4 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary cursor-pointer flex items-center justify-center hover:bg-theme-secondary-bg transition-colors"
                                >
                                    {newsImagePreview ? (
                                        <div className="flex items-center gap-3">
                                            <img src={newsImagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                                            <div className="text-left">
                                                <span className="text-sm text-green-600 font-medium">Image uploaded</span>
                                                <p className="text-xs text-theme-text-secondary">Click to change</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <span className="text-2xl mb-2 block">📷</span>
                                            <span className="text-sm text-theme-text-secondary">Click to upload image</span>
                                            <p className="text-xs text-theme-text-secondary mt-1">JPG, PNG, WEBP (max 5MB)</p>
                                        </div>
                                    )}
                                </label>

                                {/* Fallback URL input */}
                                {!newsImageFile && (
                                    <div>
                                        <label htmlFor="newsImageUrl" className="block text-xs font-medium text-theme-text-secondary mb-1">Or paste image URL:</label>
                                        <input
                                            type="url"
                                            id="newsImageUrl"
                                            value={newsForm.imageUrl}
                                            onChange={e => setNewsForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                            className="w-full bg-theme-page-bg border border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary text-sm"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                )}
                            </div>
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
                        <p>Manage news articles for {club.name}. These articles will appear on the homepage.</p>
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

    const renderManagePlayers = () => (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-theme-dark text-center">Player Management</h2>

            {/* Player Registration Requests Section */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-semibold text-theme-dark flex items-center">
                        <span className="text-3xl mr-3">📋</span>
                        Player Registration Requests
                    </h3>
                    <div className="bg-theme-primary text-theme-dark px-4 py-2 rounded-lg font-semibold">
                        {pendingPlayers.length} Pending
                    </div>
                </div>

                {clubPendingPlayers.length === 0 ? (
                    <div className="bg-theme-secondary-bg p-8 rounded-xl text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h4 className="text-xl font-semibold text-theme-dark mb-2">No Pending Registrations</h4>
                        <p className="text-theme-text-secondary">All player registration requests for {club.name} have been processed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {clubPendingPlayers.map(player => (
                            <div key={player._id || player.id} className="bg-theme-secondary-bg p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        {player.imageUrl && (
                                            <img src={player.imageUrl} alt={player.name} className="w-16 h-16 rounded-full object-cover border-2 border-theme-border" />
                                        )}
                                        <div>
                                            <h4 className="text-xl font-semibold text-theme-dark">{player.name}</h4>
                                            <p className="text-theme-text-secondary font-medium">{player.position} • {player.nationality}</p>
                                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
                                                Pending Review
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                    <div>
                                        <span className="font-medium text-theme-text-secondary">Email:</span>
                                        <p className="text-theme-dark">{player.email}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-theme-text-secondary">Phone:</span>
                                        <p className="text-theme-dark">{player.phone}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-theme-text-secondary">Date of Birth:</span>
                                        <p className="text-theme-dark">{new Date(player.dob).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-theme-text-secondary">Previous Club:</span>
                                        <p className="text-theme-dark">{player.previousClub || 'Free Agent'}</p>
                                    </div>
                                </div>

                                {player.leaguesPlayed && player.leaguesPlayed.length > 0 && (
                                    <div className="mb-4">
                                        <span className="font-medium text-theme-text-secondary text-sm">Leagues Played:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {player.leaguesPlayed.map((league, index) => (
                                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                    {league}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {player.bio && (
                                    <div className="mb-4">
                                        <span className="font-medium text-theme-text-secondary text-sm">Biography:</span>
                                        <p className="text-theme-dark text-sm mt-1 bg-theme-page-bg p-3 rounded-lg">{player.bio}</p>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <span className="font-medium text-theme-text-secondary text-sm">Documents:</span>
                                    <div className="mt-2 space-y-2">
                                        {player.imageUrl && (
                                            <a href={player.imageUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-800 text-sm">
                                                📷 Player Photo
                                            </a>
                                        )}
                                        {player.identityCardUrl && (
                                            <a href={player.identityCardUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-800 text-sm">
                                                🆔 Identity Document
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs text-theme-text-secondary mb-4">
                                    Submitted: {new Date(player.submittedAt).toLocaleDateString()} at {new Date(player.submittedAt).toLocaleTimeString()}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApprovePlayer(player._id)}
                                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center"
                                    >
                                        <span className="mr-2">✅</span>
                                        Approve & Add to Squad
                                    </button>
                                    <button
                                        onClick={() => {
                                            const reason = prompt('Please provide a reason for rejection:');
                                            if (reason && reason.trim()) {
                                                handleRejectPlayer(player._id, reason);
                                            }
                                        }}
                                        className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center"
                                    >
                                        <span className="mr-2">❌</span>
                                        Reject Request
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Current Squad Management */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-semibold text-theme-dark flex items-center">
                        <span className="text-3xl mr-3">⚽</span>
                        Current Squad
                    </h3>
                    <div className="bg-theme-primary text-theme-dark px-4 py-2 rounded-lg font-semibold">
                        {approvedPlayers.length} Players
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {approvedPlayers.map(player => (
                        <div key={player.id} className="bg-theme-secondary-bg p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <img src={player.imageUrl} alt={player.name} className="w-16 h-16 rounded-full object-cover border-2 border-theme-border" />
                                <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-theme-dark">{player.name}</h4>
                                    <p className="text-theme-text-secondary">{player.position}</p>
                                    <p className="text-sm text-theme-text-secondary">{player.nationality}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${player.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        Verified
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <span className="font-medium text-theme-text-secondary">Email:</span>
                                    <p className="text-theme-dark truncate">{player.email}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-theme-text-secondary">Phone:</span>
                                    <p className="text-theme-dark">{player.phone}</p>
                                </div>
                            </div>

                            {player.stats && (
                                <div className="bg-theme-page-bg p-3 rounded-lg mb-4">
                                    <h5 className="font-medium text-theme-dark mb-2">Season Stats</h5>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="text-center">
                                            <div className="font-semibold text-theme-dark">{player.stats.matches}</div>
                                            <div className="text-theme-text-secondary">Matches</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-theme-dark">{player.stats.goals}</div>
                                            <div className="text-theme-text-secondary">Goals</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-theme-dark">{player.stats.assists}</div>
                                            <div className="text-theme-text-secondary">Assists</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditClick(player)}
                                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Remove this player from the squad?')) return;
                                        try {
                                            const response = await playerService.remove(player._id || player.id);
                                            if (response.success) {
                                                await fetchApprovedPlayers();
                                                alert('Player removed');
                                            } else {
                                                alert(response.message || 'Failed to remove player');
                                            }
                                        } catch (e) {
                                            alert('Error removing player');
                                        }
                                    }}
                                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}

                    {approvedPlayers.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="text-6xl mb-4">⚽</div>
                            <h4 className="text-xl font-semibold text-theme-dark mb-2">No Players in Squad</h4>
                            <p className="text-theme-text-secondary">Approve player registration requests to build your squad.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderPlayerScouting = () => (
        <div>
            <h2 className="text-3xl font-bold mb-4 text-theme-dark text-center">Player Scouting</h2>
            <p className="mb-8 text-theme-text-secondary text-center max-w-2xl mx-auto">
                Discover new talent for your squad. These players have registered without a preferred club and are available for scouting.
            </p>

            {generalPoolPlayers.length === 0 ? (
                <div className="text-center py-12 bg-theme-secondary-bg rounded-xl border-2 border-dashed border-theme-border">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-theme-dark mb-2">No Candidates Found</h3>
                    <p className="text-theme-text-secondary">Check back later for new talent registrations.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generalPoolPlayers.map(player => (
                        <div key={player._id || player.id} className="bg-theme-secondary-bg rounded-xl shadow-lg border-t-4 border-theme-primary overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <img
                                        src={player.imageUrl || (import.meta as any).env.VITE_PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/150'}
                                        alt={player.name}
                                        className="h-16 w-16 rounded-full object-cover border-2 border-theme-primary"
                                    />
                                    <div>
                                        <h3 className="font-bold text-theme-dark text-lg">{player.name}</h3>
                                        <p className="text-sm text-theme-text-secondary">{player.position} • {player.nationality}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Previous Club:</span>
                                        <span className="font-medium text-theme-dark-accent">{player.previousClub || 'Free Agent'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Age:</span>
                                        <span className="font-medium text-theme-dark-accent">
                                            {player.dob ? (
                                                Math.floor((new Date().getTime() - new Date(player.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                                            ) : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            // Reuse existing edit (viewing) modal logic if possible or just show toast for now
                                            handleEditClick(player);
                                        }}
                                        className="bg-theme-secondary-bg border border-theme-border text-theme-dark py-2 rounded-md font-medium hover:bg-theme-border transition-colors text-sm"
                                    >
                                        View Profile
                                    </button>
                                    <button
                                        onClick={() => handleApprovePlayer(player._id || player.id)}
                                        className="bg-theme-primary text-theme-dark py-2 rounded-md font-medium hover:opacity-90 transition-opacity text-sm"
                                    >
                                        Scout Player
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSection = () => {
        switch (activeSection) {
            case 'Dashboard':
                return <>
                    <h2 className="text-3xl font-bold mb-6 text-theme-dark">Club Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                            <h3 className="text-4xl font-bold text-theme-primary">{clubPlayers.length}</h3>
                            <p className="text-theme-text-secondary mt-2">Total Players</p>
                        </div>
                        <div className="bg-theme-secondary-bg p-6 rounded-lg shadow-lg text-center">
                            <h3 className="text-4xl font-bold text-theme-primary">{clubVideos.length}</h3>
                            <p className="text-theme-text-secondary mt-2">Total Videos</p>
                        </div>
                    </div>
                </>;
            case 'Manage Players':
                return renderManagePlayers();
            case 'Player Scouting':
                return renderPlayerScouting();
            case 'Direct Recruitment':
                return renderDirectRecruitment();
            case 'Manage Coaches':
                return renderManageCoaches();
            case 'Manage Transfers':
                return renderManageTransfers();
            case 'Manage Best Goals':
                return renderManageBestGoals();
            case 'Manage News':
                return renderManageNews();
            case 'Profile':
                return (
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-8 text-theme-dark text-center">Manager Profile</h2>

                        <div className="bg-theme-secondary-bg p-8 rounded-xl shadow-lg">
                            {!isEditingProfile ? (
                                // View Mode
                                <div className="text-center">
                                    <div className="mb-6">
                                        <img
                                            src={profilePicPreview || profileData.profilePicture}
                                            alt="Profile"
                                            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-theme-primary shadow-lg"
                                        />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-theme-dark mb-2">{profileData.name}</h3>
                                    <p className="text-theme-text-secondary mb-6">Club Manager - {club.name}</p>

                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="bg-theme-primary text-theme-dark px-6 py-3 rounded-lg hover:bg-theme-primary-dark transition-colors font-semibold"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            ) : (
                                // Edit Mode
                                <div>
                                    <h3 className="text-xl font-semibold text-theme-dark mb-6 text-center">Edit Profile</h3>

                                    {/* Profile Picture Upload */}
                                    <div className="mb-6 text-center">
                                        <div className="mb-4">
                                            <img
                                                src={profilePicPreview || profileData.profilePicture}
                                                alt="Profile Preview"
                                                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-theme-primary shadow-lg"
                                            />
                                        </div>

                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    handleProfilePictureUpload(file);
                                                }
                                            }}
                                            className="hidden"
                                            id="profile-picture-upload"
                                        />
                                        <label
                                            htmlFor="profile-picture-upload"
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                                        >
                                            📷 Change Photo
                                        </label>
                                    </div>

                                    {/* Name Input */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-theme-text-secondary mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-theme-page-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all"
                                            placeholder="Enter your name"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={handleProfileSave}
                                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={handleProfileCancel}
                                            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const InputField = ({ label, name, type = 'text', value, onChange, required = false }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-theme-text-secondary">{label}</label>
            <input type={type} name={name} id={name} value={value} onChange={onChange} required={required} className="mt-1 block w-full bg-theme-page-bg border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" />
        </div>
    );

    const InputFieldUncontrolled = ({ label, name, type = 'text', placeholder = '', required = false }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-theme-text-secondary">{label}</label>
            <input type={type} name={name} id={name} placeholder={placeholder} required={required} className="mt-1 block w-full bg-theme-page-bg border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" />
        </div>
    );

    const sections: ManagerSection[] = ['Dashboard', 'Manage Players', 'Player Scouting', 'Direct Recruitment', 'Manage Coaches', 'Manage Transfers', 'Manage Best Goals', 'Manage News', 'Profile'];

    return (
        <div className="flex min-h-screen bg-theme-light">
            <aside className="w-72 bg-theme-light text-theme-dark flex-col hidden lg:flex">
                <div className="h-20 flex items-center gap-4 px-6 border-b border-theme-border">
                    <img src={club.logo} alt={club.name} className="h-10 w-10" />
                    <span className="font-bold text-xl">{club.name}</span>
                </div>
                <nav className="flex-grow">
                    <ul className="space-y-2 p-4">
                        {sections.map(section => (
                            <li key={section}>
                                <button
                                    onClick={() => setActiveSection(section)}
                                    className={`w-full text-left px-4 py-3 rounded-md transition-colors text-lg ${activeSection === section ? 'bg-theme-primary text-theme-dark' : 'hover:bg-theme-secondary-bg'}`}
                                >
                                    {section}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 p-6 md:p-8">
                {/* Mobile section selector */}
                <div className="lg:hidden mb-4">
                    <label className="block text-sm font-medium text-theme-text-secondary mb-1">Section</label>
                    <select
                        value={activeSection}
                        onChange={e => setActiveSection(e.target.value as any)}
                        className="w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                    >
                        {sections.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg min-h-full">
                    {renderSection()}
                </div>
            </main>
            {renderEditPlayerModal()}
        </div>
    );
};

export default ClubManagerDashboard;

