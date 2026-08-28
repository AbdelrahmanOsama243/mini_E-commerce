const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to enable Android DataBinding for Paymob React Native SDK
 * adds: android { buildFeatures { dataBinding = true } } to android/app/build.gradle
 */
const withPaymobAndroidDataBinding = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('dataBinding = true')) {
      return config;
    }

    const androidBlock = /android\s*\{/;
    if (androidBlock.test(config.modResults.contents)) {
      config.modResults.contents = config.modResults.contents.replace(
        androidBlock,
        `android {\n    buildFeatures {\n        dataBinding = true\n    }`
      );
    }
    return config;
  });
};

module.exports = withPaymobAndroidDataBinding;
