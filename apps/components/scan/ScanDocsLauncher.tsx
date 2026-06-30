"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../ui/Button";

type ScanDocsLauncherProps = {
  helperText?: string;
  onScanReady?: (file: File) => void;
};

type CameraState = "idle" | "starting" | "ready" | "unsupported" | "denied" | "unavailable" | "error";

function isPreviewableImage(file: File | null) {
  return Boolean(file?.type.startsWith("image/"));
}

function buildCameraErrorState(error: unknown): CameraState {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "denied";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "unavailable";
    }
  }

  return "error";
}

function buildStatusLabel(cameraState: CameraState, capturedFile: File | null) {
  if (capturedFile) {
    return "Review scan";
  }

  if (cameraState === "ready") {
    return "Ready to scan";
  }

  return "Position document inside the frame";
}

export function ScanDocsLauncher({
  helperText = "Use your camera or upload a file",
  onScanReady
}: ScanDocsLauncherProps) {
  const fileInputId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [open, setOpen] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [acceptedFile, setAcceptedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [acceptedPreviewUrl, setAcceptedPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!capturedFile || !isPreviewableImage(capturedFile)) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(capturedFile);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [capturedFile]);

  useEffect(() => {
    if (!acceptedFile || !isPreviewableImage(acceptedFile)) {
      setAcceptedPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(acceptedFile);
    setAcceptedPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [acceptedFile]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (capturedFile) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      setErrorMessage("This browser does not support camera capture. Upload a file instead.");
      return;
    }

    let active = true;

    async function startCamera() {
      setCameraState("starting");
      setErrorMessage(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "environment"
          }
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        setCameraState("ready");
      } catch (error) {
        setCameraState(buildCameraErrorState(error));
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Camera access could not be started. Upload a file instead."
        );
      }
    }

    void startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [capturedFile, open]);

  function stopCamera() {
    if (!streamRef.current) {
      return;
    }

    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function handleOpen() {
    setCapturedFile(null);
    setErrorMessage(null);
    setCameraState("idle");
    setOpen(true);
  }

  function handleClose() {
    stopCamera();
    setCapturedFile(null);
    setErrorMessage(null);
    setCameraState("idle");
    setOpen(false);
  }

  async function handleCapture() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setErrorMessage("The camera is not ready yet. Give it a moment and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      setErrorMessage("Canvas capture is not available in this browser.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.94);
    });

    if (!blob) {
      setErrorMessage("The current frame could not be captured. Try again.");
      return;
    }

    const file = new File([blob], `scan-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now()
    });

    setCapturedFile(file);
    stopCamera();
  }

  function handleRetake() {
    setCapturedFile(null);
    setErrorMessage(null);
    setCameraState("idle");
    setOpen(true);
  }

  function handleUploadFallback(file: File | null) {
    if (!file) {
      return;
    }

    setCapturedFile(file);
    setErrorMessage(null);
    stopCamera();
  }

  function handleUseScan() {
    if (!capturedFile) {
      return;
    }

    setAcceptedFile(capturedFile);

    if (onScanReady) {
      onScanReady(capturedFile);
    } else if (process.env.NODE_ENV !== "production") {
      console.info("ScanDocsLauncher file", capturedFile);
    }

    handleClose();
  }

  const statusLabel = buildStatusLabel(cameraState, capturedFile);
  const showVideo = open && !capturedFile && cameraState !== "unsupported";
  const showImagePreview = Boolean(capturedFile && previewUrl);
  const showFileSummary = Boolean(capturedFile && !previewUrl);

  return (
    <>
      {/* Future: replace capture engine with Scanbot SDK or OpenCV.js for auto edge detection, perspective correction, quality analyzer, and auto-capture. */}
      <div className="scan-launcher">
        <Button className="scan-docs-button" onClick={handleOpen}>
          <span className="scan-docs-button-icon" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24">
              <rect x="5" y="4" width="14" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
              <path d="M9 9h6M9 12h6M9 15h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
            </svg>
          </span>
          <span>Scan Docs</span>
        </Button>
        {helperText ? <p className="scan-launcher-helper">{helperText}</p> : null}
        {acceptedFile ? (
          <div className="scan-launcher-result">
            {acceptedPreviewUrl ? <img alt="Latest accepted scan" className="scan-launcher-thumb" src={acceptedPreviewUrl} /> : null}
            <p className="scan-launcher-summary">
              Last selected: <strong>{acceptedFile.name}</strong>
            </p>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="scan-modal" role="dialog" aria-modal="true" aria-labelledby="scan-modal-title">
          <div className="scan-modal-shell">
            <div className="scan-modal-topbar">
              <div>
                <p className="scan-modal-label" id="scan-modal-title">
                  Scan Docs
                </p>
                <span className="scan-modal-status">{statusLabel}</span>
              </div>
              <button
                aria-label="Close scanner"
                className="scan-modal-close"
                onClick={handleClose}
                type="button"
              >
                <svg fill="none" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                </svg>
              </button>
            </div>

            <div className="scan-camera-stage">
              {showVideo ? <video autoPlay className="scan-camera-video" muted playsInline ref={videoRef} /> : null}

              {showImagePreview ? (
                <div className="scan-camera-preview-panel">
                  <img alt="Captured scan preview" className="scan-camera-preview-image" src={previewUrl ?? undefined} />
                </div>
              ) : null}

              {showFileSummary ? (
                <div className="scan-camera-preview-panel scan-camera-file-panel">
                  <div className="scan-camera-file-icon" aria-hidden="true">
                    <svg fill="none" viewBox="0 0 24 24">
                      <path
                        d="M9 3h6l4 4v11a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path d="M15 3v5h5" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  </div>
                  <strong>{capturedFile?.name}</strong>
                  <p>{capturedFile?.type === "application/pdf" ? "PDF upload ready to use." : "File selected and ready."}</p>
                </div>
              ) : null}

              {!capturedFile ? (
                <div className="scan-guide-frame" aria-hidden="true">
                  <div className="scan-guide-corners">
                    <span className="scan-corner scan-corner-tl" />
                    <span className="scan-corner scan-corner-tr" />
                    <span className="scan-corner scan-corner-bl" />
                    <span className="scan-corner scan-corner-br" />
                  </div>
                </div>
              ) : null}

              {errorMessage ? <p className="scan-modal-error">{errorMessage}</p> : null}
            </div>

            <div className="scan-modal-actions">
              <label className="scan-upload-fallback" htmlFor={fileInputId}>
                <span>Upload fallback</span>
                <input
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                  id={fileInputId}
                  onChange={(event) => handleUploadFallback(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>

              {!capturedFile ? (
                <button
                  className="scan-capture-button"
                  disabled={cameraState !== "ready"}
                  onClick={() => void handleCapture()}
                  type="button"
                >
                  <span className="scan-capture-ring">
                    <span className="scan-capture-core" />
                  </span>
                </button>
              ) : (
                <div className="scan-modal-review-actions">
                  <Button onClick={handleRetake} variant="secondary">
                    Retake
                  </Button>
                  <Button onClick={handleUseScan}>Use scan</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
