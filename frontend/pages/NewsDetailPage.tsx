import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { NEWS } from '../constants';

const NewsDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // Find the news article by ID
    const article = NEWS.find(item => item.id.toString() === id);
    
    // If article not found, redirect to home
    if (!article) {
        navigate('/');
        return null;
    }

    // Get related articles (exclude current article)
    const relatedArticles = NEWS.filter(item => item.id !== article.id).slice(0, 5);

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="text-gray-700 hover:text-gray-900 transition-colors">
                            ← Back to Home
                        </Link>
                        <div className="text-gray-600 text-sm">
                            Latest News & Features
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Article Content */}
                    <div className="lg:col-span-3">
                        {/* Article Header */}
                        <div className="mb-8">
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                {article.title}
                            </h1>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
                                    🏷️ {article.category}
                                </span>
                                <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                                    ⚽ Football News
                                </span>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="mb-8">
                            <div className="relative rounded-lg overflow-hidden shadow-2xl">
                                <img 
                                    src={article.imageUrl} 
                                    alt={article.title}
                                    className="w-full h-96 lg:h-[500px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                        </div>

                        {/* Author and Date */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4 text-gray-600">
                                <span className="text-sm">📝 Admin Editor</span>
                                <span className="text-sm">•</span>
                                <span className="text-sm">{article.date}</span>
                            </div>
                            <button className="text-gray-600 hover:text-gray-800 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M15 8a3 3 0 10-6 0v3h6v-3zM5 8a3 3 0 116 0v3H5V8zM2 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"/>
                                </svg>
                            </button>
                        </div>

                        {/* Article Content */}
                        <div className="prose prose-lg max-w-none">
                            <div className="text-gray-800 space-y-6">
                                {/* Summary as sub-headline */}
                                <p className="text-xl text-gray-700 font-medium leading-relaxed">
                                    {article.summary}
                                </p>
                                
                                {/* Main content */}
                                <div className="space-y-4 text-gray-700 leading-relaxed">
                                    <p>
                                        In a stunning display of athleticism and skill, the latest developments in the football world 
                                        continue to captivate fans worldwide. This remarkable performance showcases the incredible 
                                        talent and dedication that defines modern football.
                                    </p>
                                    
                                    <p>
                                        The strategic approach taken by the team demonstrates exceptional planning and execution. 
                                        Key players have stepped up their game, delivering outstanding performances that have 
                                        reshaped the competitive landscape of the league.
                                    </p>
                                    
                                    <p>
                                        As the season progresses, these developments are setting new standards for excellence. 
                                        The combination of tactical innovation and individual brilliance continues to push the 
                                        boundaries of what's possible in professional football.
                                    </p>
                                    
                                    <p>
                                        Looking ahead, the implications of these achievements will undoubtedly influence 
                                        future strategies and inspire the next generation of football talent. The impact 
                                        extends far beyond the immediate results, shaping the future of the sport.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Content Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <h3 className="text-gray-900 text-xl font-bold mb-6">Related Content</h3>
                            <div className="space-y-4">
                                {relatedArticles.map((relatedArticle) => (
                                    <Link 
                                        key={relatedArticle.id}
                                        to={`/news/${relatedArticle.id}`}
                                        className="block group"
                                    >
                                        <div className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-all duration-300">
                                            <div className="relative h-32">
                                                <img 
                                                    src={relatedArticle.imageUrl} 
                                                    alt={relatedArticle.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute top-2 left-2">
                                                    <span className="bg-blue-600/80 text-white text-xs font-bold px-2 py-1 rounded">
                                                        {relatedArticle.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-gray-900 font-semibold text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    {relatedArticle.title}
                                                </h4>
                                                <p className="text-gray-500 text-xs mt-1">{relatedArticle.date}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            
                            {/* Additional Related Links */}
                            <div className="mt-8 space-y-3">
                                <Link to="/matches" className="block text-gray-600 hover:text-gray-800 transition-colors text-sm">
                                    📊 View All Match Reports
                                </Link>
                                <Link to="/table" className="block text-gray-600 hover:text-gray-800 transition-colors text-sm">
                                    🏆 League Standings
                                </Link>
                                <Link to="/clubs" className="block text-gray-600 hover:text-gray-800 transition-colors text-sm">
                                    ⚽ Club Information
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 mt-16">
                <div className="container mx-auto px-4 py-6">
                    <div className="text-center text-gray-600 text-sm">
                        <p>© 2024 NGL - The Heart of Football</p>
                        <p className="mt-2">Stay updated with the latest news and features from the league.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetailPage;