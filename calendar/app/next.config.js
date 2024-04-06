const { i18n } = require('./next-i18next.config');

/** @type {import("next").NextConfig} */
const config = {
  i18n,

  async redirects() {
    return [
      {
        source: '/history/',
        destination: '/history/all',
        permanent: false,
      },
    ];
  },

  /** We run eslint as a separate task in CI */
  eslint: {
    ignoreDuringBuilds: !!process.env.CI,
  },

  experimental: {
    instrumentationHook: true
  }

};

module.exports = config;

// module.exports = {
//   experimental: {
//     swcPlugins: [["next-superjson-plugin", {}]],
//   },
// };
