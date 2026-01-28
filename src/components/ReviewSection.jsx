import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reviewParams } from '../lib/api/reviews';
import Button from './Button';

const ReviewSection = ({ productId }) => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newReview, setNewReview] = useState({
        rating: 5,
        comment: ''
    });

    useEffect(() => {
        const loadReviews = async () => {
            try {
                const data = await reviewParams.fetchByProduct(productId);
                setReviews(data);
            } catch (err) {
                console.error("Error loading reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            loadReviews();
        }
    }, [productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            showToast('Please login to leave a review', 'info');
            return;
        }

        if (!newReview.comment.trim()) {
            showToast('Please write a comment', 'warning');
            return;
        }

        try {
            setSubmitting(true);
            const reviewData = {
                product_id: productId,
                user_id: user.id,
                rating: newReview.rating,
                comment: newReview.comment
            };

            const result = await reviewParams.create(reviewData);

            // Optimistically update UI
            const optimisticReview = {
                ...result,
                profiles: { full_name: profile?.full_name || 'Guest' }
            };

            setReviews(prev => [optimisticReview, ...prev]);
            setNewReview({ rating: 5, comment: '' });
            showToast('Review submitted successfully!', 'success');
        } catch (err) {
            console.error("Error submitting review:", err);
            showToast('Failed to submit review. Your session might have expired or the reviews table is not set up.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return (
        <section className="py-12 md:py-20 border-t border-border bg-white" id="reviews">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: Review Summary */}
                    <div className="lg:col-span-1">
                        <h2 className="text-2xl md:text-3xl font-bold font-outfit uppercase tracking-tighter mb-6">Customer Reviews</h2>
                        <div className="bg-background-alt/50 p-8 rounded-3xl border border-border/50 text-center">
                            <div className="text-5xl md:text-6xl font-bold text-primary font-outfit mb-2">{averageRating}</div>
                            <div className="flex justify-center gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={20}
                                        className={i < Math.round(averageRating) ? "fill-secondary text-secondary" : "text-border fill-border/10"}
                                    />
                                ))}
                            </div>
                            <p className="text-text-muted font-outfit text-sm font-bold uppercase tracking-widest">
                                Based on {reviews.length} reviews
                            </p>
                        </div>

                        {/* Submit Review Form */}
                        <div className="mt-8">
                            <h3 className="text-lg font-bold font-outfit uppercase tracking-tight mb-4">Write a Review</h3>
                            {user ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                                className="transition-transform active:scale-90"
                                            >
                                                <Star
                                                    size={24}
                                                    className={star <= newReview.rating ? "fill-secondary text-secondary" : "text-border"}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
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
                                    <Button variant="outline" size="small" onClick={() => window.location.href = '/login'}>Login Now</Button>
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
                                                                className={i < review.rating ? "fill-secondary text-secondary" : "text-border"}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                                    {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-muted font-outfit leading-relaxed">
                                                {review.comment}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <MessageSquare size={48} className="text-border mb-4 opacity-50" />
                                <h4 className="text-lg font-bold font-outfit text-text-main mb-1">No reviews yet</h4>
                                <p className="text-sm text-text-muted font-outfit">Be the first to share your thoughts on this product!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ReviewSection;
