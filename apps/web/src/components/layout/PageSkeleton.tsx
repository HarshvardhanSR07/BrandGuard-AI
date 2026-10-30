import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading page content">
      {/* Header bar placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7ebe3]">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-[#e8ece3] rounded-md" />
          <div className="h-4 w-72 bg-[#eef2ea] rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-[#e8ece3] rounded-xl" />
          <div className="h-9 w-28 bg-[#e8ece3] rounded-xl" />
        </div>
      </div>

      {/* KPI Cards placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-[#e7ebe3] space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-[#eef2ea] rounded" />
              <div className="h-6 w-6 bg-[#e8ece3] rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-[#e8ece3] rounded" />
            <div className="h-3 w-28 bg-[#eef2ea] rounded" />
          </div>
        ))}
      </div>

      {/* Main card or table placeholder */}
      <div className="p-6 bg-white rounded-xl border border-[#e7ebe3] space-y-4 min-h-[360px]">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 bg-[#e8ece3] rounded" />
          <div className="h-8 w-48 bg-[#eef2ea] rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-[#f9faf7] rounded-lg border border-[#f0f3ec]" />
          ))}
        </div>
      </div>
    </div>
  );
};
