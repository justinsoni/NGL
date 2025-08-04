import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MATCHES } from '../constants';
import SectionHeader from '../components/SectionHeader';
import { Match } from '../types';

const TicketCard: React.FC<{ match: Match; onBook: (match: Match) => void }> = ({ match, onBook }) => (
    <div className="bg-theme-page-bg rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
            <img src={match.homeLogo} alt={match.homeTeam} className="h-10 w-10"/>
            <span className="mx-4 font-bold">vs</span>
            <img src={match.awayLogo} alt={match.awayTeam} className="h-10 w-10"/>
        </div>
        <div className="text-center sm:text-left">
            <p className="font-bold">{match.homeTeam} vs {match.awayTeam}</p>
            <p className="text-sm text-theme-text-secondary">{match.date} - {match.kickoff}</p>
        </div>
        <button onClick={() => onBook(match)} className="mt-4 sm:mt-0 bg-theme-primary hover:bg-theme-primary-dark text-theme-dark font-bold py-2 px-6 rounded-lg transition-transform duration-300 hover:scale-105">
            Book Tickets
        </button>
    </div>
);


const TicketsPage: React.FC = () => {
  const { matchId } = useParams();
  const initialMatch = matchId ? MATCHES.find(m => m.id === Number(matchId)) : null;

  const [selectedMatch, setSelectedMatch] = useState<Match | null | undefined>(initialMatch);
  const [ticketType, setTicketType] = useState('Standard');
  const [quantity, setQuantity] = useState(1);
  const [isBooked, setIsBooked] = useState(false);

  const handleBookNow = (match: Match) => {
    setSelectedMatch(match);
    setIsBooked(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to a backend.
    console.log(`Booking ${quantity} ${ticketType} ticket(s) for match ${selectedMatch?.id}`);
    setIsBooked(true);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <SectionHeader title="Match Tickets" subtitle="Secure your seat at the stadium" />

        {selectedMatch && (
          <div className="mb-12 bg-theme-page-bg p-6 md:p-8 rounded-lg shadow-xl">
             <h3 className="text-2xl font-bold text-theme-dark mb-4">Book for: {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</h3>
             {isBooked ? (
                <div className="text-center p-8 bg-theme-accent/10 border-theme-accent border-2 rounded-lg">
                    <h4 className="text-2xl font-bold text-theme-accent">Booking Confirmed!</h4>
                    <p className="text-green-200/80 mt-2">Your tickets have been secured. A confirmation email has been sent.</p>
                    <button onClick={() => setSelectedMatch(null)} className="mt-6 bg-theme-secondary-bg hover:bg-opacity-80 text-theme-dark font-bold py-2 px-6 rounded-lg">
                        Book Another Match
                    </button>
                </div>
             ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="ticket-type" className="block text-sm font-medium text-theme-text-secondary">Ticket Type</label>
                        <select id="ticket-type" value={ticketType} onChange={(e) => setTicketType(e.target.value)} className="mt-1 block w-full p-2 bg-theme-secondary-bg border border-theme-border rounded-md shadow-sm focus:ring-theme-primary focus:border-theme-primary">
                            <option>Standard</option>
                            <option>VIP</option>
                            <option>Hospitality</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-theme-text-secondary">Quantity</label>
                        <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))} min="1" max="10" className="mt-1 block w-full p-2 bg-theme-secondary-bg border border-theme-border rounded-md shadow-sm focus:ring-theme-primary focus:border-theme-primary"/>
                    </div>
                    <div className="text-right">
                         <button type="submit" className="bg-theme-primary hover:bg-theme-primary-dark text-theme-dark font-bold py-3 px-8 rounded-lg transition-transform duration-300 hover:scale-105">
                            Confirm Booking
                        </button>
                    </div>
                </form>
             )}
          </div>
        )}

        <div className="space-y-6">
            <h3 className="text-xl font-bold text-theme-dark border-b-2 border-theme-border pb-2">Upcoming Matches</h3>
            {MATCHES.filter(m => m.status === 'upcoming').map(match => (
                <TicketCard key={match.id} match={match} onBook={handleBookNow} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default TicketsPage;