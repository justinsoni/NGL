import React from 'react';
import { Link } from 'react-router-dom';
import { NewsArticle } from '../types';

interface NewsFeedProps {
    articles: NewsArticle[];
}

const NewsFeed: React.FC<NewsFeedProps> = ({ articles }) => {
    if (articles.length === 0) return null;

    const featuredArticle = articles[0];
    const otherArticles = articles.slice(1, 5);

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-theme-dark mb-4 pb-2">League News</h2>
            
            {/* Featured Article */}
            <Link to="/media" className="group block mb-8">
                <div className="relative overflow-hidden rounded-lg shadow-lg">
                    <img src={featuredArticle.imageUrl} alt={featuredArticle.title} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6 text-theme-dark">
                        <span className="text-sm bg-theme-primary px-2 py-1 rounded font-bold uppercase">Featured</span>
                        <h3 className="text-3xl font-bold mt-2 drop-shadow-lg">{featuredArticle.title}</h3>
                        <p className="mt-1 text-gray-200">{featuredArticle.summary}</p>
                    </div>
                </div>
            </Link>

            {/* Other Articles */}
            <div className="space-y-4">
                {otherArticles.map(article => (
                    <Link to="/media" key={article.id} className="group flex items-center gap-4 bg-theme-secondary-bg p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <img src={article.imageUrl} alt={article.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0"/>
                        <div>
                            <h4 className="font-bold text-lg text-theme-dark group-hover:text-theme-primary transition-colors">{article.title}</h4>
                            <p className="text-sm text-theme-text-secondary">{article.date}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="text-center mt-8">
                <Link to="/media" className="font-bold text-theme-primary hover:underline">
                    View More News &rarr;
                </Link>
            </div>
        </div>
    );
};

export default NewsFeed;