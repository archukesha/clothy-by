export default function ListingLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-4 w-16 bg-neutral-100 rounded animate-pulse" />
        <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Image skeleton */}
        <div className="aspect-[3/4] bg-neutral-100 rounded-2xl animate-pulse" />

        {/* Info skeleton */}
        <div className="space-y-5">
          <div>
            <div className="h-6 w-20 bg-neutral-100 rounded-full animate-pulse mb-2" />
            <div className="h-7 w-3/4 bg-neutral-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-neutral-100 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-neutral-50 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
