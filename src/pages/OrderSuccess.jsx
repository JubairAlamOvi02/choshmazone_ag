import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import './OrderSuccess.css';

const OrderSuccess = () => {
    // Generate a random order ID for display
    const orderId = Math.floor(100000 + Math.random() * 900000);

    return (
        <div className="order-success-page">
            <Navbar />
            <main className="container section-padding text-center">
                <div className="success-content">
                    <CheckCircle size={80} className="success-icon" />
                    <h1 className="h2 success-title">Thank You for Your Order!</h1>
                    <p className="success-message">
                        Your order <strong>#{orderId}</strong> has been placed successfully.
                    </p>
                    <p className="success-details">
                        We have sent an order confirmation email to your inbox.
                    </p>
                    <Link to="/">
                        <Button variant="primary" size="large">Continue Shopping</Button>
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderSuccess;
