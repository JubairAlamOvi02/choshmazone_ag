
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Input from '../components/Input';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { settingsParams, DEFAULT_CONTACT_SETTINGS } from '../lib/api/settings';

const Contact = () => {
    const [status, setStatus] = useState(null);

    // Synchronous initial cache read to avoid layout shift
    const [contactInfo, setContactInfo] = useState(() => ({
        title: settingsParams.getCached('contact_title') || DEFAULT_CONTACT_SETTINGS.contact_title,
        description: settingsParams.getCached('contact_description') || DEFAULT_CONTACT_SETTINGS.contact_description,
        showroomTitle: settingsParams.getCached('contact_showroom_title') || DEFAULT_CONTACT_SETTINGS.contact_showroom_title,
        showroomAddress: settingsParams.getCached('contact_showroom_address') || DEFAULT_CONTACT_SETTINGS.contact_showroom_address,
        emailTitle: settingsParams.getCached('contact_email_title') || DEFAULT_CONTACT_SETTINGS.contact_email_title,
        email: settingsParams.getCached('contact_email') || DEFAULT_CONTACT_SETTINGS.contact_email,
        phoneTitle: settingsParams.getCached('contact_phone_title') || DEFAULT_CONTACT_SETTINGS.contact_phone_title,
        phone: settingsParams.getCached('contact_phone') || DEFAULT_CONTACT_SETTINGS.contact_phone
    }));

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await settingsParams.getContactSettings();
                setContactInfo({
                    title: settings.contact_title,
                    description: settings.contact_description,
                    showroomTitle: settings.contact_showroom_title,
                    showroomAddress: settings.contact_showroom_address,
                    emailTitle: settings.contact_email_title,
                    email: settings.contact_email,
                    phoneTitle: settings.contact_phone_title,
                    phone: settings.contact_phone
                });
            } catch (err) {
                console.error('Failed to load contact settings:', err);
            }
        };
        loadSettings();
    }, []);

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
                            {contactInfo.title}
                        </h1>
                        <p className="text-lg text-text-muted mb-12 font-outfit max-w-md">
                            {contactInfo.description}
                        </p>

                        <div className="space-y-8">
                            <div className="flex gap-6 group">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-main mb-1 font-outfit">{contactInfo.showroomTitle}</h3>
                                    <p className="text-text-muted font-outfit leading-relaxed whitespace-pre-line">
                                        {contactInfo.showroomAddress}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-main mb-1 font-outfit">{contactInfo.emailTitle}</h3>
                                    <a href={`mailto:${contactInfo.email}`} className="text-text-muted hover:text-primary transition-colors font-outfit leading-relaxed">
                                        {contactInfo.email}
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-main mb-1 font-outfit">{contactInfo.phoneTitle}</h3>
                                    <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} className="text-text-muted hover:text-primary transition-colors font-outfit leading-relaxed">
                                        {contactInfo.phone}
                                    </a>
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
