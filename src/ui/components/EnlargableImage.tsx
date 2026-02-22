import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/ui/dialog";
import { cn } from "@/ui/lib/utils";
import React, { useState } from "react";

interface EnlargableImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}

export function EnlargableImage({
  src,
  alt,
  className,
  imageClassName,
}: EnlargableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "relative cursor-zoom-in group overflow-hidden rounded-lg border border-slate-200 bg-slate-50",
            className,
          )}
        >
          <img
            src={src}
            alt={alt}
            className={cn("w-full h-full object-contain", imageClassName)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
        </div>
      </DialogTrigger>
      <DialogContent
        className="!max-w-[70vw] p-0 bg-black/90 border-none flex items-center justify-center outline-none [&>button:first-of-type]:hidden cursor-zoom-out"
        onClick={() => setOpen(false)}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{alt} Fullscreen</DialogTitle>
        <div className="flex h-[80vh] w-[80vw] items-center justify-center">
          <img
            src={src}
            alt={`${alt} Fullscreen`}
            className="w-full h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
