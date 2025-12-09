import { Skeleton } from "./skeleton"
import { TableBody, TableCell, TableRow } from "./table"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  variant?: "default" | "images"
}

export function TableSkeleton({ rows = 5, columns = 7, variant = "default" }: TableSkeletonProps) {
  // Images table specific skeleton
  if (variant === "images") {
    return (
      <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {/* Preview Column */}
            <TableCell className="px-5 py-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
            </TableCell>

            {/* Filename Column */}
            <TableCell className="px-5 py-4">
              <Skeleton className="h-4 w-32" />
            </TableCell>

            {/* Project Column */}
            <TableCell className="px-5 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </TableCell>

            {/* User Column */}
            <TableCell className="px-5 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </TableCell>

            {/* Size / Dimensions Column */}
            <TableCell className="px-5 py-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </TableCell>

            {/* Category Column */}
            <TableCell className="px-5 py-4">
              <Skeleton className="h-6 w-20 rounded-full" />
            </TableCell>

            {/* Uploaded Column */}
            <TableCell className="px-5 py-4">
              <Skeleton className="h-4 w-28" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    )
  }

  // Default table skeleton
  return (
    <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex} className="px-5 py-4">
              {colIndex === 0 ? (
                // First column - User with avatar
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ) : colIndex === 1 ? (
                // Second column - User ID
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4 rounded" />
                </div>
              ) : colIndex === columns - 1 ? (
                // Last column - Actions
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ) : (
                // Other columns - Regular text
                <Skeleton className="h-4 w-24" />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
