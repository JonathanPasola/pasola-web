/**
 * Cloudflare Pages Function — middleware géo-IP
 *
 * Logique :
 *   1. Cookie "pasola-lang" présent → respecter le choix manuel (aucun redirect).
 *   2. Racine "/" : FR → home FR ; tout autre pays → redirect 302 vers /en/.
 *   3. Page Cognac anglaise "/en/maison-cognac/" atteinte par un visiteur FR
 *      (ex. depuis un lien social) → redirect vers la version française
 *      "/maison-cognac/". Rattrape les liens sociaux qui pointent sur /en/.
 *
 * Le cookie est posé par main.js quand l'utilisateur clique sur le lang-switch.
 * Référence : https://developers.cloudflare.com/pages/functions/middleware/
 */

export const onRequest = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 1) Choix manuel de langue → on n'intervient jamais.
  const cookieHeader = request.headers.get('Cookie') || '';
  if (cookieHeader.includes('pasola-lang=')) {
    return next();
  }

  const country = request.headers.get('CF-IPCountry');

  // 2) Racine : FR reste sur la home FR, sinon → /en/.
  if (path === '/') {
    if (country && country !== 'FR') {
      return Response.redirect(new URL('/en/', request.url).toString(), 302);
    }
    return next();
  }

  // 3) Visiteur FR arrivant sur la page Cognac EN → version FR.
  if ((path === '/en/maison-cognac/' || path === '/en/maison-cognac') && country === 'FR') {
    return Response.redirect(new URL('/maison-cognac/', request.url).toString(), 302);
  }

  // Toutes les autres URLs sont laissées intactes.
  return next();
};
