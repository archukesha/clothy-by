export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-16 bg-neutral-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
      </div>

      {/* Title */}
      <div className="mb-6">
        <div className="h-8 w-40 bg-neutral-100 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-28 bg-neutral-100 rounded animate-pulse" />
      </div>

      {/* Subcategory chips */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-neutral-100 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] bg-neutral-100 rounded-2xl animate-pulse" />
            <div className="h-4 w-16 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
            <div className="h-5 w-20 bg-neutral-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
