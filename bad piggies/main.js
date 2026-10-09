// Minimal launcher: loads main.swf with the local ruffle.js.
// Shows what it is doing on screen so a blank page is never silent.
(function () {
  var container = document.getElementById("container");

  // On-screen status box (top-left, stays above the game).
  var status = document.createElement("pre");
  status.style.cssText =
    "position:fixed;left:8px;top:8px;margin:0;padding:8px 10px;z-index:99999;" +
    "color:#0f0;background:rgba(0,0,0,.75);font:13px monospace;white-space:pre-wrap;" +
    "max-width:90vw;pointer-events:none";
  document.body.appendChild(status);

  var log = [];
  function say(msg) {
    log.push(msg);
    status.textContent = log.join("\n");
    console.log("[launcher]", msg);
  }
  function fail(msg) {
    status.style.color = "#ff6b6b";
    say(msg);
  }

  window.addEventListener("error", function (e) {
    fail("Script error: " + (e.message || e));
  });
  window.addEventListener("unhandledrejection", function (e) {
    fail("Unhandled error: " + (e.reason && e.reason.message ? e.reason.message : e.reason));
  });

  function chain(err) {
    var lines = [];
    for (var e = err; e; e = e.cause) {
      lines.push(String(e && e.message ? e.message : e));
    }
    return lines.join("\n  caused by: ");
  }

  function start() {
    say("Page address: " + location.href);
    if (location.protocol === "file:") {
      fail("Opened from file:// - use http://localhost:8000 instead.");
      return;
    }

    if (!window.RufflePlayer || !window.RufflePlayer.newest) {
      fail("ruffle.js did not load (window.RufflePlayer is missing).\nCheck that ruffle.js is next to index.html.");
      return;
    }
    say("Ruffle found. Creating player...");

    var ruffle = window.RufflePlayer.newest();
    var player = ruffle.createPlayer();
    player.style.width = "100%";
    player.style.height = "100%";

    // The game contains helper code (from its Flash wrapper library) that looks for
    // its own <embed> element and, if the usual Flash params are missing, REPLACES it
    // with a clone. That removes Ruffle's player and leaves a black screen.
    // The original page avoided this by presenting the player as an <embed> with
    // these params already set, so we do the same.
    Object.defineProperty(player, "nodeName", {
      get: function () {
        return "EMBED";
      }
    });
    var flashParams = {
      allowFullScreen: "true",
      allowScriptAccess: "always",
      allowNetworking: "all",
      wmode: "opaque"
    };
    Object.keys(flashParams).forEach(function (k) {
      player.setAttribute(k, flashParams[k]);
    });

    container.appendChild(player);

    say("Loading main.swf...");
    var slow = setTimeout(function () {
      say("Still loading after 15s. Open the Console (Ctrl+Shift+K) and send me any red lines.");
    }, 15000);

    player
      .load({
        url: "main.swf",
        allowFullscreen: true,
        allowNetworking: "all",
        allowScriptAccess: true,
        polyfills: false,
        autoplay: "on",
        unmuteOverlay: "hidden",
        splashScreen: false,
        deviceFontRenderer: "canvas"
      })
      .then(function () {
        clearTimeout(slow);
        say("main.swf loaded. If the screen stays black, click inside the page once.");
        // Hide the status box after a few seconds once everything worked.
        setTimeout(function () {
          status.style.display = "none";
        }, 6000);
      })
      .catch(function (err) {
        clearTimeout(slow);
        fail("Could not load main.swf\n" + chain(err));
        console.error(err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
