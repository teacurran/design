/** @type {import("next").NextConfig} */
const config = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/all',
        permanent: false,
      },
    ];
  },

  /** We run eslint as a separate task in CI */
  eslint: {
    ignoreDuringBuilds: !!process.env.CI,
  },
};

module.exports = config;
