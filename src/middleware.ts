import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '../i18n/request';

export default createMiddleware({
  // A list of all locales that are supported
  locales: locales,

  // Used when no locale matches
  defaultLocale: defaultLocale,

  // Don't prefix the default locale
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  // Updated matcher to avoid matching files like /favicon.ico
  matcher: [
    // Match all routes except specific paths
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // Match the root path specifically if needed, although the above should cover it
    // '/'
 ]
};
