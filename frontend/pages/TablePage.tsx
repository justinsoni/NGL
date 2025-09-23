

import React, { useEffect, useState } from 'react';
import { TableEntry, GroupName } from '../types';
import PageBanner from '../components/PageBanner';
import { Link } from 'react-router-dom';
import { clubService } from '../services/clubService';

interface TablePageProps {
  tableData: Record<GroupName, TableEntry[]>;
}

const TablePage: React.FC<TablePageProps> = ({ tableData }) => {
  const [activeClubIds, setActiveClubIds] = useState<Set<string | number>>(new Set());
  const [activeClubNames, setActiveClubNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchActiveClubs = async () => {
      try {
        const res = await clubService.getClubs({ limit: 500 });
        const ids = new Set<string | number>();
        const names = new Set<string>();
        (res.data || []).forEach((c: any) => {
          const id = (c as any).id ?? (c as any)._id;
          if (id !== undefined && id !== null) ids.add(id);
          if (c.name) names.add(c.name);
        });
        setActiveClubIds(ids);
        setActiveClubNames(names);
      } catch (e) {
        // On failure, leave sets empty to avoid hiding anything accidentally
        setActiveClubIds(new Set());
        setActiveClubNames(new Set());
      }
    };
    fetchActiveClubs();
  }, []);
  // Flatten all group arrays into one
  const allTeams = Object.values(tableData).flat();
  // Sort by points, then goal difference, then goals for
  const filteredTeams = [...allTeams].filter(team => {
    // If we don't have active clubs loaded yet, show all to avoid blank state
    if (activeClubIds.size === 0 && activeClubNames.size === 0) return true;
    return activeClubIds.has(team.id) || activeClubNames.has(team.club);
  });

  const sortedTeams = filteredTeams.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.club.localeCompare(b.club);
  });

  const getFormColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-theme-accent';
      case 'D': return 'bg-gray-500';
      case 'L': return 'bg-red-600';
    }
  };

  return (
    <div className="min-h-screen">
      <PageBanner title="League Table" subtitle="Unified Standings for All Clubs" />
      <div className="container mx-auto p-4 md:p-6">
        <div className="overflow-x-auto shadow-2xl rounded-lg">
          <table className="min-w-full bg-theme-page-bg text-theme-dark">
            <thead className="bg-gradient-to-r from-theme-primary to-theme-accent uppercase text-sm text-white">
              <tr>
                <th className="py-4 px-2 md:px-4 text-left">Pos</th>
                <th colSpan={2} className="py-4 px-2 md:px-4 text-left">Club</th>
                <th className="py-4 px-2 md:px-4 text-center">Pl</th>
                <th className="py-4 px-2 md:px-4 text-center">W</th>
                <th className="py-4 px-2 md:px-4 text-center">D</th>
                <th className="py-4 px-2 md:px-4 text-center">L</th>
                <th className="py-4 px-2 md:px-4 text-center hidden md:table-cell">GF</th>
                <th className="py-4 px-2 md:px-4 text-center hidden md:table-cell">GA</th>
                <th className="py-4 px-2 md:px-4 text-center">GD</th>
                <th className="py-4 px-2 md:px-4 text-center">Form</th>
                <th className="py-4 px-2 md:px-4 text-center font-bold">Pts</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedTeams.map((team, index) => (
                <tr key={team.club} className={`border-t border-theme-border ${index % 2 === 0 ? 'bg-theme-page-bg' : 'bg-theme-secondary-bg'}`}>
                  <td className="py-3 px-2 md:px-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <span className={`w-6 text-center font-semibold`}>{index + 1}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 md:px-4">
                    <Link to={`/clubs/${team.id}`} className="flex items-center hover:underline">
                      <img src={team.logo} alt={`${team.club} logo`} className="w-6 h-6 mr-3" />
                      <span className="font-bold">{team.club}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-2 md:px-4 text-center font-semibold">{team.p}</td>
                  <td className="py-3 px-2 md:px-4 text-center">{team.w}</td>
                  <td className="py-3 px-2 md:px-4 text-center">{team.d}</td>
                  <td className="py-3 px-2 md:px-4 text-center">{team.l}</td>
                  <td className="py-3 px-2 md:px-4 text-center hidden md:table-cell">{team.gf}</td>
                  <td className="py-3 px-2 md:px-4 text-center hidden md:table-cell">{team.ga}</td>
                  <td className="py-3 px-2 md:px-4 text-center">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                  <td className="py-3 px-2 md:px-4 text-center">
                    <div className="flex items-center justify-center gap-1" title="Last 5 matches">
                      {team.form && team.form.map((result, i) => (
                        <span key={i} className={`h-3 w-3 rounded-full flex items-center justify-center text-white text-xs font-bold ${getFormColor(result)}`}></span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 md:px-4 text-center font-bold text-lg">{team.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 bg-theme-page-bg rounded-lg shadow-md text-sm text-theme-text-secondary">
          <h4 className="font-bold text-theme-dark mb-2">Key:</h4>
          <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2">
            <div className="flex items-center"><div className="w-3 h-3 mr-2 rounded-full bg-theme-accent"></div><span>Win</span></div>
            <div className="flex items-center"><div className="w-3 h-3 mr-2 rounded-full bg-gray-500"></div><span>Draw</span></div>
            <div className="flex items-center"><div className="w-3 h-3 mr-2 rounded-full bg-red-600"></div><span>Loss</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablePage;