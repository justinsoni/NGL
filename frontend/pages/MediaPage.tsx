import React from 'react';
import SectionHeader from '../components/SectionHeader';
import { YoutubeIcon } from '../components/icons';

const videos = [
  { id: '1', title: 'League Highlights: Matchweek 1', thumbnail: 'https://images.pexels.com/photos/776314/pexels-photo-776314.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', link: 'https://www.youtube.com' },
  { id: '2', title: 'Top 5 Goals of the Month', thumbnail: 'https://images.pexels.com/photos/1080884/pexels-photo-1080884.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', link: 'https://www.youtube.com' },
  { id: '3', title: 'Best Saves Compilation', thumbnail: 'https://images.pexels.com/photos/2296277/pexels-photo-2296277.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', link: 'https://www.youtube.com' },
  { id: '4', title: 'Top 10 Assists of the Season So Far', thumbnail: 'https://images.pexels.com/photos/7292850/pexels-photo-7292850.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', link: 'https://www.youtube.com' },
  { id: '5', title: 'Behind the Scenes with the Referees', thumbnail: 'https://images.pexels.com/photos/776077/pexels-photo-776077.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', link: 'https://www.youtube.com' },
  { id: '6', title: 'Classic Matches Revisited', thumbnail: 'https://images.pexels.com/photos/9953823/pexels-photo-9953823.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1', link: 'https://www.youtube.com' },
];

const MediaPage: React.FC = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <SectionHeader title="Media Gallery" subtitle="Exclusive videos and highlights" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map(video => (
            <a 
              key={video.id} 
              href={video.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group block bg-theme-page-bg rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="relative">
                <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <YoutubeIcon className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-theme-dark">{video.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MediaPage;