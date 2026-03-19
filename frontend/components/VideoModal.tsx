import React from 'react';

interface VideoModalProps {
  youtubeUrl: string;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ youtubeUrl, onClose }) => {
  if (!youtubeUrl) return null;

  // Extract YouTube ID assuming formats like https://www.youtube.com/watch?v=ID or https://youtu.be/ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(youtubeUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : youtubeUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-5xl bg-black rounded-lg shadow-2xl overflow-hidden aspect-video border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all"
          aria-label="Close video"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <iframe
          src={embedUrl}
          title="Video Player"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default VideoModal;
