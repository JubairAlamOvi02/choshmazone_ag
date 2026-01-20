import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';

const OrderSuccess = () => {
    // Generate a random order ID for display
    const orderId = Math.floor(100000 + Math.random() * 900000);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
                <div className="max-w-[600px] w-full text-center animate-in zoom-in duration-500">
                    <CheckCircle size={80} className="text-secondary mx-auto mb-8" />
                    <h1 className="text-3xl md:text-5xl font-bold mb-6 font-outfit uppercase tracking-wider text-text-main">
                        Order Confirmed!
                    </h1>
                    <div className="bg-gray-50 border border-border rounded-xl p-8 mb-10">
                        <p className="text-lg text-text-main font-outfit mb-4">
                            Your order <strong className="text-primary tracking-widest font-bold">#{orderId}</strong> has been successfully placed.
                        </p>
                        <p className="text-sm text-text-muted font-outfit">
                            We've sent a confirmation email with all your order details.
                            Our team will start processing it right away!
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/" className="w-full sm:w-auto">
                            <Button variant="primary" size="large" className="w-full">Continue Shopping</Button>
                        </Link>
                        <Link to="/orders" className="w-full sm:w-auto">
                            <Button variant="outline" size="large" className="w-full">View My Orders</Button>
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderSuccess;
