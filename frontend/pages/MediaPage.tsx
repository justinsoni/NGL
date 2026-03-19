import React, { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import { YoutubeIcon } from '../components/icons';
import { mediaService, Media } from '../services/mediaService';
import VideoModal from '../components/VideoModal';

const MediaPage: React.FC = () => {
  const [videos, setVideos] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Media | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response: any = await mediaService.getMedia();
        if (response && response.data) {
          setVideos(response.data);
        } else if (Array.isArray(response)) {
          setVideos(response);
        }
      } catch (error) {
        console.error('Failed to fetch media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, []);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <SectionHeader title="Media Gallery" subtitle="Exclusive videos and highlights" />
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 bg-theme-secondary-bg rounded-lg border border-theme-border">
            <p className="text-theme-text-secondary text-lg font-medium">No media available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map(video => (
              <div 
                key={video._id} 
                onClick={() => setSelectedVideo(video)}
                className="group block bg-theme-page-bg rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer border border-theme-border/50"
              >
                <div className="relative">
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-56 object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <YoutubeIcon className="h-16 w-16 text-red-600 drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white font-bold mt-2 uppercase tracking-wide text-sm">Watch Now</span>
                  </div>
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg border border-white/20">
                    {video.category}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-theme-dark text-lg line-clamp-2 leading-tight group-hover:text-theme-primary transition-colors">{video.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedVideo && (
        <VideoModal 
          youtubeUrl={selectedVideo.youtubeUrl} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
};

export default MediaPage;