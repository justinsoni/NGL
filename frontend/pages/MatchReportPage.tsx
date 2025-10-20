import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import matchDataService, { MatchData, MatchEvent, TeamStats } from '../services/matchDataService';

const StatRow: React.FC<{ label: string; home: number | string; away: number | string }> = ({ label, home, away }) => (
    <div className="grid grid-cols-3 items-center py-2 text-sm">
        <div className="text-right pr-3 font-semibold">{home}</div>
        <div className="text-center text-theme-text-secondary">{label}</div>
        <div className="text-left pl-3 font-semibold">{away}</div>
    </div>
);

const TeamBlock: React.FC<{ name: string; logo?: string }> = ({ name, logo }) => (
    <div className="flex flex-col items-center w-1/3">
        {logo && <img src={logo} alt={name} className="h-16 w-16 md:h-24 md:w-24 mb-2" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
        <h2 className="text-lg md:text-2xl font-bold text-center">{name}</h2>
    </div>
);

const MatchReportPage: React.FC = () => {
    const { fixtureId } = useParams();
    const [data, setData] = useState<MatchData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (!fixtureId) return;
                const res = await matchDataService.getMatchDataByFixture(fixtureId);
                if (mounted) setData(res.data);
            } catch (e) {
                setError('Failed to load match details');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [fixtureId]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="bg-theme-page-bg p-8 rounded-lg shadow text-center text-theme-text-secondary">Loading match report...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="bg-theme-page-bg p-8 rounded-lg shadow text-center">
                    <p className="text-theme-text-secondary mb-4">{error || 'Match report not found.'}</p>
                    <Link to="/matches" className="inline-block bg-theme-secondary-bg px-6 py-3 rounded-md text-theme-dark font-semibold">Back to Matches</Link>
                </div>
            </div>
        );
    }

    const { homeTeam, awayTeam, homeTeamName, awayTeamName, finalScore, events, homeTeamStats, awayTeamStats, venue, kickoffTime, stage } = data;

    const goalEvents = events.filter(e => e.type === 'goal');
    const yellowCardEvents = events.filter(e => e.type === 'yellow_card');
    const redCardEvents = events.filter(e => e.type === 'red_card');

    return (
        <div className="pb-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="bg-theme-secondary-bg text-theme-dark my-6 rounded-lg shadow-2xl p-4">
                    <div className="relative flex justify-around items-center text-center">
                        <TeamBlock name={homeTeamName} logo={(homeTeam as any)?.logo} />
                        <div className="w-1/3">
                            <p className="text-3xl md:text-5xl font-bold">{finalScore.home} - {finalScore.away}</p>
                            <p className="text-xs md:text-sm text-theme-text-secondary mt-1">{stage?.toUpperCase?.() || 'LEAGUE'} • {venue || 'Venue TBA'}</p>
                            <p className="text-xs md:text-sm text-theme-text-secondary">{new Date(kickoffTime).toLocaleString()}</p>
                            <p className="text-[11px] md:text-xs font-semibold text-theme-text-secondary mt-1">FULL TIME</p>
                        </div>
                        <TeamBlock name={awayTeamName} logo={(awayTeam as any)?.logo} />
                    </div>
                </div>

                {/* Key Moments */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-theme-page-bg rounded-lg shadow p-4">
                        <h3 className="font-bold mb-3">Goals</h3>
                        {goalEvents.length === 0 ? <p className="text-sm text-theme-text-secondary">No goals recorded</p> : (
                            <ul className="space-y-2 text-sm">
                                {goalEvents.map((ev, idx) => (
                                    <li key={`g-${idx}`} className="flex justify-between">
                                        <span className="text-theme-text-secondary">{ev.minute}'</span>
                                        <span className="font-semibold">{ev.player}{ev.assist ? ` (assist ${ev.assist})` : ''}</span>
                                        <span className="uppercase text-xs px-2 py-0.5 rounded bg-theme-secondary-bg">{ev.team}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="bg-theme-page-bg rounded-lg shadow p-4">
                        <h3 className="font-bold mb-3">Yellow Cards</h3>
                        {yellowCardEvents.length === 0 ? <p className="text-sm text-theme-text-secondary">No yellow cards</p> : (
                            <ul className="space-y-2 text-sm">
                                {yellowCardEvents.map((ev, idx) => (
                                    <li key={`y-${idx}`} className="flex justify-between">
                                        <span className="text-theme-text-secondary">{ev.minute}'</span>
                                        <span className="font-semibold">{ev.player}</span>
                                        <span className="uppercase text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">{ev.team}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="bg-theme-page-bg rounded-lg shadow p-4">
                        <h3 className="font-bold mb-3">Red Cards</h3>
                        {redCardEvents.length === 0 ? <p className="text-sm text-theme-text-secondary">No red cards</p> : (
                            <ul className="space-y-2 text-sm">
                                {redCardEvents.map((ev, idx) => (
                                    <li key={`r-${idx}`} className="flex justify-between">
                                        <span className="text-theme-text-secondary">{ev.minute}'</span>
                                        <span className="font-semibold">{ev.player}</span>
                                        <span className="uppercase text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">{ev.team}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Team Stats */}
                <div className="bg-theme-page-bg rounded-lg shadow p-4 mt-6">
                    <h3 className="font-bold mb-3">Match Stats</h3>
                    <StatRow label="Goals" home={homeTeamStats.finalScore} away={awayTeamStats.finalScore} />
                    <StatRow label="Possession (%)" home={homeTeamStats.possession ?? 50} away={awayTeamStats.possession ?? 50} />
                    <StatRow label="Shots" home={homeTeamStats.shots} away={awayTeamStats.shots} />
                    <StatRow label="Shots on Target" home={homeTeamStats.shotsOnTarget} away={awayTeamStats.shotsOnTarget} />
                    <StatRow label="Corners" home={homeTeamStats.corners} away={awayTeamStats.corners} />
                    <StatRow label="Fouls" home={homeTeamStats.fouls} away={awayTeamStats.fouls} />
                    <StatRow label="Yellow Cards" home={homeTeamStats.yellowCards} away={awayTeamStats.yellowCards} />
                    <StatRow label="Red Cards" home={homeTeamStats.redCards} away={awayTeamStats.redCards} />
                </div>

                {/* Player Stats */}
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-theme-page-bg rounded-lg shadow p-4">
                        <h3 className="font-bold mb-3">{homeTeamName} Players</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-theme-text-secondary text-left">
                                    <th className="py-2">Player</th>
                                    <th className="py-2">G</th>
                                    <th className="py-2">A</th>
                                    <th className="py-2">YC</th>
                                    <th className="py-2">RC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {homeTeamStats.playerStats.map((p, idx) => (
                                    <tr key={`hp-${idx}`} className="border-t border-theme-border">
                                        <td className="py-2">{p.playerName}</td>
                                        <td className="py-2">{p.goals}</td>
                                        <td className="py-2">{p.assists}</td>
                                        <td className="py-2">{p.yellowCards}</td>
                                        <td className="py-2">{p.redCards}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-theme-page-bg rounded-lg shadow p-4">
                        <h3 className="font-bold mb-3">{awayTeamName} Players</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-theme-text-secondary text-left">
                                    <th className="py-2">Player</th>
                                    <th className="py-2">G</th>
                                    <th className="py-2">A</th>
                                    <th className="py-2">YC</th>
                                    <th className="py-2">RC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {awayTeamStats.playerStats.map((p, idx) => (
                                    <tr key={`ap-${idx}`} className="border-t border-theme-border">
                                        <td className="py-2">{p.playerName}</td>
                                        <td className="py-2">{p.goals}</td>
                                        <td className="py-2">{p.assists}</td>
                                        <td className="py-2">{p.yellowCards}</td>
                                        <td className="py-2">{p.redCards}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <Link to="/matches" className="bg-theme-secondary-bg hover:bg-opacity-80 text-theme-dark font-bold py-3 px-8 rounded-lg transition-transform duration-300 hover:scale-105">
                        Back to Matches
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MatchReportPage;


