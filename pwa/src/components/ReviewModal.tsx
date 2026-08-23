import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InfoIcon, Loader2, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { getReviewUrl } from "../api/config"
import { useTranslation } from "../hooks/useTranslation"
import { RestaurantSettings, ReviewData } from "../types/menu"
import { executeRecaptcha, loadRecaptcha } from "../utils/recaptcha"
import { MenuDialog } from "./MenuBottomSheet"
import { StarRating } from "./StarRating"

interface ReviewModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentLanguage: string
  settings: RestaurantSettings
}

const emptyReview = (): ReviewData => ({
  service: 0,
  taste: 0,
  cleanliness: 0,
  comment: "",
  customerName: "",
  customerEmail: "",
})

export const ReviewModal = ({
  isOpen,
  onOpenChange,
  currentLanguage,
  settings,
}: ReviewModalProps) => {
  const { t } = useTranslation(currentLanguage)
  const [reviewData, setReviewData] = useState<ReviewData>(emptyReview())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recaptchaEnabled = Boolean(settings.recaptcha?.enabled && settings.recaptcha.site_key)

  useEffect(() => {
    if (!isOpen || !recaptchaEnabled || !settings.recaptcha?.site_key) return
    loadRecaptcha(settings.recaptcha.site_key).catch(() => {
      // Script load errors are handled again on submit.
    })
  }, [isOpen, recaptchaEnabled, settings.recaptcha?.site_key])

  const handleSubmit = async () => {
    if (reviewData.service === 0 || reviewData.taste === 0 || reviewData.cleanliness === 0) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      let recaptchaToken = ""

      if (recaptchaEnabled && settings.recaptcha?.site_key) {
        recaptchaToken = await executeRecaptcha(settings.recaptcha.site_key, "review_submit")
      }

      const response = await fetch(getReviewUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewData,
          language: currentLanguage,
          recaptcha_token: recaptchaToken,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          onOpenChange(false)
          setSubmitted(false)
          setReviewData(emptyReview())
        }, 2000)
        return
      }

      setErrorMessage(
        typeof payload?.message === "string" ? payload.message : t("review.submitError"),
      )
    } catch (error) {
      console.error("Review submission failed:", error)
      setErrorMessage(t("review.submitError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = reviewData.service > 0 && reviewData.taste > 0 && reviewData.cleanliness > 0
  const privacyUrl = settings.privacy_policy_url || "https://happybites.io/privacy-policy"

  return (
    <MenuDialog open={isOpen} onOpenChange={onOpenChange} title={t("review.rateExperience")}>
      {submitted ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-8 w-8 fill-primary text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{t("review.thankYou")}</h3>
          <p className="text-sm text-muted-foreground">{t("review.thankYouMessage")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="review-name">
                {t("review.customerName")}{" "}
                <span className="text-xs text-muted-foreground">({t("review.optional")})</span>
              </Label>
              <Input
                id="review-name"
                value={reviewData.customerName}
                onChange={(e) => setReviewData((prev) => ({ ...prev, customerName: e.target.value }))}
                placeholder={t("review.customerNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-email">
                {t("review.customerEmail")}{" "}
                <span className="text-xs text-muted-foreground">({t("review.optional")})</span>
              </Label>
              <Input
                id="review-email"
                type="email"
                value={reviewData.customerEmail}
                onChange={(e) => setReviewData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                placeholder={t("review.customerEmailPlaceholder")}
              />
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {t("review.customerInfoNote")}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("review.service")}</Label>
              <StarRating
                rating={reviewData.service}
                onRate={(rating) => setReviewData((prev) => ({ ...prev, service: rating }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("review.taste")}</Label>
              <StarRating
                rating={reviewData.taste}
                onRate={(rating) => setReviewData((prev) => ({ ...prev, taste: rating }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t("review.cleanliness")}</Label>
              <StarRating
                rating={reviewData.cleanliness}
                onRate={(rating) => setReviewData((prev) => ({ ...prev, cleanliness: rating }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">{t("review.comments")}</Label>
            <Textarea
              id="review-comment"
              value={reviewData.comment}
              onChange={(e) => setReviewData((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder={t("review.commentsPlaceholder")}
              className="min-h-[100px]"
            />
          </div>

          {errorMessage && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {t("review.privacyNotice")}{" "}
            <a href={privacyUrl} target="_blank" rel="noreferrer" className="underline">
              {t("review.privacyPolicy")}
            </a>
            .
          </p>

          {recaptchaEnabled && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Bu site reCAPTCHA ile korunmaktadır. Google{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Gizlilik Politikası
              </a>{" "}
              ve{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Hizmet Şartları
              </a>{" "}
              geçerlidir.
            </p>
          )}

          <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("review.submitting")}
              </>
            ) : (
              t("common.submit")
            )}
          </Button>
        </div>
      )}
    </MenuDialog>
  )
}
