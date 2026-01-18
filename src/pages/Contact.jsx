
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Input from '../components/Input';

const Contact = () => {
    const [status, setStatus] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('Thank you for reaching out! We will get back to you soon.');
    };

    return (
        <div className="contact-page">
            <Navbar />
            <main className="container section-padding" style={{ minHeight: '60vh' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>

                    {/* Contact Info */}
                    <div>
                        <h1 className="h1" style={{ marginBottom: '1rem' }}>Get in Touch</h1>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>
                            Have questions about our products or your order? We're here to help.
                        </p>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 className="h3" style={{ marginBottom: '0.5rem' }}>Visit Us</h3>
                            <p style={{ color: '#555' }}>
                                123 Vision Street, Suite 456<br />
                                Dhaka, Bangladesh
                            </p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 className="h3" style={{ marginBottom: '0.5rem' }}>Email Us</h3>
                            <p style={{ color: '#555' }}>support@choshmazone.com</p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 className="h3" style={{ marginBottom: '0.5rem' }}>Call Us</h3>
                            <p style={{ color: '#555' }}>+880 1234 567890</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        {status ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-success)' }}>
                                {status}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <Input label="Full Name" placeholder="John Doe" required />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <Input label="Email Address" type="email" placeholder="john@example.com" required />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Message</label>
                                    <textarea
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '4px',
                                            border: '1px solid var(--color-border)',
                                            minHeight: '120px',
                                            fontFamily: 'inherit'
                                        }}
                                        placeholder="How can we help you?"
                                        required
                                    ></textarea>
                                </div>
                                <Button type="submit" variant="primary" size="large" style={{ width: '100%' }}>
                                    Send Message
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
