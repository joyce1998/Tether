/* Tether 网站的脚本：
   - 按发布信息（release.js 里的 window.TETHER_RELEASE）填好下载链接、版本、日期、文件大小和 SHA-256；
   - 认出访客用的系统，标出推荐的安装包（三个系统的安装包一直都在页面上）；
   - 拷贝按钮、文档目录。
   没有外部依赖，不联网，不统计访客，也不管主题（主题全由 CSS 跟随系统）。
   关掉 JavaScript 时，下载按钮都指向 GitHub 的发布页。 */
(function () {
  'use strict';

  var RELEASES = 'https://github.com/joyce1998/Tether/releases/latest';
  var DOWNLOAD = 'https://github.com/joyce1998/Tether/releases/download/v';
  // 校验值列表的顺序：同一个系统的放在一起
  var KEYS = ['mac-arm64-dmg', 'mac-arm64-zip', 'mac-x64-dmg', 'mac-x64-zip', 'win-x64-nsis', 'win-arm64-nsis',
    'linux-x64-deb', 'linux-x64-appimage', 'linux-arm64-deb', 'linux-arm64-appimage'];

  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var closest = function (el, sel) { return el && el.closest ? el.closest(sel) : null; };

  /* ---------- 发布信息 ---------- */
  var R = window.TETHER_RELEASE && typeof window.TETHER_RELEASE === 'object' ? window.TETHER_RELEASE : {};
  var version = typeof R.version === 'string' && /^\d+\.\d+\.\d+$/.test(R.version) ? R.version : '';
  var base = typeof R.base === 'string' && /^https:\/\/\S+$/.test(R.base) ? R.base.replace(/\/*$/, '/')
    : version ? DOWNLOAD + version + '/' : '';
  // 只认 GitHub 上的发布页，免得缺文件时把人带回这个网站自己
  var page = typeof R.page === 'string' && /^https:\/\/github\.com\/\S+$/.test(R.page) ? R.page : RELEASES;

  function file(key) {
    var f = R.files && R.files[key];
    if (!base || !f || typeof f.name !== 'string' || !/^[A-Za-z0-9._-]+$/.test(f.name)) return null;
    return {
      name: f.name,
      url: base + f.name,
      size: typeof f.size === 'number' && f.size > 0 && f.size < 1e11 ? Math.round(f.size) : null,
      sha256: typeof f.sha256 === 'string' && /^[0-9a-fA-F]{64}$/.test(f.sha256) ? f.sha256.toLowerCase() : null
    };
  }
  function isBeta(os) { return Boolean(R.platforms && R.platforms[os] && R.platforms[os].beta === true); }

  // 1 MB = 1,000,000 字节，和访达、文件管理器的算法一样
  function mb(n) { return (n / 1e6).toFixed(1) + ' MB'; }
  function grouped(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function day(s) {
    var m = typeof s === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? m[1] + ' 年 ' + Number(m[2]) + ' 月 ' + Number(m[3]) + ' 日' : '';
  }

  if (version) $$('[data-rel="version"]').forEach(function (el) { el.textContent = version; });
  var released = day(R.date);
  $$('[data-rel="date"]').forEach(function (el) { el.textContent = released; });
  // data-if-version：只在当前发布的是这个版本时显示日期（更新日志里写死的旧版本不会被换成新版本的日期）
  $$('[data-rel-show="date"]').forEach(function (el) {
    var only = el.getAttribute('data-if-version');
    el.hidden = !released || Boolean(only && only !== version);
  });
  // 「测试版」标记和说明：只在发布信息里标了 beta 的系统旁边显示
  $$('[data-beta]').forEach(function (el) { el.hidden = !isBeta(el.getAttribute('data-beta')); });
  $$('[data-beta-any]').forEach(function (el) { el.hidden = !(isBeta('mac') || isBeta('windows') || isBeta('linux')); });
  $$('a[data-release-page]').forEach(function (a) { a.href = page; });

  // 下载链接：缺了这个文件（或者没有发布信息）就指向发布页
  function setFile(a, key) {
    var f = file(key);
    a.setAttribute('data-file', key);
    a.href = f ? f.url : page;
    var size = a.querySelector('[data-size]');
    if (size) size.textContent = f && f.size ? ' · ' + mb(f.size) : '';
  }
  $$('a[data-file]').forEach(function (a) { setFile(a, a.getAttribute('data-file')); });

  /* ---------- 访客的系统 ---------- */
  // 先看 User-Agent Client Hints（Chrome、Edge 有），再看 User-Agent。只用来标出推荐的安装包
  var who = (function () {
    var ua = navigator.userAgent || '';
    var ch = navigator.userAgentData;
    var p = ch && typeof ch.platform === 'string' ? ch.platform.toLowerCase() : '';
    var r = { os: '', arch: '', distro: '', mobile: false };
    // iPad 上的 Safari 默认用 Mac 的 User-Agent，靠触点数认出来
    if (/iPhone|iPad|iPod|Android/i.test(ua) || p === 'android' || p === 'ios' || (ch && ch.mobile === true) ||
        (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
      r.mobile = true;
      return r;
    }
    var byHint = { macos: 'mac', windows: 'windows', linux: 'linux', 'chrome os': 'linux', chromeos: 'linux' }[p];
    r.os = byHint || (/Windows/.test(ua) ? 'windows' : /Macintosh|Mac OS X/.test(ua) ? 'mac' : /Linux|X11|CrOS/.test(ua) ? 'linux' : '');
    // Safari 在 Apple 芯片的 Mac 上也写 Intel，Windows 上的浏览器在 ARM 电脑上也写 x64，所以这里只认明确写了 ARM 的
    if (/aarch64|arm64/i.test(ua)) r.arch = 'arm64';
    // 发行版：Firefox 常在 User-Agent 里写上 Ubuntu、Fedora 这些。区分大小写、按整词匹配，免得 aarch64 被当成 Arch
    if (r.os === 'linux') {
      if (/\b(Ubuntu|Debian|Mint|Pop!_OS|elementary|Raspbian|Kali|Deepin|UOS|Kylin|CrOS)\b/.test(ua)) r.distro = 'deb';
      else if (/\b(Fedora|Red Hat|CentOS|Rocky|AlmaLinux|SUSE|openSUSE|Arch Linux|Manjaro|EndeavourOS|Gentoo|NixOS|Alpine)\b/.test(ua)) r.distro = 'other';
    }
    return r;
  })();
  document.documentElement.setAttribute('data-visitor', who.os || (who.mobile ? 'mobile' : 'unknown'));

  // 每个系统推荐哪个安装包：认出了芯片就按芯片，否则 Mac 推荐 Apple 芯片，Windows 和 Linux 推荐 x64
  function archFor(os) {
    if (who.os === os && who.arch) return who.arch;
    return os === 'mac' ? 'arm64' : 'x64';
  }
  function pickFor(os) {
    var arch = archFor(os);
    if (os === 'mac') return arch === 'x64' ? 'mac-x64-dmg' : 'mac-arm64-dmg';
    if (os === 'windows') return arch === 'arm64' ? 'win-arm64-nsis' : 'win-x64-nsis';
    return 'linux-' + arch + '-' + (who.os === 'linux' && who.distro === 'other' ? 'appimage' : 'deb');
  }

  // 命令和说明里的文件名。认出了访客电脑的芯片时，换成那种芯片的文件：arm64 的 Linux 电脑上，apt 命令里就是 arm64 的 .deb
  var OS_OF = { mac: 'mac', win: 'windows', linux: 'linux' };
  function fillNames() {
    $$('[data-name]').forEach(function (el) {
      var key = el.getAttribute('data-name');
      var m = /^(mac|win|linux)-(?:x64|arm64)-(.+)$/.exec(key);
      var mine = m && who.os === OS_OF[m[1]] && who.arch ? m[1] + '-' + who.arch + '-' + m[2] : key;
      var f = file(mine) || file(key);
      if (f) el.textContent = f.name;
    });
  }

  function mark() {
    $$('[data-os]').forEach(function (col) {
      var os = col.getAttribute('data-os');
      col.classList.toggle('is-yours', who.os === os);
      // Linux 的两个按钮跟着芯片换文件，另一种芯片的放在下面一行
      if (os === 'linux') {
        var arch = archFor(os);
        var other = arch === 'arm64' ? 'x64' : 'arm64';
        $$('a[data-kind]', col).forEach(function (a) {
          setFile(a, 'linux-' + (a.hasAttribute('data-alt') ? other : arch) + '-' + a.getAttribute('data-kind'));
        });
        $$('[data-arch]', col).forEach(function (el) { el.textContent = el.hasAttribute('data-alt') ? other : arch; });
      }
      // 访客的系统里，推荐的那个是蓝色按钮；认不出系统时（比如手机），每个系统都标出常用的那个
      var pick = pickFor(os);
      var emphasize = who.os === os || !who.os;
      $$('.os-dl a[data-file]', col).forEach(function (a) {
        a.classList.toggle('btn-neutral', !(emphasize && a.getAttribute('data-file') === pick));
      });
    });
    fillNames();
    fillPicks();
  }

  /* ---------- 首页：按系统下载 ---------- */
  // 三个按钮各下载那个系统推荐的安装包（芯片按上面 pickFor 的规则），访客自己的系统是蓝色。
  // 手机和平板上不直接下载安装包，带到下载页对应的系统
  var PICK_WHAT = {
    'mac-arm64-dmg': 'Apple 芯片 · DMG', 'mac-x64-dmg': 'Intel 处理器 · DMG',
    'win-x64-nsis': 'x64 安装程序', 'win-arm64-nsis': 'ARM64 安装程序',
    'linux-x64-deb': '.deb · x64', 'linux-arm64-deb': '.deb · arm64',
    'linux-x64-appimage': 'AppImage · x64', 'linux-arm64-appimage': 'AppImage · arm64'
  };
  function fillPicks() {
    $$('a[data-pick]').forEach(function (a) {
      var os = a.getAttribute('data-pick');
      var key = pickFor(os);
      var box = closest(a, '.pick-os');
      if (box) box.classList.toggle('is-yours', who.os === os);
      a.classList.toggle('btn-neutral', who.os !== os);
      if (who.mobile) {
        a.removeAttribute('data-file');
        a.href = 'download.html#' + os;
      } else {
        setFile(a, key);
      }
      var f = file(key);
      var sub = box && box.querySelector('[data-pick-sub]');
      if (sub && PICK_WHAT[key]) sub.textContent = PICK_WHAT[key] + (f && f.size ? ' · ' + mb(f.size) : '');
    });
  }
  // 点了下载，在这组按钮下面说一声下一步怎么装
  document.addEventListener('click', function (e) {
    var a = closest(e.target, 'a[data-pick][data-file]');
    var group = closest(a, '[data-pick-group]');
    var f = a && file(a.getAttribute('data-file'));
    if (!group || !f) return;
    var os = a.getAttribute('data-pick');
    var kind = os === 'linux' ? (/appimage$/.test(a.getAttribute('data-file')) ? 'appimage' : 'deb') : os;
    $$('[data-pick-after]', group).forEach(function (note) {
      var show = note.getAttribute('data-pick-after') === kind;
      note.hidden = !show;
      if (show) $$('[data-fill-name]', note).forEach(function (el) { el.textContent = f.name; });
    });
  });

  mark();
  $$('[data-mobile-note]').forEach(function (el) { el.hidden = !who.mobile; });

  // Chrome、Edge 能告诉我们是不是 ARM 芯片（Apple 芯片的 Mac、骁龙笔记本、ARM 的 Linux 电脑）
  var hints = navigator.userAgentData;
  if (who.os && hints && typeof hints.getHighEntropyValues === 'function') {
    hints.getHighEntropyValues(['architecture', 'bitness']).then(function (h) {
      var arch = h.architecture === 'arm' ? 'arm64' : h.architecture === 'x86' && h.bitness !== '32' ? 'x64' : '';
      if (arch && arch !== who.arch) {
        who.arch = arch;
        mark();
      }
    }, function () { /* 浏览器不给就按默认的推荐 */ });
  }

  // 正文里的快捷键：Windows、Linux 的访客看到 Ctrl 的写法；认不出系统时两种都写上
  $$('kbd[data-pc]').forEach(function (k) {
    var pc = k.getAttribute('data-pc');
    if (who.os === 'windows' || who.os === 'linux') {
      k.title = 'Mac 上是 ' + k.textContent;
      k.textContent = pc;
    } else if (!who.os) {
      var alt = document.createElement('kbd');
      alt.textContent = pc;
      k.parentNode.insertBefore(alt, k.nextSibling);
      k.parentNode.insertBefore(document.createTextNode(' / '), alt);
    }
  });

  // 下载开始后，在那个系统下面说一声下一步要做什么
  document.addEventListener('click', function (e) {
    var a = closest(e.target, 'a[data-file]');
    var col = closest(a, '[data-os]');
    if (!col) return;
    var f = file(a.getAttribute('data-file'));
    if (!f) return; // 指向的是发布页，不是安装包
    var kind = a.getAttribute('data-note');
    $$('[data-after]', col).forEach(function (note) {
      var show = note.getAttribute('data-after') === kind;
      note.hidden = !show;
      if (show) $$('[data-fill-name]', note).forEach(function (el) { el.textContent = f.name; });
    });
  });

  /* ---------- 校验值列表 ---------- */
  var list = document.querySelector('[data-hashes]');
  if (list) {
    var keys = KEYS.concat(Object.keys(R.files || {}).filter(function (k) { return KEYS.indexOf(k) < 0; }));
    var anyHash = false;
    keys.forEach(function (key) {
      var f = file(key);
      if (!f) return;
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.className = 'file';
      name.textContent = f.name;
      if (f.size) {
        // 大小跟在文件名后面；窄屏换行时「· 99,234,567 字节」整个一起换
        var size = document.createElement('span');
        size.className = 'nw';
        size.textContent = '· ' + grouped(f.size) + '\u00a0字节';
        name.appendChild(document.createTextNode(' '));
        name.appendChild(size);
      }
      li.appendChild(name);
      if (f.sha256) {
        anyHash = true;
        var id = 'sha-' + key;
        var btn = document.createElement('button');
        btn.className = 'copy';
        btn.type = 'button';
        btn.textContent = '拷贝';
        btn.setAttribute('data-copy', '#' + id);
        btn.setAttribute('aria-label', '拷贝 ' + f.name + ' 的 SHA-256');
        var code = document.createElement('code');
        code.id = id;
        code.textContent = f.sha256;
        li.appendChild(btn);
        li.appendChild(code);
      }
      list.appendChild(li);
    });
    $$('[data-hashes-missing]').forEach(function (el) { el.hidden = anyHash; });
  }

  /* ---------- 拷贝按钮 ---------- */
  var status = document.createElement('div');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  document.body.appendChild(status);

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  document.addEventListener('click', function (e) {
    var btn = closest(e.target, '[data-copy]');
    if (!btn) return;
    var target = document.querySelector(btn.getAttribute('data-copy'));
    if (!target) return;
    if (!btn.hasAttribute('data-label')) btn.setAttribute('data-label', btn.textContent);
    copyText(target.textContent.trim()).then(function (ok) {
      btn.textContent = ok ? '已拷贝' : '请手动选择';
      status.textContent = ok ? '已拷贝到剪贴板' : '没能拷贝，请手动选择文字';
      clearTimeout(btn.copyTimer);
      btn.copyTimer = setTimeout(function () { btn.textContent = btn.getAttribute('data-label'); status.textContent = ''; }, 1800);
    });
  });

  /* ---------- 文档目录：高亮当前章节，窄屏可以收起 ---------- */
  var toc = document.querySelector('[data-toc]');
  if (!toc) return;
  var toggle = toc.querySelector('[data-toc-toggle]');
  var currentLabel = toc.querySelector('[data-toc-current]');
  var links = $$('a[href^="#"]', toc);
  var sections = links.map(function (a) { return document.getElementById(decodeURIComponent(a.hash.slice(1))); });
  var nav = document.querySelector('.nav');
  var active = null;

  function setOpen(open) {
    toc.classList.toggle('open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  }

  function setCurrent(i) {
    if (i === active || !links[i]) return;
    if (active !== null && links[active]) links[active].removeAttribute('aria-current');
    links[i].setAttribute('aria-current', 'true');
    if (currentLabel) currentLabel.textContent = links[i].textContent;
    active = i;
  }

  function update() {
    // 导航栏（窄屏再加上目录条）下面一段距离画一条线：最后一个越过这条线的章节就是当前章节
    var bar = toggle && toggle.offsetParent ? toc : nav;
    var line = (bar ? bar.getBoundingClientRect().bottom : 0) + Math.min(160, window.innerHeight * 0.2);
    var current = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].getBoundingClientRect().top <= line) current = i;
    }
    var doc = document.documentElement;
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) current = sections.length - 1;
    setCurrent(current);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  if (toggle) {
    toggle.addEventListener('click', function () { setOpen(!toc.classList.contains('open')); });
    toc.addEventListener('click', function (e) { if (closest(e.target, 'a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toc.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (toc.classList.contains('open') && !toc.contains(e.target)) setOpen(false);
    });
  }
})();
