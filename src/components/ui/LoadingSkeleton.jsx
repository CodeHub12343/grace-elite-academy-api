export function LoadingSkeleton({ rows = 3, className = '' }) {
  const skeletons = Array.from({ length: rows })
  return (
    <div className={`animate-pulse ${className}`}>
      {skeletons.map((_, idx) => (
        <div key={idx} className="h-4 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
      ))}
    </div>
  )
}

