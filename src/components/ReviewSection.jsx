import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, Send, User } from 'lucide-react';
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
                console.log(`[ReviewSection] Loaded ${data?.length || 0} reviews for product ${productId}`);
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

            // Reload reviews
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
        <section id="reviews" className="py-12 md:py-20 border-t border-border bg-white">
            <div className="container mx-auto px-4">
                <div className="mb-12 md:mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold font-outfit uppercase tracking-tighter mb-2">Customer Reviews</h2>
                    <div className="w-12 h-1 bg-secondary"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: Summary and Form */}
                    <div className="space-y-10">
                        {/* Summary */}
                        <div className="bg-background-alt/50 p-8 rounded-2xl border border-border/50">
                            <div className="text-center mb-8">
                                <div className="text-5xl font-bold font-outfit text-primary mb-2">{averageRating}</div>
                                <div className="flex justify-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={20}
                                            className={i < Math.round(averageRating) ? "fill-secondary text-secondary" : "text-border"}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Based on {reviews.length} reviews</p>
                            </div>

                            <div className="space-y-3">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const count = ratingDistribution[stars];
                                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                    return (
                                        <div key={stars} className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold w-4">{stars}★</span>
                                            <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-secondary transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] text-text-muted w-8 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submission Form */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold font-outfit uppercase tracking-tight">Write a Review</h3>
                            {user ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Rating</span>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        size={24}
                                                        className={star <= rating ? "fill-secondary text-secondary" : "text-border"}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        rows={4}
                                        className="w-full bg-background-alt border border-border/50 rounded-2xl p-4 text-sm font-outfit focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full h-12 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? 'Submitting...' : (
                                            <>
                                                <Send size={16} />
                                                <span>Submit Review</span>
                                            </>
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <div className="bg-background-alt/30 p-6 rounded-2xl border border-dashed border-border text-center">
                                    <p className="text-sm text-text-muted font-outfit mb-4">Please login to write a review.</p>
                                    <Link to="/login">
                                        <Button variant="outline" size="small">Login Now</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Review List */}
                    <div className="lg:col-span-2">
                        {loading ? (
                            <div className="space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex gap-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : reviews.length > 0 ? (
                            <div className="space-y-8">
                                {reviews.map((review) => (
                                    <div key={review.id} className="flex gap-4 md:gap-6 group">
                                        <div className="w-12 h-12 bg-background-alt rounded-full flex items-center justify-center flex-shrink-0 border border-border/50 overflow-hidden">
                                            <User size={24} className="text-text-muted" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-text-main font-outfit leading-none mb-1">
                                                        {review.profiles?.full_name || 'Verified Customer'}
                                                    </h4>
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={12}
                                                                className={i < (Number(review.rating) || 0) ? "fill-secondary text-secondary" : "text-border"}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                                    {review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-muted font-outfit leading-relaxed">
                                                {review.comment || "No comment provided."}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <MessageSquare size={48} className="text-border mb-4 opacity-50" />
                                <h4 className="text-lg font-bold font-outfit text-text-main mb-1">No reviews yet</h4>
                                <p className="text-sm text-text-muted font-outfit">Be the first to share your thoughts!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReviewSection;
