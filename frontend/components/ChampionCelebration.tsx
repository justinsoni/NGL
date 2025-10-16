import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface ChampionCelebrationProps {
  championTeam: {
    name: string;
    logo?: string;
  };
  onClose: () => void;
}

const ChampionCelebration: React.FC<ChampionCelebrationProps> = ({ championTeam, onClose }) => {
  const [showCelebration, setShowCelebration] = useState(true);

  console.log('🎊 ChampionCelebration component rendered with:', { championTeam, showCelebration });

  useEffect(() => {
    // Trigger confetti explosion
    const triggerConfetti = () => {
      // Multiple confetti bursts for dramatic effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Second burst after a short delay
      setTimeout(() => {
        confetti({
          particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
        });
      }, 200);

      // Third burst for extra celebration
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 }
        });
      }, 400);
    };

    triggerConfetti();

    // Auto-hide celebration after 8 seconds
    const timer = setTimeout(() => {
      setShowCelebration(false);
      setTimeout(onClose, 500); // Allow fade out animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!showCelebration) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl shadow-2xl p-8 max-w-2xl mx-4 text-center animate-pulse">
        {/* Close button */}
        <button
          onClick={() => {
            setShowCelebration(false);
            setTimeout(onClose, 500);
          }}
          className="absolute top-4 right-4 text-white hover:text-yellow-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Trophy Icon */}
        <div className="text-8xl mb-4 animate-bounce">
          🏆
        </div>

        {/* Champion Banner */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Congratulations!
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            {championTeam.logo && (
              <img 
                src={championTeam.logo} 
                alt={`${championTeam.name} logo`} 
                className="w-16 h-16 rounded-full shadow-md"
              />
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-yellow-600">
                {championTeam.name}
              </h2>
              <p className="text-lg text-gray-600 font-semibold">
                Champions of the Season!
              </p>
            </div>
          </div>

          <div className="text-2xl mb-4">
            🎉
          </div>

          <p className="text-gray-700 text-lg">
            Thank you to all teams for participating!
          </p>
        </div>

        {/* Celebration Message */}
        <div className="text-white text-lg font-semibold">
          🎆 What an incredible season! 🎆
        </div>

        {/* Animated stars */}
        <div className="absolute top-4 left-4 text-2xl animate-spin" style={{ animationDuration: '3s' }}>
          ⭐
        </div>
        <div className="absolute top-8 right-8 text-xl animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
          ✨
        </div>
        <div className="absolute bottom-4 left-8 text-lg animate-spin" style={{ animationDuration: '4s' }}>
          🌟
        </div>
        <div className="absolute bottom-8 right-4 text-xl animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}>
          💫
        </div>
      </div>
    </div>
  );
};

export default ChampionCelebration;
