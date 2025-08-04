import React from 'react';
import { Link } from 'react-router-dom';
import { MEDIA_GALLERY } from '../constants';
import { YoutubeIcon } from './icons';

const MediaHighlights = () => {
    if (!MEDIA_GALLERY || MEDIA_GALLERY.length === 0) {
        return null;
    }

    const featuredMedia = MEDIA_GALLERY[0];
    const otherMedia = MEDIA_GALLERY.slice(1, 5);

    return (
        <section className="py-16 bg-transparent">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-extrabold text-theme-dark mb-6 border-b-2 border-theme-border pb-2">Media Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Featured Media */}
                    <Link to="/media" className="group block relative rounded-lg overflow-hidden shadow-lg col-span-1 md:col-span-2 lg:col-span-3 h-96">
                        <img src={featuredMedia.src} alt={featuredMedia.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                         {featuredMedia.type === 'video' && <YoutubeIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 text-white/80 group-hover:text-white transition-colors" />}
                        <div className="absolute bottom-0 left-0 p-6 text-white">
                            <h3 className="text-3xl font-bold">{featuredMedia.title}</h3>
                        </div>
                    </Link>

                    {/* Other Media */}
                    {otherMedia.map(item => (
                         <Link to="/media" key={item.id} className="group block relative rounded-lg overflow-hidden shadow-lg h-56">
                            <img src={item.src} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                            <div className="absolute inset-0 bg-black/50"></div>
                            {item.type === 'video' && <YoutubeIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-white/80 group-hover:text-white transition-colors" />}
                             <div className="absolute bottom-0 left-0 p-4 text-white">
                                <h3 className="font-bold">{item.title}</h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MediaHighlights;