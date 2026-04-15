import { NextResponse } from "next/server";

const SCRIPT = `
(function () {
  var scripts = document.querySelectorAll('script[data-business]');
  var script = scripts[scripts.length - 1];
  if (!script) return;

  var origin = new URL(script.src).origin;
  var business = script.dataset.business || '';
  var type = script.dataset.type || 'badge';
  var themeAttr = script.getAttribute('data-theme');
  var theme = (themeAttr != null && String(themeAttr).trim() !== '')
    ? String(themeAttr).trim().toLowerCase()
    : 'inherit';
  // Iframe chrome: explicit minimal stays inline; spotlight row needs full width even in minimal.
  var layoutMinimal = theme === 'minimal';
  var spotlightWide = type === 'spotlight_carousel' || type === 'review_slider' || type === 'micro_trustscore';
  var limitStr = script.dataset.limit;
  if (type === 'review_dropdown' && (limitStr == null || String(limitStr).trim() === '')) {
    limitStr = '20';
  }
  var limit = parseInt(limitStr || '5', 10);
  if (isNaN(limit) || limit < 1) limit = 1;
  if (limit > 20) limit = 20;
  if ((type === 'spotlight_carousel' || type === 'review_slider') && limit < 6) limit = 6;

  var heightDefaults = { badge: 110, collector: 70, list: 420, carousel: 260, review_us: 72, score_strip: 150, showcase: 400, tellacity_trust: 200, trust_strip: 86, trust_stacked: 220, trust_strip_icon: 86, trust_mini: 34, spotlight_carousel: 520, review_slider: 380, review_dropdown: 400, micro_trustscore: 44 };
  var defaultHeight = heightDefaults[type] || 110;
  var height = parseInt(script.dataset.height || String(defaultHeight), 10);
  if (isNaN(height)) height = defaultHeight;

  if (!business) {
    console.warn('[Tellacity Widget] data-business attribute is required.');
    return;
  }

  var src =
    origin +
    '/widgets/embed?business=' + encodeURIComponent(business) +
    '&type=' + encodeURIComponent(type) +
    '&limit=' + encodeURIComponent(limit) +
    '&theme=' + encodeURIComponent(theme === 'light' ? 'light' : theme === 'minimal' ? 'minimal' : theme);

  var iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.style.cssText = layoutMinimal && !spotlightWide
    ? 'border:0;width:auto;max-width:100%;min-width:0;display:inline-block;vertical-align:middle;overflow:hidden;'
    : 'border:0;width:100%;max-width:100%;min-width:0;display:block;overflow:hidden;';
  iframe.height = String(height);
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('title', 'Tellacity Reviews Widget');
  iframe.setAttribute('loading', 'lazy');

  // Resize iframe when widget sends its content height
  window.addEventListener('message', function (e) {
    if (e.origin !== origin) return;
    if (e.data && e.data.type === 'tellacity-widget-resize' && e.data.src === src) {
      iframe.height = String(e.data.height);
    }
  });

  if (script.parentNode) {
    script.parentNode.insertBefore(iframe, script.nextSibling);
  }
})();
`.trim();

export async function GET() {
  return new NextResponse(SCRIPT, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
