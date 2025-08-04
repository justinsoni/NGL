import React, { useState, useMemo } from 'react';
import { PRODUCTS } from '../constants';
import { Product } from '../types';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden group transform transition-all duration-300 hover:shadow-xl">
        <div className="relative">
            {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-80 object-cover"/>
            ) : (
                <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No Image</p>
                    </div>
                </div>
            )}
            {product.tags?.includes('personalizable') && (
                <span className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 rounded">
                    Customizable
                </span>
            )}
        </div>
        <div className="p-4">
            <h3 className="font-semibold text-sm text-gray-800 leading-tight">{product.name}</h3>
            <p className="text-black font-bold text-lg mt-2">€{product.price.toFixed(2)}</p>
        </div>
    </div>
);

const StorePage: React.FC = () => {
    const [priceRange, setPriceRange] = useState([0, 95]);
    const [season, setSeason] = useState('25/26');
    const [productType, setProductType] = useState('All');
    const [size, setSize] = useState('All');
    const [gender, setGender] = useState('All');
    const [viewMode, setViewMode] = useState('grid');
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [sortBy, setSortBy] = useState('Características');

    const filteredProducts = useMemo(() => {
        return PRODUCTS.filter(p => {
            const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1];
            const typeMatch = productType === 'All' || p.category === productType;
            return priceMatch && typeMatch;
        });
    }, [priceRange, productType]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-red-600 rounded-full"></div>
                            <span className="font-semibold text-gray-800">Official Store</span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">KITS 25/26</h1>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                        {/* View Mode */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">VIEW AS</span>
                            <div className="flex space-x-1">
                                <button 
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                    </svg>
                                </button>
                                <button 
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Items per page */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">ITEMS PER PAGE</span>
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                                <option value={12}>12</option>
                                <option value={20}>20</option>
                                <option value={40}>40</option>
                            </select>
                        </div>

                        {/* Sort by */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">SORT BY</span>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                                <option value="Features">Features</option>
                                <option value="Price">Price</option>
                                <option value="Name">Name</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-8">
                    {/* Left Sidebar - Filters */}
                    <aside className="w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                            {/* Price Filter */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-900">PRICE</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span>€ {priceRange[0]}</span>
                                        <span>€ {priceRange[1]}</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            min="0"
                                            max="95"
                                            value={priceRange[0]}
                                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="95"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                                        />
                                    </div>
                                    <button className="w-full bg-black text-white font-bold py-2 px-4 rounded">
                                        APPLY
                                    </button>
                                </div>
                            </div>

                            {/* Season Filter */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-900">SEASON</h3>
                                <select 
                                    value={season} 
                                    onChange={(e) => setSeason(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    <option value="25/26">25/26</option>
                                    <option value="24/25">24/25</option>
                                </select>
                            </div>

                            {/* Product Type Filter */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-900">PRODUCT TYPE</h3>
                                <select 
                                    value={productType} 
                                    onChange={(e) => setProductType(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    <option value="All">All</option>
                                    <option value="Kits">Kits</option>
                                    <option value="Training">Training</option>
                                    <option value="Equipment">Equipment</option>
                                </select>
                            </div>

                            {/* Size Filter */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-900">SIZE</h3>
                                <select 
                                    value={size} 
                                    onChange={(e) => setSize(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    <option value="All">All</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                </select>
                            </div>

                            {/* Gender Filter */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-gray-900">GENDER</h3>
                                <select 
                                    value={gender} 
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    <option value="All">All</option>
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                    <option value="Kids">Kids</option>
                                </select>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content - Product Grid */}
                    <main className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default StorePage;