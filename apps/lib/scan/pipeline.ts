export const scanPipeline = {
  capture: {
    fallbackLabel: "Current fallback",
    fallbackValue: "Secure browser file input",
    guidance: [
      "Keep the document flat, front-lit, and fully inside the frame.",
      "Move closer if text looks soft or edges are clipped.",
      "Retake before saving if glare or shadow covers key fields."
    ],
    highlights: ["Web support", "User guidance", "Automatic capture", "Auto-cropping", "On-device processing"],
    implementationStatus: "Scanbot is the selected capture target for guided web scanning.",
    selectedLabel: "Selected capture layer",
    selectedValue: "Scanbot SDK"
  },
  ocr: {
    highlights: ["Accuracy-first OCR", "Document digitization", "Layout fidelity", "Structured extraction path"],
    implementationStatus: "ABBYY is the selected OCR target for extraction and searchable document output.",
    selectedLabel: "Selected OCR layer",
    selectedValue: "ABBYY FineReader"
  }
} as const;

export type ScanPipeline = typeof scanPipeline;
