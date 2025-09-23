import React, { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

export default function ChampionDisplay() {
  const [champion, setChampion] = useState<any>(null);

  useEffect(() => {
    const s = getSocket();
    const onChampion = (p: any) => setChampion(p.championClub);
    s.on('league:champion', onChampion);
    return () => { s.off('league:champion', onChampion); };
  }, []);

  if (!champion) return null;
  return (
    <div className="p-6 bg-green-100 border border-green-300 rounded text-center">
      <div className="text-2xl font-extrabold">Champion!</div>
    </div>
  );
}

