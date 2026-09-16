const PROCESSABLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_OUTPUT_DIMENSION = 2600;
const JPEG_QUALITY = 0.92;

type Dimensions = {
  height: number;
  width: number;
};

type CropBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ScanImageProcessingMetadata = {
  autoCropApplied: boolean;
  enhancements: string[];
  originalDimensions: Dimensions | null;
  originalMimeType: string;
  originalSizeBytes: number;
  outputDimensions: Dimensions | null;
  outputMimeType: string;
  outputSizeBytes: number;
  skippedReason: string | null;
};

export type ScanImageProcessingResult = {
  file: File;
  metadata: ScanImageProcessingMetadata;
};

export function canProcessScanImage(file: File | null) {
  return Boolean(file && PROCESSABLE_IMAGE_TYPES.has(file.type));
}

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360;
}

function replaceImageExtension(fileName: string) {
  const baseName = fileName.replace(/\.[a-z0-9]+$/i, "") || "scan";
  return `${baseName}.jpg`;
}

async function loadImage(file: File) {
  const blobUrl = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("This browser cannot process the selected image format."));
      image.src = blobUrl;
    });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function drawRotatedImage(image: HTMLImageElement, rotation: number) {
  const angle = normalizeRotation(rotation);
  const radians = (angle * Math.PI) / 180;
  const swapDimensions = angle === 90 || angle === 270;
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight || imageWidth * imageHeight > 40_000_000) {
    throw new Error("Choose an image under 40 megapixels to process safely in this browser.");
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas processing is not available in this browser.");
  }

  canvas.width = swapDimensions ? imageHeight : imageWidth;
  canvas.height = swapDimensions ? imageWidth : imageHeight;

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(radians);
  context.drawImage(image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);

  return canvas;
}

function getLuma(data: Uint8ClampedArray, offset: number) {
  return data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
}

function findBoundary(ratios: number[], fromStart: boolean) {
  const threshold = 0.08;
  const requiredRun = 3;
  let run = 0;
  const start = fromStart ? 0 : ratios.length - 1;
  const end = fromStart ? ratios.length : -1;
  const step = fromStart ? 1 : -1;

  for (let index = start; index !== end; index += step) {
    if (ratios[index] >= threshold) {
      run += 1;
      if (run >= requiredRun) {
        return fromStart ? index - requiredRun + 1 : index + requiredRun - 1;
      }
    } else {
      run = 0;
    }
  }

  return fromStart ? 0 : ratios.length - 1;
}

function analyzeBounds(source: HTMLCanvasElement) {
  const sampleMax = 420;
  const scale = Math.min(1, sampleMax / Math.max(source.width, source.height));
  const sampleWidth = Math.max(32, Math.round(source.width * scale));
  const sampleHeight = Math.max(32, Math.round(source.height * scale));
  const sample = document.createElement("canvas");
  const context = sample.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return { bounds: null, brightness: null };
  }

  sample.width = sampleWidth;
  sample.height = sampleHeight;
  context.drawImage(source, 0, 0, sampleWidth, sampleHeight);

  const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
  const borderSamples: number[] = [];
  const borderInset = Math.max(2, Math.round(Math.min(sampleWidth, sampleHeight) * 0.035));
  let brightnessTotal = 0;
  let brightnessSamples = 0;

  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const offset = (y * sampleWidth + x) * 4;
      const luma = getLuma(data, offset);
      brightnessTotal += luma;
      brightnessSamples += 1;

      if (x < borderInset || x >= sampleWidth - borderInset || y < borderInset || y >= sampleHeight - borderInset) {
        borderSamples.push(luma);
      }
    }
  }

  if (!borderSamples.length) {
    return {
      bounds: null,
      brightness: brightnessSamples ? brightnessTotal / brightnessSamples : null
    };
  }

  borderSamples.sort((a, b) => a - b);
  const borderLuma = borderSamples[Math.floor(borderSamples.length / 2)];
  const rowRatios = new Array<number>(sampleHeight).fill(0);
  const columnRatios = new Array<number>(sampleWidth).fill(0);
  const contrastThreshold = 24;

  for (let y = 0; y < sampleHeight; y += 1) {
    let rowHits = 0;

    for (let x = 0; x < sampleWidth; x += 1) {
      const offset = (y * sampleWidth + x) * 4;
      const luma = getLuma(data, offset);
      const previousOffset = (y * sampleWidth + Math.max(0, x - 1)) * 4;
      const localEdge = Math.abs(luma - getLuma(data, previousOffset));
      const isContent = Math.abs(luma - borderLuma) > contrastThreshold || localEdge > 34;

      if (isContent) {
        rowHits += 1;
        columnRatios[x] += 1;
      }
    }

    rowRatios[y] = rowHits / sampleWidth;
  }

  for (let x = 0; x < sampleWidth; x += 1) {
    columnRatios[x] /= sampleHeight;
  }

  const top = findBoundary(rowRatios, true);
  const bottom = findBoundary(rowRatios, false);
  const left = findBoundary(columnRatios, true);
  const right = findBoundary(columnRatios, false);

  if (bottom <= top || right <= left) {
    return {
      bounds: null,
      brightness: brightnessSamples ? brightnessTotal / brightnessSamples : null
    };
  }

  const padding = Math.max(6, Math.round(Math.min(sampleWidth, sampleHeight) * 0.025));
  const paddedLeft = Math.max(0, left - padding);
  const paddedTop = Math.max(0, top - padding);
  const paddedRight = Math.min(sampleWidth - 1, right + padding);
  const paddedBottom = Math.min(sampleHeight - 1, bottom + padding);
  const width = paddedRight - paddedLeft + 1;
  const height = paddedBottom - paddedTop + 1;
  const areaRatio = (width * height) / (sampleWidth * sampleHeight);
  const aspectRatio = width / height;

  if (areaRatio > 0.92 || areaRatio < 0.38 || aspectRatio < 0.45 || aspectRatio > 2.2) {
    return {
      bounds: null,
      brightness: brightnessSamples ? brightnessTotal / brightnessSamples : null
    };
  }

  return {
    bounds: {
      height: Math.round(height / scale),
      width: Math.round(width / scale),
      x: Math.round(paddedLeft / scale),
      y: Math.round(paddedTop / scale)
    },
    brightness: brightnessSamples ? brightnessTotal / brightnessSamples : null
  };
}

