import React from 'react';
import Skeleton from './Skeleton';

const DashboardSkeleton = () => {
    return (
        <div className="animate-in fade-in duration-700">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-12 w-40 rounded-xl" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <Skeleton className="w-12 h-12 rounded-xl" />
                            <Skeleton className="w-16 h-4" />
                        </div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                ))}
            </div>

            {/* Charts & Recent Orders Skeleton */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-8">
                {/* Chart Skeleton */}
                <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                    {/* Fake Chart Bars/Area */}
                    <div className="h-[300px] w-full flex items-end justify-between gap-2 px-4 pb-4">
                        {[...Array(7)].map((_, i) => (
                            <Skeleton key={i} className={`w-full rounded-t-lg mx-1`} style={{ height: `${Math.random() * 60 + 20}%` }} />
                        ))}
                    </div>
                </div>

                {/* Recent Orders Skeleton */}
                <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-16" />
                    </div>

                    <div className="space-y-6 flex-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div>
                                        <Skeleton className="h-4 w-24 mb-1" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-20 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
