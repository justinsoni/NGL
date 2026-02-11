import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const StorePage: React.FC<{ products: Product[] }> = ({ products }) => {
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterGender, setFilterGender] = useState('All');
    const [sortBy, setSortBy] = useState('Featured');

    const filteredProducts = useMemo(() => {
        let result = [...products];

        if (filterCategory !== 'All') {
            result = result.filter(p => p.category === filterCategory);
        }

        if (filterGender !== 'All') {
            result = result.filter(p => {
                if (p.gender) return p.gender === filterGender || p.gender === 'Unisex';
                const lowerTags = p.tags?.map(t => t.toLowerCase()) || [];
                if (filterGender === 'Men') return !lowerTags.includes('women') && !lowerTags.includes('kids');
                if (filterGender === 'Women') return lowerTags.includes('women');
                if (filterGender === 'Kids') return lowerTags.includes('kids');
                return true;
            });
        }

        if (sortBy === 'Price: Low to High') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'Price: High to Low') {
            result.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'Newest') {
            result.sort((a, b) => String(b.id).localeCompare(String(a.id)));
        }

        return result;
    }, [products, filterCategory, filterGender, sortBy]);

    const categories = ['All', 'Kits', 'Training', 'Equipment', 'Accessories'];
    const genders = ['All', 'Men', 'Women', 'Kids'];

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#4c7b6d] to-[#1a3c4a] text-white py-20 px-4 mb-8">
                <div className="container mx-auto text-center">
                    <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 italic">Official Store</h1>
                    <div className="w-24 h-1 bg-white/40 mx-auto mb-6"></div>
                    <p className="text-gray-400 max-w-2xl mx-auto uppercase text-xs font-bold tracking-widest">
                        Wear your colors with pride. Shop the latest kits, training wear, and fan essentials directly from the club.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-16">
                {/* Top Filter Bar */}
                <div className="flex flex-col lg:flex-row justify-between items-center mb-10 sticky top-0 bg-white z-10 py-4 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 w-full md:w-auto overflow-x-auto">
                        <div className="flex space-x-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${filterCategory === cat ? 'bg-[#4c7b6d] text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                        <div className="flex space-x-4">
                            {genders.map(g => (
                                <button
                                    key={g}
                                    onClick={() => setFilterGender(g)}
                                    className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${filterGender === g ? 'text-[#4c7b6d] underline underline-offset-8' : 'text-gray-500 hover:text-black'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 lg:mt-0 flex items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mr-4">Sort By</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-[10px] font-black uppercase tracking-[0.2em] border-none focus:ring-0 cursor-pointer bg-transparent"
                        >
                            <option>Featured</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Newest</option>
                        </select>
                    </div>
                </div>

                {/* Product Grid */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No products found matching your filters.</p>
                        <button
                            onClick={() => { setFilterCategory('All'); setFilterGender('All'); }}
                            className="mt-4 text-red-600 text-xs font-black uppercase tracking-[0.2em] hover:underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StorePage;
