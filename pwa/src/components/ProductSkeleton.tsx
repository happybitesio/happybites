import { Card, CardContent } from "@/components/ui/card"

interface ProductSkeletonProps {
  isDarkMode: boolean
}

export const ProductSkeleton = ({ isDarkMode }: ProductSkeletonProps) => (
  <Card
    className={`border-0 border-b last:border-b-0 rounded-none ${
      isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
    }`}
  >
    <CardContent className="p-0">
      <div className="flex">
        <div className="relative w-20 h-20 flex-shrink-0">
          <div
            className={`w-full h-full animate-pulse aspect-square ${
              isDarkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          />
        </div>
        <div className="flex-1 p-3 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div
              className={`h-5 w-32 animate-pulse rounded ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-6 w-16 animate-pulse rounded ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            />
          </div>
          <div
            className={`h-4 w-full animate-pulse rounded mb-2 ${
              isDarkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          />
          <div className="flex gap-1">
            <div
              className={`h-5 w-16 animate-pulse rounded ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-5 w-12 animate-pulse rounded ${
                isDarkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)
