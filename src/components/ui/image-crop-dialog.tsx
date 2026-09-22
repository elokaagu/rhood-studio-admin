"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

const OUTPUT_SQUARE = 1080;
const OUTPUT_WIDE_W = 1600;
const OUTPUT_WIDE_H = 900;

function coverScale(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number
) {
  return Math.max(boxWidth / imageWidth, boxHeight / imageHeight);
}

function clampPan(
  panX: number,
  panY: number,
  zoom: number,
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number
) {
  const scale = coverScale(imageWidth, imageHeight, boxWidth, boxHeight) * zoom;
  const extraX = Math.max(0, (imageWidth * scale - boxWidth) / 2);
  const extraY = Math.max(0, (imageHeight * scale - boxHeight) / 2);
  return {
    x: Math.min(extraX, Math.max(-extraX, panX)),
    y: Math.min(extraY, Math.max(-extraY, panY)),
  };
}

export function ImageCropDialog({
  open,
  src,
  aspect = "square",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  src: string | null;
  aspect?: "square" | "wide";
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const boxWidth = 320;
  const boxHeight = aspect === "square" ? 320 : 180;
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImageSize({ width: 1, height: 1 });
    }
  }, [open, src]);

  const naturalWidth = imageSize.width;
  const naturalHeight = imageSize.height;

  const applyPan = (nextX: number, nextY: number, nextZoom = zoom) => {
    const image = imageRef.current;
    if (!image?.naturalWidth) {
      setPan({ x: nextX, y: nextY });
      return;
    }
    setPan(
      clampPan(
        nextX,
        nextY,
        nextZoom,
        image.naturalWidth,
        image.naturalHeight,
        boxWidth,
        boxHeight
      )
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    applyPan(
      drag.originX + (event.clientX - drag.startX),
      drag.originY + (event.clientY - drag.startY)
    );
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const handleZoom = (nextZoom: number) => {
    const clamped = Math.min(3, Math.max(1, nextZoom));
    setZoom(clamped);
    applyPan(pan.x, pan.y, clamped);
  };

  const handleConfirm = () => {
    const image = imageRef.current;
    if (!image?.naturalWidth) return;

    const scale =
      coverScale(
        image.naturalWidth,
        image.naturalHeight,
        boxWidth,
        boxHeight
      ) * zoom;
    const displayedWidth = image.naturalWidth * scale;
    const displayedHeight = image.naturalHeight * scale;
    const left = (boxWidth - displayedWidth) / 2 + pan.x;
    const top = (boxHeight - displayedHeight) / 2 + pan.y;

    const sourceX = Math.max(0, -left / scale);
    const sourceY = Math.max(0, -top / scale);
    const sourceW = Math.min(image.naturalWidth - sourceX, boxWidth / scale);
    const sourceH = Math.min(image.naturalHeight - sourceY, boxHeight / scale);

    const outputWidth = aspect === "square" ? OUTPUT_SQUARE : OUTPUT_WIDE_W;
    const outputHeight = aspect === "square" ? OUTPUT_SQUARE : OUTPUT_WIDE_H;
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      0,
      0,
      outputWidth,
      outputHeight
    );
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onConfirm(
          new File([blob], `opportunity-${Date.now()}.jpg`, {
            type: "image/jpeg",
          })
        );
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust image</DialogTitle>
          <DialogDescription>
            Zoom and drag to frame the crop, then save.
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative mx-auto overflow-hidden rounded-lg bg-black cursor-grab active:cursor-grabbing touch-none"
          style={{ width: boxWidth, height: boxHeight }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={(event) => {
            event.preventDefault();
            handleZoom(zoom + (event.deltaY < 0 ? 0.1 : -0.1));
          }}
        >
          {src && (
            <img
              ref={imageRef}
              src={src}
              alt="Crop preview"
              draggable={false}
              onLoad={(event) => {
                const image = event.currentTarget;
                setImageSize({
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                });
                applyPan(0, 0, zoom);
              }}
              className="absolute max-w-none select-none pointer-events-none"
              style={{
                width: naturalWidth * coverScale(naturalWidth, naturalHeight, boxWidth, boxHeight) * zoom,
                height: naturalHeight * coverScale(naturalWidth, naturalHeight, boxWidth, boxHeight) * zoom,
                left: (boxWidth - naturalWidth * coverScale(naturalWidth, naturalHeight, boxWidth, boxHeight) * zoom) / 2 + pan.x,
                top: (boxHeight - naturalHeight * coverScale(naturalWidth, naturalHeight, boxWidth, boxHeight) * zoom) / 2 + pan.y,
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleZoom(zoom - 0.1)}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={([value]) => handleZoom(value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleZoom(zoom + 0.1)}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Save crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
