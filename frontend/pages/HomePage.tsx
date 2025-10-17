



import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NEWS } from '../constants';
import { LeagueLogoIcon } from '../components/icons';
import { TableEntry, Match, GroupName, LeaderStat, Player } from '../types';
import RoadToFinal from '../components/RoadToFinal';
import MatchTicker from '../components/MatchTicker';
// News feed replaced by new Latest News grid
import SectionHeader from '../components/SectionHeader';
import { GROUPS } from '../constants';
import { fetchNews } from '@/api/news/fetchNews';

// Using local images from assets - using correct asset paths
const image103 = new URL('../src/assets/images/103.jpg', import.meta.url).href;
const footballStadium = new URL('../src/assets/images/football_stadium_2-wallpaper-2560x1024.jpg', import.meta.url).href;
const pexelsImage = new URL('../src/assets/images/pexels-pixabay-274422.jpg', import.meta.url).href;

interface HomePageProps {
  matchesData: Match[];
  tableData: Record<GroupName, TableEntry[]>;
  competitionStage: 'League Stage' | 'Semi-Finals' | 'Final' | 'Finished';
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

// LeagueTable component for single league standings
type LeagueTableProps = { tableData: Record<GroupName, TableEntry[]> };
const LeagueTable: React.FC<LeagueTableProps> = ({ tableData }) => {
  // Get all teams from group A (single league)
  const allTeams = tableData['A'] || [];
  // Sort by points, then goal difference, then goals for
  const sortedTeams = [...allTeams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.club.localeCompare(b.club);
  });
  return (
    <div className="bg-theme-page-bg rounded-lg shadow-lg overflow-hidden">
      <h3 className="text-xl font-bold bg-gradient-to-r from-theme-primary to-theme-accent text-white p-3 text-center">League Table</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-theme-secondary-bg uppercase text-xs text-theme-text-secondary">
            <tr>
              <th className="py-2 px-2 text-left">Pos</th>
              <th className="py-2 px-2 text-left">Club</th>
              <th className="py-2 px-2 text-center">Pl</th>
              <th className="py-2 px-2 text-center">GD</th>
              <th className="py-2 px-2 text-center font-bold">Pts</th>
            </tr>
          </thead>
          <tbody className="text-theme-dark">
            {sortedTeams.map((team, index) => (
              <tr key={team.id} className={`border-t border-theme-border ${index % 2 === 0 ? 'bg-theme-page-bg' : 'bg-theme-secondary-bg'}`}>
                <td className="py-2 px-2 whitespace-nowrap font-semibold">{index + 1}</td>
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
};


const HomePage: React.FC<HomePageProps> = ({ matchesData, tableData, competitionStage, leaderStats, onPlayerSelect }) => {
  const [activeStat, setActiveStat] = useState<string>(leaderStats.length > 0 ? leaderStats[0].statUnit : '');
  const activeLeaderStat = leaderStats.find(stat => stat.statUnit === activeStat);

  const [newsArticles, setNewsArticles] = useState<Array<{ _id: string; title: string; imageUrl: string, summary: string, content: string, createdAt: string }>>([]);
  const [trendingNews, setTrendingNews] = useState<Array<{ _id: string; title: string; imageUrl: string, icon: string, createdAt: string }>>([]);
    
    useEffect(() => {
      async function getNews() {
        try {
          const data = await fetchNews();
          setNewsArticles(data);
          
          // Filter trending news from the data
          const trending = data
            .filter((item: any) => item.type === 'trending')
            .map((item: any) => ({
              _id: item._id,
              title: item.title,
              imageUrl: item.imageUrl,
              icon: item.icon || '🔥',
              createdAt: item.createdAt
            }));
          setTrendingNews(trending);
        } catch (err) {
          setNewsArticles([]);
          setTrendingNews([]);
        }
      }
      getNews();
    }, []);


  // Load transfers from MongoDB
  const [transfers, setTransfers] = useState<Array<{ id: string; title: string; imageUrl: string; clubName: string; createdAt: string }>>([]);
  useEffect(() => {
    async function loadTransfers() {
      try {
        const data = await fetchNews();
        const transferItems = data
          .filter((item: any) => item.type === 'transfer')
          .map((item: any) => ({
            id: item._id,
            title: item.title,
            imageUrl: item.imageUrl,
            clubName: item.club || 'Unknown',
            createdAt: item.createdAt
          }));
        setTransfers(transferItems);
      } catch (error) {
        console.error('Failed to load transfers:', error);
        setTransfers([]);
      }
    }
    loadTransfers();
  }, []);

  // Load best goals from MongoDB
  const [bestGoals, setBestGoals] = useState<Array<{ id: string; title: string; imageUrl: string; clubName: string; createdAt: string }>>([]);
  useEffect(() => {
    async function loadBestGoals() {
      try {
        const data = await fetchNews();
        const goalItems = data
          .filter((item: any) => item.type === 'best-goal')
          .map((item: any) => ({
            id: item._id,
            title: item.title,
            imageUrl: item.imageUrl,
            clubName: item.club || 'Unknown',
            createdAt: item.createdAt
          }));
        setBestGoals(goalItems);
      } catch (error) {
        console.error('Failed to load best goals:', error);
        setBestGoals([]);
      }
    }
    loadBestGoals();
  }, []);

  // Load match reports from MongoDB
  const [matchReports, setMatchReports] = useState<Array<{ id: string; title: string; imageUrl: string; createdAt: string }>>([]);
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

  const TrendingNowSection = () => (
    <div className="py-10">
        <h2 className="text-3xl font-bold text-theme-dark mb-6">Trending Now</h2>
        {trendingNews.length > 0 ? (
          <>
            <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4 scrollbar-hide">
                {trendingNews.map(item => (
                    <Link to="/media" key={item._id} className="group flex-shrink-0 w-52">
                        <div className="relative rounded-lg overflow-hidden h-72 shadow-lg">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <span className="absolute top-2 left-2 bg-theme-accent text-white text-xs font-bold px-2 py-1 rounded">{item.icon} Trending</span>
                            <div className="absolute bottom-0 left-0 p-3 text-white">
                                <h3 className="font-semibold leading-tight">{item.title}</h3>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            <div className="flex justify-center mt-6">
                <Link to="/media" className="inline-block bg-white text-theme-dark font-semibold px-6 py-3 rounded-full shadow hover:shadow-md transition-shadow">
                    View More
                </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-theme-secondary-bg rounded-lg">
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-xl font-semibold text-theme-dark mb-2">No Trending News Yet</h3>
            <p className="text-theme-text-secondary">Check back later for trending content!</p>
          </div>
        )}
    </div>
  );

  const KeyTransfersSection = () => (
    transfers.length > 0 ? (
      <div className="py-10">
          <h2 className="text-3xl font-bold text-theme-dark mb-6">Key Summer 2025 Transfers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {transfers.map(item => (
                  <Link to="/media" key={item.id} className="group">
                      <div className="rounded-lg overflow-hidden bg-transparent">
                          {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover rounded-lg group-hover:opacity-80 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                          <div className="pt-3">
                              <h3 className="font-semibold text-theme-dark group-hover:text-theme-primary transition-colors">{item.title}</h3>
                              <p className="text-sm text-theme-text-secondary mt-1">Transfers</p>
                          </div>
                      </div>
                  </Link>
              ))}
          </div>
          <div className="text-center mt-8">
              <Link to="/media" className="inline-block bg-white text-theme-dark font-semibold px-6 py-3 rounded-full shadow hover:shadow-md transition-shadow">
                  View More
              </Link>
          </div>
      </div>
    ) : null
  );
  
  const BestGoalsSection = () => (
      bestGoals.length > 0 ? (
        <div className="my-12 py-10 rounded-lg bg-theme-page-bg">
          <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-theme-dark mb-6">Best Goals 2024/25</h2>
              <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4 scrollbar-hide">
                  {bestGoals.map(item => (
                      <Link to="/media" key={item.id} className="group flex-shrink-0 w-52">
                          <div className="relative rounded-lg overflow-hidden h-72 shadow-lg">
                              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
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
      ) : null
  );

  const InterviewsSection = () => (
    <div className="py-10">
      <h2 className="text-3xl font-bold text-theme-dark mb-6">Interviews</h2>
      <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4 scrollbar-hide">
        {/* Sample interview data - you can replace with dynamic data from your API */}
        {[
          { id: 1, title: "Emery: Watkins should be ready for Spurs", imageUrl: "https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 2, title: "Amorim on catching Liverpool: I don't kno...", imageUrl: "https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 3, title: "Silva: SIX players on Fulham's injury list", imageUrl: "https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 4, title: "Ange: My story always ends with a trophy", imageUrl: "https://images.pexels.com/photos/6688537/pexels-photo-6688537.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 5, title: "Watch: Amorim's update on Martinez a...", imageUrl: "https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 6, title: "Pereira: I don't feel pressure, I live for the...", imageUrl: "https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 7, title: "Iraola on Brooks injury and other team news", imageUrl: "https://images.pexels.com/photos/1429536/pexels-photo-1429536.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 8, title: "Amorim: I can feel the club's support", imageUrl: "https://images.pexels.com/photos/1189955/pexels-photo-1189955.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 9, title: "Pep issues injury latest on City quartet", imageUrl: "https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 10, title: "Hurzeler: Mitoma and Veltman could feature.", imageUrl: "https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" }
        ].map(item => (
          <Link to="/media" key={item.id} className="group flex-shrink-0 w-52">
            <div className="relative rounded-lg overflow-hidden h-72 shadow-lg">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">New</span>
              <div className="absolute bottom-0 left-0 p-3 text-white">
                <h3 className="font-semibold leading-tight">{item.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <Link to="/media" className="inline-block bg-white text-theme-dark font-semibold px-6 py-3 rounded-full shadow hover:shadow-md transition-shadow">
          View More
        </Link>
      </div>
    </div>
  );

  const BestMomentsSection = () => (
    <div className="py-10">
      <h2 className="text-3xl font-bold text-theme-dark mb-6">Best moments of 2025/26</h2>
      <div className="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4 scrollbar-hide">
        {/* Sample best moments data - you can replace with dynamic data from your API */}
        {[
          { id: 1, title: "Watch all NINE Haaland goals this season ⚽", imageUrl: "https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 2, title: "ALL ANGLES: Zubimendi's Goal of th...", imageUrl: "https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 3, title: "TEN players involved in Chelsea's goal 🤝", imageUrl: "https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 4, title: "Watch: Haaland OUTMUSCLING...", imageUrl: "https://images.pexels.com/photos/6688537/pexels-photo-6688537.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 5, title: "Malen ORCHESTRATES Aston Villa's goal 🧠", imageUrl: "https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 6, title: "Woltemade on FIRE at St James' Park 🔥", imageUrl: "https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 7, title: "How Everton ENDED Palace's unbeaten run", imageUrl: "https://images.pexels.com/photos/1429536/pexels-photo-1429536.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 8, title: "Watch: Johnstone's UNREAL save 🧤", imageUrl: "https://images.pexels.com/photos/1189955/pexels-photo-1189955.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 9, title: "Come for the goal, stay for the celebration 🤪", imageUrl: "https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" },
          { id: 10, title: "Caicedo only scores BANGERS 🚀", imageUrl: "https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1" }
        ].map(item => (
          <Link to="/media" key={item.id} className="group flex-shrink-0 w-52">
            <div className="relative rounded-lg overflow-hidden h-72 shadow-lg">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">New</span>
              <div className="absolute bottom-0 left-0 p-3 text-white">
                <h3 className="font-semibold leading-tight">{item.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <Link to="/media" className="inline-block bg-white text-theme-dark font-semibold px-6 py-3 rounded-full shadow hover:shadow-md transition-shadow">
          View More
        </Link>
      </div>
    </div>
  );

  const StatisticsSection = () => {
    const [activeStat, setActiveStat] = useState('Goals');
    
    // Sample statistics data - you can replace with dynamic data from your API
    const statsData = {
      Goals: [
        { id: 1, player: "Kylian Mbappe", team: "Real Madrid", value: 9, avatar: "https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 2, player: "Julian Alvarez", team: "Atletico", value: 6, avatar: "https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/6688537/pexels-photo-6688537.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 3, player: "Karl Etta", team: "Levante", value: 5, avatar: "https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 4, player: "Vinicius Junior", team: "Real Madrid", value: 5, avatar: "https://images.pexels.com/photos/1429536/pexels-photo-1429536.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/1189955/pexels-photo-1189955.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 5, player: "Ferran Torres", team: "Barcelona", value: 4, avatar: "https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 6, player: "Ivan Romero", team: "Levante", value: 4, avatar: "https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/6688537/pexels-photo-6688537.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" }
      ],
      Assists: [
        { id: 1, player: "Kevin De Bruyne", team: "Manchester City", value: 8, avatar: "https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 2, player: "Bruno Fernandes", team: "Manchester United", value: 6, avatar: "https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/6688537/pexels-photo-6688537.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 3, player: "Luka Modric", team: "Real Madrid", value: 5, avatar: "https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" }
      ],
      "Yellow Cards": [
        { id: 1, player: "Casemiro", team: "Manchester United", value: 7, avatar: "https://images.pexels.com/photos/1429536/pexels-photo-1429536.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/1189955/pexels-photo-1189955.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 2, player: "Rodri", team: "Manchester City", value: 5, avatar: "https://images.pexels.com/photos/6203517/pexels-photo-6203517.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/4065137/pexels-photo-4065137.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 3, player: "Fabinho", team: "Liverpool", value: 4, avatar: "https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/6688537/pexels-photo-6688537.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" }
      ],
      "Red Cards": [
        { id: 1, player: "Raphael Varane", team: "Manchester United", value: 2, avatar: "https://images.pexels.com/photos/7991584/pexels-photo-7991584.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" },
        { id: 2, player: "Joao Cancelo", team: "Barcelona", value: 1, avatar: "https://images.pexels.com/photos/1429536/pexels-photo-1429536.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1", teamLogo: "https://images.pexels.com/photos/1189955/pexels-photo-1189955.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1" }
      ]
    };

    const currentStats = statsData[activeStat as keyof typeof statsData] || [];

    return (
      <div className="py-10 bg-theme-page-bg rounded-lg">
        <div className="px-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-theme-dark">NGL Statistics</h2>
          <Link to="/stats" className="bg-theme-primary text-theme-dark font-semibold px-6 py-3 rounded-full shadow hover:shadow-md transition-shadow flex items-center gap-2">
            See all stats
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        {/* Stats Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(statsData).map((stat) => (
            <button
              key={stat}
              onClick={() => setActiveStat(stat)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeStat === stat
                  ? 'bg-theme-primary text-theme-dark shadow-md'
                  : 'bg-theme-secondary-bg text-theme-text-secondary hover:bg-theme-page-bg'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>

        {/* Statistics Table */}
        <div className="bg-theme-page-bg rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-theme-secondary-bg">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Player</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">Team</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-theme-text-secondary uppercase tracking-wider">{activeStat}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {currentStats.map((player, index) => (
                  <tr key={player.id} className="hover:bg-theme-secondary-bg/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={player.avatar}
                            alt={player.player}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-theme-dark">
                            <Link to={`/players/${player.id}`} className="hover:text-theme-primary transition-colors">
                              {player.player}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6">
                          <img
                            className="h-6 w-6 rounded-full object-cover"
                            src={player.teamLogo}
                            alt={player.team}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm text-theme-dark">{player.team}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-theme-primary text-lg">{player.value}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <HeroSection />
      <MatchTicker matches={matchesData} />

      <main className="container mx-auto px-4 py-12">
        <section className="mb-10">
          <h2 className="text-3xl font-extrabold text-theme-dark mb-6">Latest News & Features</h2>

          {newsArticles.filter((article: any) => article.type !== 'match-report' && article.type !== 'trending' && article.authorRole === 'admin').length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {newsArticles
                .filter((article: any) => article.type !== 'match-report' && article.type !== 'trending' && article.authorRole === 'admin') // Only show admin-created news, exclude match reports and trending
                .slice(0, 10)
                .map((article, index) => (
                <Link to={`/news/${article._id}`} key={article._id || `news-${index}`} className="group">
                  <div className="relative h-64 rounded-lg overflow-hidden shadow-lg">
                    {article.imageUrl && (
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-semibold leading-tight drop-shadow text-sm mb-1">{article.title}</h3>
                      <p className="text-xs opacity-90 uppercase tracking-wide">{article.category || 'Features'}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-theme-secondary-bg rounded-lg">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-xl font-semibold text-theme-dark mb-2">No Admin News Yet</h3>
              <p className="text-theme-text-secondary">Only news created by administrators will appear in this section.</p>
            </div>
          )}
          
          <div className="flex justify-center mt-8">
            <Link to="/media" className="bg-white text-theme-dark font-semibold px-6 py-3 rounded-full shadow hover:shadow-md transition-shadow">
              View More
            </Link>
          </div>
        </section>
      </main>

      {/* Match Reports Section - Load from MongoDB */}
      {matchReports.length > 0 && (
        <section className="py-12 bg-transparent">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-extrabold text-theme-dark mb-6">Match Reports</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {matchReports.slice(0, 10).map((mr) => (
                <Link to="/matches" key={mr.id} className="group">
                  <div className="relative h-56 rounded-lg overflow-hidden bg-black/30">
                    {mr.imageUrl && <img src={mr.imageUrl} alt={mr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-semibold leading-tight drop-shadow">{mr.title}</h3>
                      <p className="text-theme-text-secondary text-sm">Match report</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Link to="/matches" className="bg-white text-theme-dark font-semibold px-6 py-3 rounded-full shadow hover:shadow-md transition-shadow">
                View More
              </Link>
            </div>
          </div>
        </section>
      )}

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
                              {activeLeaderStat.leaderboard.map((player, index) => (
                                  <li key={`${player.playerId}-${player.playerName}`}>
                                    <button onClick={() => onPlayerSelect(player.playerId)} className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-theme-secondary-bg text-left">
                                      <div className="flex items-center gap-4">
                                          <span className="font-bold text-theme-text-secondary text-lg w-6 text-center">{index + 1}.</span>
                                          <img src={player.clubLogo} alt="Club Logo" className="w-6 h-6" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                          <span className="font-semibold text-theme-dark uppercase">{player.playerName}</span>
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
                <StatisticsSection />
                <InterviewsSection />
                <BestMomentsSection />
                <KeyTransfersSection />
             </div>
             <BestGoalsSection />
          </div>
      </section>

      {/* Road to the Final Section */}
      {competitionStage !== 'League Stage' &&
        <section className="py-16 bg-theme-page-bg/50">
          <div className="container mx-auto px-4">
             <h2 className="text-3xl font-extrabold text-theme-dark mb-8 text-center uppercase tracking-wider">Road to the Final</h2>
             <RoadToFinal matches={matchesData} />
          </div>
        </section>
      }
      

      {/* League Standings section intentionally removed from Home page */}

    </div>
  );
};

export default HomePage;