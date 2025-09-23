import React, { useEffect, useState } from 'react';
import LiveMatch from './LiveMatch';
import { getSocket } from '../services/socket';
import { FixtureDTO } from '../services/fixturesService';

export default function FinalMatch() {
  const [finalMatch, setFinalMatch] = useState<FixtureDTO | null>(null);
  const [champion, setChampion] = useState<any>(null);

  useEffect(() => {
    const s = getSocket();
    const onCreated = (m: any) => setFinalMatch(m);
    const onFinished = (m: any) => setFinalMatch(m);
    const onChampion = (p: any) => setChampion(p.championClub);
    s.on('final:created', onCreated);
    s.on('final:finished', onFinished);
    s.on('league:champion', onChampion);
    return () => {
      s.off('final:created', onCreated);
      s.off('final:finished', onFinished);
      s.off('league:champion', onChampion);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Championship Final</h3>
      {finalMatch ? <LiveMatch initial={finalMatch} /> : <div className="text-sm text-theme-text-secondary">Final not scheduled yet.</div>}
      {champion && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
          <div className="text-lg font-extrabold">Champion Declared!</div>
        </div>
      )}
    </div>
  );
}

