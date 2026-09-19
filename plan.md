# Improvement Plan: Where Code Needs Changes

1. **API configuration**
   - `/home/runner/work/TDP/TDP/script.js`
   - Update `API_BASE` and `isApiConfigured` (lines 1–4), and `getApiUrl()` (lines 111–113).

2. **XSS-safe rendering**
   - `/home/runner/work/TDP/TDP/script.js`
   - Update `renderProducts()` (lines 212–246), especially `card.innerHTML` and `tile.innerHTML`.

3. **Contact form real behavior**
   - `/home/runner/work/TDP/TDP/script.js`
   - Update `postContact()` (lines 177–199) and submit handler in `setupEventListeners()` (lines 406–433).

4. **Accessibility improvements**
   - `/home/runner/work/TDP/TDP/index.html`
   - Improve header/nav/sections/form semantics (lines 11–139) with ARIA, labels, skip link, and landmarks.
   - `/home/runner/work/TDP/TDP/style.css`
   - Add focus-visible styles and improve contrast across controls.

5. **Better error UX**
   - `/home/runner/work/TDP/TDP/script.js`
   - Improve error/loading handling in `loadProducts()` (lines 354–377), form messages (406–433), and fetch fallbacks (128–175, 177–199).

6. **Performance & dependency resilience**
   - `/home/runner/work/TDP/TDP/index.html`
   - Rework external Chart.js dependency (line 8) with fallback/local strategy.
   - `/home/runner/work/TDP/TDP/style.css`
   - Optimize hero image handling in `#hero` styles (lines 64–76).

7. **Code modularization**
   - `/home/runner/work/TDP/TDP/script.js`
   - Split by concern: API, rendering, charts, events, initialization.

8. **Category/taxonomy consistency**
   - `/home/runner/work/TDP/TDP/index.html`
   - Align filter options (lines 46–52).
   - `/home/runner/work/TDP/TDP/script.js`
   - Align `MOCK.products` categories (lines 43–48), chart labels (lines 54–57), and filter logic (115–126).

9. **Testing**
   - Add tests for `script.js` helpers and behaviors:
     - `filterMockProducts`
     - `buildQuery`
     - `moneyFmt`
     - `getFallbackYear`
     - rendering and fallback behavior

10. **Documentation**
   - `/home/runner/work/TDP/TDP/README.md`
   - Expand to include setup, config, API expectations, and development workflow.
