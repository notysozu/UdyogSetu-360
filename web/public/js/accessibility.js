(function initAccessibilitySystem() {
  const storageKeys = {
    fontScale: 'us360_font_scale',
    highContrast: 'us360_high_contrast',
    darkMode: 'us360_dark_mode',
    grayscale: 'us360_grayscale',
    reduceMotion: 'us360_reduce_motion',
    dyslexiaFont: 'us360_dyslexia_font',
    letterSpacing: 'us360_letter_spacing',
    highlightLinks: 'us360_highlight_links',
    largeCursor: 'us360_large_cursor',
    focusMode: 'us360_focus_mode',
    screenReaderMode: 'us360_screen_reader_mode'
  };

  const defaults = {
    fontScale: 100,
    highContrast: false,
    darkMode: false,
    grayscale: false,
    reduceMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    dyslexiaFont: false,
    letterSpacing: false,
    highlightLinks: false,
    largeCursor: false,
    focusMode: false,
    screenReaderMode: false
  };

  const root = document.documentElement;

  function clampFontScale(value) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return defaults.fontScale;
    return Math.min(140, Math.max(80, Math.round(numeric / 5) * 5));
  }

  function readBoolean(key, fallback) {
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;
    return value === 'true';
  }

  function readSettings() {
    return {
      fontScale: clampFontScale(window.localStorage.getItem(storageKeys.fontScale) || defaults.fontScale),
      highContrast: readBoolean(storageKeys.highContrast, defaults.highContrast),
      darkMode: readBoolean(storageKeys.darkMode, defaults.darkMode),
      grayscale: readBoolean(storageKeys.grayscale, defaults.grayscale),
      reduceMotion: readBoolean(storageKeys.reduceMotion, defaults.reduceMotion),
      dyslexiaFont: readBoolean(storageKeys.dyslexiaFont, defaults.dyslexiaFont),
      letterSpacing: readBoolean(storageKeys.letterSpacing, defaults.letterSpacing),
      highlightLinks: readBoolean(storageKeys.highlightLinks, defaults.highlightLinks),
      largeCursor: readBoolean(storageKeys.largeCursor, defaults.largeCursor),
      focusMode: readBoolean(storageKeys.focusMode, defaults.focusMode),
      screenReaderMode: readBoolean(storageKeys.screenReaderMode, defaults.screenReaderMode)
    };
  }

  function saveSettings(settings) {
    window.localStorage.setItem(storageKeys.fontScale, String(settings.fontScale));
    window.localStorage.setItem(storageKeys.highContrast, String(settings.highContrast));
    window.localStorage.setItem(storageKeys.darkMode, String(settings.darkMode));
    window.localStorage.setItem(storageKeys.grayscale, String(settings.grayscale));
    window.localStorage.setItem(storageKeys.reduceMotion, String(settings.reduceMotion));
    window.localStorage.setItem(storageKeys.dyslexiaFont, String(settings.dyslexiaFont));
    window.localStorage.setItem(storageKeys.letterSpacing, String(settings.letterSpacing));
    window.localStorage.setItem(storageKeys.highlightLinks, String(settings.highlightLinks));
    window.localStorage.setItem(storageKeys.largeCursor, String(settings.largeCursor));
    window.localStorage.setItem(storageKeys.focusMode, String(settings.focusMode));
    window.localStorage.setItem(storageKeys.screenReaderMode, String(settings.screenReaderMode));
  }

  function applySettings(settings) {
    root.style.setProperty('--app-font-scale', String(settings.fontScale / 100));
    root.classList.toggle('a11y-high-contrast', settings.highContrast);
    root.classList.toggle('a11y-dark-mode', settings.darkMode);
    root.classList.toggle('a11y-grayscale', settings.grayscale);
    root.classList.toggle('a11y-reduce-motion', settings.reduceMotion);
    root.classList.toggle('a11y-dyslexia-font', settings.dyslexiaFont);
    root.classList.toggle('a11y-letter-spacing', settings.letterSpacing);
    root.classList.toggle('a11y-highlight-links', settings.highlightLinks);
    root.classList.toggle('a11y-large-cursor', settings.largeCursor);
    root.classList.toggle('a11y-focus-mode', settings.focusMode);
    root.classList.toggle('a11y-screen-reader-mode', settings.screenReaderMode);
  }

  function resetSettings() {
    Object.values(storageKeys).forEach((key) => window.localStorage.removeItem(key));
    const next = { ...defaults };
    applySettings(next);
    syncControls(next);
    return next;
  }

  function syncControls(settings) {
    const slider = document.querySelector('[data-a11y-setting="font_scale"]');
    const output = document.querySelector('[data-a11y-font-scale-value]');
    if (slider) slider.value = String(settings.fontScale);
    if (output) output.textContent = `${settings.fontScale}%`;

    Object.entries({
      high_contrast: settings.highContrast,
      dark_mode: settings.darkMode,
      grayscale: settings.grayscale,
      reduce_motion: settings.reduceMotion,
      dyslexia_font: settings.dyslexiaFont,
      letter_spacing: settings.letterSpacing,
      highlight_links: settings.highlightLinks,
      large_cursor: settings.largeCursor,
      focus_mode: settings.focusMode,
      screen_reader_mode: settings.screenReaderMode
    }).forEach(([name, value]) => {
      const field = document.querySelector(`[data-a11y-setting="${name}"]`);
      if (field) field.checked = value;
    });
  }

  const initialSettings = readSettings();
  applySettings(initialSettings);
  window.UdyogSetuAccessibility = { applySettings, resetSettings };

  document.addEventListener('DOMContentLoaded', () => {
    let settings = readSettings();
    const panel = document.querySelector('[data-a11y-panel]');
    const toggle = document.querySelector('[data-a11y-toggle]');
    const close = document.querySelector('[data-a11y-close]');
    const reset = document.querySelector('[data-a11y-reset]');
    const slider = document.querySelector('[data-a11y-setting="font_scale"]');
    const sliderOutput = document.querySelector('[data-a11y-font-scale-value]');
    const legacyFontButton = document.querySelector('[data-font-resize]');
    const legacyAccessibilityButton = document.querySelector('[data-accessibility-toggle]');
    const legacyThemeButton = document.querySelector('[data-theme-toggle]');

    function openPanel() {
      if (!panel || !toggle) return;
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
      if (!panel || !toggle) return;
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }

    function persistAndApply() {
      saveSettings(settings);
      applySettings(settings);
      syncControls(settings);
    }

    syncControls(settings);

    if (slider) {
      slider.addEventListener('input', () => {
        settings.fontScale = clampFontScale(slider.value);
        if (sliderOutput) sliderOutput.textContent = `${settings.fontScale}%`;
        persistAndApply();
      });
    }

    document.querySelectorAll('[data-a11y-setting]').forEach((field) => {
      if (field.type === 'checkbox') {
        field.addEventListener('change', () => {
          const map = {
            high_contrast: 'highContrast',
            dark_mode: 'darkMode',
            grayscale: 'grayscale',
            reduce_motion: 'reduceMotion',
            dyslexia_font: 'dyslexiaFont',
            letter_spacing: 'letterSpacing',
            highlight_links: 'highlightLinks',
            large_cursor: 'largeCursor',
            focus_mode: 'focusMode',
            screen_reader_mode: 'screenReaderMode'
          };
          const target = map[field.dataset.a11ySetting];
          if (!target) return;
          settings[target] = field.checked;
          persistAndApply();
        });
      }
    });

    toggle?.addEventListener('click', () => {
      if (!panel) return;
      if (panel.hidden) openPanel();
      else closePanel();
    });

    close?.addEventListener('click', closePanel);

    reset?.addEventListener('click', () => {
      settings = resetSettings();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePanel();
    });

    document.addEventListener('click', (event) => {
      if (!panel || !toggle || panel.hidden) return;
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      closePanel();
    });

    if (legacyFontButton) {
      legacyFontButton.addEventListener('click', () => {
        openPanel();
        slider?.focus();
      });
    }

    if (legacyAccessibilityButton) {
      legacyAccessibilityButton.addEventListener('click', () => {
        openPanel();
      });
    }

    if (legacyThemeButton) {
      legacyThemeButton.addEventListener('click', () => {
        settings.darkMode = !settings.darkMode;
        persistAndApply();
      });
    }
  });
})();
