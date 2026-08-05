module.exports = {
  // Temporary rollout switch. Disable when physical NFC tags are ready.
  allowNfcSkip: true,
  // Try CloudBase first, then persist on the current device if cloud access fails.
  allowLocalPhotoFallback: true,
  cloudEnvId: 'cloudbase-d7gfg8vr06572506e'
}
