# Maze Rush — RevenueCat iOS Integration Guide

This document is for whoever maintains the native iOS shell (the Xcode project that
wraps the Maze Rush web app in a WKWebView). It covers installing the RevenueCat
SDK via Swift Package Manager, configuring it, subscriptions/entitlements,
presenting a RevenueCat Paywall, Customer Center, and — critically — wiring the
`window.NativeInAppPurchase` bridge the web app already calls.

- **API key:** `test_XelDlSQvKcGoIahMOQEgiJsvgRa` (Test Store key — see note in Step 3)
- **Entitlement:** `maze_rush_pro`
- **Products:** `consumable` (Consumable), `lifetime` (Non-Consumable)

---

## 1. Install the RevenueCat SDK via Swift Package Manager

1. In Xcode: **File > Add Package Dependencies…**
2. Paste the repository URL:
   ```
   https://github.com/RevenueCat/purchases-ios-spm.git
   ```
3. Set **Dependency Rule** to **Up to Next Major Version**, from `5.0.0`.
   (RevenueCat Paywalls require **5.27.1+**; multipage paywalls require 5.83.0+.)
4. Click **Add Package**. In the **Choose Package Products** sheet, add **both**
   products to your app target:
   - `RevenueCat` (core SDK)
   - `RevenueCatUI` (Paywall + Customer Center views)
5. Build (**Product > Build**) to verify, with `import RevenueCat` in a source file.

## 2. Enable the In-App Purchase capability

1. Sign in to Xcode with your Apple Account and assign the project to a team
   (automatic signing handles provisioning).
2. Select your app target → **Signing & Capabilities** → **+ Capability** →
   **In-App Purchase**.
3. Before real App Store purchases work: the Account Holder must accept the
   **Paid Apps** agreement in App Store Connect (banking/tax info included), and
   the Xcode bundle ID must match the App Store Connect app record.

## 3. Configure the SDK (SwiftUI `App` init)

Configure **once**, as early as possible in the app lifecycle.

```swift
import SwiftUI
import RevenueCat

@main
struct MazeRushApp: App {
    init() {
        #if DEBUG
        Purchases.logLevel = .debug
        #endif
        Purchases.configure(withAPIKey: "test_XelDlSQvKcGoIahMOQEgiJsvgRa")
    }

    var body: some Scene {
        WindowGroup {
            ContentView() // hosts the WKWebView running Maze Rush
        }
    }
}
```

> **About the API key:** `test_…` is a **Test Store** key. It works out of the box
> for testing (no App Store Connect needed). For production you must use your
> **Apple app-specific public key** (starts with `appl_`, found in RevenueCat
> under Project Settings > API keys) and register the products in App Store
> Connect. Public SDK keys are safe to embed in the app — never embed secret keys.

> **Anonymous vs. logged-in users:** by default RevenueCat uses an anonymous ID.
> If you later add accounts, call `Purchases.shared.logIn(appUserID:)`.

## 4. Dashboard setup — products, entitlement, offering, paywall

