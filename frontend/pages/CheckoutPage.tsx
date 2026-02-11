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
        <div className="min-h-screen bg-white pt-12 pb-24 px-4 font-sans uppercase">
            <div className="container mx-auto max-w-7xl">
                <h1 className="text-5xl font-black uppercase tracking-tighter mb-16 italic flex items-center gap-3">
                    <div className="w-2 h-12 bg-black"></div>
                    CHECKOUT
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Order Summary */}
                    <div className="lg:col-span-7">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-12">Order Summary</h2>
                        <div className="space-y-12">
                            {cart.map((item, idx) => (
                                <div key={`${item.id}-${item.selectedSize || idx}`} className="flex gap-8 group pb-8 border-b border-gray-50 last:border-0">
                                    <div className="w-32 h-40 bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">👕</div>
                                        )}
                                    </div>
                                    <div className="flex-grow flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black text-lg tracking-tight text-gray-900 leading-none">{item.name}</h3>
                                            <span className="font-black text-xl italic italic">₹{(item.price * item.quantity).toFixed(0)}</span>
                                        </div>
                                        {item.selectedSize && (
                                            <p className="text-[10px] font-black text-red-600 tracking-[0.2em] mb-6">SIZE: {item.selectedSize}</p>
                                        )}
                                        <div className="mt-auto flex justify-between items-center">
                                            <div className="flex items-center border-[1.5px] border-gray-200">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-sm font-black transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="w-10 h-10 flex items-center justify-center text-sm font-black border-x-[1.5px] border-gray-200">{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize)}
                                                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-sm font-black transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => onRemoveFromCart(item.id, item.selectedSize)}
                                                className="text-[10px] font-black text-gray-400 tracking-[0.3em] hover:text-red-600 transition-colors uppercase"
                                            >
                                                REMOVE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping & Payment */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-black text-white p-12 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-4 right-8 text-7xl font-black italic opacity-10 select-none pointer-events-none">NGL</div>

                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-10">Shipping Information</h2>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-[0.2em] text-gray-500 block uppercase">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className="w-full bg-[#111] border-none px-4 py-4 text-sm font-bold placeholder-gray-800 text-white focus:ring-1 focus:ring-gray-700 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-[0.2em] text-gray-500 block uppercase">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="john@example.com"
                                        className="w-full bg-[#111] border-none px-4 py-4 text-sm font-bold placeholder-gray-800 text-white focus:ring-1 focus:ring-gray-700 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-[0.2em] text-gray-500 block uppercase">Shipping Address</label>
                                    <textarea
                                        required
                                        name="address"
                                        rows={3}
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="123 Football St, League Town"
                                        className="w-full bg-[#111] border-none px-4 py-4 text-sm font-bold placeholder-gray-800 text-white focus:ring-1 focus:ring-gray-700 transition-all resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-[0.2em] text-gray-500 block uppercase">City</label>
                                        <input
                                            required
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            placeholder="Barcelona"
                                            className="w-full bg-[#111] border-none px-4 py-4 text-sm font-bold placeholder-gray-800 text-white focus:ring-1 focus:ring-gray-700 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-[0.2em] text-gray-500 block uppercase">Zip Code</label>
                                        <input
                                            required
                                            type="text"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            placeholder="08001"
                                            className="w-full bg-[#111] border-none px-4 py-4 text-sm font-bold placeholder-gray-800 text-white focus:ring-1 focus:ring-gray-700 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-12 mt-12 border-t border-gray-900">
                                    <div className="flex justify-between items-center mb-10">
                                        <span className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Total Due</span>
                                        <span className="text-3xl font-black italic italic">₹{total.toFixed(0)}</span>
                                    </div>

                                    <button
                                        disabled={isProcessing}
                                        type="submit"
                                        className={`w-full py-6 font-black uppercase tracking-[0.3em] text-sm transition-all relative overflow-hidden ${isProcessing ? 'bg-gray-800 cursor-not-allowed' : 'bg-[#e31e24] hover:bg-[#c4191f] text-white shadow-[0_20px_40px_rgba(227,30,36,0.15)]'}`}
                                    >
                                        {isProcessing ? (
                                            <div className="flex items-center justify-center">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            </div>
                                        ) : (
                                            'Complete Purchase'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="bg-[#f8f8f8] p-8 border border-gray-100">
                            <p className="text-[9px] font-black text-gray-400 tracking-[0.3em] mb-6 uppercase">Payment Methods</p>
                            <div className="flex flex-wrap gap-4 opacity-40">
                                <span className="bg-white px-4 py-1.5 text-[8px] font-black uppercase border border-gray-200">Visa</span>
                                <span className="bg-white px-4 py-1.5 text-[8px] font-black uppercase border border-gray-200">Mastercard</span>
                                <span className="bg-white px-4 py-1.5 text-[8px] font-black uppercase border border-gray-200">PayPal</span>
                                <span className="bg-white px-4 py-1.5 text-[8px] font-black uppercase border border-gray-200">Apple Pay</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 flex justify-end">
                    <button
                        onClick={() => navigate('/store')}
                        className="w-full lg:w-5/12 bg-white text-black border-2 border-black py-5 font-black uppercase tracking-[0.25em] text-[10px] hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Back to Collection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
