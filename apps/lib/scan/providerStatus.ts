export type ScanProviderStatus = {
  captureLabel: string;
  captureProvider: "scanbot-sdk" | "browser-file-input";
  captureReady: boolean;
  ocrLabel: string;
  ocrProvider: "abbyy-finereader";
  ocrReady: boolean;
};

export function getScanProviderStatus(): ScanProviderStatus {
  const captureReady = Boolean(process.env.NEXT_PUBLIC_SCANBOT_LICENSE_KEY?.trim());
  const ocrReady = Boolean(process.env.ABBYY_OCR_ENGINE_URL?.trim() && process.env.ABBYY_OCR_LICENSE_KEY?.trim());

  return {
    captureLabel: captureReady ? "Guided capture enabled" : "Browser capture fallback",
    captureProvider: captureReady ? "scanbot-sdk" : "browser-file-input",
    captureReady,
    ocrLabel: ocrReady ? "OCR extraction enabled" : "OCR connector pending",
    ocrProvider: "abbyy-finereader",
    ocrReady
  };
}
