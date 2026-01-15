import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Input from '../components/Input';
import { useCart } from '../context/CartContext';
import './Checkout.css';

const Checkout = () => {
    const { cartItems, cartTotal } = useCart();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        zip: '',
        country: 'Bangladesh',
        paymentMethod: 'bkash', // 'bkash' or 'cod'
        bkashNumber: '',
        bkashTrxId: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Submitted:', formData);

        // Mock validation
        if (formData.paymentMethod === 'bkash') {
            if (!formData.bkashNumber || !formData.bkashTrxId) {
                alert('Please enter bKash details');
                return;
            }
        }

        // Simulate API call
        setTimeout(() => {
            navigate('/order-success');
        }, 1000);
    };

    return (
        <div className="checkout-page">
            <Navbar />
            <main className="container section-padding">
                <div className="checkout-layout">
                    {/* Left Column: Forms */}
                    <div className="checkout-form-container">
                        <section className="checkout-section">
                            <h2 className="h3">Contact Information</h2>
                            <form id="checkout-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        name="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Phone Number"
                                        type="tel"
                                        name="phone"
                                        placeholder="+8801..."
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </form>
                        </section>

                        <section className="checkout-section">
                            <h2 className="h3">Shipping Address</h2>
                            <div className="form-row">
                                <Input
                                    label="First Name"
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Last Name"
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <Input
                                label="Address"
                                type="text"
                                name="address"
                                placeholder="Street address, apartment, etc."
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                            <div className="form-row">
                                <Input
                                    label="City"
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                                <Input
                                    label="Zip / Postal Code"
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <Input
                                label="Country"
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                disabled
                            />
                        </section>

                        <section className="checkout-section">
                            <h2 className="h3">Payment Method</h2>
                            <div className="payment-methods">
                                <label className={`payment-method-card ${formData.paymentMethod === 'bkash' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="bkash"
                                        checked={formData.paymentMethod === 'bkash'}
                                        onChange={handleChange}
                                        className="payment-radio"
                                    />
                                    <div className="payment-content">
                                        <span className="payment-title">bKash Payment</span>
                                        <span className="payment-subtitle">Pay via bKash mobile banking</span>
                                    </div>
                                </label>

                                <label className={`payment-method-card ${formData.paymentMethod === 'cod' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleChange}
                                        className="payment-radio"
                                    />
                                    <div className="payment-content">
                                        <span className="payment-title">Cash on Delivery</span>
                                        <span className="payment-subtitle">Pay upon receiving your order</span>
                                    </div>
                                </label>
                            </div>

                            {formData.paymentMethod === 'bkash' && (
                                <div className="bkash-details">
                                    <p className="instruction-text">Please send <strong>${cartTotal.toFixed(2)}</strong> to <strong>017XXXXXXXX</strong> and enter the Transaction ID below.</p>
                                    <Input
                                        label="bKash Number"
                                        type="text"
                                        name="bkashNumber"
                                        placeholder="017XXXXXXXX"
                                        value={formData.bkashNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Transaction ID (TrxID)"
                                        type="text"
                                        name="bkashTrxId"
                                        placeholder="8N7..."
                                        value={formData.bkashTrxId}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}

                            {formData.paymentMethod === 'cod' && (
                                <div className="cod-details">
                                    <p className="instruction-text">You can pay in cash when our courier delivers your package.</p>
                                </div>
                            )}
                        </section>

                        <div className="checkout-actions">
                            <Link to="/cart">
                                <Button variant="ghost">Return to Cart</Button>
                            </Link>
                            <Button variant="primary" size="large" onClick={handleSubmit}>Continue to Payment</Button>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="checkout-summary">
                        <h3 className="h4 summary-title">Order Summary</h3>
                        <div className="summary-items">
                            {cartItems.map(item => (
                                <div key={item.id} className="summary-item">
                                    <div className="summary-item-image-wrapper">
                                        <img src={item.image} alt={item.title} className="summary-item-image" />
                                        <span className="summary-item-quantity">{item.quantity}</span>
                                    </div>
                                    <div className="summary-item-details">
                                        <p className="summary-item-title">{item.title}</p>
                                        <p className="summary-item-variant">{item.style}</p>
                                    </div>
                                    <div className="summary-item-price">${(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="summary-totals">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span>Calculated next step</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Checkout;
