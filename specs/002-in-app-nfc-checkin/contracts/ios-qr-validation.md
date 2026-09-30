# Contract: Platform-Neutral QR Validation

The file name is retained for compatibility with the earlier specification. The contract now applies to Android, HarmonyOS, and iOS equally.

1. The user opens the current point check-in page normally.
2. The page offers `扫码打卡` and calls `wx.scanCode` only after the user taps it.
3. The result must exactly match one enabled `HRQ1` payload in `qr-tags.js`.
4. The matched `stationIndex` must equal `progress.completed`.
5. Success is stored as `LOCAL_QR_MATCH`; camera errors and invalid results preserve progress.
