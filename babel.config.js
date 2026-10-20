module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Unistyles must see every file that builds styles. All app code lives in src/.
      ['react-native-unistyles/plugin', { root: 'src' }],
    ],
  };
};
