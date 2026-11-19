/* Google Ads Contact conversion tracking for Digital World.
   Load the Google tag only after a WhatsApp or phone click to reduce initial page work.
   A click records contact intent; it does not guarantee a message or call completed. */
(function () {
  'use strict';

  var CONVERSION_ID = 'AW-18510400390';
  var CONVERSION_SEND_TO = 'AW-18510400390/i0JfCKP-_K8dEIaXufpE';
  var sentLinks = new WeakSet();
  var tagRequested = false;

  function loadGoogleTag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    if (!tagRequested) {
      tagRequested = true;
      window.gtag('js', new Date());
      window.gtag('config', CONVERSION_ID);
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONVERSION_ID;
      document.head.appendChild(script);
    }
    return window.gtag;
  }

  function trackContactClick(event) {
    var link = event.target && event.target.closest
      ? event.target.closest('a[href]')
      : null;

    if (!link || sentLinks.has(link)) return;

    var href = (link.getAttribute('href') || '').trim();
    var isWhatsApp = /^https?:\/\/(?:www\.)?wa\.me\//i.test(href) ||
      /^https?:\/\/(?:api\.)?whatsapp\.com\//i.test(href);
    var isPhone = /^tel:/i.test(href);

    if (!isWhatsApp && !isPhone) return;

    sentLinks.add(link);
    loadGoogleTag()('event', 'conversion', {
      'send_to': CONVERSION_SEND_TO,
      'value': 1.0,
      'currency': 'INR',
      'event_timeout': 2000
    });
  }

  document.addEventListener('click', trackContactClick, true);
})();
