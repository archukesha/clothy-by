export default function Loading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-6">
            <div className="h-14 md:h-20 bg-neutral-100 rounded-lg animate-pulse w-3/4" />
            <div className="h-14 md:h-20 bg-neutral-100 rounded-lg animate-pulse w-1/2" />
            <div className="h-5 bg-neutral-100 rounded animate-pulse w-2/3" />
            <div className="h-12 bg-neutral-100 rounded-full animate-pulse w-44" />
          </div>
          <div className="md:col-span-5">
            <div className="aspect-[4/5] bg-neutral-100 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="h-7 w-32 bg-neutral-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] bg-neutral-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Recent */}
      <div className="max-w-7xl mx-auto px-4 py-14 border-t border-neutral-100">
        <div className="h-7 w-24 bg-neutral-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] bg-neutral-100 rounded-2xl animate-pulse" />
              <div className="h-3.5 w-16 bg-neutral-100 rounded animate-pulse" />
              <div className="h-4 bg-neutral-100 rounded animate-pulse" />
              <div className="h-5 w-20 bg-neutral-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
