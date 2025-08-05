

import React, { useState } from 'react';
import { TableEntry, GroupName } from '../types';
import PageBanner from '../components/PageBanner';
import { Link } from 'react-router-dom';
import { GROUPS } from '../constants';

interface TablePageProps {
  tableData: Record<GroupName, TableEntry[]>;
}

const TablePage: React.FC<TablePageProps> = ({ tableData }) => {
  const [activeGroup, setActiveGroup] = useState<GroupName>('A');
  const activeTableData = tableData[activeGroup];

  const getFormColor = (result: 'W' | 'D' | 'L') => {
    switch (result) {
      case 'W': return 'bg-theme-accent';
      case 'D': return 'bg-gray-500';
      case 'L': return 'bg-red-600';
    }
  };

  const getPositionStyle = (pos: number) => {
    if (pos === 1) return 'border-l-4 border-theme-accent'; // Group Winner
    if (pos === 2) return 'border-l-4 border-blue-500'; // 2nd Place
    return 'border-l-4 border-transparent';
  };

  return (
    <div className="min-h-screen">
      <PageBanner title="League Table" subtitle={`Group ${activeGroup} Standings`} />
      <div className="container mx-auto p-4 md:p-6">

        {/* Group Tabs */}
        <div className="mb-6 bg-theme-page-bg p-2 rounded-lg shadow-md flex justify-center gap-2">
            {GROUPS.map(group => (
                <button
                    key={group}
                    onClick={() => setActiveGroup(group)}
                    className={`px-4 sm:px-6 py-2 text-sm font-semibold rounded-md transition-colors ${
                        activeGroup === group
                            ? 'bg-gradient-to-r from-theme-primary to-theme-accent text-white shadow'
                            : 'text-theme-text-secondary hover:bg-theme-secondary-bg'
                    }`}
                >
                    Group {group}
                </button>
            ))}
        </div>

        <div className="overflow-x-auto shadow-2xl rounded-lg">
          <table className="min-w-full bg-theme-page-bg text-theme-dark">
            <thead className="bg-gradient-to-r from-theme-primary to-theme-accent uppercase text-sm text-white">
              <tr>
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
              {activeTableData.map((team, index) => (
                <tr key={team.club} className={`border-t border-theme-border ${index % 2 === 0 ? 'bg-theme-page-bg' : 'bg-theme-secondary-bg'} ${getPositionStyle(team.pos)}`}>
                  <td className="py-3 px-2 md:px-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <span className={`w-6 text-center font-semibold`}>{team.pos}</span>
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
                      {team.form.map((result, i) => (
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
            <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#00ff87'}}></div><span>Semi-Final Qualification (Group Winner)</span></div>
            <div className="flex items-center"><div className="w-4 h-4 mr-2 bg-blue-500"></div><span>Second Place</span></div>
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