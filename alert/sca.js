/* bootstrap SCA object */
window.SCA = window.SCA || {};

/*!
 * SCA — Smart Custom Alert  v1.0.0
 * Dark Cyberpunk Theme · PMS Design System
 * Usage: include sca.css + sca.js, then call SCA.*
 */
(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────────────
     CONFIG & CONSTANTS
  ───────────────────────────────────────────────────── */
  var TYPE_MAP = {
    primary : { icon: 'bi-info-circle-fill',      color: '#00c8ff', bg: 'rgba(0,200,255,.12)' },
    success : { icon: 'bi-check-circle-fill',     color: '#00e5a0', bg: 'rgba(0,229,160,.12)' },
    warning : { icon: 'bi-exclamation-triangle-fill', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
    danger  : { icon: 'bi-x-octagon-fill',        color: '#ff4d6d', bg: 'rgba(255,77,109,.12)' },
    info    : { icon: 'bi-lightbulb-fill',         color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
    dark    : { icon: 'bi-shield-fill',            color: '#e2eaf4', bg: 'rgba(30,58,95,.4)' },
    light   : { icon: 'bi-brightness-high-fill',  color: '#e2eaf4', bg: 'rgba(226,234,244,.1)' },
  };

  var POSITION_MAP = {
    'top-right'    : 'sca-top-right',
    'top-left'     : 'sca-top-left',
    'top-center'   : 'sca-top-center',
    'bottom-right' : 'sca-bottom-right',
    'bottom-left'  : 'sca-bottom-left',
    'bottom-center': 'sca-bottom-center',
  };

  // Active dialog overlay reference
  var _activeOverlay = null;
  var _toastContainers = {};

  /* ─────────────────────────────────────────────────────
     UTILITY HELPERS
  ───────────────────────────────────────────────────── */
  function esc (str) {
    var d = document.createElement('div');
    d.textContent = str != null ? String(str) : '';
    return d.innerHTML;
  }

  function iconHtml (type) {
    var t = TYPE_MAP[type] || TYPE_MAP.primary;
    return '<i class="bi ' + t.icon + '"></i>';
  }

  function removeEl (el, delay) {
    if (!el || !el.parentNode) return;
    delay = delay || 0;
    setTimeout(function () {
      el.classList.add('sca-out');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 280);
    }, delay);
  }

  function injectSVGDefs () {
    if (document.getElementById('sca-svg-defs')) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'sca-svg-defs';
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = '<defs>'
      + '<linearGradient id="sca-lg" x1="0%" y1="0%" x2="100%" y2="100%">'
      + '<stop offset="0%" stop-color="#00c8ff"/>'
      + '<stop offset="50%" stop-color="#a78bfa"/>'
      + '<stop offset="100%" stop-color="#00e5a0"/>'
      + '</linearGradient>'
      + '</defs>';
    document.body.appendChild(svg);
  }

  /* ─────────────────────────────────────────────────────
     OVERLAY  (shared for dialog + loading)
  ───────────────────────────────────────────────────── */
  function createOverlay () {
    var ov = document.createElement('div');
    ov.className = 'sca-overlay';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    return ov;
  }

  function closeOverlay (ov) {
    if (!ov) return;
    ov.classList.add('sca-out');
    document.body.style.overflow = '';
    setTimeout(function () {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }, 220);
    if (_activeOverlay === ov) _activeOverlay = null;
  }

  /* click-outside closes dialog (not loading) */
  function bindOutsideClose (overlay, dialog) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        dialog.classList.add('sca-out');
        setTimeout(function () { closeOverlay(overlay); }, 180);
      }
    });
    // ESC key
    var onKey = function (e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        dialog.classList.add('sca-out');
        setTimeout(function () { closeOverlay(overlay); }, 180);
      }
    };
    document.addEventListener('keydown', onKey);
  }

  /* ─────────────────────────────────────────────────────
     DIALOG BASE BUILDER
  ───────────────────────────────────────────────────── */
  function buildDialog (opts) {
    var type     = opts.type  || 'primary';
    var t        = TYPE_MAP[type] || TYPE_MAP.primary;
    var title    = opts.title   || '';
    var message  = opts.message || '';
    var confirmText = opts.confirmText || 'OK';
    var cancelText  = opts.cancelText  || 'Batal';
    var showCancel  = opts.showCancel !== false ? (opts.showCancel || false) : false;
    var extraHtml   = opts.extraHtml   || '';
    var formHtml    = opts.formHtml    || '';
    var footerCol   = opts.footerCol   || false;

    var overlay = createOverlay();
    _activeOverlay = overlay;

    var dialog = document.createElement('div');
    dialog.className = 'sca-dialog sca-t-' + type;

    dialog.innerHTML = [
      '<div class="sca-dialog-icon-wrap">',
        '<div class="sca-dialog-icon">', iconHtml(type), '</div>',
      '</div>',
      '<div class="sca-dialog-body">',
        '<div class="sca-dialog-title">', esc(title), '</div>',
        message ? '<div class="sca-dialog-msg">' + esc(message) + '</div>' : '',
        extraHtml ? '<div class="sca-dialog-extra">' + extraHtml + '</div>' : '',
      '</div>',
      formHtml ? '<div class="sca-dialog-form">' + formHtml + '</div>' : '',
      '<div class="sca-dialog-footer' + (footerCol ? ' sca-footer-col' : '') + '">',
        showCancel
          ? '<button class="sca-btn sca-btn-cancel" data-sca="cancel"><span>' + esc(cancelText) + '</span></button>'
          : '',
        '<button class="sca-btn sca-btn-confirm t-' + type + '" data-sca="confirm">',
          '<span>', iconHtml(type), ' ', esc(confirmText), '</span>',
        '</button>',
      '</div>',
    ].join('');

    overlay.appendChild(dialog);
    return { overlay: overlay, dialog: dialog };
  }

  /* ─────────────────────────────────────────────────────
     DIALOG (with Promise)
  ───────────────────────────────────────────────────── */
  SCA.dialog = function (opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var built   = buildDialog(Object.assign({ showCancel: true }, opts));
      var overlay = built.overlay;
      var dialog  = built.dialog;

      bindOutsideClose(overlay, dialog);

      dialog.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-sca]');
        if (!btn) return;
        var result = btn.dataset.sca === 'confirm';
        dialog.classList.add('sca-out');
        setTimeout(function () {
          closeOverlay(overlay);
          resolve(result);
        }, 180);
      });
    });
  };

  /* ─────────────────────────────────────────────────────
     LOADING DIALOG
  ───────────────────────────────────────────────────── */
  SCA.loading = function (opts) {
    opts = opts || {};
    injectSVGDefs();
    var overlay = createOverlay();
    _activeOverlay = overlay;

    var dialog = document.createElement('div');
    dialog.className = 'sca-dialog sca-t-primary';
    dialog.style.maxWidth = '340px';

    dialog.innerHTML = [
      '<div class="sca-dialog-body" style="padding-top:28px;padding-bottom:24px">',
        '<div class="sca-loading-ring">',
          '<svg viewBox="0 0 58 58" fill="none">',
            '<circle class="sca-lr-track" cx="29" cy="29" r="24" stroke-width="3"/>',
            '<circle class="sca-lr-fill" cx="29" cy="29" r="24" stroke-width="3"',
            '  stroke-dasharray="90 150" stroke-dashoffset="0"/>',
          '</svg>',
        '</div>',
        '<div class="sca-loading-dots"><span></span><span></span><span></span></div>',
        '<div class="sca-dialog-title" style="margin-top:16px">', esc(opts.title || 'Memuat...'), '</div>',
        opts.message
          ? '<div class="sca-dialog-msg">' + esc(opts.message) + '</div>'
          : '',
      '</div>',
    ].join('');

    overlay.appendChild(dialog);
    return overlay;
  };

  /* ─────────────────────────────────────────────────────
     CLOSE (active dialog/loading)
  ───────────────────────────────────────────────────── */
  SCA.close = function () {
    if (_activeOverlay) {
      var ov = _activeOverlay;
      var dlg = ov.querySelector('.sca-dialog');
      if (dlg) dlg.classList.add('sca-out');
      setTimeout(function () { closeOverlay(ov); }, 180);
    }
  };

  /* ─────────────────────────────────────────────────────
     TOAST
  ───────────────────────────────────────────────────── */
  SCA.toast = function (opts) {
    opts = opts || {};
    var type     = opts.type     || 'primary';
    var pos      = opts.position || 'top-right';
    var duration = opts.duration !== undefined ? opts.duration : 4000;
    var title    = opts.title    || '';
    var message  = opts.message  || '';
    var t        = TYPE_MAP[type] || TYPE_MAP.primary;
    var posCls   = POSITION_MAP[pos] || 'sca-top-right';

    // get or create container
    if (!_toastContainers[pos] || !document.body.contains(_toastContainers[pos])) {
      var wrap = document.createElement('div');
      wrap.className = 'sca-toast-wrap ' + posCls;
      document.body.appendChild(wrap);
      _toastContainers[pos] = wrap;
    }
    var container = _toastContainers[pos];

    var toast = document.createElement('div');
    toast.className = 'sca-toast';
    toast.style.setProperty('--sca-toast-color', t.color);
    toast.style.setProperty('--sca-toast-bg', t.bg);

    toast.innerHTML = [
      '<div class="sca-toast-ico"><i class="bi ' + t.icon + '"></i></div>',
      '<div class="sca-toast-content">',
        title   ? '<div class="sca-toast-title">' + esc(title) + '</div>' : '',
        message ? '<div class="sca-toast-msg">'   + esc(message) + '</div>' : '',
      '</div>',
      '<button class="sca-toast-close" aria-label="Close"><i class="bi bi-x-lg"></i></button>',
      duration > 0
        ? '<div class="sca-toast-bar" style="animation-duration:' + duration + 'ms"></div>'
        : '',
    ].join('');

    container.appendChild(toast);

    // close button
    toast.querySelector('.sca-toast-close').addEventListener('click', function () {
      removeEl(toast);
    });

    // auto-dismiss
    if (duration > 0) {
      setTimeout(function () { removeEl(toast); }, duration);
    }

    return toast;
  };

  /* ─────────────────────────────────────────────────────
     INLINE ALERT BANNER
  ───────────────────────────────────────────────────── */
  SCA.alert = function (opts, target) {
    opts   = opts   || {};
    var type        = opts.type   || 'primary';
    var title       = opts.title  || '';
    var message     = opts.message || '';
    var dismissible = opts.dismissible !== false;
    var t           = TYPE_MAP[type] || TYPE_MAP.primary;

    var container = typeof target === 'string'
      ? document.querySelector(target)
      : (target instanceof Element ? target : null);
    if (!container) { console.warn('SCA.alert: target not found', target); return; }

    var banner = document.createElement('div');
    banner.className = 'sca-alert-banner sca-banner-' + type;
    banner.innerHTML = [
      '<i class="bi ', t.icon, ' sca-al-ico"></i>',
      '<div class="sca-al-body">',
        title   ? '<div class="sca-al-title">' + esc(title) + '</div>' : '',
        message ? '<div class="sca-al-msg">'   + esc(message) + '</div>' : '',
      '</div>',
      dismissible ? '<button class="sca-al-close" aria-label="Close"><i class="bi bi-x-lg"></i></button>' : '',
    ].join('');

    if (dismissible) {
      banner.querySelector('.sca-al-close').addEventListener('click', function () {
        removeEl(banner);
      });
    }

    container.insertBefore(banner, container.firstChild);
    return banner;
  };

  /* ─────────────────────────────────────────────────────
     SHORTHAND METHODS
  ───────────────────────────────────────────────────── */
  ['success','error','warning','info','primary','dark','light'].forEach(function (type) {
    var mapped = type === 'error' ? 'danger' : type;
    SCA[type] = function (title, message, isToast, position) {
      if (isToast) {
        return SCA.toast({ type: mapped, title: title, message: message, position: position || 'top-right' });
      }
      return SCA.dialog({ type: mapped, title: title, message: message, showCancel: false, confirmText: 'OK' });
    };
  });

  SCA.confirm = function (title, message, opts) {
    return SCA.dialog(Object.assign({
      type: 'primary', title: title, message: message,
      showCancel: true, confirmText: 'Ya, Lanjutkan', cancelText: 'Batal',
    }, opts || {}));
  };

  SCA.deleteConfirm = function (itemName, opts) {
    return SCA.dialog(Object.assign({
      type: 'danger',
      title: 'Hapus Data?',
      message: 'Anda akan menghapus ' + (itemName ? '<strong>' + esc(itemName) + '</strong>' : 'item ini') + '. Tindakan ini tidak dapat dibatalkan.',
      showCancel: true,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      extraHtml: '<i class="bi bi-exclamation-triangle-fill" style="color:#f59e0b;margin-right:6px"></i>Semua data terkait akan ikut terhapus.',
    }, opts || {}));
  };

  /* ─────────────────────────────────────────────────────
     SPECIAL DIALOGS
  ───────────────────────────────────────────────────── */

  /**
   * Dialog Aktivasi User
   * @param {object} user  — { name, email, role }
   * @returns {Promise<boolean>}
   */
  SCA.activateUser = function (user) {
    user = user || {};
    var formHtml = [
      '<div class="sca-info-row">',
        '<i class="bi bi-person-fill"></i>',
        '<div>',
          '<strong style="color:#e2eaf4;font-size:13px">', esc(user.name || '—'), '</strong>',
          '<div style="font-size:12px;color:#7a90a8;font-family:\'DM Mono\',monospace;margin-top:2px">',
            esc(user.email || ''), ' &bull; ', esc(user.role || 'Member'),
          '</div>',
        '</div>',
      '</div>',
      '<div class="sca-divider"></div>',
      '<div class="sca-field">',
        '<label class="sca-label">Catatan Aktivasi <span style="color:#3d5068">(opsional)</span></label>',
        '<textarea class="sca-input" id="sca-activate-note" rows="2" ',
          'style="height:auto;padding:10px 14px;resize:none;line-height:1.6" ',
          'placeholder="Catatan untuk pengguna..."></textarea>',
      '</div>',
      '<div class="sca-field-note" style="margin-bottom:2px">',
        '<i class="bi bi-envelope-fill" style="color:#00c8ff;margin-right:4px"></i>',
        'Email notifikasi aktivasi akan dikirim ke pengguna.',
      '</div>',
    ].join('');

    return new Promise(function (resolve) {
      var built   = buildDialog({
        type       : 'success',
        title      : 'Aktivasi Akun Pengguna',
        message    : 'Pengguna akan dapat mengakses sistem setelah diaktifkan.',
        showCancel : true,
        confirmText: 'Aktifkan Sekarang',
        cancelText : 'Batal',
        formHtml   : formHtml,
      });
      var overlay = built.overlay;
      var dialog  = built.dialog;

      bindOutsideClose(overlay, dialog);

      dialog.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-sca]');
        if (!btn) return;
        var confirmed = btn.dataset.sca === 'confirm';
        var note = dialog.querySelector('#sca-activate-note');
        var result = confirmed ? { confirmed: true, note: note ? note.value : '' } : false;
        dialog.classList.add('sca-out');
        setTimeout(function () { closeOverlay(overlay); resolve(result); }, 180);
      });
    });
  };

  /**
   * Dialog Kirim Email
   * @param {object} opts — { to, toName, subject, body }
   * @returns {Promise<object|false>}
   */
  SCA.sendEmail = function (opts) {
    opts = opts || {};
    var formHtml = [
      '<div class="sca-field">',
        '<label class="sca-label">Kepada <span style="color:#ff4d6d">*</span></label>',
        '<div class="sca-input-wrap">',
          '<i class="bi bi-person-fill sca-input-ico"></i>',
          '<input type="text" class="sca-input" id="sca-email-to" ',
            'value="', esc(opts.to || ''), '" ',
            'placeholder="nama@email.com" />',
        '</div>',
      '</div>',
      '<div class="sca-field">',
        '<label class="sca-label">Subjek <span style="color:#ff4d6d">*</span></label>',
        '<div class="sca-input-wrap">',
          '<i class="bi bi-chat-left-text-fill sca-input-ico"></i>',
          '<input type="text" class="sca-input" id="sca-email-subj" ',
            'value="', esc(opts.subject || ''), '" ',
            'placeholder="Subjek email..." />',
        '</div>',
      '</div>',
      '<div class="sca-field">',
        '<label class="sca-label">Pesan <span style="color:#ff4d6d">*</span></label>',
        '<textarea class="sca-input" id="sca-email-body" rows="3" ',
          'style="height:auto;padding:10px 14px;resize:none;line-height:1.6" ',
          'placeholder="Tulis pesan di sini...">', esc(opts.body || ''), '</textarea>',
      '</div>',
      '<div class="sca-field-note" style="margin-bottom:2px">',
        '<i class="bi bi-shield-lock-fill" style="color:#a78bfa;margin-right:4px"></i>',
        'Email dikirim melalui SMTP server yang terenkripsi.',
      '</div>',
    ].join('');

    return new Promise(function (resolve) {
      var built   = buildDialog({
        type       : 'info',
        title      : 'Kirim Email',
        message    : '',
        showCancel : true,
        confirmText: 'Kirim Email',
        cancelText : 'Batal',
        formHtml   : formHtml,
      });
      var overlay = built.overlay;
      var dialog  = built.dialog;

      // remove empty message div
      var msgEl = dialog.querySelector('.sca-dialog-msg');
      if (msgEl && !msgEl.textContent.trim()) msgEl.remove();

      bindOutsideClose(overlay, dialog);

      dialog.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-sca]');
        if (!btn) return;
        var confirmed = btn.dataset.sca === 'confirm';
        var result = false;

        if (confirmed) {
          var toEl   = dialog.querySelector('#sca-email-to');
          var subjEl = dialog.querySelector('#sca-email-subj');
          var bodyEl = dialog.querySelector('#sca-email-body');
          var to   = toEl   ? toEl.value.trim()   : '';
          var subj = subjEl ? subjEl.value.trim()  : '';
          var body = bodyEl ? bodyEl.value.trim()  : '';

          // simple validation
          if (!to || !subj || !body) {
            if (toEl)   toEl.style.borderColor   = !to   ? '#ff4d6d' : '';
            if (subjEl) subjEl.style.borderColor = !subj ? '#ff4d6d' : '';
            if (bodyEl) bodyEl.style.borderColor = !body ? '#ff4d6d' : '';
            return;
          }
          result = { confirmed: true, to: to, subject: subj, body: body };
        }

        dialog.classList.add('sca-out');
        setTimeout(function () { closeOverlay(overlay); resolve(result); }, 180);
      });
    });
  };

  /**
   * Dialog Reset Password
   * @param {object} opts — { userName, userEmail }
   * @returns {Promise<object|false>}  { confirmed, mode, newPassword? }
   */
  SCA.resetPassword = function (opts) {
    opts = opts || {};
    var formHtml = [
      opts.userName ? [
        '<div class="sca-info-row">',
          '<i class="bi bi-person-lock"></i>',
          '<div>',
            '<strong style="color:#e2eaf4;font-size:13px">', esc(opts.userName), '</strong>',
            opts.userEmail
              ? '<div style="font-size:12px;color:#7a90a8;font-family:\'DM Mono\',monospace;margin-top:2px">' + esc(opts.userEmail) + '</div>'
              : '',
          '</div>',
        '</div>',
        '<div class="sca-divider"></div>',
      ].join('') : '',

      '<div class="sca-field">',
        '<label class="sca-label">Mode Reset</label>',
        '<select class="sca-input" id="sca-reset-mode" style="cursor:pointer;padding-right:32px;',
          'background-image:url(\'data:image/svg+xml,%3Csvg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'11\\\' height=\\\'11\\\' viewBox=\\\'0 0 24 24\\\' fill=\\\'none\\\' stroke=\\\'%237a90a8\\\' stroke-width=\\\'2.5\\\'%3E%3Cpolyline points=\\\'6 9 12 15 18 9\\\'/%3E%3C/svg%3E\');',
          'background-repeat:no-repeat;background-position:right 10px center;appearance:none">',
          '<option value="link">Kirim link reset via email</option>',
          '<option value="manual">Set password baru secara manual</option>',
        '</select>',
      '</div>',

      '<div id="sca-reset-manual" style="display:none">',
        '<div class="sca-field">',
          '<label class="sca-label">Password Baru <span style="color:#ff4d6d">*</span></label>',
          '<div class="sca-pw-wrap">',
            '<input type="password" class="sca-input" id="sca-reset-pw" placeholder="Minimal 8 karakter..." />',
            '<button type="button" class="sca-pw-eye" id="sca-reset-pw-eye"><i class="bi bi-eye"></i></button>',
          '</div>',
        '</div>',
        '<div class="sca-field">',
          '<label class="sca-label">Konfirmasi Password <span style="color:#ff4d6d">*</span></label>',
          '<div class="sca-pw-wrap">',
            '<input type="password" class="sca-input" id="sca-reset-pw2" placeholder="Ulangi password baru..." />',
            '<button type="button" class="sca-pw-eye" id="sca-reset-pw2-eye"><i class="bi bi-eye"></i></button>',
          '</div>',
        '</div>',
      '</div>',

      '<div class="sca-field-note" id="sca-reset-note" style="margin-bottom:2px">',
        '<i class="bi bi-envelope-fill" style="color:#00c8ff;margin-right:4px"></i>',
        'Link reset akan dikirim ke email terdaftar.',
      '</div>',
    ].join('');

    return new Promise(function (resolve) {
      var built   = buildDialog({
        type       : 'warning',
        title      : 'Reset Password',
        message    : 'Pilih cara untuk mereset password pengguna.',
        showCancel : true,
        confirmText: 'Reset Password',
        cancelText : 'Batal',
        formHtml   : formHtml,
      });
      var overlay = built.overlay;
      var dialog  = built.dialog;

      bindOutsideClose(overlay, dialog);

      // Mode toggle
      var modeEl   = dialog.querySelector('#sca-reset-mode');
      var manualEl = dialog.querySelector('#sca-reset-manual');
      var noteEl   = dialog.querySelector('#sca-reset-note');

      if (modeEl) {
        modeEl.addEventListener('change', function () {
          var isManual = this.value === 'manual';
          manualEl.style.display = isManual ? '' : 'none';
          noteEl.innerHTML = isManual
            ? '<i class="bi bi-shield-lock-fill" style="color:#f59e0b;margin-right:4px"></i>Password akan langsung diperbarui di sistem.'
            : '<i class="bi bi-envelope-fill" style="color:#00c8ff;margin-right:4px"></i>Link reset akan dikirim ke email terdaftar.';
        });
      }

      // Password eye toggles
      function bindEye (inputId, btnId) {
        var inp = dialog.querySelector('#' + inputId);
        var btn = dialog.querySelector('#' + btnId);
        if (inp && btn) {
          btn.addEventListener('click', function () {
            var show = inp.type === 'password';
            inp.type = show ? 'text' : 'password';
            btn.innerHTML = show ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
          });
        }
      }
      bindEye('sca-reset-pw', 'sca-reset-pw-eye');
      bindEye('sca-reset-pw2', 'sca-reset-pw2-eye');

      // Confirm
      dialog.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-sca]');
        if (!btn) return;
        var confirmed = btn.dataset.sca === 'confirm';
        var result    = false;

        if (confirmed) {
          var mode = modeEl ? modeEl.value : 'link';
          if (mode === 'manual') {
            var pw1 = dialog.querySelector('#sca-reset-pw');
            var pw2 = dialog.querySelector('#sca-reset-pw2');
            var p1  = pw1 ? pw1.value : '';
            var p2  = pw2 ? pw2.value : '';
            if (!p1 || p1.length < 8) {
              if (pw1) pw1.style.borderColor = '#ff4d6d'; return;
            }
            if (p1 !== p2) {
              if (pw2) { pw2.style.borderColor = '#ff4d6d'; pw2.placeholder = 'Password tidak cocok!'; } return;
            }
            result = { confirmed: true, mode: 'manual', newPassword: p1 };
          } else {
            result = { confirmed: true, mode: 'link' };
          }
        }

        dialog.classList.add('sca-out');
        setTimeout(function () { closeOverlay(overlay); resolve(result); }, 180);
      });
    });
  };

  /* expose */
  global.SCA = SCA;

}(window));

