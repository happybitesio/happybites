import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  onRate: (rating: number) => void
}

export const StarRating = ({ rating, onRate }: StarRatingProps) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          className={`h-7 w-7 transition-colors ${
            star <= rating ? "text-yellow-400" : "text-muted-foreground/40"
          }`}
        >
          <Star className={`h-full w-full ${star <= rating ? "fill-current" : ""}`} />
        </button>
      ))}
    </div>
  )
}
