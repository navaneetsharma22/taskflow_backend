/**
 * Ultra-fast user agent parser to extract OS, Browser, and Device Type
 */
const parseUserAgent = (userAgentString) => {
  const ua = userAgentString || "";
  let os = "unknown";
  let browser = "unknown";
  let type = "desktop";

  // 1. Detect OS
  if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
    type = /ipad/i.test(ua) ? "tablet" : "mobile";
  } else if (/android/i.test(ua)) {
    os = "Android";
    type = /tablet|pad/i.test(ua) ? "tablet" : "mobile";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  // 2. Detect Browser
  if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/chrome|crios/i.test(ua) && !/opr|opios|edg/i.test(ua)) {
    browser = "Chrome";
  } else if (/safari/i.test(ua) && !/chrome|crios|opr|opios|edg/i.test(ua)) {
    browser = "Safari";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/opr|opera/i.test(ua)) {
    browser = "Opera";
  }

  // 3. Detect Bot/Crawler
  if (/bot|crawler|spider|googlebot|yandexbot/i.test(ua)) {
    type = "bot";
  }

  return { os, browser, type };
};

module.exports = parseUserAgent;
