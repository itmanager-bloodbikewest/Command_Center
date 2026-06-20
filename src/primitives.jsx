// Messaging helpers: device detection, phone formatting, and deep-link builders
// for handing a status update off to the rider's SMS or WhatsApp app.

// Treat phones and tablets as "mobile" (where an SMS/WhatsApp handoff makes
// sense). A touchscreen laptop deliberately stays on the desktop path.
export const isMobileUA = () =>
  /android|iphone|ipad|ipod|iemobile|blackberry|opera mini|mobile/i.test(
    navigator.userAgent || ""
  );

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent || "");

// Normalise a phone number to international digits (no +, no spaces) for wa.me.
// National numbers default to Ireland (+353): a leading 0 becomes 353.
// Numbers already in +353…/353…/00353… form are handled too.
// Returns "" if there's nothing usable.
export const toWhatsAppNumber = (raw) => {
  if (!raw) return "";
  let d = String(raw).replace(/[^\d+]/g, "");          // keep digits and +
  if (d.startsWith("+")) d = d.slice(1);                // wa.me wants no +
  else if (d.startsWith("00")) d = d.slice(2);          // 00 intl prefix
  else if (d.startsWith("0")) d = "353" + d.slice(1);   // Irish national → +353
  return d.replace(/\D/g, "");
};

// sms: link with a pre-filled body. iOS historically uses a different body
// separator from Android/others, so branch on the platform.
export const smsLink = (phone, body) => {
  const num = String(phone || "").replace(/[^\d+]/g, "");
  const sep = isIOS() ? "&" : "?";
  return `sms:${num}${sep}body=${encodeURIComponent(body)}`;
};

// wa.me link with pre-filled text. Returns "" if the number can't be formatted.
export const whatsappLink = (phone, body) => {
  const num = toWhatsAppNumber(phone);
  if (!num) return "";
  return `https://wa.me/${num}?text=${encodeURIComponent(body)}`;
};
