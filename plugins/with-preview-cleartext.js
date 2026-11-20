const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withPreviewCleartext(config) {
  if (process.env.EAS_BUILD_PROFILE !== 'preview') {
    return config;
  }

  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('Android application manifest entry was not found.');
    }

    application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
