// Simplified toast hook using sonner under the hood or just a simple implementation for now
// Since I installed sonner, I should probably use it, but the code references use-toast.
// I'll create a wrapper or a simple implementation.

import { toast as sonnerToast } from "sonner"

export const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string; description: string; variant?: "default" | "destructive" }) => {
      if (variant === "destructive") {
        sonnerToast.error(title, { description })
      } else {
        sonnerToast.success(title, { description })
      }
    },
  }
}
