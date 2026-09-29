module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
    // Reanimated 4 ships its worklet transform in react-native-worklets.
    // It has to stay last.
    plugins: ['react-native-worklets/plugin'],
  };
};
