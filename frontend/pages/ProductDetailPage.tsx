import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface ProductDetailPageProps {
    products: Product[];
    onAddToCart: (product: Product, size?: string, quantity?: number) => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ products, onAddToCart }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedSize, setSelectedSize] = React.useState<string>('');
    const [activeImage, setActiveImage] = React.useState<string>('');
    const [zoomStyle, setZoomStyle] = React.useState<React.CSSProperties>({});

    const product = products.find(p => String(p.id) === id || p._id === id);

    React.useEffect(() => {
        if (product) {
            setActiveImage(product.imageUrl);
            setSelectedSize(''); // Reset size when product changes
            window.scrollTo(0, 0); // Scroll to top when product changes
        }
    }, [product]);

    // Extraction logic for recommendations
    const getRecommendations = () => {
        if (!product || !products.length) return [];

        const name = product.name.toLowerCase();

        // Define common clubs to look for in the name
        const clubs = [
            'manchester city', 'man city',
            'wolverhampton', 'wolves',
            'west ham',
            'arsenal', 'chelsea', 'liverpool', 'manchester united', 'man utd', 'tottenham', 'spurs',
            'barcelona', 'real madrid', 'bayern'
        ];

        const detectedClub = clubs.find(club => name.includes(club));
        const category = product.category;

        // Strict filtering: same club AND same category
        let filtered = products.filter(p => {
            if (p.id === product.id || p._id === product._id) return false;

            const pName = p.name.toLowerCase();
            const pCategory = p.category;

            // Match category strictly
            const categoryMatch = pCategory === category;

            // Match club strictly (if detected)
            const clubMatch = detectedClub ? pName.includes(detectedClub) : true;

            return clubMatch && categoryMatch;
        });

        // Ensure we only show matches that satisfy both if a club was detected
        if (detectedClub) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(detectedClub));
        }

        return filtered.slice(0, 4);
    };

    const recommendations = getRecommendations();

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left - window.scrollX) / width) * 100;
        const y = ((e.pageY - top - window.scrollY) / height) * 100;

        setZoomStyle({
            transformOrigin: `${x}% ${y}%`,
            transform: 'scale(2)',
            transition: 'transform 0.1s ease-out'
        });
    };

    const handleMouseLeave = () => {
        setZoomStyle({
            transform: 'scale(1)',
            transition: 'transform 0.3s ease-in-out'
        });
    };

    const handleAddToBag = () => {
        if (product) {
            if (product.sizes && product.sizes.length > 0 && !selectedSize) {
                toast.error('Please select a size');
                return false;
            }
            onAddToCart(product, selectedSize);
            return true;
        }
        return false;
    };

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Product Not Found</h2>
                <button
                    onClick={() => navigate('/store')}
                    className="bg-black text-white px-8 py-3 font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-colors"
                >
                    Back to Store
                </button>
            </div>
        );
    }

    // Mock images if none provided to show the gallery layout
    const galleryImages = product.images && product.images.length > 0
        ? product.images
        : [product.imageUrl, product.imageUrl, product.imageUrl, product.imageUrl].filter(Boolean);

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8 lg:py-16">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                    {/* Image Section - Interactive Gallery */}
                    <div className="lg:w-7/12 flex flex-col-reverse lg:flex-row gap-4">
                        {/* Thumbnails Sidebar */}
                        <div className="flex lg:flex-col gap-8 overflow-x-auto lg:overflow-y-auto lg:w-32 no-scrollbar">
                            {galleryImages.map((img, idx) => (
                                <button
                                    key={`${img}-${idx}`}
                                    onClick={() => setActiveImage(img)}
                                    className={`w-20 h-20 lg:w-full lg:h-32 flex-shrink-0 border-2 transition-all ${activeImage === img ? 'border-black' : 'border-gray-100 hover:border-gray-300'}`}
                                >
                                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>

                        {/* Main Image with Zoom */}
                        <div className="flex-grow group/main relative">
                            <div
                                className="relative aspect-[4/5] bg-gray-50 overflow-hidden cursor-crosshair border border-gray-100"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                                {activeImage ? (
                                    <img
                                        src={activeImage}
                                        alt={product.name}
                                        style={zoomStyle}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        <span className="text-6xl mb-4">👕</span>
                                        <span className="text-xs font-black uppercase tracking-[0.2em]">NGL OFFICIAL</span>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Arrows */}
                            {galleryImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const idx = galleryImages.indexOf(activeImage);
                                            const prevIdx = (idx - 1 + galleryImages.length) % galleryImages.length;
                                            setActiveImage(galleryImages[prevIdx]);
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/main:opacity-100 transition-opacity hover:bg-white"
                                    >
                                        <span className="text-xl font-bold">‹</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const idx = galleryImages.indexOf(activeImage);
                                            const nextIdx = (idx + 1) % galleryImages.length;
                                            setActiveImage(galleryImages[nextIdx]);
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/main:opacity-100 transition-opacity hover:bg-white"
                                    >
                                        <span className="text-xl font-bold">›</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="lg:w-5/12">
                        <div className="mb-8">
                            <div className="flex justify-between items-start mb-2">
                                <h1 className="text-4xl font-black uppercase tracking-tighter italic text-gray-900 leading-none">{product.name}</h1>
                                <span className="text-2xl font-black italic text-red-600">₹{product.price.toFixed(0)}</span>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 block">{product.category}</span>
                        </div>

                        {product.description && (
                            <div className="mb-10 p-8 bg-gray-50 border-l-[6px] border-black">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-gray-400">The Story</h3>
                                <p className="text-sm text-gray-700 leading-relaxed italic font-medium">{product.description}</p>
                            </div>
                        )}

                        {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-5">Select Size</h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.sizes.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`min-w-[56px] h-14 border-2 flex items-center justify-center text-xs font-black uppercase tracking-widest transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black text-black'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-auto space-y-4 pt-8">
                            <button
                                onClick={handleAddToBag}
                                className="w-full bg-black text-white py-6 font-black uppercase tracking-[0.3em] text-sm hover:bg-gray-900 transition-all transform hover:-translate-y-1 shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
                            >
                                Add to Bag
                            </button>
                            <button
                                onClick={() => {
                                    if (handleAddToBag()) {
                                        navigate('/checkout');
                                    }
                                }}
                                className="w-full bg-red-600 text-white py-6 font-black uppercase tracking-[0.3em] text-sm hover:bg-red-700 transition-all transform hover:-translate-y-1 shadow-[0_20px_40px_rgba(220,38,38,0.2)]"
                            >
                                Buy Now
                            </button>
                            <button
                                onClick={() => navigate('/store')}
                                className="w-full bg-white text-black border-2 border-black py-5 font-black uppercase tracking-[0.25em] text-[10px] hover:bg-gray-50 transition-all"
                            >
                                Back to Collection
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recommendations Section */}
                {recommendations.length > 0 && (
                    <div className="mt-24 border-t border-gray-100 pt-16">
                        <h2 className="text-2xl font-black uppercase tracking-[0.15em] mb-10 italic">You Might Also Like</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {recommendations.map(rec => (
                                <ProductCard key={rec.id || rec._id} product={rec} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;
