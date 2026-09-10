import { PORTAL_BASE_URL } from "@/lib/portal-url";

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
