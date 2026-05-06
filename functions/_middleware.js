/**
 * Cloudflare Pages Function — middleware géo-IP
 *
 * Logique :
 *   1. Ne s'applique qu'à la racine "/" (la home FR)
 *   2. Si un cookie "pasola-lang" existe → respecter le choix manuel (pas de redirect)
 *   3. Sinon : lire l'en-tête CF-IPCountry envoyé par Cloudflare
 *      - FR → laisser passer (rester sur la home FR)
 *      - tout autre pays → redirect 302 vers /en/
 *
 * Le cookie est posé par main.js quand l'utilisateur clique sur le lang-switch.
 *
 * Référence : https://developers.cloudflare.com/pages/functions/middleware/
 */

export const onRequest = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // 1) On ne redirige QUE depuis la racine. Toutes les autres URLs (assets,
  //    /en/, sous-pages futures) sont laissées intactes.
  if (url.pathname !== '/') {
    return next();
  }

  // 2) Si l'utilisateur a déjà choisi sa langue manuellement (cookie posé
  //    via le lang-switch), on respecte son choix.
  const cookieHeader = request.headers.get('Cookie') || '';
  if (cookieHeader.includes('pasola-lang=')) {
    return next();
  }

  // 3) Lire le pays via l'en-tête CF-IPCountry envoyé automatiquement par
  //    Cloudflare. Si "FR" → on reste sur la home FR. Sinon → redirect vers /en/.
  const country = request.headers.get('CF-IPCountry');

  if (country && country !== 'FR') {
    const targetUrl = new URL('/en/', request.url).toString();
    return Response.redirect(targetUrl, 302);
  }

  return next();
};
