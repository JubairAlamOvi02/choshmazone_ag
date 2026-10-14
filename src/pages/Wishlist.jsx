import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';

const EmptyWishlist = ({ user }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Heart size={32} className="text-gray-300 fill-gray-100" />
        </div>
        <h2 className="text-2xl font-bold font-outfit uppercase tracking-wider mb-2 text-text-main">
            Your wishlist is empty
        </h2>
        <p className="text-text-muted font-outfit mb-8 max-w-md mx-auto">
            {user
                ? "Looks like you haven't saved any items yet. Browse our collection and save your favorites!"
                : "Login to save your favorites and access them from any device."}
        </p>
        <div className="flex gap-4">
            <Link to="/shop">
                <Button variant="primary">Start Shopping</Button>
            </Link>
            {!user && (
                <Link to="/login">
                    <Button variant="outline">Login Account</Button>
                </Link>
            )}
        </div>
    </div>
);

const Wishlist = () => {
    const { wishlist, loading } = useWishlist();
    const { user } = useAuth();



    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <div className="bg-background-alt/50 border-b border-border">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <h1 className="text-3xl md:text-4xl font-bold font-outfit uppercase tracking-tighter text-text-main mb-2">
                        My Wishlist
                    </h1>
                    <p className="text-text-muted font-outfit">
                        {loading ? 'Syncing...' : `${wishlist.length} Saved Items`}
                    </p>
                </div>
            </div>

            <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="bg-gray-100 aspect-square rounded-md"></div>
                                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : wishlist.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                        {wishlist.map((item) => (
                            <ProductCard key={item.wishlist_id || item.id} product={item} />
                        ))}
                    </div>
                ) : (
                    <EmptyWishlist user={user} />
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Wishlist;
