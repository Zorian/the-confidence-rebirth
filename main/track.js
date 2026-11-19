// Tracking for the main site and quiz. Paste the IDs once here; nothing loads while they are empty.
const META_PIXEL_ID = ""; // Meta Events Manager > Data sources > Pixel ID
const GA_ID = "";         // Google Analytics 4 measurement ID, e.g. G-XXXXXXX
if (META_PIXEL_ID) {
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
  s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', META_PIXEL_ID); fbq('track', 'PageView');
}
if (GA_ID) {
  const g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(g);
  window.dataLayer = window.dataLayer || []; window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date()); gtag('config', GA_ID);
}
