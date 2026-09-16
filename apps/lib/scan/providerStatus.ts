export type ScanProviderStatus = {
  captureLabel: string;
  captureProvider: "scanbot-sdk" | "browser-file-input";
  captureReady: boolean;
  ocrLabel: string;
  ocrProvider: "abbyy-finereader";
  ocrReady: boolean;
};

// Credentials alone do not implement a provider integration.
export function getScanProviderStatus(): ScanProviderStatus {
  return {
    captureLabel: "Camera or file upload",
    captureProvider: "browser-file-input",
    captureReady: false,
    ocrLabel: "Text extraction coming later",
    ocrProvider: "abbyy-finereader",
    ocrReady: false
  };
}
