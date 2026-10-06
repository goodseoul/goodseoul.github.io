// Fire-and-forget event logging to Supabase. Never blocks or breaks the page.
(function () {
  var cfg = window.GS_CONFIG || {};
  var params = new URLSearchParams(window.location.search);
  var hash = (params.get("e") || "").replace(/[^a-f0-9]/gi, "").slice(0, 64) || null;
  var ready = cfg.SUPABASE_URL && cfg.SUPABASE_URL.indexOf("YOUR-PROJECT") === -1 &&
              cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_ANON_KEY.indexOf("PASTE_") === -1;

  var sessionId;
  try {
    sessionId = sessionStorage.getItem("gs_sid");
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("gs_sid", sessionId);
    }
  } catch (e) { sessionId = Math.random().toString(36).slice(2); }

  function post(table, row) {
    if (!ready) { console.info("[GS] tracking off (config not set)", table, row); return Promise.resolve(); }
    return fetch(cfg.SUPABASE_URL + "/rest/v1/" + table, {
      method: "POST",
      keepalive: true,
      headers: {
        "apikey": cfg.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(row)
    }).catch(function () {});
  }

  window.GS = {
    emailHash: hash,
    track: function (event) {
      return post("page_visits", {
        event: event,
        email_hash: hash,
        session_id: sessionId,
        page: window.location.pathname.split("/").pop() || "index.html",
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign") || cfg.CAMPAIGN,
        utm_content: params.get("utm_content"),
        referrer: document.referrer || null,
        user_agent: navigator.userAgent.slice(0, 300),
        screen_w: window.innerWidth
      });
    },
    unsubscribe: function () {
      return post("unsubscribes", { email_hash: hash, campaign: cfg.CAMPAIGN });
    },
    ready: ready
  };
})();
