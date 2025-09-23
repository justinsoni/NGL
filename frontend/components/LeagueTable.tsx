import React, { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { getLeagueTable } from '../services/tableService';

interface Standing {
  club: { _id: string; name: string; logo?: string } | string;
  played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number;
}

export default function LeagueTable() {
  const [standings, setStandings] = useState<Standing[]>([]);

  useEffect(() => {
    // Initial fetch
    getLeagueTable().then(t => setStandings(t.standings || [])).catch(()=>{});
    const s = getSocket();
    const onUpdate = (table: any) => setStandings(table.standings || []);
    s.on('table:updated', onUpdate);
    return () => { s.off('table:updated', onUpdate); };
  }, []);

  return (
    <div className="bg-theme-page-bg p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-3">League Table</h3>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Team</th>
              <th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const club = typeof s.club === 'string' ? null : s.club;
              return (
                <tr key={idx} className="border-b">
                  <td className="py-2 flex items-center gap-2">
                    {club?.logo && <img src={club.logo} className="h-5 w-5" />}
                    <span>{club?.name || 'Team'}</span>
                  </td>
                  <td>{s.played}</td><td>{s.won}</td><td>{s.drawn}</td><td>{s.lost}</td><td>{s.gf}</td><td>{s.ga}</td><td>{s.gd}</td><td className="font-bold">{s.points}</td>
                </tr>
              );
            })}
            {standings.length === 0 && (
              <tr><td className="py-3 text-theme-text-secondary" colSpan={9}>No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

