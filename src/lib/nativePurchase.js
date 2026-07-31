// Native in-app purchase bridge.
//
// When Maze Rush is published and run as an installed app, the host OS
// (App Store / Play Store) exposes a purchase bridge on window so the charge
// is processed by the device's own store. In the web builder preview there is
// no store available, so we resolve with an "unavailable" status the UI can
// surface gracefully.
//
// Expected native contract (injected by the published shell):
//   window.NativeInAppPurchase.purchase(productId) -> Promise<{ ok: boolean, reason?: string }>

export async function purchaseProduct(productId) {
  try {
    const bridge = window.NativeInAppPurchase;
    if (bridge && typeof bridge.purchase === "function") {
      return await bridge.purchase(productId);
    }
    return { ok: false, reason: "unavailable" };
  } catch (e) {
    return { ok: false, reason: "error" };
  }
}