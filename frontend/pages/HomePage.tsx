



import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NEWS } from '../constants';
import { LeagueLogoIcon } from '../components/icons';
import { TableEntry, Match, GroupName, LeaderStat, Player } from '../types';
import RoadToFinal from '../components/RoadToFinal';
import MatchTicker from '../components/MatchTicker';
import NewsFeed from '../components/NewsFeed';
import MediaHighlights from '../components/MediaHighlights';
import SectionHeader from '../components/SectionHeader';
import { GROUPS } from '../constants';

// Import local images from assets
import image103 from '@/src/assets/images/103.jpg';
import footballStadium from '@/src/assets/images/football_stadium_2-wallpaper-2560x1024.jpg';
import pexelsImage from '@/src/assets/images/pexels-pixabay-274422.jpg';

interface HomePageProps {
  matchesData: Match[];
  tableData: Record<GroupName, TableEntry[]>;
  competitionStage: 'Group Stage' | 'Semi-Finals' | 'Final' | 'Finished';
  leaderStats: LeaderStat[];
  onPlayerSelect: (playerId: number) => void;
}

const heroImages = [
    // Using local images from assets folder
    image103,
    footballStadium,
    pexelsImage
];

const HeroSection = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const slideshowInterval = setInterval(() => {
            setCurrentImageIndex(prevIndex => (prevIndex + 1) % heroImages.length);
        }, 3000);

        return () => clearInterval(slideshowInterval);
    }, []);

    return (
       <section className="relative h-[80vh] text-theme-dark overflow-hidden">
            <div className="absolute inset-0">
                {heroImages.map((src, index) => (
                    <div
                        key={index}
                        className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                        style={{
                            backgroundImage: `url(${src})`,
                            opacity: index === currentImageIndex ? 1 : 0
                        }}
                    ></div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-theme-primary/80 via-theme-primary-dark/40 to-transparent"></div>
            </div>
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-4">
                <div className="opacity-0 animate-fadeInUp">
                    <LeagueLogoIcon className="h-24 w-24 text-theme-dark mx-auto mb-4" />
                </div>
                <div className="overflow-hidden">
                    <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tight drop-shadow-2xl opacity-0 animate-fadeInUp animation-delay-200">
                        The Heart of Football
                    </h1>
                </div>
                <div className="overflow-hidden">
                    <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-lg opacity-0 animate-fadeInUp animation-delay-400">
                        All the fixtures, results, and stories from the NGL. Welcome to the official home of the league.
                    </p>
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-4 opacity-0 animate-fadeInUp animation-delay-600">
                    <Link to="/matches" className="bg-theme-primary hover:bg-theme-primary-dark text-theme-dark font-bold py-3 px-8 rounded-lg transition-transform duration-300 hover:scale-105 shadow-lg">
                        View Fixtures
                    </Link>
                    <Link to="/table" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-theme-dark font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg">
                        League Table
                    </Link>
                </div>
            </div>
        </section>
    );
};

const GroupStandingsCard: React.FC<{groupName: GroupName, tableData: TableEntry[]}> = ({ groupName, tableData}) => (
    <div className="bg-theme-page-bg rounded-lg shadow-lg overflow-hidden">
        <h3 className="text-xl font-bold bg-gradient-to-r from-theme-primary to-theme-accent text-white p-3 text-center">Group {groupName}</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-theme-secondary-bg uppercase text-xs text-theme-text-secondary">
                    <tr>
                        <th colSpan={2} className="py-2 px-2 text-left">Club</th>
                        <th className="py-2 px-2 text-center">Pl</th>
                        <th className="py-2 px-2 text-center">GD</th>
                        <th className="py-2 px-2 text-center font-bold">Pts</th>
                    </tr>
                </thead>
                <tbody className="text-theme-dark">
                    {tableData.map((team, index) => (
                        <tr key={team.id} className={`border-t border-theme-border ${index % 2 === 0 ? 'bg-theme-page-bg' : 'bg-theme-secondary-bg'}`}>
                            <td className="py-2 px-2 whitespace-nowrap font-semibold">{team.pos}</td>
                            <td className="py-2 px-2">
                                <Link to={`/clubs/${team.id}`} className="flex items-center hover:opacity-80">
                                    <img src={team.logo} alt={`${team.club} logo`} className="w-5 h-5 mr-2" />
                                    <span className="font-bold text-xs sm:text-sm">{team.club}</span>
                                </Link>
                            </td>
                            <td className="py-2 px-2 text-center">{team.p}</td>
                            <td className="py-2 px-2 text-center">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                            <td className="py-2 px-2 text-center font-bold">{team.pts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const HomePage: React.FC<HomePageProps> = ({ matchesData, tableData, competitionStage, leaderStats, onPlayerSelect }) => {
  const [activeStat, setActiveStat] = useState<string>(leaderStats.length > 0 ? leaderStats[0].statUnit : '');
  const activeLeaderStat = leaderStats.find(stat => stat.statUnit === activeStat);

  const trendingNowData = [
    { id: 1, title: 'Best of Madueke 24/25', imageUrl: 'https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', icon: '🔥' },
    { id: 2, title: 'Isak is electric', imageUrl: 'https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', icon: '⚡️' },
    { id: 3, title: "Gibbs-White's showreel", imageUrl: 'https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', icon: '✨' },
    { id: 4, title: 'Mbeumo: All goals 24/25', imageUrl: 'https://images.pexels.com/photos/6688537/pexels-photo-6688537.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', icon: '⚽️' },
    { id: 5, title: 'Palhinha goals and tackles', imageUrl: 'https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', icon: '💪' },
    { id: 6, title: 'Ramsdale wonder saves', imageUrl: 'https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', icon: '🧤' },
    { id: 7, title: "Trafford's top stops", imageUrl: 'https://images.pexels.com/photos/1429536/pexels-photo-1429536.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', icon: '🟣' },
    { id: 8, title: 'Diaz da', imageUrl: 'https://images.pexels.com/photos/1189955/pexels-photo-1189955.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1', icon: '🏃‍♂️' },
  ];

  const summerTransfersData = [
    { id: 1, title: 'Newcastle sign Ramsdale on loan from Southampton', imageUrl: 'https://images.pexels.com/photos/3621180/pexels-photo-3621180.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
    { id: 2, title: 'West Ham sign former Newcastle striker Wilson', imageUrl: 'https://images.pexels.com/photos/879629/pexels-photo-879629.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
    { id: 3, title: 'Wolves sign Norwegian David Moller Wolfe from AZ Alkmaar', imageUrl: 'https://images.pexels.com/photos/6203433/pexels-photo-6203433.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
    { id: 4, title: 'Sunderland sign goalkeeper Robin Roefs from NEC Nijmegen', imageUrl: 'https://images.pexels.com/photos/6203513/pexels-photo-6203513.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
    { id: 5, title: 'Brighton sign midfielder Show from Bristol Rovers', imageUrl: 'https://images.pexels.com/photos/7718641/pexels-photo-7718641.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1' },
  ];

  const bestGoalsData = [
    { id: 1, title: "Marmoush v B'nemouth", imageUrl: 'https://images.pexels.com/photos/7718641/pexels-photo-7718641.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1' },
    { id: 2, title: 'De Bruyne v Palace', imageUrl: 'https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1' },
    { id: 3, title: 'Bowen v Forest', imageUrl: 'https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1' },
    { id: 4, title: 'Sancho v Spurs', imageUrl: 'https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1' },
    { id: 5, title: 'Wilson v Brentford', imageUrl: 'https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1' },
    { id: 6, 'title': 'Eze v Chelsea', imageUrl: 'https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1' },
    { id: 7, "title": "Tonali v Brentford", imageUrl: 'https://images.pexels.com/photos/1429536/pexels-photo-1429536.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1' },
    { id: 8, "title": "Cunha v Wolves", imageUrl: 'https://images.pexels.com/photos/1189955/pexels-photo-1189955.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1' }
  ];

  const TrendingNowSection = () => (
    <div className="py-10">
        <h2 className="text-3xl font-bold text-theme-dark mb-6">Trending Now</h2>
        <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4 scrollbar-hide">
            {trendingNowData.map(item => (
                <Link to="/media" key={item.id} className="group flex-shrink-0 w-52">
                    <div className="relative rounded-lg overflow-hidden h-72 shadow-lg">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <span className="absolute top-2 left-2 bg-theme-accent text-white text-xs font-bold px-2 py-1 rounded">New</span>
                        <div className="absolute bottom-0 left-0 p-3 text-theme-dark">
                            <h3 className="font-semibold leading-tight">{item.title} {item.icon}</h3>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </div>
  );

  const KeyTransfersSection = () => (
    <div className="py-10">
        <h2 className="text-3xl font-bold text-theme-dark mb-6">Key Summer 2025 Transfers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {summerTransfersData.map(item => (
                <Link to="/media" key={item.id} className="group">
                    <div className="rounded-lg overflow-hidden bg-transparent">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover rounded-lg group-hover:opacity-80 transition-opacity" />
                        <div className="pt-3">
                            <h3 className="font-semibold text-theme-dark group-hover:text-theme-primary transition-colors">{item.title}</h3>
                            <p className="text-sm text-theme-text-secondary mt-1">Transfers</p>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
        <div className="text-center mt-8">
            <Link to="/media" className="bg-theme-secondary-bg hover:bg-opacity-80 text-theme-dark font-bold py-2 px-8 rounded-md transition-colors">
                View More
            </Link>
        </div>
    </div>
  );
  
  const BestGoalsSection = () => (
      <div className="my-12 py-10 rounded-lg bg-theme-page-bg">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-theme-dark mb-6">Best Goals 2024/25</h2>
            <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4 scrollbar-hide">
                {bestGoalsData.map(item => (
                    <Link to="/media" key={item.id} className="group flex-shrink-0 w-52">
                        <div className="relative rounded-lg overflow-hidden h-72 shadow-lg">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <span className="absolute top-2 left-2 bg-theme-accent text-white text-xs font-bold px-2 py-1 rounded">New</span>
                            <div className="absolute bottom-0 left-0 p-3 text-theme-dark">
                                <h3 className="font-semibold leading-tight">{item.title}</h3>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      </div>
  );

  return (
    <div>
      <HeroSection />
      <MatchTicker matches={matchesData} />

      <main className="container mx-auto px-4 py-12">
        <div className="bg-theme-page-bg p-4 sm:p-6 md:p-8 rounded-lg border border-theme-border">
            <NewsFeed articles={NEWS} />
        </div>
      </main>

      {/* Top Performers Section */}
      {leaderStats.length > 0 && (
          <section className="py-20 bg-transparent">
              <div className="container mx-auto px-4">
                  <SectionHeader 
                      title="Top Performers"
                      subtitle="See who's leading the league in key stats"
                  />
                  
                  <div className="flex justify-center flex-wrap gap-2 mb-8 bg-theme-page-bg p-2 rounded-lg shadow-md max-w-lg mx-auto">
                      {leaderStats.map(stat => (
                          <button
                              key={stat.statUnit}
                              onClick={() => setActiveStat(stat.statUnit)}
                              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                  activeStat === stat.statUnit
                                      ? 'bg-theme-accent text-white shadow'
                                      : 'text-theme-text-secondary hover:bg-theme-secondary-bg'
                              }`}
                          >
                              {stat.statUnit}
                          </button>
                      ))}
                  </div>

                  <div className="max-w-lg mx-auto bg-theme-page-bg rounded-lg shadow-lg p-4 sm:p-6">
                      {activeLeaderStat ? (
                          <ul className="space-y-3">
                              {activeLeaderStat.leaderboard.map((player) => (
                                  <li key={`${player.rank}-${player.name}`}>
                                    <button onClick={() => onPlayerSelect(player.id)} className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-theme-secondary-bg text-left">
                                      <div className="flex items-center gap-4">
                                          <span className="font-bold text-theme-text-secondary text-lg w-6 text-center">{player.rank}.</span>
                                          <img src={player.clubLogo} alt="Club Logo" className="w-6 h-6"/>
                                          <span className="font-semibold text-theme-dark uppercase">{player.name}</span>
                                      </div>
                                      <span className="font-bold text-xl text-theme-primary">{player.value}</span>
                                    </button>
                                  </li>
                              ))}
                          </ul>
                      ) : (
                          <p className="text-center text-theme-text-secondary py-4">No leader data available.</p>
                      )}
                  </div>
              </div>
          </section>
      )}

      {/* New Themed Section for Trending and Transfers */}
      <section className="bg-transparent">
          <div className="container mx-auto px-4">
             <div className="divide-y divide-theme-border">
                <TrendingNowSection />
                <KeyTransfersSection />
             </div>
             <BestGoalsSection />
          </div>
      </section>

      {/* Road to the Final Section */}
      {competitionStage !== 'Group Stage' &&
        <section className="py-16 bg-theme-page-bg/50">
          <div className="container mx-auto px-4">
             <h2 className="text-3xl font-extrabold text-theme-dark mb-8 text-center uppercase tracking-wider">Road to the Final</h2>
             <RoadToFinal matches={matchesData} />
          </div>
        </section>
      }
      
      <MediaHighlights />

      {/* League Standings Section */}
      <section className="py-16 bg-theme-light">
          <div className="container mx-auto px-4">
              <SectionHeader 
                  title="League Standings"
                  subtitle="An overview of the group stage tables"
              />
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {GROUPS.map(groupName => (
                    <GroupStandingsCard 
                        key={groupName}
                        groupName={groupName}
                        tableData={tableData[groupName]}
                    />
                  ))}
              </div>

              <div className="text-center mt-12">
                  <Link to="/table" className="bg-theme-secondary-bg hover:bg-opacity-80 text-theme-dark font-bold py-3 px-8 rounded-lg transition-transform duration-300 hover:scale-105 shadow-lg">
                      View Full Tables
                  </Link>
              </div>
          </div>
      </section>

    </div>
  );
};

export default HomePage;