In the [RevenueCat dashboard](https://app.revenuecat.com/):

### 4.1 Products (App Store Connect + RevenueCat)
Register both in App Store Connect **and** RevenueCat (Products > + New):

| RevenueCat product ID | App Store Connect type | Suggested use in Maze Rush |
|---|---|---|
| `consumable` | Consumable | Purchasable extras that can be bought repeatedly |
| `lifetime` | Non-Consumable | Permanent unlock (Ad-Free / pro tier) → grants `maze_rush_pro` |

(When you want Maze Rush's individual cosmetics — star skin, trails, bundles — as
their own App Store products, register each with the same ID in App Store Connect
and RevenueCat, then extend the mapping table in Step 7.)

### 4.2 Entitlement
Entitlements > **+ New** → identifier `maze_rush_pro`. Attach the `lifetime`
product to it. Any successful purchase of an attached product activates the
entitlement forever.

### 4.3 Offering
Offerings > create the **default/current offering** containing a package for each
product (e.g. `"$rc_lifetime"` with `lifetime`, `"$rc_consumable"` with `consumable`).

### 4.4 Paywall
Paywalls > create a Paywall and attach it to your default offering
(Paywalls render the offering you attach them to — see
[docs](https://www.revenuecat.com/docs/tools/paywalls)). Templates or the AI
editor both work; no code changes are needed to update it later.

### 4.5 Customer Center
Project Settings > **Customer Center** (enable). Configure the paths —
"Restore purchases" and "Contact support" at minimum.

## 5. A `PurchasesManager` — customer info, entitlements, purchases

Modern async/await with `customerInfoStream` (v5). Never block the UI on
`customerInfo` at launch — subscribe to the stream and let state update.

```swift
import Foundation
import RevenueCat
import StoreKit

@MainActor
final class PurchasesManager: ObservableObject {
    static let shared = PurchasesManager()

    /// True while the `maze_rush_pro` entitlement is active.
    @Published private(set) var hasPro = false
    @Published private(set) var customerInfo: CustomerInfo?
    private var listening = false

    private init() {}

    /// Call once after the web view loads (and again on scenePhase .active
    /// if you want to catch purchases made off-app).
    func startListening() {
        guard !listening else { return }
        listening = true
        Task { [weak self] in
            for await info in Purchases.shared.customerInfoStream {
                self?.customerInfo = info
                self?.hasPro = info.entitlements["maze_rush_pro"]?.isActive == true
            }
        }
    }

    /// Fetch a product by its RevenueCat identifier.
    func product(withID id: String) async throws -> StoreProduct? {
        let products = try await Purchases.shared.getProducts(with: [id])
        return products.first { $1.productIdentifier == id }.map { $0.value }
            ?? products.first { $0.productIdentifier == id }
    }

    /// Purchase a product. Returns (succeeded, cancelled).
    func purchase(productID: String) async -> (ok: Bool, cancelled: Bool) {
        guard let product = try? await product(withID: productID) else {
            return (false, false)
        }
        do {
            let result = try await Purchases.shared.purchase(product: product)
            if result.userCancelled { return (false, true) }
            // Non-consumables are finished by the SDK; consumables should be
            // granted HERE before finishing:
            if product.productType == .consumable {
                grantConsumable(productID: productID)   // your logic
                await result.transaction?.finish()
            }
            return (true, false)
        } catch {
            // User cancelling is normal, not an error to surface.
            if Purchases.errorInformation(for: error)?.errorCode == .purchaseCancelledError {
                return (false, true)
            }
            if let code = Purchases.ErrorCode(rawValue: (error as NSError).code),
               code == .purchaseCancelledError {
                return (false, true)
            }
            print("RevenueCat purchase error: \(error.localizedDescription)")
            return (false, false)
        }
    }

    private func grantConsumable(productID: String) {
        // Maze Rush stores unlocks locally in the WebView; the bridge
        // (Step 7) resolves the JS promise, which the web app reacts to.
        print("Granting consumable: \(productID)")
    }

    /// Restore purchases. Apple requires a visible Restore affordance.
    func restore() async throws -> CustomerInfo {
        let info = try await Purchases.shared.restorePurchases()
        hasPro = info.entitlements["maze_rush_pro"]?.isActive == true
        return info
    }
}
```

## 6. Presenting a RevenueCat Paywall (SwiftUI)

`RevenueCatUI` renders the Paywall you attached to the offering in the dashboard.
Two modern options:

**Option A — the `.paywall()` modifier (simplest):**
```swift
import SwiftUI
import RevenueCatUI

struct StoreView: View {
    @State private var showPaywall = false
    @ObservedObject private var purchases = PurchasesManager.shared

    var body: some View {
        VStack(spacing: 16) {
            Text(purchases.hasPro ? "Maze Rush Pro ✓" : "Free tier")
            Button("Upgrade") { showPaywall = true }
        }
        .paywall(isPresented: $showPaywall) { purchaseCompleted in
            print("Entitlement active: \(purchaseCompleted.entitlement.active)")
        }
    }
}
```

**Option B — explicit `PaywallView` with callbacks:**
```swift
struct PaywallSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        PaywallView() // renders the current offering's paywall
            .onPurchaseCompleted { _ in dismiss() }
            .onRestoreCompleted { _ in dismiss() }
    }
}
```
Paywall content, styling, and pricing are all editable in the dashboard with no
app update.

## 7. The WKWebView bridge — connecting Maze Rush's web app

This is the part that makes the **existing web app** purchase through RevenueCat.
Maze Rush calls (see `src/lib/nativePurchase.js`):

```
window.NativeInAppPurchase.purchase(productId) -> Promise<{ ok: boolean, reason?: string }>
```
with these product IDs coming from the web app:

| Web app product ID | Meaning | Maps to |
|---|---|---|
| `adfree` | Ad-Free unlock ($5.99) | `lifetime` |
| `star` | Shooting Star skin | `lifetime` (add a dedicated product later for per-item tracking) |
| `trail_stardust`, `trail_<id>` | Trail cosmetics | `lifetime` |
| `bundle_star_stardust`, `bundle_consumables`, `bundle_everything` | Bundles | `lifetime` |
| (future) coin/life packs | Repeated purchases | `consumable` |

**The web app records the specific unlock locally** when the promise resolves
`{ ok: true }`, so a single `lifetime` purchase driving `maze_rush_pro` works
today; swap the mapping table to dedicated products when they're registered.

### 7.1 Inject the JS bridge

```swift
import WebKit

enum PurchaseBridge {
    /// Inject before the page loads so `window.NativeInAppPurchase` exists
    /// on first render.
    static func inject(into webView: WKWebView) {
        let js = """
        window.NativeInAppPurchase = (function () {
            var pending = {}, nextId = 1;
            function call(handler, payload) {
                return new Promise(function (resolve) {
                    var id = String(nextId++);
                    pending[id] = resolve;
                    window.webkit.messageHandlers[handler].postMessage(
                        Object.assign({ _cb: id }, payload)
                    );
                });
            }
            return {
                purchase: function (productId) {
                    return call('mazerushPurchase', { productId: productId });
                },
                restore: function () {
                    return call('mazerushRestore', {});
                },
                getEntitlements: function () {
                    return call('mazerushEntitlements', {});
                },
                _resolve: function (id, result) {
                    if (pending[id]) { var r = pending[id]; delete pending[id]; r(result); }
                }
            };
        })();
        """
        let userScript = WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        webView.configuration.userContentController.addUserScript(userScript)
    }
}
```

### 7.2 Handle the messages natively

```swift
import WebKit
import RevenueCat

final class MazeRushWebCoordinator: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?

    func userContentController(_ userContentController: WKUserContentController,
                              didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let cb = body["_cb"] as? String else { return }
        switch message.name {
        case "mazerushPurchase":
            let productID = body["productId"] as? String ?? ""
            // Map the web app's IDs to RevenueCat product IDs.
            let rcProductID = Self.mapToRevenueCat(productID)
            Task { @MainActor in
                let result = await PurchasesManager.shared.purchase(productID: rcProductID)
                let js: String
                if result.ok {
                    js = "window.NativeInAppPurchase._resolve('\(cb)', { ok: true });"
                } else if result.cancelled {
                    js = "window.NativeInAppPurchase._resolve('\(cb)', { ok: false, reason: 'cancelled' });"
                } else {
                    js = "window.NativeInAppPurchase._resolve('\(cb)', { ok: false, reason: 'error' });"
                }
                self.webView?.evaluateJavaScript(js, completionHandler: nil)
            }

        case "mazerushRestore":
            Task { @MainActor in
                do {
                    _ = try await PurchasesManager.shared.restore()
                    self.webView?.evaluateJavaScript(
                        "window.NativeInAppPurchase._resolve('\(cb)', { ok: true });",
                        completionHandler: nil)
                } catch {
                    self.webView?.evaluateJavaScript(
                        "window.NativeInAppPurchase._resolve('\(cb)', { ok: false });",
                        completionHandler: nil)
                }
            }

        case "mazerushEntitlements":
            Task { @MainActor in
                let pro = PurchasesManager.shared.hasPro
                self.webView?.evaluateJavaScript(
                    "window.NativeInAppPurchase._resolve('\(cb)', { maze_rush_pro: \(pro) });",
                    completionHandler: nil)
            }

        default: break
        }
    }

    static func mapToRevenueCat(_ webProductID: String) -> String {
        // Extend this table as dedicated products are registered.
        switch webProductID {
        case "adfree", "star", "bundle_star_stardust", "bundle_consumables",
             "bundle_everything":
            return "lifetime"
        default:
            if webProductID.hasPrefix("trail_") { return "lifetime" }
            return "consumable" // future consumable packs
        }
    }
}
```

Register the handlers where you set up the WKWebView:

```swift
let config = WKWebViewConfiguration()
let coordinator = MazeRushWebCoordinator()
webView = WKWebView(frame: .zero, configuration: config)
for name in ["mazerushPurchase", "mazerushRestore", "mazerushEntitlements"] {
    config.userContentController.add(coordinator, name: name)
}
coordinator.webView = webView
PurchaseBridge.inject(into: webView)
PurchasesManager.shared.startListening()
```

### 7.3 Optional: native Paywall / Customer Center entry points

Expose the dashboard-designed Paywall and Customer Center to the web app by
adding two more bridge handlers that present SwiftUI sheets over the web view:

```swift
// Present Customer Center — makes sense for Maze Rush because it bundles
// Apple-required "Restore purchases" + refund/subscription management UI.
// Most valuable once you add subscriptions or consumables users may want
// refunds for; the restore path alone is required by Apple either way.
struct ManageSheet: View {
    var body: some View {
        CustomerCenterView()   // RevenueCatUI
    }
}
```

Present it with a SwiftUI `.sheet`, or use `@Environment(\.presentCustomerCenter)`.
The Paywall presents identically with `PaywallView()` in a sheet (Step 6).

## 8. Testing

- **Test Store (the `test_…` key):** works immediately, no App Store Connect.
  Set offerings/products in RevenueCat and purchase from a device.
- **Sandbox:** create a Sandbox Tester in App Store Connect, sign in on-device,
  purchase with the `appl_…` key. Sandbox purchases can be refunded/cleared via
  Settings > App Store > Sandbox Account on the device.
- Verify `maze_rush_pro` activates and that the web UI unlocks as expected
  (the web app saves unlocks when the purchase promise resolves `{ ok: true }`).

## 9. Best-practice checklist

- Configure `Purchases` exactly once, early (App init).
- Use `customerInfoStream` for entitlement state; don't poll or block at launch.
- Cancellations (`userCancelled`) are normal — never show an error for them.
- Always ship a visible **Restore purchases** entry (Apple requirement); the
  `mazerushRestore` bridge + Settings screen covers this.
- Grant consumables before `transaction.finish()`; never finish twice.
- `.debug` log level in DEBUG builds only.
- Replace the `test_…` key with the `appl_…` production key before release, and
  verify the Paid Apps agreement is signed.
- Purchase flows must be triggered from user interaction (Apple/RevenueCat rule).
- Paywall changes (copy, pricing, layout) are dashboard-only — no app update.