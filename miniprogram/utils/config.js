module.exports = {
  // Temporary rollout switch. Disable when physical NFC tags are ready.
  allowNfcSkip: true,
  // WeChat test accounts cannot use CloudBase. Keep local persistence for demos.
  allowLocalPhotoFallback: true,
  // Set this to the CloudBase environment ID after switching to a registered AppID.
  cloudEnvId: ''
}
