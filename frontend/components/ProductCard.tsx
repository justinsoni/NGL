import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full">
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                        <span className="text-4xl mb-2">👕</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">NGL OFFICIAL</span>
                    </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {product.tags?.includes('personalizable') && (
                        <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                            Personalizable
                        </span>
                    )}
                    {product.tags?.includes('new') && (
                        <span className="bg-[#A50044] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                            New Arrival
                        </span>
                    )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-center pb-6 bg-gradient-to-t from-black/50 to-transparent">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/store/product/${product.id || product._id}`);
                        }}
                        className="bg-white text-black font-bold uppercase text-xs py-2 px-6 hover:bg-gray-100 transition-colors"
                    >
                        Quick View
                    </button>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow cursor-pointer" onClick={() => navigate(`/store/product/${product.id || product._id}`)}>
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{product.category}</div>
                <h3 className="font-bold text-gray-900 leading-tight mb-2 flex-grow">{product.name}</h3>

                {product.sizes && product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {product.sizes.map(size => (
                            <span key={size} className="text-[10px] uppercase font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                {size}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-auto pt-2 border-t border-gray-100">
                    <p className="text-gray-900 font-bold">
                        ₹{product.price.toFixed(0)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
