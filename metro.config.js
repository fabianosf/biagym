const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('mp4')) {
  config.resolver.assetExts.push('mp4');
}

// zustand's ESM build (usado por padrão na resolução de "web") tem
// `import.meta` no código do devtools connector, sintaxe inválida no bundle
// não-modular que o Metro gera. A build CJS não tem esse problema — força só
// o pacote zustand a resolver por ela, em qualquer plataforma. Nativo já
// resolvia pra CJS antes (condição "react-native"), então isso não muda nada
// lá; só corrige a web.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return (defaultResolveRequest ?? context.resolveRequest)(
      { ...context, unstable_conditionNames: ['require', 'react-native', 'default'] },
      moduleName,
      platform,
    );
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