function buildOutputCanvas(source: HTMLCanvasElement, bounds: CropBounds | null, brightness: number | null, enhance: boolean) {
  const crop = bounds ?? {
    height: source.height,
    width: source.width,
    x: 0,
    y: 0
  };
  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(crop.width, crop.height));
  const output = document.createElement("canvas");
  const context = output.getContext("2d");

  if (!context) {
    throw new Error("Canvas processing is not available in this browser.");
  }

  output.width = Math.max(1, Math.round(crop.width * scale));
  output.height = Math.max(1, Math.round(crop.height * scale));

  const brightnessFactor = brightness !== null && brightness < 118 ? 1.08 : brightness !== null && brightness > 220 ? 0.96 : 1.02;
  context.fillStyle = "white";
  context.fillRect(0, 0, output.width, output.height);
  context.filter = enhance ? `brightness(${brightnessFactor}) contrast(1.08) saturate(0.96)` : "none";
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, output.width, output.height);
  context.filter = "none";

  return output;
}

async function canvasToJpegFile(canvas: HTMLCanvasElement, fileName: string) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (!nextBlob) {
        reject(new Error("Unable to prepare the scan image."));
        return;
      }

      resolve(nextBlob);
    }, "image/jpeg", JPEG_QUALITY);
  });

  return new File([blob], replaceImageExtension(fileName), {
    lastModified: Date.now(),
    type: "image/jpeg"
  });
}

export async function prepareScanImageForUpload(file: File, rotation: number, enhance = false): Promise<ScanImageProcessingResult> {
  const angle = normalizeRotation(rotation);

  if (!canProcessScanImage(file) || (angle === 0 && !enhance)) {
    if (angle !== 0 && file.type.startsWith("image/")) {
      throw new Error("This browser cannot rotate that image format. Save it upright or choose a JPG, PNG, or WebP copy.");
    }

    return {
      file,
      metadata: {
        autoCropApplied: false,
        enhancements: [],
        originalDimensions: null,
        originalMimeType: file.type,
        originalSizeBytes: file.size,
        outputDimensions: null,
        outputMimeType: file.type,
        outputSizeBytes: file.size,
        skippedReason: canProcessScanImage(file) ? "original-preserved" : file.type.startsWith("image/") ? "unsupported-image-format" : "not-an-image"
      }
    };
  }

  const image = await loadImage(file);
  const rotatedCanvas = drawRotatedImage(image, angle);
  const { bounds, brightness } = enhance ? analyzeBounds(rotatedCanvas) : { bounds: null, brightness: null };
  const outputCanvas = buildOutputCanvas(rotatedCanvas, bounds, brightness, enhance);
  const outputFile = await canvasToJpegFile(outputCanvas, file.name);
  const enhancements = ["rotation-normalized", ...(enhance ? ["contrast-normalized"] : [])];

  if (bounds) {
    enhancements.push("auto-cropped");
  }

  if (Math.max(outputCanvas.width, outputCanvas.height) < Math.max(rotatedCanvas.width, rotatedCanvas.height)) {
    enhancements.push("size-normalized");
  }

  return {
    file: outputFile,
    metadata: {
      autoCropApplied: Boolean(bounds),
      enhancements,
      originalDimensions: {
        height: image.naturalHeight || image.height,
        width: image.naturalWidth || image.width
      },
      originalMimeType: file.type,
      originalSizeBytes: file.size,
      outputDimensions: {
        height: outputCanvas.height,
        width: outputCanvas.width
      },
      outputMimeType: outputFile.type,
      outputSizeBytes: outputFile.size,
      skippedReason: null
    }
  };
}
