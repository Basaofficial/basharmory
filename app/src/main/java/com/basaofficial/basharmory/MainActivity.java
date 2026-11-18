package com.basaofficial.basharmory;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    static volatile boolean visible = false;

    private static final int GREEN = Color.parseColor("#8CFF2E");
    private static final String UA_MOBILE = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

    private WebView web;
    private WebView panelWeb;
    private FrameLayout panelBox;
    private String panelKey = null;
    private boolean panelEmbed = false;
    private LinearLayout overlay;
    private WebView overlayWeb;
    private TextView overlayTitle;
    private ProgressBar overlayProgress;
    private boolean overlayModelMode = false;
    private final ExecutorService pool = Executors.newFixedThreadPool(6);

    /** Finds the 3D model canvas on the Warmane page and shows only it, full screen. */
    private static final String ISOLATE_MODEL_JS =
        "(function(){if(window.__bashIso)return;window.__bashIso=1;var n=0;" +
        "var t=setInterval(function(){n++;" +
        "var cs=[].slice.call(document.querySelectorAll('canvas')).filter(function(c){var r=c.getBoundingClientRect();return r.width>120&&r.height>120;});" +
        "if(cs.length){clearInterval(t);cs.sort(function(a,b){return b.width*b.height-a.width*a.height;});" +
        "var c=cs[0],box=c.parentElement||c;" +
        "var st=document.createElement('style');st.textContent='html,body{background:#000!important;overflow:hidden!important}';document.head.appendChild(st);" +
        "var p=box;while(p&&p!==document.body){p.style.transform='none';p.style.filter='none';p=p.parentElement;}" +
        "box.style.cssText+=';position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;z-index:2147483000!important;background:radial-gradient(ellipse at 50% 40%,#16300c,#000 70%)!important;margin:0!important;';" +
        "c.style.width='100%';c.style.height='100%';" +
        "setTimeout(function(){window.dispatchEvent(new Event('resize'));},300);" +
        "var B=window.BashOverlay||window.BashPanel;if(B)B.found(true);}" +
        "if(n>60){clearInterval(t);var B2=window.BashOverlay||window.BashPanel;if(B2)B2.found(false);}},1000);})();";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.setStatusBarColor(Color.BLACK);
        w.setNavigationBarColor(Color.BLACK);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        root.addView(content, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // Warmane-style character panel (3D model + gear) shown above the app on character pages
        panelWeb = new WebView(this);
        panelWeb.setBackgroundColor(Color.BLACK);
        panelWeb.setVisibility(View.GONE);
        WebSettings ps = panelWeb.getSettings();
        ps.setJavaScriptEnabled(true);
        ps.setDomStorageEnabled(true);
        ps.setMediaPlaybackRequiresUserGesture(false);
        ps.setUserAgentString(UA_MOBILE);
        panelWeb.addJavascriptInterface(new PanelBridge(), "BashPanel");
        panelWeb.setWebChromeClient(new WebChromeClient());
        panelWeb.addJavascriptInterface(new NetBridge(), "BashNet");
        panelWeb.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                String host = req.getUrl().getHost();
                return !(panelEmbed && host != null && host.endsWith("warmane.com"));
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (panelEmbed && url != null && url.contains("warmane.com")) {
                    view.evaluateJavascript(ISOLATE_MODEL_JS, null);
                    String ui = asset("panel-ui.js");
                    if (lastPanelJson != null) view.evaluateJavascript(ui + ";setTimeout(function(){window.buildPanelUi(" + lastPanelJson + ");},400);", null);
                }
            }
        });
        panelBox = new FrameLayout(this);
        panelBox.setBackgroundColor(Color.BLACK);
        panelBox.setVisibility(View.GONE);
        TextView pl = new TextView(this);
        pl.setText("Učitavam Warmane 3D…");
        pl.setTextColor(GREEN);
        pl.setTextSize(14);
        pl.setGravity(Gravity.CENTER);
        panelBox.addView(pl, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        panelWeb.setVisibility(View.VISIBLE);
        panelBox.addView(panelWeb, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        content.addView(panelBox, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0));

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        content.addView(web, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);

        web.addJavascriptInterface(new Bridge(), "BashNative");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                String u = req.getUrl().toString();
                if (u.startsWith("file:")) return false;
                openExternal(u);
                return true;
            }
        });

        buildOverlay(root);
        CookieManager.getInstance().setAcceptCookie(true);
        web.loadUrl("file:///android_asset/index.html");
        UpdateJob.schedule(this);
        WatchJob.schedule(this);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 7);
        }
        if (getIntent() != null && getIntent().getBooleanExtra("openUpdate", false)) pendingOpenUpdate = true;
    }

    private boolean pendingOpenUpdate = false;

    @Override
    protected void onResume() {
        super.onResume();
        visible = true;
        Updater.ui = this;
        Updater.maybeCheck(this, 30 * 60_000L);
        if (pendingOpenUpdate) { pendingOpenUpdate = false; web.postDelayed(() -> js("window.openUpdate && window.openUpdate()"), 1200); }
    }

    @Override
    protected void onPause() {
        visible = false;
        if (Updater.ui == this) Updater.ui = null;
        super.onPause();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent.getBooleanExtra("openUpdate", false)) js("window.openUpdate && window.openUpdate()");
    }

    void js(final String code) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    /** Called by Updater with {state, ver, pct, msg…}. */
    void onUpdateEvent(JSONObject o) {
        js("window.onUpdate && window.onUpdate(" + o.toString() + ")");
    }

    private int dp(int v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private void openExternal(String u) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(u))); } catch (Exception ignored) {}
    }

    /** In-app browser on top of the app (used for Warmane's own 3D model and pages). */
    private void buildOverlay(FrameLayout root) {
        overlay = new LinearLayout(this);
        overlay.setOrientation(LinearLayout.VERTICAL);
        overlay.setBackgroundColor(Color.BLACK);
        overlay.setVisibility(View.GONE);
        overlay.setClickable(true);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(10), dp(8), dp(10), dp(8));
        bar.setBackgroundColor(Color.BLACK);

        Button close = new Button(this);
        close.setText("✕");
        close.setTextColor(Color.BLACK);
        close.setTextSize(16);
        close.setBackgroundColor(GREEN);
        close.setOnClickListener(v -> closeOverlay());
        bar.addView(close, new LinearLayout.LayoutParams(dp(44), dp(40)));

        overlayTitle = new TextView(this);
        overlayTitle.setTextColor(GREEN);
        overlayTitle.setTextSize(17);
        overlayTitle.setTypeface(Typeface.DEFAULT_BOLD);
        overlayTitle.setPadding(dp(12), 0, dp(8), 0);
        overlayTitle.setSingleLine(true);
        bar.addView(overlayTitle, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        Button full = new Button(this);
        full.setText("Stranica");
        full.setTextColor(GREEN);
        full.setTextSize(12);
        full.setAllCaps(false);
        full.setBackgroundColor(Color.parseColor("#0B140B"));
        full.setOnClickListener(v -> {
            overlayModelMode = false;
            overlayWeb.reload();
        });
        bar.addView(full, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
        overlay.addView(bar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        overlayProgress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        overlayProgress.setMax(100);
        overlay.addView(overlayProgress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));

        overlayWeb = new WebView(this);
        overlayWeb.setBackgroundColor(Color.BLACK);
        WebSettings os = overlayWeb.getSettings();
        os.setJavaScriptEnabled(true);
        os.setDomStorageEnabled(true);
        os.setUseWideViewPort(true);
        os.setLoadWithOverviewMode(true);
        os.setBuiltInZoomControls(true);
        os.setDisplayZoomControls(false);
        os.setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(overlayWeb, true);
        overlayWeb.addJavascriptInterface(new OverlayBridge(), "BashOverlay");
        overlayWeb.addJavascriptInterface(new NetBridge(), "BashNet");
        overlayWeb.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int p) {
                overlayProgress.setProgress(p);
                overlayProgress.setVisibility(p >= 100 ? View.GONE : View.VISIBLE);
            }
        });
        overlayWeb.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                String host = req.getUrl().getHost();
                if (host != null && (host.endsWith("warmane.com") || host.endsWith("wowhead.com"))) return false;
                openExternal(req.getUrl().toString());
                return true;
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                if (overlayModelMode) view.evaluateJavascript(ISOLATE_MODEL_JS, null);
            }
        });
        overlay.addView(overlayWeb, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(overlay, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void openOverlay(String url, String title, boolean modelMode) {
        overlayModelMode = modelMode;
        overlayTitle.setText(title);
        overlayWeb.getSettings().setUserAgentString(modelMode ? null : UA_MOBILE);
        overlayWeb.loadUrl("about:blank");
        overlayWeb.loadUrl(url);
        overlay.setVisibility(View.VISIBLE);
    }

    private void closeOverlay() {
        overlay.setVisibility(View.GONE);
        overlayWeb.loadUrl("about:blank");
    }

    private String asset(String name) {
        try {
            InputStream in = getAssets().open(name);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192]; int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            in.close();
            return out.toString("UTF-8");
        } catch (Exception e) { return ""; }
    }

    private String modelHtml(String json) throws Exception {
        return asset("model.html").replace("/*__PANELUI__*/", asset("panel-ui.js")).replace("/*__DATA__*/null", json);
    }

    /** Synchronous GET for page scripts (runs on the JS bridge thread, not the UI thread). */
    public class NetBridge {
        @JavascriptInterface
        public String fetchText(String url) {
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(30000);
                c.setRequestProperty("User-Agent", UA_MOBILE);
                c.setRequestProperty("Referer", "https://www.wowhead.com/");
                if (c.getResponseCode() != 200) return "";
                InputStream in = c.getInputStream();
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[32768]; int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                in.close();
                return out.toString("UTF-8");
            } catch (Exception e) {
                return "";
            } finally {
                if (c != null) c.disconnect();
            }
        }
    }

    private String lastPanelJson = null;

    void showPanel(String json, String key) {
        try {
            int h = (int) (getResources().getDisplayMetrics().heightPixels * 0.56);
            LinearLayout.LayoutParams lp = (LinearLayout.LayoutParams) panelBox.getLayoutParams();
            if (lp.height != h) { lp.height = h; panelBox.setLayoutParams(lp); }
            panelBox.setVisibility(View.VISIBLE);
            if (key != null && key.equals(panelKey)) return;
            panelKey = key;
            lastPanelJson = json;
            panelEmbed = false;
            panelWeb.setAlpha(1f);
            panelWeb.getSettings().setUserAgentString(UA_MOBILE);
            panelWeb.loadDataWithBaseURL("https://www.wowhead.com/", modelHtml(json), "text/html", "UTF-8", null);
        } catch (Exception ignored) {}
    }

    void hidePanel() {
        if (panelBox.getVisibility() == View.GONE) return;
        panelBox.setVisibility(View.GONE);
        panelEmbed = false;
        panelWeb.loadUrl("about:blank");
        panelKey = null;
    }

    public class PanelBridge {
        @JavascriptInterface
        public void tip(final int k) { js("window.showTip && window.showTip(" + k + ")"); }

        @JavascriptInterface
        public void full() {
            final String j = lastPanelJson;
            if (j == null) return;
            runOnUiThread(() -> {
                try {
                    overlayModelMode = false;
                    String nm = ""; try { nm = new JSONObject(j).optString("name"); } catch (Exception ignored) {}
                    overlayTitle.setText(nm);
                    overlayWeb.getSettings().setUserAgentString(UA_MOBILE);
                    overlayWeb.loadDataWithBaseURL("https://www.wowhead.com/", modelHtml(j.replace("\"panel\":true", "\"panel\":false")), "text/html", "UTF-8", null);
                    overlay.setVisibility(View.VISIBLE);
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void warmaneEmbed() {
            final String j = lastPanelJson;
            if (j == null) return;
            runOnUiThread(() -> {
                try {
                    String u = new JSONObject(j).optString("warmaneUrl");
                    if (u.isEmpty()) return;
                    panelEmbed = true;
                    panelWeb.setAlpha(0f);
                    panelWeb.getSettings().setUserAgentString(null);
                    panelWeb.loadUrl(u);
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void found(final boolean ok) {
            runOnUiThread(() -> panelWeb.animate().alpha(1f).setDuration(400).start());
        }

        @JavascriptInterface
        public void warmane() {
            final String j = lastPanelJson;
            if (j == null) return;
            runOnUiThread(() -> {
                try {
                    JSONObject o = new JSONObject(j);
                    String u = o.optString("warmaneUrl");
                    if (!u.isEmpty()) openOverlay(u, o.optString("name"), true);
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void collapse() {
            runOnUiThread(() -> { hidePanel(); js("window.onPanelCollapsed && window.onPanelCollapsed()"); });
        }
    }

    public class OverlayBridge {
        @JavascriptInterface
        public void found(final boolean ok) {
            runOnUiThread(() -> {
                if (!ok) overlayTitle.setText(overlayTitle.getText() + " · klikni 3D na stranici");
            });
        }
    }

    /** HTTP from Java, so the Warmane/Wowhead requests are not blocked by CORS. */
    public class Bridge {
        @JavascriptInterface
        public void get(final String id, final String url) { request(id, url, null); }

        @JavascriptInterface
        public void post(final String id, final String url, final String body) { request(id, url, body); }

        @JavascriptInterface
        public void setWatch(final String json) { WatchJob.setWatch(MainActivity.this, json); }

        @JavascriptInterface
        public void showPanel(final String json, final String key) { runOnUiThread(() -> MainActivity.this.showPanel(json, key)); }

        @JavascriptInterface
        public void hidePanel() { runOnUiThread(() -> MainActivity.this.hidePanel()); }

        @JavascriptInterface
        public String updInfo() {
            try {
                JSONObject o = new JSONObject();
                o.put("ver", Updater.currentName(MainActivity.this));
                o.put("code", Updater.currentCode(MainActivity.this));
                o.put("mode", Updater.prefs(MainActivity.this).getString("upd", "auto"));
                o.put("canInstall", Updater.canInstall(MainActivity.this));
                JSONObject l = Updater.latest;
                if (l != null) o.put("latest", l);
                return o.toString();
            } catch (Exception e) { return "{}"; }
        }

        @JavascriptInterface
        public void updCheck() { Updater.checkAsync(MainActivity.this, true); }

        @JavascriptInterface
        public void updInstall() { Updater.installReady(MainActivity.this); }

        @JavascriptInterface
        public void updSnooze() { Updater.snooze(MainActivity.this); }

        @JavascriptInterface
        public void updMode(String m) {
            if ("auto".equals(m) || "ask".equals(m) || "off".equals(m))
                Updater.prefs(MainActivity.this).edit().putString("upd", m).apply();
        }

        @JavascriptInterface
        public void updPerm() {
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName())));
                } catch (Exception e) {
                    try { startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS)); } catch (Exception ignored) {}
                }
            });
        }

        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("text/plain");
                i.putExtra(Intent.EXTRA_TEXT, text);
                try { startActivity(Intent.createChooser(i, "Podijeli")); } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void openModel(final String json, final String title) {
            runOnUiThread(() -> {
                try {
                    String html = modelHtml(json);
                    overlayModelMode = false;
                    overlayTitle.setText(title);
                    overlayWeb.getSettings().setUserAgentString(UA_MOBILE);
                    overlayWeb.loadDataWithBaseURL("https://www.wowhead.com/", html, "text/html", "UTF-8", null);
                    overlay.setVisibility(View.VISIBLE);
                } catch (Exception e) {
                    overlayTitle.setText("3D greška");
                }
            });
        }

        @JavascriptInterface
        public void openWeb(final String url, final String title, final boolean modelMode) {
            runOnUiThread(() -> openOverlay(url, title, modelMode));
        }

        private void request(final String id, final String url, final String body) {
            pool.execute(() -> {
                boolean ok = false; String resp;
                HttpURLConnection c = null;
                try {
                    c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(15000);
                    c.setReadTimeout(25000);
                    c.setInstanceFollowRedirects(true);
                    c.setRequestProperty("User-Agent", UA_MOBILE);
                    c.setRequestProperty("Accept", "application/json, text/html, text/xml, */*");
                    String ck = CookieManager.getInstance().getCookie(url);
                    if (ck != null) c.setRequestProperty("Cookie", ck);
                    if (body != null) {
                        c.setRequestMethod("POST");
                        c.setDoOutput(true);
                        c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                        c.setRequestProperty("X-Requested-With", "XMLHttpRequest");
                        c.setRequestProperty("Referer", url);
                        OutputStream os = c.getOutputStream();
                        os.write(body.getBytes("UTF-8"));
                        os.close();
                    }
                    int code = c.getResponseCode();
                    InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    if (in != null) {
                        byte[] buf = new byte[16384]; int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        in.close();
                    }
                    resp = out.toString("UTF-8");
                    ok = code < 400;
                    if (!ok && resp.isEmpty()) resp = "HTTP " + code;
                } catch (Exception e) {
                    resp = "Nema interneta ili server ne odgovara (" + e.getClass().getSimpleName() + ")";
                } finally {
                    if (c != null) c.disconnect();
                }
                final String js = "window.__nativeCb(" + JSONObject.quote(id) + "," + ok + "," + JSONObject.quote(resp) + ")";
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript(js, null); });
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (overlay.getVisibility() == View.VISIBLE) {
            if (overlayWeb.canGoBack() && !overlayModelMode) overlayWeb.goBack(); else closeOverlay();
            return;
        }
        web.evaluateJavascript("window.bashBack && window.bashBack()", value -> {
            if (!"true".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onDestroy() {
        pool.shutdownNow();
        if (overlayWeb != null) { overlayWeb.destroy(); overlayWeb = null; }
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
