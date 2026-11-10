/* Google Ads Contact conversion tracking for Digital World.
   Tracks WhatsApp and phone link clicks as contact-intent actions.
   A click does not guarantee that a message was sent or a call was completed. */
(function () {
  'use strict';

  var CONVERSION_SEND_TO = 'AW-18510400390/i0JfCKP-_K8dEIaXufpE';
  var sentLinks = new WeakSet();

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
    if (typeof window.gtag !== 'function') return;

    sentLinks.add(link);
    window.gtag('event', 'conversion', {
      'send_to': CONVERSION_SEND_TO,
      'value': 1.0,
      'currency': 'INR',
      'event_callback': function () {},
      'event_timeout': 2000
    });
  }

  document.addEventListener('click', trackContactClick, true);
})();
