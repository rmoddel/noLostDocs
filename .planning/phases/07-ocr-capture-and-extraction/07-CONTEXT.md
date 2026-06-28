# Phase 7: OCR Capture and Extraction - Context

**Gathered:** 2026-06-25
**Status:** Complete

## Objective

Upgrade the live `apps/web` scan flow from a basic file upload into a review-driven capture experience that is honest about the selected Scanbot and ABBYY stack while giving users immediate quality feedback before save.

## Scope

- Keep the web app production-safe without pretending third-party SDK credentials are already configured
- Preserve the signed upload flow while enriching saved document metadata with capture and OCR readiness details
- Add pre-save quality diagnostics for blur, distance, lighting, framing, and orientation
- Surface Scanbot as the guided capture target and ABBYY as the OCR target directly in the scan UI
- Add configuration placeholders needed to turn on guided capture and OCR later without changing the UX contract

## Implementation Decisions

- Use client-side image inspection heuristics for pre-save quality feedback so the live UX improves immediately without depending on vendor runtime setup
- Pass only boolean readiness state from the server into the scan page so secrets remain server-only
- Persist provider choice and quality summary in document metadata to make future OCR processing and support auditing easier
- Keep OCR messaging explicit: ABBYY is the selected engine, but extraction only activates once the server connector is configured
