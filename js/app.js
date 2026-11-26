/* ============================================================
   掌机口袋 · 应用逻辑
   ============================================================ */

(function () {
  "use strict";

  var $ = function (sel) { return document.querySelector(sel); };

  var state = {
    local: [],
    filter: "builtin",
    booted: false,
    currentBlobUrl: null,
    dragging: 0
  };

  var el = {};

  /* ---------------- 小工具 ---------------- */

  function toast(message, type) {
    var box = document.createElement("div");
    box.className = "toast " + (type || "");
    var ic = document.createElement("span");
    ic.className = "ic";
    ic.textContent = type === "err" ? "!" : type === "ok" ? "OK" : "i";
    var txt = document.createElement("span");
    txt.textContent = message;
    box.appendChild(ic);
    box.appendChild(txt);
    el.toasts.appendChild(box);
    setTimeout(function () {
      box.style.transition = "opacity .3s, transform .3s";
      box.style.opacity = "0";
      box.style.transform = "translateY(8px)";
      setTimeout(function () { box.remove(); }, 320);
    }, 3600);
  }

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function hueOf(text) {
    var h = 0;
    for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
    return h;
  }

  function glyphOf(name) {
    var clean = String(name).replace(/[^\p{L}\p{N}]/gu, "");
    return (clean[0] || "?").toUpperCase();
  }

  /* ---------------- 卡片 ---------------- */

  function makeCard(node) {
    node.className = "card";
    node.tabIndex = 0;
    node.setAttribute("role", "button");
    node.addEventListener("click", function (e) {
      if (e.target.closest(".card-del")) return;
      startGame(node.dataset.kind, node.dataset.id);
    });
    node.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        startGame(node.dataset.kind, node.dataset.id);
      }
    });
    return node;
  }

  function builtinCard(game) {
    var card = makeCard(document.createElement("article"));
    card.dataset.kind = "builtin";
    card.dataset.id = game.id;

    var cover = document.createElement("div");
    cover.className = "card-cover";

    var img = document.createElement("img");
    img.src = game.cover;
    img.alt = game.title + " 游戏画面";
    img.loading = "lazy";
    img.decoding = "async";
    cover.appendChild(img);

    var badge = document.createElement("span");
    badge.className = "card-badge free";
    badge.textContent = "内置 · 免费";
    cover.appendChild(badge);

    var playBtn = document.createElement("span");
    playBtn.className = "card-play";
    playBtn.textContent = "▶ 开始游戏";
    cover.appendChild(playBtn);

    var body = document.createElement("div");
    body.className = "card-body";

    var titleRow = document.createElement("div");
    titleRow.className = "card-title";
    var h3 = document.createElement("h3");
    h3.textContent = game.title;
    var yr = document.createElement("span");
    yr.className = "yr";
    yr.textContent = game.year;
    titleRow.appendChild(h3);
    titleRow.appendChild(yr);

    var sub = document.createElement("p");
    sub.className = "card-sub";
    sub.textContent = game.blurb;

    var meta = document.createElement("div");
    meta.className = "card-meta";
    var genre = document.createElement("span");
    genre.textContent = game.genre;
    var dot = document.createElement("span");
    dot.textContent = "·";
    var author = document.createElement("span");
    author.textContent = game.author;
    var lic = document.createElement("span");
    lic.className = "lic";
    lic.textContent = game.license;
    meta.appendChild(genre);
    meta.appendChild(dot);
    meta.appendChild(author);
    meta.appendChild(lic);

    body.appendChild(titleRow);
    body.appendChild(sub);
    body.appendChild(meta);

    card.appendChild(cover);
    card.appendChild(body);
    return card;
  }

  function localCard(rec) {
    var card = makeCard(document.createElement("article"));
    card.dataset.kind = "local";
    card.dataset.id = rec.id;

    var hue = hueOf(rec.name || "rom");
    var cover = document.createElement("div");
    cover.className = "card-cover";

    var gen = document.createElement("div");
    gen.className = "cover-gen";
    gen.textContent = glyphOf(rec.name);
    gen.style.background =
      "radial-gradient(120% 120% at 20% 10%, hsl(" + hue + " 70% 42%) 0%, hsl(" +
      ((hue + 40) % 360) + " 60% 18%) 55%, #0a0912 100%)";
    cover.appendChild(gen);

    var badge = document.createElement("span");
    badge.className = "card-badge mine";
    badge.textContent = "我的卡带";
    cover.appendChild(badge);

    var del = document.createElement("button");
    del.type = "button";
    del.className = "card-del";
    del.title = "从库里移除";
    del.setAttribute("aria-label", "移除 " + rec.name);
    del.textContent = "✕";
    del.addEventListener("click", function (e) {
      e.stopPropagation();
      removeLocal(rec);
    });
    cover.appendChild(del);

    var playBtn = document.createElement("span");
    playBtn.className = "card-play";
    playBtn.textContent = "▶ 开始游戏";
    cover.appendChild(playBtn);

    var body = document.createElement("div");
    body.className = "card-body";

    var titleRow = document.createElement("div");
    titleRow.className = "card-title";
    var h3 = document.createElement("h3");
    h3.textContent = rec.name;
    var yr = document.createElement("span");
    yr.className = "yr";
    yr.textContent = rec.code || "GBA";
    titleRow.appendChild(h3);
    titleRow.appendChild(yr);

    var sub = document.createElement("p");
    sub.className = "card-sub";
    sub.textContent = window.ROM.formatSize(rec.size) + " · 存档随卡带保存在本机";
    if (rec.filename) sub.title = rec.filename;

    var meta = document.createElement("div");
    meta.className = "card-meta";
    var m1 = document.createElement("span");
    m1.textContent = "本地导入";
    var m2 = document.createElement("span");
    m2.textContent = "·";
    var m3 = document.createElement("span");
    m3.textContent = formatDate(rec.addedAt) + " 加入";
    meta.appendChild(m1);
    meta.appendChild(m2);
    meta.appendChild(m3);

    body.appendChild(titleRow);
    body.appendChild(sub);
    body.appendChild(meta);

    card.appendChild(cover);
    card.appendChild(body);
    return card;
  }

  /* ---------------- 渲染 ---------------- */

  function visibleGames() {
    if (state.filter === "builtin") {
      return window.BUILTIN_GAMES.map(function (g) { return { kind: "builtin", data: g }; });
    }
    if (state.filter === "local") {
      return state.local.map(function (r) { return { kind: "local", data: r }; });
    }
    return window.BUILTIN_GAMES
      .map(function (g) { return { kind: "builtin", data: g }; })
      .concat(state.local.map(function (r) { return { kind: "local", data: r }; }));
  }

  function render() {
    var list = visibleGames();
    el.grid.innerHTML = "";

    list.forEach(function (item) {
      el.grid.appendChild(item.kind === "builtin" ? builtinCard(item.data) : localCard(item.data));
    });

    el.count.textContent = String(list.length);
    el.tabLocalCount.textContent = String(state.local.length);
    el.empty.hidden = !(state.filter === "local" && state.local.length === 0);

    el.tabs.forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.filter === state.filter);
    });
  }

  /* ---------------- 导入 ---------------- */

  async function handleFiles(fileList) {
    if (!fileList || !fileList.length) return;

    var result = await window.ROM.ingestFiles(fileList);
    var added = 0;

    for (var i = 0; i < result.roms.length; i++) {
      var r = result.roms[i];
      var rec = {
        id: window.ROMDB.uid(),
        name: r.name,
        filename: r.filename,
        size: r.header.size,
        code: r.header.code,
        addedAt: Date.now(),
        blob: new Blob([r.buffer], { type: "application/octet-stream" })
      };
      try {
        await window.ROMDB.put(rec);
        state.local.unshift(rec);
        added++;
      } catch (err) {
        result.errors.push(r.name + "：写入本地存储失败");
      }
    }

    if (added) {
      state.filter = "local";
      render();
      toast(added === 1 ? "已导入《" + result.roms[0].name + "》，点击卡片开始" : "已导入 " + added + " 个卡带", "ok");
    }
    result.roms.forEach(function (r, idx) {
      if (!r.warning) return;
      setTimeout(function () { toast(r.warning, "warn"); }, 600 + idx * 300);
    });
    result.errors.forEach(function (msg, idx) {
      setTimeout(function () { toast(msg, "err"); }, (added ? 600 : 0) + idx * 300);
    });
  }

  function removeLocal(rec) {
    if (!window.confirm("从游戏库移除《" + rec.name + "》？\n（浏览器里的存档不会被删除）")) return;
    window.ROMDB.remove(rec.id).then(function () {
      state.local = state.local.filter(function (r) { return r.id !== rec.id; });
      render();
      toast("已移除《" + rec.name + "》");
    });
  }

  /* ---------------- 播放器 ---------------- */

  function findGame(kind, id) {
    if (kind === "builtin") {
      return window.BUILTIN_GAMES.find(function (g) { return g.id === id; }) || null;
    }
    return state.local.find(function (r) { return r.id === id; }) || null;
  }

  async function romBufferOf(kind, game) {
    if (kind === "builtin") {
      var res = await fetch(game.rom);
      if (!res.ok) throw new Error("内置 ROM 读取失败（" + res.status + "）");
      return await res.arrayBuffer();
    }
    var rec = await window.ROMDB.get(game.id);
    if (!rec || !rec.blob) throw new Error("找不到这份卡带，可能已被移除");
    return await rec.blob.arrayBuffer();
  }

  function showPlayer(kind, game) {
    el.player.hidden = false;
    document.body.style.overflow = "hidden";
    el.plTitle.textContent = game.name || game.title;
    el.plBadge.textContent = kind === "builtin" ? "内置 · 免费" : "我的卡带";
    el.plBadge.className = "pill " + (kind === "builtin" ? "mint" : "local");
    el.plSize.textContent = window.ROM.formatSize(
      kind === "builtin" ? (game.size || 0) : game.size
    );
    setLoading(game.name || game.title);
  }

  function setLoading(name) {
    el.root.innerHTML = "";
    var box = document.createElement("div");
    box.className = "ejs-loading";
    box.innerHTML =
      '<div class="ld-cart"><span></span></div>' +
      '<p class="ld-title"></p>' +
      '<p class="ld-sub">正在装载 mGBA 内核 · 准备画面</p>';
    box.querySelector(".ld-title").textContent = name;
    el.root.appendChild(box);
  }

  function clearLoading() {
    var box = el.root.querySelector(".ejs-loading");
    if (box) box.remove();
  }

  function removeTap() {
    var btn = el.root.querySelector(".pa-tap");
    if (btn) btn.remove();
  }

  var pendingPlay = false;

  function requestPlay() {
    var emu = window.EJS_emulator;
    if (!emu || typeof emu.play !== "function") {
      pendingPlay = true;
      return;
    }
    // 已经跑起来就不要再 play()，EJS 的 play/pause 是同一个开关
    if (emu.paused) {
      try { emu.play(); } catch (e) {}
    }
    try { emu.setVolume(0.5); } catch (e) {}
  }

  /* 浏览器要求「用户手势」才允许启动 AudioContext，
     所以先盖一层点击层，点一下再真正开始跑。 */
  function showTap() {
    if (el.root.querySelector(".pa-tap")) return;
    var emu = window.EJS_emulator;
    if (emu && emu.started && !emu.paused) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pa-tap";
    btn.innerHTML =
      '<span class="pa-tap-ic">▶</span>' +
      "<b>点击开始</b>" +
      "<i>浏览器需要一次点击，才允许模拟器发出声音</i>";
    btn.addEventListener("click", function () {
      removeTap();
      requestPlay();
    });
    el.root.appendChild(btn);
  }

  var bootTimer = null;

  /* EmulatorJS 在 localhost 上会去 CDN 检查版本、缺文件时也会回源。
     这里直接掐断，保证「零外部请求」。 */
  function installOfflineGuard() {
    if (window.__paOfflineGuard) return;
    window.__paOfflineGuard = true;
    var orig = window.fetch ? window.fetch.bind(window) : null;
    if (!orig) return;
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      if (/emulatorjs\.org|jsdelivr|unpkg/i.test(url)) {
        return Promise.reject(new Error("offline: " + url));
      }
      return orig(input, init);
    };
  }

  function bootEmulator(kind, game) {
    installOfflineGuard();
    romBufferOf(kind, game).then(function (buffer) {
      el.plSize.textContent = window.ROM.formatSize(buffer.byteLength);
      if (state.currentBlobUrl) URL.revokeObjectURL(state.currentBlobUrl);
      var blob = new Blob([buffer], { type: "application/octet-stream" });
      state.currentBlobUrl = URL.createObjectURL(blob);

      el.root.innerHTML = "";

      window.EJS_player = "#ejs-root";
      window.EJS_core = "gba";
      window.EJS_gameUrl = state.currentBlobUrl;
      window.EJS_gameName = game.name || game.title;
      window.EJS_pathtodata = "data/";
      window.EJS_language = "zh-CN";
      window.EJS_color = "#7b5cff";
      window.EJS_backgroundColor = "#05050a";
      window.EJS_startOnLoaded = true;
      window.EJS_fullscreenOnLoaded = false;
      window.EJS_ready = function () {
        clearTimeout(bootTimer);
        state.booted = true;
        clearLoading();
        if (pendingPlay) { pendingPlay = false; requestPlay(); }
      };
      window.EJS_onGameStart = function () {
        clearTimeout(bootTimer);
        state.booted = true;
        clearLoading();
        removeTap();
      };
      window.EJS_disableAutoLang = true;

      var script = document.createElement("script");
      script.src = "data/loader.js";
      script.onerror = function () {
        clearTimeout(bootTimer);
        state.booted = false;
        toast("模拟器内核加载失败，请用本地服务打开本页面", "err");
        showBootError("无法加载 data/loader.js");
      };
      document.body.appendChild(script);

      // EJS 构造时会清空容器，所以等它挂载完再把点击层叠上去
      setTimeout(showTap, 1200);

      bootTimer = setTimeout(function () {
        if (state.booted) return;
        var hint = el.root.querySelector(".ld-sub");
        if (hint && hint.textContent.indexOf("较慢") === -1) {
          hint.textContent = "首次启动需要解压 WASM 内核，稍等几秒…";
        }
      }, 9000);
    }).catch(function (err) {
      toast(err.message || "启动失败", "err");
      showBootError(err.message || "启动失败");
    });
  }

  function showBootError(message) {
    el.root.innerHTML = "";
    var box = document.createElement("div");
    box.className = "ejs-error";
    var h = document.createElement("b");
    h.textContent = "启动失败";
    var p = document.createElement("p");
    p.textContent = message;
    var tip = document.createElement("p");
    tip.className = "dim";
    tip.textContent = "请确认是通过本地服务（start.bat / node server.mjs）打开的，而不是双击 index.html。";
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(tip);
    el.root.appendChild(box);
  }

  function startGame(kind, id) {
    var game = findGame(kind, id);
    if (!game) {
      toast("找不到这个游戏", "err");
      return;
    }
    var hash = "#/play/" + kind + "/" + id;
    if (state.booted) {
      // 已经有一个会话在跑：整页重载最干净，避免内核实例叠加
      location.hash = hash;
      location.reload();
      return;
    }
    location.hash = hash;
    showPlayer(kind, game);
    bootEmulator(kind, game);
  }

  function route() {
    var m = /^#\/play\/(builtin|local)\/([\w-]+)$/.exec(location.hash || "");
    if (!m) return;
    var game = findGame(m[1], m[2]);
    if (!game) {
      history.replaceState(null, "", location.pathname);
      return;
    }
    showPlayer(m[1], game);
    bootEmulator(m[1], game);
  }

  /* ---------------- 事件 ---------------- */

  function bind() {
    el.btnImport.addEventListener("click", function () { el.fileInput.click(); });
    el.btnImportHero.addEventListener("click", function () { el.fileInput.click(); });
    el.btnImportLib.addEventListener("click", function () { el.fileInput.click(); });
    el.btnImportEmpty.addEventListener("click", function () { el.fileInput.click(); });

    el.fileInput.addEventListener("change", function () {
      handleFiles(el.fileInput.files);
      el.fileInput.value = "";
    });

    el.btnPlayFirst.addEventListener("click", function () {
      var first = window.BUILTIN_GAMES[0];
      if (first) startGame("builtin", first.id);
    });

    el.tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.filter = tab.dataset.filter;
        render();
      });
    });

    el.btnBack.addEventListener("click", function () {
      location.href = location.pathname;
    });

    el.btnAbout.addEventListener("click", function () { el.modal.hidden = false; });
    el.modalClose.addEventListener("click", function () { el.modal.hidden = true; });
    el.modal.addEventListener("click", function (e) {
      if (e.target === el.modal) el.modal.hidden = true;
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !el.modal.hidden) el.modal.hidden = true;
    });

    // 拖拽导入
    window.addEventListener("dragenter", function (e) {
      if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") === -1) return;
      e.preventDefault();
      state.dragging++;
      el.veil.hidden = false;
    });
    window.addEventListener("dragover", function (e) {
      if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") === -1) return;
      e.preventDefault();
    });
    window.addEventListener("dragleave", function (e) {
      if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") === -1) return;
      state.dragging = Math.max(0, state.dragging - 1);
      if (state.dragging === 0) el.veil.hidden = true;
    });
    window.addEventListener("drop", function (e) {
      if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
      e.preventDefault();
      state.dragging = 0;
      el.veil.hidden = true;
      handleFiles(e.dataTransfer.files);
    });

    window.addEventListener("beforeunload", function () {
      if (state.currentBlobUrl) URL.revokeObjectURL(state.currentBlobUrl);
    });
  }

  /* ---------------- 启动 ---------------- */

  async function init() {
    el = {
      grid: $("#lib-grid"),
      empty: $("#lib-empty"),
      count: $("#lib-count"),
      tabLocalCount: $("#tab-n-local"),
      tabs: Array.prototype.slice.call(document.querySelectorAll(".tab")),
      toasts: $("#toasts"),
      btnImport: $("#btn-import"),
      btnImportHero: $("#btn-import-hero"),
      btnImportLib: $("#btn-import-lib"),
      btnImportEmpty: $("#btn-import-empty"),
      btnPlayFirst: $("#btn-play-first"),
      btnBack: $("#btn-back"),
      btnAbout: $("#btn-about"),
      modal: $("#modal-about"),
      modalClose: $("#modal-close"),
      fileInput: $("#file-input"),
      veil: $("#drop-veil"),
      player: $("#player"),
      root: $("#ejs-root"),
      plTitle: $("#pl-title"),
      plBadge: $("#pl-badge"),
      plSize: $("#pl-size")
    };

    $("#fact-count").textContent = String(window.BUILTIN_GAMES.length);

    try {
      var rows = await window.ROMDB.all();
      state.local = (rows || [])
        .filter(function (r) { return r && r.blob; })
        .sort(function (a, b) { return b.addedAt - a.addedAt; });
    } catch (e) {
      state.local = [];
    }

    bind();
    render();
    route();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
