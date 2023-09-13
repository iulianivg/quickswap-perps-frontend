import { useMasaAnalyticsReact } from "@masa-finance/analytics-react";

export default function useMasaAnalytics() {
  const masaAnalytics = useMasaAnalyticsReact({
    clientId: process.env.REACT_APP_MASA_CLIENT_ID ?? "",
    clientApp: "Quickswap",
    clientName: "Quickswap",
  });
  return masaAnalytics;
}
