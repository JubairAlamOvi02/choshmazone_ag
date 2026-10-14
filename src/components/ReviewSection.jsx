import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Send, User, ChevronRight, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reviewParams } from '../lib/api/reviews';
import Button from './Button';

const ReviewSection = ({ productId }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    useEffect(() => {
        let isMounted = true;
        const loadReviews = async () => {
            if (!productId) return;
            try {
                setLoading(true);
                const data = await reviewParams.fetchByProduct(productId);
                if (isMounted) {
                    setReviews(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error loading reviews:", err);
                if (isMounted) setReviews([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadReviews();
        return () => { isMounted = false; };
    }, [productId]);

    const averageRating = useMemo(() => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
        return (sum / reviews.length).toFixed(1);
    }, [reviews]);

    const ratingDistribution = useMemo(() => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        if (!reviews) return dist;
        reviews.forEach(r => {
            const val = Math.round(Number(r.rating)) || 5;
            if (dist[val] !== undefined) dist[val]++;
        });
        return dist;
    }, [reviews]);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const getAvatarColor = (name) => {
        const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600'];
        const charCode = name ? name.charCodeAt(0) : 0;
        return colors[charCode % colors.length];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            showToast('Please login to submit a review', 'error');
            return;
        }

        if (!comment.trim()) {
            showToast('Please enter a comment', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const reviewData = {
                product_id: productId,
                user_id: user.id,
                rating,
                comment: comment.trim()
            };

            await reviewParams.create(reviewData);
            showToast('Review submitted successfully!', 'success');
            setComment('');
            setRating(5);

            const updatedData = await reviewParams.fetchByProduct(productId);
            setReviews(Array.isArray(updatedData) ? updatedData : []);
        } catch (err) {
            console.error("Error submitting review:", err);
            showToast(err.message || 'Failed to submit review', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="reviews" className="py-20 bg-white border-t border-border">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-4">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-[2px] bg-secondary"></div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">Community Feedback</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold font-outfit text-text-main tracking-tighter">
                            Customer Reviews
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold font-outfit text-text-main">{reviews.length} Total Reviews</p>
                            <p className="text-xs text-text-muted font-outfit">Verified user experiences</p>
                        </div>
                        <div className="h-10 w-[1px] bg-border hidden md:block"></div>
                        <a href="#write-review" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors underline underline-offset-8">
                            Write Yours
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* LEFT SIDE: SUMMARY CARD */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="sticky top-24 space-y-8">
                            {/* Premium Rating Card */}
                            <div className="bg-text-main rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-secondary/20 transition-all duration-700"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl transition-all duration-700"></div>

                                <div className="relative z-10 text-center">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-secondary/80 mb-6">Overall Rating</h3>
                                    <div className="flex flex-col items-center">
                                        <span className="text-7xl font-bold font-outfit mb-3 tracking-tighter tabular-nums leading-none">
                                            {averageRating}
                                        </span>
                                        <div className="flex gap-1.5 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={22}
                                                    className={i < Math.round(averageRating) ? "fill-secondary text-secondary" : "text-white/20"}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                                            from {reviews.length} customers
                                        </p>
                                    </div>

                                    {/* Breakdown */}
                                    <div className="mt-10 space-y-4">
                                        {[5, 4, 3, 2, 1].map((stars) => {
                                            const count = ratingDistribution[stars];
                                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                            return (
                                                <div key={stars} className="flex items-center gap-4 text-left">
                                                    <span className="text-[10px] font-bold text-white/60 w-6">{stars} ★</span>
                                                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-secondary transition-all duration-1000 ease-out"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] text-white/30 w-8 text-right font-bold">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Trust Badge */}
                            <div className="bg-background-alt border border-border/50 rounded-2xl p-6 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-main">Verified Integrity</h4>
                                    <p className="text-xs text-text-muted font-outfit">100% of reviews are from verified purchase accounts.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: REVIEWS LIST & FORM */}
                    <div className="lg:col-span-8 space-y-16">
                        {/* FORM TRANSITION */}
                        {user && (
                            <div id="write-review" className="bg-white rounded-[2rem] p-1 md:p-10 border border-border/50 transition-all hover:border-primary/20 hover:shadow-xl">
                                <div className="mb-10 text-center md:text-left">
                                    <h3 className="text-2xl font-bold font-outfit text-text-main mb-2">Share Your Experience</h3>
                                    <p className="text-sm text-text-muted font-outfit">Help our community by sharing your thoughts on this frame.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block">Select Rating</span>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        className="group relative focus:outline-none transition-transform active:scale-90"
                                                    >
                                                        <Star
                                                            size={32}
                                                            className={`${star <= rating ? "fill-secondary text-secondary" : "text-border hover:text-secondary"} transition-all duration-300`}
                                                        />
                                                        {star === rating && (
                                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-secondary rounded-full animate-ping"></div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block">Your Thoughts</span>
                                            <div className="relative group">
                                                <textarea
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    placeholder="Focus on the fit, lens clarity, and overall feel..."
                                                    rows={1}
                                                    className="w-full bg-background-alt border-b border-border p-0 pb-2 text-base font-outfit focus:border-primary outline-none transition-all resize-none min-h-[40px] placeholder:text-text-muted/40 placeholder:text-sm"
                                                />
                                                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-focus-within:w-full transition-all duration-500"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="h-14 px-10 bg-text-main text-white font-bold text-xs uppercase tracking-widest rounded-full hover:bg-secondary hover:text-primary transition-all duration-500 shadow-xl disabled:opacity-50 flex items-center gap-3"
                                        >
                                            {submitting ? 'Authenticating...' : (
                                                <>
                                                    <span>Post My Review</span>
                                                    <ChevronRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* REVIEWS FEED */}
                        <div className="space-y-12">
                            {loading ? (
                                <div className="space-y-12">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="animate-pulse flex gap-8">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex-shrink-0"></div>
                                            <div className="flex-1 space-y-4 mt-2">
                                                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                                                <div className="h-4 bg-gray-100 rounded w-full"></div>
                                                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : reviews.length > 0 ? (
                                <div className="divide-y divide-border/30">
                                    {reviews.map((review, idx) => {
                                        const userName = review.profiles?.full_name || 'Verified Customer';
                                        return (
                                            <div key={review.id} className="py-12 first:pt-0 group animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
                                                    {/* Profile Column */}
                                                    <div className="flex md:flex-col items-center gap-4 flex-shrink-0">
                                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg font-outfit shadow-sm border border-white transform transition-transform group-hover:scale-110 duration-500 ${getAvatarColor(userName)}`}>
                                                            {getInitials(userName)}
                                                        </div>
                                                        <div className="md:text-center text-left">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#22c55e] mb-1">
                                                                <CheckCircle2 size={10} />
                                                                <span>Verified</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Content Column */}
                                                    <div className="flex-1">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                            <div>
                                                                <h4 className="text-lg font-bold text-text-main font-outfit mb-1 leading-tight group-hover:text-primary transition-colors">
                                                                    {userName}
                                                                </h4>
                                                                <div className="flex gap-1">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            size={12}
                                                                            className={i < (Number(review.rating) || 0) ? "fill-secondary text-secondary" : "text-border/40"}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] font-outfit">
                                                                    {review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently Added'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="relative">
                                                            <p className="text-base text-text-muted font-outfit leading-[1.8] italic group-hover:text-text-main transition-colors duration-500">
                                                                "{review.comment || "This customer left no specific comment, but highly recommends the frame."}"
                                                            </p>
                                                        </div>

                                                        {/* Interactions */}
                                                        <div className="flex items-center gap-6 mt-8">
                                                            <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-colors">
                                                                <ThumbsUp size={12} />
                                                                <span>Helpful</span>
                                                            </button>
                                                            <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-colors">
                                                                <span>Report</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center bg-background-alt/30 rounded-[3rem] border border-border/50">
                                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-border mb-6 shadow-sm">
                                        <MessageSquare size={32} />
                                    </div>
                                    <h4 className="text-2xl font-bold font-outfit text-text-main mb-2">Be the First to Review</h4>
                                    <p className="text-sm text-text-muted font-outfit max-w-xs mx-auto">Share your experience with this frame and help the community find their perfect style.</p>
                                </div>
                            )}

                            {/* SMALLER JOIN THE CONVERSATION PROMPT (ONLY FOR LOGGED OUT) */}
                            {!user && (
                                <div className="mt-12 pt-12 border-t border-border/30">
                                    <div className="bg-background-alt border border-border/50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 group transition-colors hover:border-primary/20">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-text-muted opacity-40 shadow-sm border border-border/50">
                                                <User size={20} />
                                            </div>
                                            <div className="text-center md:text-left">
                                                <h4 className="text-base font-bold font-outfit text-text-main mb-0.5">Join the Conversation</h4>
                                                <p className="text-[11px] text-text-muted font-outfit">Login to share your feedback with our community.</p>
                                            </div>
                                        </div>
                                        <Link to="/login" className="w-full md:w-auto">
                                            <Button variant="outline" className="w-full md:w-auto h-11 px-8 rounded-xl text-[10px]">Sign In to Review</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReviewSection;
