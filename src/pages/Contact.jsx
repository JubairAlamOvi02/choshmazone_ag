
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Input from '../components/Input';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
    const [status, setStatus] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('Thank you for reaching out! We will get back to you soon.');
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="container mx-auto px-4 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start max-w-6xl mx-auto">

                    {/* Contact Info */}
                    <div className="animate-in slide-in-from-left-4 duration-700">
                        <h1 className="text-4xl md:text-5xl font-bold font-outfit uppercase tracking-tighter text-text-main mb-6">
                            Get in Touch
                        </h1>
                        <p className="text-lg text-text-muted mb-12 font-outfit max-w-md">
                            Have questions about our premium eyewear or your recent order?
                            Our dedicated support team is here to assist you.
                        </p>

                        <div className="space-y-8">
                            <div className="flex gap-6 group">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-main mb-1 font-outfit">Visit Our Showroom</h3>
                                    <p className="text-text-muted font-outfit leading-relaxed">
                                        123 Vision Street, Suite 456<br />
                                        Dhaka, Bangladesh
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-main mb-1 font-outfit">Email Support</h3>
                                    <p className="text-text-muted font-outfit leading-relaxed">support@choshmazone.com</p>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-main mb-1 font-outfit">Call Our Hotline</h3>
                                    <p className="text-text-muted font-outfit leading-relaxed">+880 1234 567890</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl shadow-black/5 border border-border w-full animate-in slide-in-from-right-4 duration-700">
                        {status ? (
                            <div className="py-20 text-center space-y-4 animate-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Send size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-text-main font-outfit uppercase">Message Sent</h2>
                                <p className="text-text-muted font-outfit">{status}</p>
                                <Button onClick={() => setStatus(null)} variant="outline" className="mt-8">Send Another Message</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Full Name" placeholder="e.g. John Doe" required className="font-outfit" />
                                    <Input label="Email Address" type="email" placeholder="john@example.com" required className="font-outfit" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-text-main uppercase tracking-[0.2em] font-outfit">
                                        Your Message
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3.5 rounded-lg border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-outfit text-text-main placeholder:text-text-muted/50 min-h-[160px] resize-none"
                                        placeholder="Tell us what's on your mind..."
                                        required
                                    ></textarea>
                                </div>
                                <Button type="submit" variant="primary" size="large" className="w-full shadow-lg shadow-black/5 font-outfit uppercase tracking-widest">
                                    Send Inquiry
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
