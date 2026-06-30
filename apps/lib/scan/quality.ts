export type ScanQualityTone = "ready" | "warning" | "blocked";

export type ScanQualitySignal = {
  detail: string;
  id: "sharpness" | "distance" | "lighting" | "framing" | "orientation";
  label: string;
  tone: ScanQualityTone;
};

export type ScanQualityReport = {
  canSave: boolean;
  flags: string[];
  headline: string;
  ocrSummary: string;
  signals: ScanQualitySignal[];
  tone: ScanQualityTone;
};

type ImageMetrics = {
  aspectRatio: number;
  brightness: number;
  edgeScore: number;
  height: number;
  width: number;
};

async function loadImageMetrics(file: File): Promise<ImageMetrics> {
  const blobUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to inspect the selected image."));
      element.src = blobUrl;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const sampleWidth = Math.max(32, Math.min(256, width));
    const sampleHeight = Math.max(32, Math.round((sampleWidth / width) * height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("Canvas inspection is not available in this browser.");
    }

    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    context.drawImage(image, 0, 0, sampleWidth, sampleHeight);

    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
    const grayscale = new Float32Array(sampleWidth * sampleHeight);
    let brightnessTotal = 0;

    for (let index = 0; index < grayscale.length; index += 1) {
      const offset = index * 4;
      const value = data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
      grayscale[index] = value;
      brightnessTotal += value;
    }

    let edgeTotal = 0;
    let edgeSamples = 0;

    for (let y = 1; y < sampleHeight - 1; y += 1) {
      for (let x = 1; x < sampleWidth - 1; x += 1) {
        const center = grayscale[y * sampleWidth + x];
        const left = grayscale[y * sampleWidth + (x - 1)];
        const right = grayscale[y * sampleWidth + (x + 1)];
        const up = grayscale[(y - 1) * sampleWidth + x];
        const down = grayscale[(y + 1) * sampleWidth + x];
        const laplacian = Math.abs(4 * center - left - right - up - down);
        edgeTotal += laplacian;
        edgeSamples += 1;
      }
    }

    return {
      aspectRatio: width / height,
      brightness: brightnessTotal / grayscale.length,
      edgeScore: edgeSamples ? edgeTotal / edgeSamples : 0,
      height,
      width
    };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export async function analyzeScanQuality(file: File, rotation: number): Promise<ScanQualityReport> {
  const metrics = await loadImageMetrics(file);
  const minDimension = Math.min(metrics.width, metrics.height);
  const signals: ScanQualitySignal[] = [];
  const flags: string[] = [];

  if (metrics.edgeScore < 10) {
    signals.push({
      detail: "The page looks too soft for reliable text extraction. Retake with steadier focus.",
      id: "sharpness",
      label: "Blur detected",
      tone: "blocked"
    });
    flags.push("blurry");
  } else if (metrics.edgeScore < 16) {
    signals.push({
      detail: "Text edges are softer than ideal. A closer retake should improve OCR accuracy.",
      id: "sharpness",
      label: "Soft focus",
      tone: "warning"
    });
    flags.push("soft-focus");
  } else {
    signals.push({
      detail: "Text edges look sharp enough for OCR review.",
      id: "sharpness",
      label: "Sharpness",
      tone: "ready"
    });
  }

  if (minDimension < 1000) {
    signals.push({
      detail: "Move closer so the document fills more of the frame before you save it.",
      id: "distance",
      label: "Low resolution",
      tone: "warning"
    });
    flags.push("distant");
  } else {
    signals.push({
      detail: "Resolution is sufficient for document review.",
      id: "distance",
      label: "Distance",
      tone: "ready"
    });
  }

  if (metrics.brightness < 90) {
    signals.push({
      detail: "The page is darker than ideal. Increase front lighting to avoid missed fields.",
      id: "lighting",
      label: "Low light",
      tone: "warning"
    });
    flags.push("dark");
  } else {
    signals.push({
      detail: "Lighting looks balanced for extraction.",
      id: "lighting",
      label: "Lighting",
      tone: "ready"
    });
  }

  if (metrics.aspectRatio < 0.45 || metrics.aspectRatio > 2.2) {
    signals.push({
      detail: "The selected image does not look framed like a single document page.",
      id: "framing",
      label: "Invalid framing",
      tone: "blocked"
    });
    flags.push("invalid-framing");
  } else if (metrics.aspectRatio < 0.6 || metrics.aspectRatio > 1.9) {
    signals.push({
      detail: "The document appears clipped or heavily skewed. Reframe before saving.",
      id: "framing",
      label: "Uneven framing",
      tone: "warning"
    });
    flags.push("tilted");
  } else {
    signals.push({
      detail: "The page framing looks usable.",
      id: "framing",
      label: "Framing",
      tone: "ready"
    });
  }

  signals.push({
    detail:
      rotation % 180 === 0
        ? "Orientation is upright for standard review."
        : "Rotation is applied for review. Save uses the adjusted orientation.",
    id: "orientation",
    label: "Orientation",
    tone: "ready"
  });

  const tone = signals.some((signal) => signal.tone === "blocked")
    ? "blocked"
    : signals.some((signal) => signal.tone === "warning")
      ? "warning"
      : "ready";

  return {
    canSave: tone !== "blocked",
    flags,
    headline:
      tone === "ready"
        ? "Capture looks ready."
        : tone === "warning"
          ? "Capture is usable, but a retake would likely improve OCR."
          : "Retake before saving.",
    ocrSummary:
      tone === "ready"
        ? "This image should be a strong candidate for ABBYY extraction once OCR is enabled."
        : tone === "warning"
          ? "ABBYY extraction may miss fields unless you improve the scan quality."
          : "Extraction quality will be poor until the framing or focus issue is fixed.",
    signals,
    tone
  };
}
