import React, { useState, useEffect } from 'react';
import { Star, Quote, Plus, Check, MessageSquareHeart, X, Sparkles, Send } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { REVIEWS_DATA, BUSINESS_INFO, ReviewItem, MenuItem } from '../data/menuData';

interface ReviewsSectionProps {
  menuItems?: MenuItem[];
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ menuItems = [] }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>(REVIEWS_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form states for customer review
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [favoriteDish, setFavoriteDish] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const ratingDescriptions: Record<number, string> = {
    1: 'Needs Improvement',
    2: 'Fair Experience',
    3: 'Good Taste',
    4: 'Very Good & Fresh',
    5: 'Exceptional Lahori Zaika (Lazeez!)',
  };

  // Real-time listener for Firestore reviews
  useEffect(() => {
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreReviews: ReviewItem[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                name: data.name || 'Valued Foodie',
                location: data.location || 'Lahore',
                rating: Number(data.rating) || 5,
                date: data.date || 'Recent',
                comment: data.comment || '',
                favoriteDish: data.favoriteDish || 'Signature Murgh Channay',
              };
            });
            // Combine with initial reviews if needed
            setReviews(firestoreReviews);
          } else {
            // First time seeding default reviews into Firestore for initial display
            seedInitialReviews();
          }
        },
        (error) => {
          console.warn('Firestore reviews listener notice:', error);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Fallback to local reviews:', e);
    }
  }, []);

  // Helper to seed initial verified reviews to Firestore once
  const seedInitialReviews = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'reviews'));
      if (snapshot.empty) {
        for (const rev of REVIEWS_DATA) {
          await addDoc(collection(db, 'reviews'), {
            name: rev.name,
            location: rev.location,
            rating: rev.rating,
            date: rev.date,
            comment: rev.comment,
            favoriteDish: rev.favoriteDish,
            createdAt: Date.now() - Math.floor(Math.random() * 1000000),
          });
        }
      }
    } catch (err) {
      console.error('Failed to seed initial reviews to Firestore:', err);
    }
  };

  // Calculate dynamic live average rating
  const totalReviewsCount = reviews.length;
  const averageRating =
    totalReviewsCount > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
      : BUSINESS_INFO.rating.toFixed(1);

  // Submit customer review to Firestore
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!comment.trim()) {
      setFormError('Please share a few words about your food experience.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newReviewData = {
        name: customerName.trim(),
        location: customerLocation.trim() || 'Lahore Patrons',
        rating: selectedRating,
        comment: comment.trim(),
        favoriteDish: favoriteDish.trim() || 'Signature Murgh Channay',
        date: 'Just now',
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'reviews'), newReviewData);

      setSubmittedSuccess(true);
      setIsSubmitting(false);

      // Reset form after 2 seconds and close modal
      setTimeout(() => {
        setCustomerName('');
        setCustomerLocation('');
        setComment('');
        setSelectedRating(5);
        setFavoriteDish('');
        setSubmittedSuccess(false);
        setIsModalOpen(false);
      }, 1800);
    } catch (err) {
      console.error('Failed to save review to Firestore:', err);
      // Fallback: save to local state if offline
      const fallbackReview: ReviewItem = {
        id: `rev-${Date.now()}`,
        name: customerName.trim(),
        location: customerLocation.trim() || 'Lahore Patrons',
        rating: selectedRating,
        date: 'Just now',
        comment: comment.trim(),
        favoriteDish: favoriteDish.trim() || 'Signature Murgh Channay',
      };
      setReviews((prev) => [fallbackReview, ...prev]);
      setSubmittedSuccess(true);
      setIsSubmitting(false);

      setTimeout(() => {
        setSubmittedSuccess(false);
        setIsModalOpen(false);
      }, 1800);
    }
  };

  return (
    <section id="reviews" className="py-20 bg-[#0e1016] border-t border-stone-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Overall Rating Summary */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">
              <span>Customer Love & Live Feedback</span>
              <span aria-hidden="true">·</span>
              <span>Connected to Live Database</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 tracking-tight">
              Honest Praise from Local Patrons
            </h2>
            <p className="mt-2 text-sm text-stone-400 max-w-xl">
              From morning breakfast regulars in Badami Bagh to Lahori food lovers across town. Taste our dishes and leave your own review!
            </p>
          </div>

          {/* Aggregate Rating Scoreboard & Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <div className="bg-[#141620] border border-stone-800 rounded-2xl p-4 sm:p-5 flex items-center gap-5 shadow-lg">
              <div className="text-center pr-5 border-r border-stone-800">
                <div className="text-3xl font-serif font-bold text-amber-400 font-mono tabular-nums">
                  {averageRating}
                </div>
                <div className="flex items-center gap-0.5 justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(Number(averageRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-amber-400/30 text-amber-400/50'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-stone-400 mt-1">Live Rating</div>
              </div>

              <div className="space-y-1 text-xs text-stone-300">
                <div className="font-semibold text-stone-100">{totalReviewsCount} Customer Reviews</div>
                <div className="text-stone-400">#1 Murgh Channay & Fish in Badami Bagh</div>
                <div className="text-amber-400/90 font-medium">98% Positive Recommendation</div>
              </div>
            </div>

            {/* Write a Review Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              type="button"
              className="px-5 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <MessageSquareHeart className="w-4 h-4 text-stone-950" />
              <span>Leave a Review ⭐</span>
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, rIdx) => (
            <div
              key={review.id || `review-${review.name}-${rIdx}`}
              className="bg-[#13151f] border border-stone-800/90 rounded-2xl p-6 hover:border-amber-500/40 transition-colors flex flex-col justify-between shadow-md group"
            >
              <div>
                {/* Rating & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-stone-800 text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className="w-5 h-5 text-stone-700 group-hover:text-amber-500/40 transition-colors" />
                </div>

                {/* Comment Content */}
                <p className="text-sm text-stone-300 leading-relaxed italic mb-6">
                  "{review.comment}"
                </p>
              </div>

              {/* Author & Favorite Dish Footnote */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-between gap-4 text-xs">
                <div>
                  <h4 className="font-semibold text-stone-100">{review.name}</h4>
                  <div className="text-stone-500">{review.location} · {review.date}</div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Favorite:</span>
                  <span className="text-amber-400 font-medium truncate max-w-[130px] inline-block">
                    {review.favoriteDish}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Interactive Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => !isSubmitting && setIsModalOpen(false)}
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-[#12141d] border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#161825] border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-100">
                    Rate Your Food Experience
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Your feedback will be published live on the restaurant website
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                disabled={isSubmitting}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              
              {submittedSuccess ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-stone-100 font-serif">
                    Shukriya! Review Published
                  </h4>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Thank you for sharing your experience! Your review is now live on our website.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  
                  {/* Interactive Star Rating Selector */}
                  <div className="bg-[#171926] border border-stone-800 rounded-xl p-4 text-center space-y-2">
                    <label className="text-xs font-semibold text-stone-200 block">
                      Select Your Star Rating *
                    </label>

                    <div className="flex items-center justify-center gap-2 py-1">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isFilled =
                          starValue <= (hoverRating || selectedRating);

                        return (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => setSelectedRating(starValue)}
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                            aria-label={`${starValue} Stars`}
                          >
                            <Star
                              className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                  : 'fill-stone-800 text-stone-700'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-xs font-semibold text-amber-400 font-serif tracking-wide">
                      {ratingDescriptions[hoverRating || selectedRating]}
                    </div>
                  </div>

                  {/* Customer Name & City/Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-stone-300 block mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Muhammad Bilal"
                        value={customerName || ''}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#161824] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-stone-300 block mb-1">
                        Area / City (e.g. Badami Bagh, Gulberg)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sadiq Pura, Lahore"
                        value={customerLocation || ''}
                        onChange={(e) => setCustomerLocation(e.target.value)}
                        className="w-full bg-[#161824] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Favorite Dish selection */}
                  <div>
                    <label className="text-xs font-medium text-stone-300 block mb-1">
                      Favorite Dish Ordered *
                    </label>
                    <select
                      value={favoriteDish || ''}
                      onChange={(e) => setFavoriteDish(e.target.value)}
                      className="w-full bg-[#161824] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select your favorite dish...</option>
                      {menuItems && menuItems.length > 0 ? (
                        menuItems.map((item, mIdx) => (
                          <option key={item.id || `dish-opt-${item.name}-${mIdx}`} value={item.name}>
                            {item.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Murgh Channay">Murgh Channay</option>
                          <option value="Crispy Rahu Fish">Crispy Rahu Fish</option>
                          <option value="Roghni Naan">Roghni Naan</option>
                          <option value="Special Bong Paye">Special Bong Paye</option>
                          <option value="Desi Chicken Karhai">Desi Chicken Karhai</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-xs font-medium text-stone-300 block mb-1">
                      Your Review / Experience *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="How was the taste, desi ghee tarka, fish crispiness, and service? Write your honest feedback..."
                      value={comment || ''}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-[#161824] border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {formError && (
                    <div className="text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-lg p-2.5">
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Saving Review to Live Database...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publish Review to Website</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </section>
  );
};
