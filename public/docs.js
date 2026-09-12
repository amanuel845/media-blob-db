/* ============================================================
   docs-content.js
   Injects docs content into #tab-pane-docs of index.html and
   wires the sidebar + footer "Docs" links to open that tab.
   The #tab-docs button is hardcoded in index.html.
   Styles come from style.css — no CSS is injected here.
   Compact layout for content, original sizing for the TOC.
   ============================================================ */
(function () {
  'use strict';

  var DOCS_HTML = `
    <div class="h-full flex overflow-hidden">

      <!-- ========== TOC ========== -->
      <aside class="w-9 md:w-56 bg-[#1a2e36] border-r border-cyan-400/20 overflow-y-auto flex-shrink-0 px-1 md:px-4 py-2 z-10">
        <div class="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 md:mb-4 flex items-center justify-center md:justify-start gap-2">
          <i class="fa-solid fa-list text-[14px]"></i>
          <span class="hidden md:inline">Contents</span>
        </div>
        <nav class="flex flex-col gap-1 text-sm">
          <a href="#docs-overview" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-circle-info text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Overview</span>
          </a>
          <a href="#docs-stack" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-layer-group text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Tech Stack</span>
          </a>
          <a href="#docs-api" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-plug text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">API Reference</span>
          </a>
          <a href="#docs-modules" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-cube text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Modules</span>
          </a>
          <a href="#docs-events" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-bell text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Events</span>
          </a>
          <a href="#docs-security" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-lock text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Security</span>
          </a>
          <a href="#docs-usage" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-code text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Usage Examples</span>
          </a>
          <a href="#docs-architecture" class="toc-link px-1 md:px-3 py-2 rounded text-cyan-300 hover:text-cyan-200 flex items-center justify-center md:justify-start">
            <i class="fa-solid fa-diagram-project text-[14px] md:text-[10px] md:mr-2"></i>
            <span class="hidden md:inline">Architecture</span>
          </a>
        </nav>
      </aside>

      <!-- ========== CONTENT ========== -->
      <div id="docs-content-scroll" class="flex-1 overflow-y-auto p-1 md:p-2 relative">
        <div class="max-w-3xl mx-auto space-y-2">

          <!-- OVERVIEW -->
          <section id="docs-overview" class="doc-section">
            <div class="bg-[#1a2e36] rounded-lg p-3 border border-cyan-400/30">
              <h1 class="text-base font-bold text-cyan-300 mb-1 flex items-center gap-1">
                <i class="fa-solid fa-circle-info text-sm"></i>BlobDB Documentation
              </h1>
              <p class="text-[10px] text-cyan-100/70 mb-2">Complete specification and API reference for the Blob Image &amp; Video Database dashboard.</p>
              <div class="bg-black/30 border-l-2 border-cyan-400 rounded p-2">
                <p class="text-[9px] text-cyan-200"><strong>Version:</strong> 2.0.0</p>
                <p class="text-[9px] text-cyan-200"><strong>Status:</strong> <span class="text-emerald-400"><i class="fa-solid fa-check-circle mr-1"></i>Active</span></p>
                <p class="text-[9px] text-cyan-200"><strong>Last Updated:</strong> Aug 31, 2026</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-2">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20 hover:border-cyan-400/50 transition-colors">
                <i class="fa-solid fa-images text-base text-cyan-400 mb-1"></i>
                <h3 class="font-semibold text-cyan-300 text-[10px] mb-0.5">Images</h3>
                <p class="text-[9px] text-cyan-100/60">Folder cards, slideshow, and per-image controls.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20 hover:border-cyan-400/50 transition-colors">
                <i class="fa-solid fa-video text-base text-cyan-400 mb-1"></i>
                <h3 class="font-semibold text-cyan-300 text-[10px] mb-0.5">Videos</h3>
                <p class="text-[9px] text-cyan-100/60">Upload, preview, and play with custom controls.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20 hover:border-cyan-400/50 transition-colors">
                <i class="fa-solid fa-folder-open text-base text-cyan-400 mb-1"></i>
                <h3 class="font-semibold text-cyan-300 text-[10px] mb-0.5">Folder Cards</h3>
                <p class="text-[9px] text-cyan-100/60">Top-level folders show random previews and counts.</p>
              </div>
            </div>
          </section>

          <!-- TECH STACK -->
          <section id="docs-stack" class="doc-section">
            <h2 class="text-sm font-bold text-cyan-300 mb-1.5 flex items-center gap-1">
              <i class="fa-solid fa-layer-group text-xs"></i>Technology Stack
            </h2>

            <div class="space-y-2">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">Frontend</h3>
                <ul class="space-y-0.5 text-[9px]">
                  <li><code>HTML5</code> – Semantic markup and structure</li>
                  <li><code>Vanilla JavaScript</code> – No framework dependencies</li>
                  <li><code>Tailwind CSS</code> – Utility-first styling via CDN</li>
                  <li><code>Font Awesome 6.4.0</code> – Icon library</li>
                  <li><code>Web Crypto API</code> – PBKDF2 + AES-GCM encryption</li>
                </ul>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">Backend API</h3>
                <ul class="space-y-0.5 text-[9px]">
                  <li><code>Endpoint:</code> <code>https://media-blob-db-two.vercel.app/api</code></li>
                  <li><code>Auth:</code> Bearer token (API Secret Key)</li>
                  <li><code>Protocol:</code> REST over HTTPS</li>
                  <li><code>Upload:</code> Presigned PUT &gt;4 MB; multipart ≤4 MB</li>
                </ul>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">Storage &amp; Caching</h3>
                <ul class="space-y-0.5 text-[9px]">
                  <li><code>localStorage</code> – Encrypted API key + cached blob data</li>
                  <li><code>Blob Store</code> – Remote storage with path hierarchy</li>
                  <li><code>Cache</code> – First fetch cached; invalidated after upload/delete</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- API REFERENCE -->
          <section id="docs-api" class="doc-section">
            <h2 class="text-sm font-bold text-cyan-300 mb-1.5 flex items-center gap-1">
              <i class="fa-solid fa-plug text-xs"></i>API Reference
            </h2>

            <div class="space-y-2">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-[11px] font-semibold text-cyan-300">Fetch Blobs</h3>
                  <span class="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-mono">GET</span>
                </div>
                <p class="text-[9px] text-cyan-100/80 mb-1"><code>/server</code></p>
                <p class="text-[9px] text-cyan-100/60 mb-1.5">Retrieve all blobs. Client filters by mode.</p>
                <pre class="mb-1.5"><code class="text-[8px]">GET /server?_=timestamp HTTP/1.1
Host: media-blob-db-two.vercel.app/api
Authorization: Bearer YOUR_SECRET_KEY</code></pre>
                <p class="text-[8px] text-cyan-300 font-semibold mb-1">Response (200 OK):</p>
                <pre><code class="text-[8px]">{
  "blobs": [
    {
      "pathname": "uploads/screenshots/photo_20260830123456.jpg",
      "url": "https://...",
      "downloadUrl": "https://...",
      "size": 245678,
      "uploadedAt": "2026-08-30T12:34:56Z",
      "lastModified": "2026-08-30T12:34:56Z",
      "type": "image/jpeg"
    }
  ],
  "storeId": "store_abc123"
}</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-[11px] font-semibold text-cyan-300">Presign Upload URL</h3>
                  <span class="bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-mono">POST</span>
                </div>
                <p class="text-[9px] text-cyan-100/80 mb-1"><code>/server?action=presign</code></p>
                <p class="text-[9px] text-cyan-100/60 mb-1.5">Get a presigned PUT URL for large files (&gt;4 MB).</p>
                <pre class="mb-1.5"><code class="text-[8px]">POST /server?action=presign&amp;date=timestamp HTTP/1.1
Host: media-blob-db-two.vercel.app/api
Authorization: Bearer YOUR_SECRET_KEY
Content-Type: multipart/form-data

filename: movie.mp4
category: videos
lastModified: 1757600000000</code></pre>
                <p class="text-[8px] text-cyan-300 font-semibold mb-1">Response (200 OK):</p>
                <pre><code class="text-[8px]">{ "presignedUrl": "https://...blob.vercel-storage.com/..." }</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-[11px] font-semibold text-cyan-300">Upload File (small)</h3>
                  <span class="bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-mono">POST</span>
                </div>
                <p class="text-[9px] text-cyan-100/80 mb-1"><code>/server?category=...&amp;lastModified=...</code></p>
                <p class="text-[9px] text-cyan-100/60 mb-1.5">Multipart for files ≤ 4 MB. Videos also upload a thumbnail to <code>/thumbnails</code>.</p>
                <pre class="mb-1.5"><code class="text-[8px]">POST /server?category=videos HTTP/1.1
Host: media-blob-db-two.vercel.app/api
Authorization: Bearer YOUR_SECRET_KEY
Content-Type: multipart/form-data

image: [File]
lastModified: 1757600000000</code></pre>
                <p class="text-[8px] text-cyan-300 font-semibold mb-1">Response (200/201 OK):</p>
                <pre><code class="text-[8px]">{ "url": "...", "pathname": "uploads/...", "size": 245678 }</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-[11px] font-semibold text-cyan-300">Delete Blob</h3>
                  <span class="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[8px] font-mono">DELETE</span>
                </div>
                <p class="text-[9px] text-cyan-100/80 mb-1"><code>/server</code></p>
                <p class="text-[9px] text-cyan-100/60 mb-1.5">Delete a blob by pathname. Videos also remove the thumbnail.</p>
                <pre class="mb-1.5"><code class="text-[8px]">DELETE /server HTTP/1.1
Host: media-blob-db-two.vercel.app/api
Authorization: Bearer YOUR_SECRET_KEY
Content-Type: application/json

{ "pathname": "uploads/videos/movie_20260830123456.mp4" }</code></pre>
                <p class="text-[8px] text-cyan-300 font-semibold mb-1">Response (200 OK):</p>
                <pre><code class="text-[8px]">{ "success": true, "pathname": "uploads/..." }</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-[11px] font-semibold text-cyan-300">Test Connection</h3>
                  <span class="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-mono">GET</span>
                </div>
                <p class="text-[9px] text-cyan-100/80 mb-1"><code>/server?limit=1</code></p>
                <p class="text-[9px] text-cyan-100/60 mb-1.5">Test API connectivity without full dataset.</p>
                <pre class="mb-1.5"><code class="text-[8px]">GET /server?limit=1 HTTP/1.1
Host: media-blob-db-two.vercel.app/api
Authorization: Bearer YOUR_SECRET_KEY</code></pre>
                <p class="text-[8px] text-cyan-300 font-semibold mb-1">Response (200 OK):</p>
                <pre><code class="text-[8px]">{ "connected": true, "storeId": "store_abc123" }</code></pre>
              </div>
            </div>
          </section>

          <!-- MODULES -->
          <section id="docs-modules" class="doc-section">
            <h2 class="text-sm font-bold text-cyan-300 mb-1.5 flex items-center gap-1">
              <i class="fa-solid fa-cube text-xs"></i>Core Modules
            </h2>

            <div class="space-y-2">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">ImageDB</h3>
                <p class="text-[9px] text-cyan-100/70 mb-1.5">Image-specific operations. Filters out videos and skipped folders.</p>
                <div class="bg-black/30 rounded p-2">
                  <p class="text-[9px] text-cyan-300 font-semibold mb-1">Key Methods:</p>
                  <ul class="text-[8px] text-cyan-100/70 space-y-0.5 font-mono">
                    <li><code class="text-cyan-200">configure(options)</code> – Set API base, key, category</li>
                    <li><code class="text-cyan-200">fetchData()</code> – Fetch all blobs (with cache)</li>
                    <li><code class="text-cyan-200">uploadFiles(files, onProgress, categories)</code> – Upload</li>
                    <li><code class="text-cyan-200">deleteItem(pathname)</code> – Remove</li>
                    <li><code class="text-cyan-200">testConnection()</code> – Verify API access</li>
                    <li><code class="text-cyan-200">addFiles(files)</code> – Add to selection (deduped)</li>
                    <li><code class="text-cyan-200">getSelectedFiles()</code> – Get pending uploads</li>
                    <li><code class="text-cyan-200">openSlideshow(index, urls)</code> – Start viewer</li>
                    <li><code class="text-cyan-200">on(event, callback)</code> – Register listener</li>
                  </ul>
                </div>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">VideoDB</h3>
                <p class="text-[9px] text-cyan-100/70 mb-1.5">Video operations with thumbnail generation and custom player.</p>
                <div class="bg-black/30 rounded p-2">
                  <p class="text-[9px] text-cyan-300 font-semibold mb-1">Key Methods:</p>
                  <ul class="text-[8px] text-cyan-100/70 space-y-0.5 font-mono">
                    <li><code class="text-cyan-200">configure(options)</code> – Set API base, key, category</li>
                    <li><code class="text-cyan-200">fetchData()</code> – Fetch all blobs (with cache)</li>
                    <li><code class="text-cyan-200">uploadFiles(files, onProgress, categories)</code> – Upload with thumbs</li>
                    <li><code class="text-cyan-200">deleteItem(pathname)</code> – Remove</li>
                    <li><code class="text-cyan-200">testConnection()</code> – Verify API access</li>
                    <li><code class="text-cyan-200">openSlideshow(index, urls)</code> – Start player</li>
                    <li><code class="text-cyan-200">on(event, callback)</code> – Register listener</li>
                  </ul>
                </div>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">FolderExplorer</h3>
                <p class="text-[9px] text-cyan-100/70 mb-1.5">Virtual filesystem tree built from flat blob paths.</p>
                <div class="bg-black/30 rounded p-2">
                  <p class="text-[9px] text-cyan-300 font-semibold mb-1">Key Methods:</p>
                  <ul class="text-[8px] text-cyan-100/70 space-y-0.5 font-mono">
                    <li><code class="text-cyan-200">create(data)</code> – Factory method</li>
                    <li><code class="text-cyan-200">navigateToFolder(pathParts)</code> – Change dir</li>
                    <li><code class="text-cyan-200">getCurrentPath()</code> – Get path array</li>
                    <li><code class="text-cyan-200">getChildFolders(pathParts)</code> – List subfolders</li>
                    <li><code class="text-cyan-200">getFilesInCurrentFolder()</code> – Get files</li>
                    <li><code class="text-cyan-200">getAllFiles()</code> – Return all blobs</li>
                    <li><code class="text-cyan-200">searchFiles(query)</code> – Find by name</li>
                    <li><code class="text-cyan-200">getTotalStats()</code> – Store statistics</li>
                    <li><code class="text-cyan-200">formatSize(bytes)</code> – Human-readable size</li>
                  </ul>
                </div>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">BlobUtils</h3>
                <p class="text-[9px] text-cyan-100/70 mb-1.5">Shared helpers: formatting, filtering, caching, folder utilities.</p>
                <div class="bg-black/30 rounded p-2">
                  <p class="text-[9px] text-cyan-300 font-semibold mb-1">Key Functions:</p>
                  <ul class="text-[8px] text-cyan-100/70 space-y-0.5 font-mono">
                    <li><code class="text-cyan-200">isSkippedPath(pathname)</code> – Excludes json folders</li>
                    <li><code class="text-cyan-200">isVideoPath(pathname)</code> – Excludes video paths</li>
                    <li><code class="text-cyan-200">getTopLevelFolders(blobs, basePath)</code> – List folders</li>
                    <li><code class="text-cyan-200">getRandomBlobsFromFolders(blobs, basePath, count)</code> – Folder preview</li>
                    <li><code class="text-cyan-200">saveCache / loadCache / clearCache</code> – Cache utilities</li>
                    <li><code class="text-cyan-200">createEmitter(prefix)</code> – Event emitter</li>
                    <li><code class="text-cyan-200">formatFileSize(bytes)</code> – Human-readable size</li>
                    <li><code class="text-cyan-200">formatDuration(seconds)</code> – Video duration</li>
                  </ul>
                </div>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">KeyEncryptor</h3>
                <p class="text-[9px] text-cyan-100/70 mb-1.5">Client-side encryption with PBKDF2 + AES-256-GCM.</p>
                <div class="bg-black/30 rounded p-2 mb-1.5">
                  <p class="text-[9px] text-cyan-300 font-semibold mb-1">Methods:</p>
                  <ul class="text-[8px] text-cyan-100/70 space-y-0.5 font-mono">
                    <li><code class="text-cyan-200">encrypt(plaintext, password)</code> → <code>{iv, salt, ciphertext}</code></li>
                    <li><code class="text-cyan-200">decrypt(bundle, password)</code> → <code>plaintext</code></li>
                  </ul>
                </div>
                <p class="text-[8px] text-cyan-100/60 bg-black/20 border-l-2 border-orange-400 p-1.5 rounded">
                  <strong>Note:</strong> Uses async crypto.subtle API. Use <code>await</code> or <code>.then()</code>.
                </p>
              </div>
            </div>
          </section>

          <!-- EVENTS -->
          <section id="docs-events" class="doc-section">
            <h2 class="text-sm font-bold text-cyan-300 mb-1.5 flex items-center gap-1">
              <i class="fa-solid fa-bell text-xs"></i>Event System
            </h2>
            <p class="text-[9px] text-cyan-100/70 mb-1.5">Listen with <code>ImageDB.on(event, callback)</code> or <code>VideoDB.on(event, callback)</code>.</p>

            <div class="space-y-1.5">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>imagesLoading</code> / <code>videosLoading</code></p>
                <p class="text-[9px] text-cyan-100/60">Fired when fetch begins.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>imagesLoaded</code> / <code>videosLoaded</code> <span class="text-[8px] text-emerald-400 ml-1">data: {items, count, storeId, fromCache}</span></p>
                <p class="text-[9px] text-cyan-100/60">Data fetched (or loaded from cache).</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>imagesFetchError</code> / <code>videosFetchError</code> <span class="text-[8px] text-red-400 ml-1">data: {error, message}</span></p>
                <p class="text-[9px] text-cyan-100/60">Fetch failed.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>uploadStarted</code> <span class="text-[8px] text-cyan-400 ml-1">data: {total, files}</span></p>
                <p class="text-[9px] text-cyan-100/60">Upload batch initiated.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>uploadProgress</code> <span class="text-[8px] text-cyan-400 ml-1">data: {overallPercent, ...}</span></p>
                <p class="text-[9px] text-cyan-100/60">Upload progress update.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>uploadComplete</code> <span class="text-[8px] text-emerald-400 ml-1">data: {success, total, failed}</span></p>
                <p class="text-[9px] text-cyan-100/60">Upload finished. Cache cleared automatically.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>selectionChanged</code> <span class="text-[8px] text-cyan-400 ml-1">data: {selectedFiles, count}</span></p>
                <p class="text-[9px] text-cyan-100/60">File selection updated.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>slideshowOpened</code>, <code>slideshowChanged</code>, <code>slideshowClosed</code></p>
                <p class="text-[9px] text-cyan-100/60">Slideshow state changes.</p>
              </div>
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/20">
                <p class="text-[10px] font-mono text-cyan-300"><code>connectionTested</code> <span class="text-[8px] text-blue-400 ml-1">data: {connected, storeId, message}</span></p>
                <p class="text-[9px] text-cyan-100/60">API test result.</p>
              </div>
            </div>
          </section>

          <!-- SECURITY -->
          <section id="docs-security" class="doc-section">
            <h2 class="text-sm font-bold text-cyan-300 mb-1.5 flex items-center gap-1">
              <i class="fa-solid fa-lock text-xs"></i>Security &amp; Encryption
            </h2>

            <div class="space-y-2">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">API Authentication</h3>
                <p class="text-[9px] text-cyan-100/70 mb-1.5">All API requests use Bearer token authentication.</p>
                <pre><code class="text-[8px]">Authorization: Bearer &lt;API_SECRET_KEY&gt;</code></pre>
                <p class="text-[9px] text-cyan-100/60 mt-1.5">Key stored in <code>localStorage</code> after decryption on load.</p>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">Unlock Flow (PBKDF2 + AES-GCM)</h3>
                <ol class="text-[9px] text-cyan-100/70 space-y-1 list-decimal list-inside">
                  <li>User enters a <strong>password</strong> on first load</li>
                  <li>Key derived via <strong>PBKDF2-SHA256</strong> (600,000 iterations)</li>
                  <li>Derived key decrypts embedded cipher with <strong>AES-256-GCM</strong></li>
                  <li>Decrypted API key stored in <code>localStorage</code></li>
                  <li>Page reloads and app initializes with stored key</li>
                </ol>
                <pre class="mt-1.5"><code class="text-[8px]">// Embedded encrypted key structure:
_jfrKey = {
  iv: "base64_encoded_iv",
  salt: "base64_encoded_salt",
  ciphertext: "base64_encoded_ciphertext"
}</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-orange-400/30">
                <h3 class="text-[11px] font-semibold text-orange-300 mb-1">⚠️ Important Security Notes</h3>
                <ul class="text-[9px] text-cyan-100/70 space-y-0.5 list-disc list-inside">
                  <li>API key lives in <strong>localStorage</strong> – same-origin only</li>
                  <li>Always use <strong>HTTPS</strong> in production</li>
                  <li>Browser console can access <code>localStorage</code></li>
                  <li>For sensitive environments, use server-side key management</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- USAGE -->
          <section id="docs-usage" class="doc-section">
            <h2 class="text-sm font-bold text-cyan-300 mb-1.5 flex items-center gap-1">
              <i class="fa-solid fa-code text-xs"></i>Usage Examples
            </h2>

            <div class="space-y-2">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">1. Initialize &amp; Configure</h3>
                <pre><code class="text-[8px]">// Configure ImageDB
ImageDB.configure({
  apiBase: 'https://media-blob-db-two.vercel.app/api',
  apiSecretKey: 'your-secret-key',
  uploadCategory: 'screenshots'
});

// Configure VideoDB
VideoDB.configure({
  apiBase: 'https://media-blob-db-two.vercel.app/api',
  apiSecretKey: 'your-secret-key',
  uploadCategory: 'videos'
});

ImageDB.on('imagesLoaded', function(data) {
  console.log('Loaded', data.count, 'images, from cache:', data.fromCache);
});</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">2. Fetch &amp; Browse with Folder Cards</h3>
                <pre><code class="text-[8px]">ImageDB.fetchData().then(function(images) {
  const folderData = BlobUtils.getRandomBlobsFromFolders(images, 'uploads', 3);
  console.log(folderData);
});

const explorer = FolderExplorer.create({
  blobs: ImageDB.getItems(),
  storeId: ImageDB.getStoreId()
});
explorer.navigateToFolder(['uploads']);
const topFolders = explorer.getChildFolders(['uploads']);
console.log(topFolders);</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">3. Upload Images and Videos</h3>
                <pre><code class="text-[8px]">// Small files (≤4 MB) → serverless endpoint.
// Large files (>4 MB) → presigned PUT directly to blob storage.

const files = document.getElementById('file-input').files;
ImageDB.addFiles(files);
ImageDB.uploadFiles(ImageDB.getSelectedFiles(), null, ['screenshots/2026/08/30']);

VideoDB.addFiles(files);
VideoDB.uploadFiles(VideoDB.getSelectedFiles(), null, ['videos/2026/08/30']);</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">4. Delete &amp; Manage</h3>
                <pre><code class="text-[8px]">ImageDB.deleteItem('uploads/screenshots/photo_20260830123456.jpg')
  .then(() => ImageDB.fetchData());

const videoPath = 'uploads/videos/movie_20260830123456.mp4';
const thumbPath = videoPath.replace('/videos/', '/videos/thumbnails/').replace(/\.[^.]+$/, '.jpg');
VideoDB.deleteItem(thumbPath)
  .catch(() => {})
  .then(() => VideoDB.deleteItem(videoPath))
  .then(() => VideoDB.fetchData());</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">5. Encryption &amp; Password Unlock</h3>
                <pre><code class="text-[8px]">const password = 'my-secure-password';
KeyEncryptor.encrypt('my-api-secret-key', password)
  .then(bundle => console.log('Encrypted:', bundle));

KeyEncryptor.decrypt(bundle, 'my-secure-password')
  .then(decrypted => console.log('API Key:', decrypted))
  .catch(err => console.error('Wrong password:', err.message));</code></pre>
              </div>
            </div>
          </section>

          <!-- ARCHITECTURE -->
          <section id="docs-architecture" class="doc-section">
            <h2 class="text-sm font-bold text-cyan-300 mb-1.5 flex items-center gap-1">
              <i class="fa-solid fa-diagram-project text-xs"></i>Application Architecture
            </h2>

            <div class="space-y-2">
              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">Data Flow</h3>
                <pre class="bg-black/30 p-2 rounded overflow-x-auto"><code class="text-[8px]">┌─────────────────────────────────────────────────┐
│ User Browser (Client)                           │
├─────────────────────────────────────────────────┤
│ index.html                                      │
│  ├─ old.js         (all modules)                │
│  │   ├─ KeyEncryptor (crypto)                   │
│  │   ├─ BlobUtils    (helpers + cache)          │
│  │   ├─ FolderExplorer (navigation)             │
│  │   ├─ ImageDB      (image API)                │
│  │   ├─ VideoDB      (video API)                │
│  │   └─ ImageDBApp / VideoDBApp (UI init)       │
│  ├─ help-content.js / docs-content.js           │
│  ├─ Tailwind CSS     (styling)                  │
│  └─ localStorage: encrypted key + cache         │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
                 ├─ GET    /server
                 ├─ POST   /server   (small)
                 ├─ POST   /server?action=presign
                 ├─ PUT    (presigned → blob.vercel-storage.com)
                 ├─ DELETE /server
                 └─ GET    /server?limit=1 (test)
                 │
            ┌────▼──────────────────────────┐
            │ Backend API (server.js)        │
            ├────────────────────────────────┤
            │ Vercel Deployment              │
            │ - Auth: Bearer token           │
            │ - Storage: Blob store          │
            │ - Response: JSON               │
            └────────────────────────────────┘</code></pre>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">App Startup &amp; Mode Switching</h3>
                <ol class="text-[9px] text-cyan-100/70 space-y-0.5 list-decimal list-inside">
                  <li>Determine <strong>app mode</strong> (image or video) from <code>localStorage</code></li>
                  <li>If no stored API key → show unlock modal, decrypt with password</li>
                  <li>Store decrypted key in <code>localStorage</code></li>
                  <li>Configure the appropriate DB module</li>
                  <li>Check cache → if present, load immediately; else fetch from API</li>
                  <li>Build folder tree and render gallery (folder cards at top level)</li>
                  <li>Attach event listeners for upload, delete, settings</li>
                  <li><strong>Switch button</strong> updates <code>localStorage</code> and reloads</li>
                </ol>
              </div>

              <div class="bg-[#1a2e36] rounded-lg p-2 border border-cyan-400/30">
                <h3 class="text-[11px] font-semibold text-cyan-300 mb-1">Caching Strategy</h3>
                <ul class="text-[9px] text-cyan-100/70 space-y-0.5 list-disc list-inside">
                  <li>First fetch saves blob list to <code>localStorage</code> under <code>imageDB_cache_v1</code> or <code>videoDB_cache_v1</code></li>
                  <li>Subsequent loads use cache immediately</li>
                  <li>After upload or delete, cache is cleared automatically</li>
                  <li>Manual refresh also clears cache before refetching</li>
                </ul>
              </div>
            </div>
          </section>

          <div class="mt-3 p-2 bg-black/40 border-l-2 border-cyan-400 rounded">
            <p class="text-[10px] text-cyan-300 mb-1"><i class="fa-solid fa-lightbulb mr-1"></i><strong>Need Help?</strong></p>
            <p class="text-[9px] text-cyan-100/70">Visit the <a href="./help.html" class="text-cyan-400 hover:text-cyan-300 underline">Help tab</a> for user guide and troubleshooting.</p>
          </div>

        </div>
      </div>
    </div>
  `;

  // -------- Inject content + wire internal scroll/TOC behaviour --------
  function injectContent() {
    var pane = document.getElementById('tab-pane-docs');
    if (!pane || pane.dataset.docsLoaded === 'true') return;
    pane.innerHTML = DOCS_HTML;
    pane.dataset.docsLoaded = 'true';

    var scrollContainer = pane.querySelector('#docs-content-scroll');
    var tocLinks = pane.querySelectorAll('.toc-link');
    var sections = pane.querySelectorAll('.doc-section');

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
  }

  // -------- Repoint Docs links → open the Docs tab --------
  function wireTriggers() {
    var tabDocs = document.getElementById('tab-docs');
    if (!tabDocs) return;

    function openDocs(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      tabDocs.click();
    }

    var docsLinks = document.querySelectorAll(
      '#app-sidebar a[href$="docs.html"], #app-footer a[href$="docs.html"]'
    );
    docsLinks.forEach(function (link) {
      link.setAttribute('href', 'javascript:void(0)');
      link.setAttribute('role', 'button');
      link.setAttribute('aria-label', 'Open Documentation');
      link.addEventListener('click', openDocs);
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href$="docs.html"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      tabDocs.click();
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
