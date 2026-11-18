package com.basaofficial.basharmory;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;

/**
 * Prati likove i guildove na Warmaneu (svakih ~15 min) i javi kad neko uđe u igru.
 * Lista dolazi iz aplikacije (BashNative.setWatch). Prvo pokretanje samo zapamti stanje.
 */
public class WatchJob extends JobService {

    static final int JOB_ID = 4343;
    static final int NOTIF = 61;
    static final String UA = "Mozilla/5.0 (Linux; Android 13) BashArmory/1.3";

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("basharmory_watch", Context.MODE_PRIVATE);
    }

    static void setWatch(Context c, String json) {
        prefs(c).edit().putString("watch", json).apply();
        schedule(c);
        final Context app = c.getApplicationContext();
        new Thread(() -> { try { check(app); } catch (Exception ignored) {} }, "watch-now").start();
    }

    static void schedule(Context c) {
        try {
            JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js == null) return;
            boolean on = false;
            try { on = new JSONObject(prefs(c).getString("watch", "{}")).optBoolean("on", false); } catch (Exception ignored) {}
            if (!on) { js.cancel(JOB_ID); return; }
            for (JobInfo j : js.getAllPendingJobs()) if (j.getId() == JOB_ID) return;
            js.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(c, WatchJob.class))
                    .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                    .setPeriodic(15 * 60_000L)
                    .setPersisted(true)
                    .build());
        } catch (Exception ignored) { }
    }

    private static String get(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(12000);
        c.setReadTimeout(15000);
        c.setRequestProperty("User-Agent", UA);
        c.setRequestProperty("Accept", "application/json");
        if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode());
        InputStream in = c.getInputStream();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192]; int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        in.close();
        c.disconnect();
        return out.toString("UTF-8");
    }

    private static String enc(String s) throws Exception { return URLEncoder.encode(s, "UTF-8").replace("+", "%20"); }

    private static boolean isOnline(Object v) {
        if (v instanceof Boolean) return (Boolean) v;
        String s = String.valueOf(v);
        return s.equals("1") || s.equalsIgnoreCase("true");
    }

    static synchronized void check(Context c) throws Exception {
        SharedPreferences p = prefs(c);
        JSONObject w = new JSONObject(p.getString("watch", "{}"));
        if (!w.optBoolean("on", false)) return;
        JSONObject last = new JSONObject(p.getString("last", "{}"));
        JSONObject now = new JSONObject();
        List<String> cameOnline = new ArrayList<>();
        String realmOf = "";

        JSONArray guilds = w.optJSONArray("guilds");
        if (guilds != null) for (int i = 0; i < guilds.length() && i < 5; i++) {
            JSONObject g = guilds.getJSONObject(i);
            try {
                JSONObject gd = new JSONObject(get("https://armory.warmane.com/api/guild/" + enc(g.getString("name")) + "/" + enc(g.getString("realm")) + "/summary"));
                JSONArray ros = gd.optJSONArray("roster");
                if (ros == null) ros = gd.optJSONArray("members");
                if (ros != null) for (int k = 0; k < ros.length(); k++) {
                    JSONObject m = ros.getJSONObject(k);
                    String key = g.getString("realm") + "/" + m.optString("name");
                    now.put(key, isOnline(m.opt("online")));
                }
            } catch (Exception ignored) { }
        }
        JSONArray chars = w.optJSONArray("chars");
        if (chars != null) for (int i = 0; i < chars.length() && i < 25; i++) {
            JSONObject ch = chars.getJSONObject(i);
            String key = ch.getString("realm") + "/" + ch.getString("name");
            if (now.has(key)) continue;
            try {
                JSONObject cd = new JSONObject(get("https://armory.warmane.com/api/character/" + enc(ch.getString("name")) + "/" + enc(ch.getString("realm")) + "/summary"));
                now.put(key, isOnline(cd.opt("online")));
            } catch (Exception ignored) { }
        }
        boolean first = !p.getBoolean("baseline", false);
        java.util.Iterator<String> it = now.keys();
        while (it.hasNext()) {
            String k = it.next();
            if (now.getBoolean(k) && last.has(k) && !last.optBoolean(k)) {
                cameOnline.add(k.substring(k.indexOf('/') + 1));
                realmOf = k.substring(0, k.indexOf('/'));
            }
        }
        // keep old states for keys that failed this round
        java.util.Iterator<String> li = last.keys();
        while (li.hasNext()) { String k = li.next(); if (!now.has(k)) now.put(k, last.get(k)); }
        p.edit().putString("last", now.toString()).putBoolean("baseline", true).apply();
        if (first || cameOnline.isEmpty()) return;
        String title = cameOnline.size() == 1 ? "🟢 " + cameOnline.get(0) + " je u igri" : "🟢 " + cameOnline.size() + " ušlo u igru";
        String text = cameOnline.size() == 1 ? "Warmane · " + realmOf : android.text.TextUtils.join(", ", cameOnline);
        Updater.notify(c, title, text, Updater.openApp(c), NOTIF);
    }

    @Override
    public boolean onStartJob(final JobParameters params) {
        new Thread(() -> {
            try { check(getApplicationContext()); } catch (Exception ignored) { }
            jobFinished(params, false);
        }, "watch-job").start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) { return true; }
}
