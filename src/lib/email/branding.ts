import { PORTAL_BASE_URL, getDjAndroidPlayStoreUrl, getDjIosAppStoreUrl } from "@/lib/portal-url";

export function emailLogoBlock(eyebrow: string): string {
  return `
              <tr>
                <td>
                  <img src="${PORTAL_BASE_URL}/icon.png" alt="" width="40" height="40" style="display:block;height:40px;width:40px;margin-bottom:14px;border-radius:8px;" />
                  <img src="${PORTAL_BASE_URL}/RHOOD_Lettering_Logo.png" alt="R/HOOD" width="180" height="54" style="display:block;height:40px;width:auto;" />
                </td>
              </tr>
              <tr>
                <td style="padding-top:20px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c2cc06;font-weight:700;">${eyebrow}</td>
              </tr>
  `;
}

const buttonStyle =
  "display:inline-block;padding:14px 28px;background-color:#c2cc06;color:#1d1d1b;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;";

const secondaryButtonStyle =
  "display:inline-block;padding:14px 28px;background-color:#252525;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;border:1px solid #3a3a3a;";

/** App Store / Play Store buttons for DJ emails. */
export function emailAppStoreButtons(label = "Get the R/HOOD app"): string {
  const ios = getDjIosAppStoreUrl();
  const android = getDjAndroidPlayStoreUrl();
  // Booking emails pass a custom label — keep a single in-app CTA even when
  // store URLs differ, so DJs are not sent to the App Store listing.
  if (label !== "Get the R/HOOD app" || ios === android) {
    return `<a href="${ios}" style="${buttonStyle}">${label}</a>`;
  }
  return `
                  <a href="${ios}" style="${buttonStyle}">Download on the App Store</a>
                  <span style="display:inline-block;width:10px;"></span>
                  <a href="${android}" style="${secondaryButtonStyle}">Get it on Google Play</a>
  `;
}

export function emailAppStorePlainText(label = "Get the R/HOOD app"): string {
  const ios = getDjIosAppStoreUrl();
  const android = getDjAndroidPlayStoreUrl();
  if (label !== "Get the R/HOOD app" || ios === android) {
    return `${label}: ${ios}`;
  }
  return `Download on the App Store: ${ios}\nGet it on Google Play: ${android}`;
}

