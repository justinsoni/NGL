import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Club, Player, ClubVideo, Position, CreatedUser, PlayerRegistration, UserRole } from '../types';
import { POSITIONS, CLUBS, LEAGUES } from '../constants';
import { EmailService } from '../utils/emailService';
import { useAuth } from '../contexts/AuthContext';
import { coachService, CreateCoachData } from '../services/coachService';
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
}

type ManagerSection = 'Dashboard' | 'Manage Players' | 'Manage Coaches' | 'Manage Transfers' | 'Manage Best Goals' | 'Manage News' | 'Profile';

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
        name: '', email: '', phone: '', dob: '',
        position: POSITIONS[0], nationality: '',
        previousClub: 'Free Agent', leaguesPlayed: [] as string[],
        imageUrl: '', identityCardUrl: '', bio: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [clubVideos, setClubVideos] = useState<ClubVideo[]>([]);
    const [uploadedDocuments, setUploadedDocuments] = useState<{[key: number]: File}>({});
    const [documentPreviews, setDocumentPreviews] = useState<{[key: number]: string}>({});
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

    // Profile management state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name || 'Club Manager',
        profilePicture: 'https://via.placeholder.com/150'
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
            // Prefer club name to avoid ObjectId casting issues in backend
            const response = await playerService.getPendingPlayers(undefined, club.name);
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

    const fetchApprovedPlayers = async () => {
        try {
            const response = await playerService.getApprovedPlayers(undefined, club.name);
            if (response.success) {
                const normalized = (response.data as any[]).map((p: any, index: number) => ({
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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };



    // Professional Coach Form Handlers
    const handleProfessionalCoachInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Field-level sanitization
        if (name === 'name') {
            const sanitized = value.replace(/[^A-Za-z\s'\-]/g, '');
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
        const fakeUrl = `https://uploads.ngl.com/documents/${Date.now()}-${file.name}`;
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
        const fakeUrl = `https://uploads.ngl.com/photos/${Date.now()}-${file.name}`;
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
        const fakeUrl = `https://uploads.ngl.com/profiles/${Date.now()}-${file.name}`;
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
        const fakeUrl = `https://uploads.ngl.com/news/${Date.now()}-${file.name}`;
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
            profilePicture: 'https://via.placeholder.com/150'
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

    const handlePlayerFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!formData.identityCardUrl) {
            alert('Player identity card/document is required for verification.');
            return;
        }

        if (editingPlayer) {
            const updatedPlayer: Player = {
                ...editingPlayer,
                ...formData,
                imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.name}/400/400`,
            };
            onEditPlayer(updatedPlayer);
        } else {
            const newPlayer = {
                ...formData,
                flag: '🏳️',
                club: club.name,
                clubLogo: club.logo,
                imageUrl: formData.imageUrl || `https://picsum.photos/seed/${formData.name}/400/400`,
                bio: formData.bio || 'A promising new signing.',
                stats: { matches: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
            };
            onAddPlayer(newPlayer);
        }
        setEditingPlayer(null);
    };

    const handleEditClick = (player: Player) => setEditingPlayer(player);
    const handleCancelEdit = () => setEditingPlayer(null);

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
            thumbnail: formData.get('thumbnail') as string || `https://picsum.photos/seed/${formData.get('title')}/400`,
        };
        setClubVideos(prev => [...prev, newVideo]);
        e.currentTarget.reset();
    };


    const handleApprovePlayer = async (playerId: number) => {
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

    const handleRejectPlayer = async (playerId: number, reason: string) => {
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
                                        pattern="[A-Za-z][A-Za-z\s'\-]*"
                                        title="Letters, spaces, apostrophes and hyphens only"
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
                                        min={(d => { const t=new Date(); const m=new Date(t.getFullYear()-75,t.getMonth(),t.getDate()); return new Date(m.getTime()-m.getTimezoneOffset()*60000).toISOString().split('T')[0]; })()}
                                        max={(d => { const t=new Date(); const m=new Date(t.getFullYear()-18,t.getMonth(),t.getDate()); return new Date(m.getTime()-m.getTimezoneOffset()*60000).toISOString().split('T')[0]; })()}
                                        className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-text-secondary mb-2">Nationality</label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        value={professionalCoachData.nationality}
                                        onChange={handleProfessionalCoachInputChange}
                                        pattern="[A-Za-z\s]+"
                                        title="Letters and spaces only"
                                        className="w-full bg-theme-secondary-bg border-2 border-theme-border rounded-lg py-3 px-4 text-theme-dark focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="American"
                                    />
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
                            onChange={e=>setTransferForm(prev=>({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Club signs Striker from XYZ"
                            className="w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-theme-text-secondary mb-1">Image</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e)=>{
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
                                onChange={e=>setTransferForm(prev=>({ ...prev, imageUrl: e.target.value }))}
                                placeholder="or paste an image URL"
                                className="mt-2 w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                            />
                        )}
                        {transferImagePreview && (
                            <img src={transferImagePreview} alt="Preview" className="mt-2 h-16 w-full object-cover rounded"/>
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
                                        <button onClick={()=>removeTransfer(t.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
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
                            onChange={e=>setBestGoalForm(prev=>({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Player v Opponent"
                            className="w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-theme-text-secondary mb-1">Image</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e)=>{
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
                                onChange={e=>setBestGoalForm(prev=>({ ...prev, imageUrl: e.target.value }))}
                                placeholder="or paste an image URL"
                                className="mt-2 w-full bg-theme-page-bg border border-theme-border rounded-md py-2 px-3"
                            />
                        )}
                        {bestGoalImagePreview && (
                            <img src={bestGoalImagePreview} alt="Preview" className="mt-2 h-16 w-full object-cover rounded"/>
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
                                        <button onClick={()=>removeBestGoal(g.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
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

                {pendingPlayers.length === 0 ? (
                    <div className="bg-theme-secondary-bg p-8 rounded-xl text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h4 className="text-xl font-semibold text-theme-dark mb-2">No Pending Registrations</h4>
                        <p className="text-theme-text-secondary">All player registration requests have been processed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingPlayers.map(player => (
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
                                    onClick={async () => {
                                        // Simple inline edit: toggle name/position prompt; in real UI use the existing edit form
                                        const newName = prompt('Update player name:', player.name);
                                        if (!newName || newName.trim() === player.name) return;
                                        try {
                                            const response = await playerService.update(player.id, { name: newName.trim() } as any);
                                            if (response.success) {
                                                await fetchApprovedPlayers();
                                                alert('Player updated');
                                            } else {
                                                alert(response.message || 'Failed to update player');
                                            }
                                        } catch (e) {
                                            alert('Error updating player');
                                        }
                                    }}
                                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Remove this player from the squad?')) return;
                                        try {
                                            const response = await playerService.remove(player.id);
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

    const renderSection = () => {
        switch(activeSection) {
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

    const sections: ManagerSection[] = ['Dashboard', 'Manage Players', 'Manage Coaches', 'Manage Transfers', 'Manage Best Goals', 'Manage News', 'Profile'];

    return (
        <div className="flex min-h-screen bg-theme-light">
            <aside className="w-72 bg-theme-light text-theme-dark flex-col hidden lg:flex">
                <div className="h-20 flex items-center gap-4 px-6 border-b border-theme-border">
                    <img src={club.logo} alt={club.name} className="h-10 w-10"/>
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
                        onChange={e=>setActiveSection(e.target.value as any)}
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
        </div>
    );
};

export default ClubManagerDashboard;

