const {resolve} = require("node:path");

/** @type {import("next-i18next").UserConfig} */
const config = {
  debug: process.env.NODE_ENV === 'development',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    localeDetection: false
  },
  localePath: resolve('./public/locales'),
};

module.exports = config
