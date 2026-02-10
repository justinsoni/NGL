import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CartItem } from '../types';

interface CheckoutPageProps {
    cart: CartItem[];
    onUpdateQuantity: (productId: string | number, delta: number, size?: string) => void;
    onRemoveFromCart: (productId: string | number, size?: string) => void;
    onClearCart: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, onUpdateQuantity, onRemoveFromCart, onClearCart }) => {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        zipCode: ''
    });

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            toast.error('Your bag is empty');
            return;
        }

        setIsProcessing(true);

        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            onClearCart();
            toast.success('Order placed successfully! Thank you for shopping with NGL.', {
                duration: 6000,
                icon: '🎉'
            });
            navigate('/store');
        }, 2000);
    };

    if (cart.length === 0 && !isProcessing) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <div className="text-6xl mb-6">🛒</div>
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Your bag is empty</h2>
                <button
                    onClick={() => navigate('/store')}
                    className="bg-black text-white px-8 py-3 font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-colors shadow-lg"
                >
                    Back to Store
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-12 pb-24 px-4">
            <div className="container mx-auto max-w-6xl">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-12 italic border-l-8 border-black pl-6">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Order Summary */}
                    <div className="lg:col-span-7 bg-white p-8 shadow-sm border border-gray-100 rounded-lg">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8 pb-4 border-b border-gray-100">Order Summary</h2>
                        <div className="space-y-8">
                            {cart.map((item, idx) => (
                                <div key={`${item.id}-${item.selectedSize || idx}`} className="flex gap-6 group">
                                    <div className="w-24 h-30 bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 rounded">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">👕</div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black uppercase text-sm tracking-tight text-gray-900">{item.name}</h3>
                                            <span className="font-bold text-gray-900 italic">₹{(item.price * item.quantity).toFixed(0)}</span>
                                        </div>
                                        {item.selectedSize && (
                                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-4">Size: {item.selectedSize}</p>
                                        )}
                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center border border-gray-200">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize)}
                                                    className="p-1 px-4 hover:bg-gray-50 text-xs font-black transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="px-4 text-xs font-black border-x border-gray-200">{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize)}
                                                    className="p-1 px-4 hover:bg-gray-50 text-xs font-black transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => onRemoveFromCart(item.id, item.selectedSize)}
                                                className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-red-600 transition-colors flex items-center gap-1"
                                            >
                                                <span>Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping & Payment */}
                    <div className="lg:col-span-5 flex flex-col gap-8">
                        <div className="bg-black text-white p-8 shadow-xl rounded-lg overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl pointer-events-none italic font-black">NGL</div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8">Shipping Information</h2>
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/10 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 placeholder-gray-600 text-white rounded transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/10 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 placeholder-gray-600 text-white rounded transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Shipping Address</label>
                                    <textarea
                                        required
                                        name="address"
                                        rows={3}
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/10 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 placeholder-gray-600 text-white rounded transition-all resize-none"
                                        placeholder="123 Football St, League Town"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">City</label>
                                        <input
                                            required
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/10 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 placeholder-gray-600 text-white rounded transition-all"
                                            placeholder="Barcelona"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Zip Code</label>
                                        <input
                                            required
                                            type="text"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/10 border-none px-4 py-3 text-sm focus:ring-2 focus:ring-red-600 placeholder-gray-600 text-white rounded transition-all"
                                            placeholder="08001"
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 mt-8 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Due</span>
                                        <span className="text-2xl font-black italic">₹{total.toFixed(0)}</span>
                                    </div>
                                    <button
                                        disabled={isProcessing}
                                        type="submit"
                                        className={`w-full py-5 font-black uppercase tracking-[0.2em] text-sm transition-all transform hover:-translate-y-1 shadow-2xl relative overflow-hidden ${isProcessing ? 'bg-gray-800 cursor-not-allowed' : 'bg-red-600 hover:bg-white hover:text-red-600'}`}
                                    >
                                        <span className={isProcessing ? 'opacity-0' : 'opacity-100'}>Complete Purchase</span>
                                        {isProcessing && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-gray-100 p-6 rounded-lg">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Payment Methods</p>
                            <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                                <span className="bg-white px-3 py-1 text-[8px] font-black uppercase border border-gray-200">Visa</span>
                                <span className="bg-white px-3 py-1 text-[8px] font-black uppercase border border-gray-200">Mastercard</span>
                                <span className="bg-white px-3 py-1 text-[8px] font-black uppercase border border-gray-200">PayPal</span>
                                <span className="bg-white px-3 py-1 text-[8px] font-black uppercase border border-gray-200">Apple Pay</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
