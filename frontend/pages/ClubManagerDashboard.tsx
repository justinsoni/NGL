

import React, { useState, useEffect } from 'react';
import { Club, Player, ClubVideo, Position, CreatedUser, PlayerRegistration, UserRole } from '../types';
import { POSITIONS, CLUBS, LEAGUES } from '../constants';
import { EmailService } from '../utils/emailService';

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

type ManagerSection = 'Dashboard' | 'Manage Players' | 'Manage Coaches' | 'Manage Videos' | 'Player Registrations';

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
    onRejectPlayerRegistration
}) => {
    const [activeSection, setActiveSection] = useState<ManagerSection>('Manage Players');
    
    // Coach management
    const [newCoachEmail, setNewCoachEmail] = useState('');
    const [lastCreatedCoach, setLastCreatedCoach] = useState<CreatedUser | null>(null);
    
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

    const clubPlayers = players.filter(p => p.club === club.name);
    const clubCoaches = coaches.filter(c => c.clubId === club.id && c.role === 'coach');
    const pendingRegistrations = playerRegistrations.filter(r => r.clubId === club.id && r.status === 'pending');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateCoach = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if coach email already exists
        const existingCoach = coaches.find((c: CreatedUser) => c.email === newCoachEmail && c.isActive);
        if (existingCoach) {
            alert('A coach with this email already exists.');
            return;
        }

        const newCoach: Omit<CreatedUser, 'password' | 'id'> = {
            email: newCoachEmail,
            role: 'coach' as UserRole,
            clubId: club.id,
            clubName: club.name,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        const createdCoach = onCreateCoach(newCoach);

        // Send email notification to the new coach
        try {
            await EmailService.sendCoachCredentials(
                createdCoach.email,
                createdCoach.password,
                club.name,
                'Club Manager'
            );
            alert(`Coach account created successfully! Login credentials have been sent to ${createdCoach.email}`);
        } catch (error) {
            console.error('Failed to send email:', error);
            alert(`Coach account created successfully! Please provide these credentials manually:\nEmail: ${createdCoach.email}\nPassword: ${createdCoach.password}`);
        }

        setLastCreatedCoach(createdCoach);
        setNewCoachEmail('');
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



    const renderManageCoaches = () => (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-theme-dark">Manage Coaches</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-theme-dark">Add New Coach</h3>
                    <form onSubmit={handleCreateCoach} className="space-y-4 bg-theme-secondary-bg p-4 rounded-lg">
                        <div>
                            <label htmlFor="coachEmail" className="block text-sm font-medium text-theme-text-secondary">Coach Email</label>
                            <input
                                type="email"
                                id="coachEmail"
                                value={newCoachEmail}
                                onChange={e => setNewCoachEmail(e.target.value)}
                                required
                                className="mt-1 block w-full bg-theme-page-bg border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary"
                            />
                        </div>
                        <button type="submit" className="w-full bg-theme-primary text-theme-dark font-bold py-2 px-4 rounded-md hover:bg-theme-primary-dark transition-colors">
                            Create Coach Account
                        </button>
                    </form>

                    {lastCreatedCoach && (
                        <div className="mt-6 bg-theme-accent/10 border-l-4 border-theme-accent text-theme-accent p-4 rounded-lg">
                            <h4 className="font-bold">Coach Account Created!</h4>
                            <p className="text-sm mt-1">Credentials sent to:</p>
                            <p className="text-sm font-semibold">{lastCreatedCoach.email}</p>
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-theme-dark">Current Coaches</h3>
                    <div className="space-y-3">
                        {clubCoaches.map(coach => (
                            <div key={coach.id} className="bg-theme-secondary-bg p-3 rounded-lg">
                                <p className="font-semibold text-theme-dark">{coach.email}</p>
                                <p className="text-sm text-theme-text-secondary">
                                    Created: {new Date(coach.createdAt).toLocaleDateString()}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded ${coach.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {coach.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        ))}
                        {clubCoaches.length === 0 && (
                            <p className="text-theme-text-secondary">No coaches assigned to this club yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderManagePlayers = () => (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-theme-dark">Manage Players</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h3 className="text-xl font-semibold mb-3 text-theme-dark">{editingPlayer ? 'Edit Player' : 'Register New Player'}</h3>
                    <form onSubmit={handlePlayerFormSubmit} className="space-y-4 bg-theme-secondary-bg p-4 rounded-lg shadow-md">
                        <InputField label="Player Name" name="name" value={formData.name} onChange={handleInputChange} required />
                        <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                        <InputField label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                        <InputField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleInputChange} required />
                        
                        <div>
                            <label htmlFor="position" className="block text-sm font-medium text-theme-text-secondary">Position</label>
                            <select name="position" id="position" value={formData.position} onChange={handleInputChange} className="mt-1 block w-full bg-theme-page-bg border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary">
                                {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                            </select>
                        </div>
                        
                        <InputField label="Nationality" name="nationality" value={formData.nationality} onChange={handleInputChange} required />
                        <InputField label="Previous Club" name="previousClub" value={formData.previousClub} onChange={handleInputChange} />
                        <InputField label="Player Photo URL" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
                        <InputField label="Identity Card/Document URL *" name="identityCardUrl" value={formData.identityCardUrl} onChange={handleInputChange} required />
                        
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-theme-text-secondary">Biography</label>
                            <textarea name="bio" id="bio" value={formData.bio} onChange={handleInputChange} rows={3} className="mt-1 block w-full bg-theme-page-bg border-theme-border rounded-md shadow-sm py-2 px-3 text-theme-dark focus:outline-none focus:ring-theme-primary focus:border-theme-primary" />
                        </div>
                        
                        <button type="submit" className="w-full bg-theme-primary text-theme-dark font-bold py-2 px-4 rounded-md hover:bg-theme-primary-dark transition-colors">
                            {editingPlayer ? 'Update Player' : 'Register Player'}
                        </button>
                    </form>
                </div>
                
                {/* Players List */}
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-3 text-theme-dark">Club Players</h3>
                    <div className="space-y-3">
                        {clubPlayers.map(player => (
                            <div key={player.id} className="bg-theme-secondary-bg p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img src={player.imageUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <h4 className="font-semibold text-theme-dark">{player.name}</h4>
                                        <p className="text-sm text-theme-text-secondary">{player.position} • {player.nationality}</p>
                                        <span className={`text-xs px-2 py-1 rounded ${player.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {player.isVerified ? 'Verified' : 'Pending Verification'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingPlayer(player)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                    <button onClick={() => onDeletePlayer(player.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
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
            case 'Manage Videos':
                return <>
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">Manage Videos</h2>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <h3 className="text-xl font-semibold mb-3 text-theme-dark">Add New Video</h3>
                            <form onSubmit={handleAddVideo} className="space-y-4 bg-theme-secondary-bg p-4 rounded-lg shadow-md">
                                <InputFieldUncontrolled label="Video Title" name="title" required />
                                <InputFieldUncontrolled label="YouTube URL" name="url" required />
                                <InputFieldUncontrolled label="Thumbnail URL (Optional)" name="thumbnail" />
                                <button type="submit" className="w-full bg-theme-primary text-theme-dark font-bold py-2 px-4 rounded-md hover:bg-theme-primary-dark transition-colors">Add Video</button>
                            </form>
                        </div>
                        <div className="lg:col-span-2">
                             <h3 className="text-xl font-semibold mb-3 text-theme-dark">Current Videos</h3>
                             <div className="bg-theme-secondary-bg p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto shadow-md">
                                {clubVideos.map(v => (
                                    <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="block bg-theme-page-bg p-2 rounded-md group">
                                        <img src={v.thumbnail} alt={v.title} className="w-full h-32 object-cover rounded-md mb-2"/>
                                        <p className="font-semibold text-theme-dark group-hover:text-theme-primary">{v.title}</p>
                                    </a>
                                ))}
                             </div>
                        </div>
                    </div>
                </>;
            case 'Player Registrations':
                return <div>
                    <h2 className="text-2xl font-bold mb-4 text-theme-dark">Player Registrations</h2>
                    <div className="space-y-4">
                        {pendingRegistrations.length === 0 ? (
                            <p className="text-theme-text-secondary">No pending player registrations for your club.</p>
                        ) : (
                            pendingRegistrations.map(registration => (
                                <div key={registration.id} className="bg-theme-secondary-bg p-4 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-theme-dark">{registration.name}</h3>
                                            <p className="text-theme-text-secondary">{registration.position} • {registration.nationality}</p>
                                            <p className="text-sm text-theme-text-secondary">Email: {registration.email}</p>
                                            <p className="text-sm text-theme-text-secondary">Phone: {registration.phone}</p>
                                            <p className="text-sm text-theme-text-secondary">Previous Club: {registration.previousClub || 'N/A'}</p>
                                            <p className="text-sm text-theme-text-secondary">Submitted: {new Date(registration.submittedAt).toLocaleDateString()}</p>
                                            {registration.bio && (
                                                <p className="text-sm text-theme-text-secondary mt-2">Bio: {registration.bio}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onApprovePlayerRegistration(registration.id)}
                                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt('Reason for rejection:');
                                                    if (reason) onRejectPlayerRegistration(registration.id, reason);
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>;
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

    const sections: ManagerSection[] = ['Dashboard', 'Manage Players', 'Manage Coaches', 'Manage Videos', 'Player Registrations'];

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
                <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg min-h-full">
                    {renderSection()}
                </div>
            </main>
        </div>
    );
};

export default ClubManagerDashboard;

