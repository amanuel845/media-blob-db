/* ============================================================
   help-content.js
   Injects help content into #tab-pane-help of index.html and
   wires the sidebar + footer "Help" links to open that tab.
   The #tab-help button is hardcoded in index.html.
   Styles come from style.css — no CSS is injected here.
   TOC aside mirrors the docs layout.
   ============================================================ */
(function () {
  'use strict';

  var HELP_HTML = `
    <div class="h-full flex overflow-hidden">

      <!-- ========== TOC ========== -->
      <aside class="w-9 md:w-56 bg-[#1a2e36] border-r border-cyan-400/20 overflow-y-auto flex-shrink-0 px-1 md:px-4 py-2 z-10">
        <div class="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 md:mb-4 flex items-center justify-center md:justify-start gap-2">
          <i class="fa-solid fa-list text-[14px]"></i>
          <span class="hidden md:inline">Contents</span>
        </div>
        <nav class="flex flex-col gap-1 text-sm">
          <a href="#help-welcome" class="toc-link active px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-hand-sparkles text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Welcome</span>
          </a>
          <a href="#help-getting-started" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-rocket text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Getting Started</span>
          </a>
          <a href="#help-faq" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-comments text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">FAQ</span>
          </a>
          <a href="#help-troubleshooting" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-wrench text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Troubleshooting</span>
          </a>
          <a href="#help-tips" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-lightbulb text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Tips &amp; Tricks</span>
          </a>
          <a href="#help-contact" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-envelope text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Contact</span>
          </a>
        </nav>
      </aside>

      <!-- ========== CONTENT ========== -->
      <div id="help-content-scroll" class="flex-1 overflow-y-auto p-2 md:p-3 relative">
        <div class="max-w-3xl mx-auto space-y-4">

          <!-- WELCOME -->
          <section id="help-welcome">
            <div class="bg-[#1a2e36] rounded-lg p-3 border border-cyan-400/30">
              <h1 class="text-lg font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <i class="fa-solid fa-lifesaver text-[16px]"></i>Welcome to BlobDB Help
              </h1>
              <p class="text-[11px] text-cyan-100/70 mb-2">Your guide to managing, uploading, and organizing <strong>images and videos</strong>.</p>
              <div class="grid grid-cols-3 gap-2">
                <a href="#help-getting-started" class="bg-black/30 hover:bg-black/50 border border-cyan-400/40 rounded p-2 transition-colors text-center">
                  <i class="fa-solid fa-rocket text-cyan-400 text-sm mb-1 block"></i>
                  <span class="text-[9px] text-cyan-300 font-medium">Getting Started</span>
                </a>
                <a href="#help-faq" class="bg-black/30 hover:bg-black/50 border border-cyan-400/40 rounded p-2 transition-colors text-center">
                  <i class="fa-solid fa-comments text-cyan-400 text-sm mb-1 block"></i>
                  <span class="text-[9px] text-cyan-300 font-medium">FAQ</span>
                </a>
                <a href="#help-troubleshooting" class="bg-black/30 hover:bg-black/50 border border-cyan-400/40 rounded p-2 transition-colors text-center">
                  <i class="fa-solid fa-wrench text-cyan-400 text-sm mb-1 block"></i>
                  <span class="text-[9px] text-cyan-300 font-medium">Troubleshooting</span>
                </a>
              </div>
            </div>
          </section>

          <!-- GETTING STARTED -->
          <section id="help-getting-started">
            <h2 class="text-base font-bold text-cyan-300 mb-2 flex items-center gap-1">
              <i class="fa-solid fa-rocket text-sm"></i>Getting Started
            </h2>

            <div class="space-y-3">
              <div class="bg-[#1a2e36] rounded-lg p-3 border border-cyan-400/30">
                <h3 class="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-1">
                  <i class="fa-solid fa-lock text-xs"></i>First Time Setup: Unlock
                </h3>
                <div class="space-y-2">
                  <div class="flex gap-3">
                    <div class="step-number text-white">1</div>
                    <div>
                      <p class="font-medium text-cyan-300 text-[10px] mb-0.5">Open the app</p>
                      <p class="text-[10px] text-cyan-100/70">You'll see a password unlock modal.</p>
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <div class="step-number text-white">2</div>
                    <div>
                      <p class="font-medium text-cyan-300 text-[10px] mb-0.5">Enter password</p>
                      <p class="text-[10px] text-cyan-100/70">Decrypts your stored API key.</p>
                    </div>
                  </div>
                  <div class="flex gap-3">
                    <div class="step-number text-white">3</div>
                    <div>
                      <p class="font-medium text-cyan-300 text-[10px] mb-0.5">Click "Unlock"</p>
                      <p class="text-[10px] text-cyan-100/70">App reloads and shows gallery.</p>
                    </div>
                  </div>
                </div>
                <div class="bg-black/30 border-l-2 border-blue-400 rounded p-2 mt-3">
                  <p class="text-[9px] text-cyan-100/70"><strong>💡 Tip:</strong> Key is stored in localStorage.</p>
                </div>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-3 border border-cyan-400/30">
                <h3 class="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-1">
                  <i class="fa-solid fa-images text-xs"></i>Browse Gallery
                </h3>
                <p class="text-[10px] text-cyan-100/70 mb-2">Top-level shows <strong>folder cards</strong> with previews and total counts.</p>
                <div class="space-y-2">
                  <div class="flex gap-3"><div class="step-number text-white">1</div><p class="text-[10px] text-cyan-100/70">Click a folder card to enter it.</p></div>
                  <div class="flex gap-3"><div class="step-number text-white">2</div><p class="text-[10px] text-cyan-100/70">Use dropdowns to navigate deeper.</p></div>
                  <div class="flex gap-3"><div class="step-number text-white">3</div><p class="text-[10px] text-cyan-100/70">Click an image/video to open slideshow.</p></div>
                  <div class="flex gap-3"><div class="step-number text-white">4</div><p class="text-[10px] text-cyan-100/70">Hover and click trash to delete.</p></div>
                </div>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-3 border border-cyan-400/30">
                <h3 class="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-1">
                  <i class="fa-solid fa-cloud-upload-alt text-xs"></i>Upload Files
                </h3>
                <div class="space-y-2">
                  <div class="flex gap-3"><div class="step-number text-white">1</div><p class="text-[10px] text-cyan-100/70">Go to <strong>Upload</strong> tab.</p></div>
                  <div class="flex gap-3"><div class="step-number text-white">2</div><p class="text-[10px] text-cyan-100/70">Drag &amp; drop or click to select files.</p></div>
                  <div class="flex gap-3"><div class="step-number text-white">3</div><p class="text-[10px] text-cyan-100/70">Review previews, remove unwanted.</p></div>
                  <div class="flex gap-3"><div class="step-number text-white">4</div><p class="text-[10px] text-cyan-100/70">Click <strong>Upload All</strong>.</p></div>
                  <div class="flex gap-3"><div class="step-number text-white">5</div><p class="text-[10px] text-cyan-100/70">Auto-compress images &gt;4.5MB; videos get thumbnails.</p></div>
                </div>
                <div class="bg-black/30 border-l-2 border-green-400 rounded p-2 mt-3">
                  <p class="text-[9px] text-cyan-100/70"><strong>✨ Note:</strong> Files auto-organize by date.</p>
                </div>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-3 border border-cyan-400/30">
                <h3 class="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-1">
                  <i class="fa-solid fa-gear text-xs"></i>Configure Settings
                </h3>
                <div class="space-y-2">
                  <p class="text-[10px] text-cyan-100/70">Settings tab shows API config and upload category.</p>
                  <div class="bg-black/30 rounded p-2 space-y-1">
                    <p class="text-[9px] font-mono text-cyan-300"><strong>Store ID:</strong> Unique store identifier</p>
                    <p class="text-[9px] font-mono text-cyan-300"><strong>API Endpoint:</strong> Backend URL</p>
                    <p class="text-[9px] font-mono text-cyan-300"><strong>Secret Key:</strong> Update API key</p>
                    <p class="text-[9px] font-mono text-cyan-300"><strong>Upload Category:</strong> e.g., <code>screenshots</code> or <code>videos</code></p>
                    <p class="text-[9px] font-mono text-cyan-300"><strong>Current DB:</strong> Images or Videos mode</p>
                  </div>
                  <p class="text-[10px] text-cyan-100/70"><strong>Test Connection:</strong> Verify API key.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- FAQ -->
          <section id="help-faq">
            <h2 class="text-base font-bold text-cyan-300 mb-2 flex items-center gap-1">
              <i class="fa-solid fa-comments text-sm"></i>FAQ
            </h2>

            <div class="space-y-2">
              <div class="faq-item">
                <button class="faq-toggle w-full bg-[#1a2e36] hover:bg-[#1f3b44] border border-cyan-400/30 rounded-lg p-2 text-left flex items-center justify-between transition-colors">
                  <span class="text-[10px] text-cyan-300 font-medium flex items-center gap-1">
                    <i class="fa-solid fa-question text-cyan-400 text-[8px]"></i>
                    What formats do you support?
                  </span>
                  <i class="fa-solid fa-chevron-down text-cyan-400 text-[8px]"></i>
                </button>
                <div class="faq-content">
                  <p class="text-[9px] text-cyan-100/70 bg-black/30 rounded mx-2">Images: JPG, PNG, GIF, WebP, SVG. Videos: MP4, WebM, OGG, MOV, AVI, MKV. Non-media filtered out.</p>
                </div>
              </div>

              <div class="faq-item">
                <button class="faq-toggle w-full bg-[#1a2e36] hover:bg-[#1f3b44] border border-cyan-400/30 rounded-lg p-2 text-left flex items-center justify-between transition-colors">
                  <span class="text-[10px] text-cyan-300 font-medium flex items-center gap-1">
                    <i class="fa-solid fa-question text-cyan-400 text-[8px]"></i>
                    Are there file size limits?
                  </span>
                  <i class="fa-solid fa-chevron-down text-cyan-400 text-[8px]"></i>
                </button>
                <div class="faq-content">
                  <p class="text-[9px] text-cyan-100/70 bg-black/30 rounded mx-2">Images &gt;4.5MB auto-compressed to JPEG 85%. Videos uploaded as-is. Server limits may apply.</p>
                </div>
              </div>
              <!-- Add more FAQ items here with the same .faq-item structure -->
            </div>
          </section>

          <!-- TROUBLESHOOTING -->
          <section id="help-troubleshooting">
            <h2 class="text-base font-bold text-cyan-300 mb-2 flex items-center gap-1">
              <i class="fa-solid fa-wrench text-sm"></i>Troubleshooting
            </h2>

            <div class="space-y-3">
              <div class="bg-[#1a2e36] rounded-lg p-3 border border-red-400/30">
                <h3 class="text-xs font-semibold text-red-400 mb-1">
                  <i class="fa-solid fa-circle-xmark mr-1"></i>Unlock Modal Error: "Invalid Password"
                </h3>
                <ul class="list-disc list-inside text-[9px] text-cyan-100/70 space-y-1">
                  <li>Check password (case-sensitive), Caps Lock off</li>
                  <li>If forgotten, clear <code>localStorage</code> in DevTools</li>
                  <li>Contact admin for correct password</li>
                </ul>
              </div>
              <!-- Add more troubleshooting cards here -->
            </div>
          </section>

          <!-- TIPS & TRICKS -->
          <section id="help-tips">
            <h2 class="text-base font-bold text-cyan-300 mb-2 flex items-center gap-1">
              <i class="fa-solid fa-lightbulb text-sm"></i>Tips &amp; Tricks
            </h2>

            <div class="grid grid-cols-2 gap-2">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <h4 class="text-[10px] text-cyan-300 font-medium mb-1"><i class="fa-solid fa-keyboard mr-1"></i>Shortcuts</h4>
                <ul class="text-[8px] text-cyan-100/70 space-y-0.5 font-mono">
                  <li><code>←</code>/<code>→</code> Navigate</li>
                  <li><code>Esc</code> Close slideshow</li>
                  <li><code>Space</code> Play/pause video</li>
                </ul>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <h4 class="text-[10px] text-cyan-300 font-medium mb-1"><i class="fa-solid fa-mobile-screen mr-1"></i>Mobile</h4>
                <ul class="text-[8px] text-cyan-100/70 space-y-0.5">
                  <li>Swipe to navigate</li>
                  <li>Tap upload &amp; use picker</li>
                  <li>Pinch to zoom</li>
                </ul>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <h4 class="text-[10px] text-cyan-300 font-medium mb-1"><i class="fa-solid fa-rocket mr-1"></i>Upload Tips</h4>
                <ul class="text-[8px] text-cyan-100/70 space-y-0.5">
                  <li>Batch uploads faster</li>
                  <li>Videos get thumbnails</li>
                  <li>Change category in Settings</li>
                </ul>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <h4 class="text-[10px] text-cyan-300 font-medium mb-1"><i class="fa-solid fa-shield mr-1"></i>Security</h4>
                <ul class="text-[8px] text-cyan-100/70 space-y-0.5">
                  <li>Use HTTPS only</li>
                  <li>Don't share password</li>
                  <li>Clear browser history on shared PCs</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- CONTACT -->
          <section id="help-contact" class="bg-black/40 border-l-4 border-cyan-400 rounded p-3">
            <h3 class="text-xs font-semibold text-cyan-300 mb-1">
              <i class="fa-solid fa-envelope mr-1"></i>Need More Help?
            </h3>
            <p class="text-[9px] text-cyan-100/70 mb-2">Couldn't find the answer? Check the full documentation.</p>
            <div class="flex gap-2">
              <a href="./docs.html" class="bg-cyan-800/50 hover:bg-cyan-700 text-white px-3 py-1 rounded text-[10px] transition-colors">
                <i class="fa-solid fa-book mr-1"></i>Docs
              </a>
              <button type="button" data-help-close class="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-[10px] transition-colors">
                <i class="fa-solid fa-arrow-left mr-1"></i>Back to App
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  `;

  // -------- Inject help HTML into the pane + wire internal scroll/TOC --------
  function injectContent() {
    var pane = document.getElementById('tab-pane-help');
    if (!pane || pane.dataset.helpLoaded === 'true') return;
    pane.innerHTML = HELP_HTML;
    pane.dataset.helpLoaded = 'true';

    var scrollContainer = pane.querySelector('#help-content-scroll');
    var tocLinks = pane.querySelectorAll('.toc-link');
    var sections = pane.querySelectorAll('section[id^="help-"]');

    // FAQ toggles
    pane.querySelectorAll('.faq-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        var item = this.parentElement;
        if (item) item.classList.toggle('open');
      });
    });

    // TOC click → smooth-scroll inside the pane's content column
    tocLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var id = this.getAttribute('href').substring(1);
        var target = pane.querySelector('#' + id);
        if (target && scrollContainer) {
          var top = target.offsetTop - scrollContainer.offsetTop;
          scrollContainer.scrollTo({ top: top - 4, behavior: 'smooth' });
          setTimeout(updateActiveToc, 150);
        }
      });
    });

    // Welcome shortcut cards → same scroll behaviour
    pane.querySelectorAll('a[href^="#help-"]').forEach(function (link) {
      if (link.classList.contains('toc-link')) return; // already wired above
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var id = this.getAttribute('href').substring(1);
        var target = pane.querySelector('#' + id);
        if (target && scrollContainer) {
          var top = target.offsetTop - scrollContainer.offsetTop;
          scrollContainer.scrollTo({ top: top - 4, behavior: 'smooth' });
          setTimeout(updateActiveToc, 150);
        }
      });
    });

    // TOC active-state tracking on scroll
    function updateActiveToc() {
  if (!scrollContainer) return;
  
  var containerRect = scrollContainer.getBoundingClientRect();
  
  // Pane is display:none — every rect is 0. Don't touch state.
  if (containerRect.height === 0) return;
  
  var activeId = null;
  sections.forEach(function(section) {
    var rect = section.getBoundingClientRect();
    if (rect.top - containerRect.top <= 60) {
      activeId = section.id;
    }
  });
  tocLinks.forEach(function(link) {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + activeId) {
      link.classList.add('active');
    }
  });
}

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateActiveToc, { passive: true });
    }
    updateActiveToc();

    // "Back to App" button
    var closeBtn = pane.querySelector('[data-help-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        var galleryTab = document.getElementById('tab-gallery');
        if (galleryTab) galleryTab.click();
      });
    }
  }

  // -------- Repoint Help links → open the Help tab --------
  function wireTriggers() {
    var tabHelp = document.getElementById('tab-help');
    if (!tabHelp) return;

    function openHelp(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      tabHelp.click();
    }

    var helpLinks = document.querySelectorAll(
      '#app-sidebar a[href$="help.html"], #app-footer a[href$="help.html"]'
    );
    helpLinks.forEach(function (link) {
      link.setAttribute('href', 'javascript:void(0)');
      link.setAttribute('role', 'button');
      link.setAttribute('aria-label', 'Open Help');
      link.addEventListener('click', openHelp);
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href$="help.html"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      tabHelp.click();
    }, true);
  }

  function init() {
    injectContent();
    wireTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
