var KeyEncryptor = (function () {
    'use strict';

    function _arrayBufferToBase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = '';
        for (var i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function _base64ToArrayBuffer(base64) {
        var binary = atob(base64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async function _deriveKey(password, salt) {
        var enc = new TextEncoder();
        var keyMaterial = await crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 600000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async function encrypt(plaintext, password) {
        if (!plaintext || !password) {
            throw new Error('Plaintext and password are required.');
        }
        var salt = crypto.getRandomValues(new Uint8Array(16));
        var iv = crypto.getRandomValues(new Uint8Array(12));
        var key = await _deriveKey(password, salt);
        var encoded = new TextEncoder().encode(plaintext);
        var cipherBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encoded
        );
        return {
            iv: _arrayBufferToBase64(iv),
            salt: _arrayBufferToBase64(salt),
            ciphertext: _arrayBufferToBase64(cipherBuffer)
        };
    }

    async function decrypt(bundle, password) {
        if (!bundle || !password) {
            throw new Error('Bundle and password are required.');
        }
        var iv = new Uint8Array(_base64ToArrayBuffer(bundle.iv));
        var salt = new Uint8Array(_base64ToArrayBuffer(bundle.salt));
        var cipherBuffer = _base64ToArrayBuffer(bundle.ciphertext);
        var key = await _deriveKey(password, salt);
        var decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            cipherBuffer
        );
        return new TextDecoder().decode(decrypted);
    }

    return {
        encrypt: encrypt,
        decrypt: decrypt
    };
})();

var BlobUtils = (function () {
    'use strict';

    function isSkippedPath(pathname) {
        if (!pathname || typeof pathname !== 'string') return false;
        const parts = pathname.split('/');
        parts.pop();
        return parts.some(part => part === 'json' || part === 'json-data');
    }

    function isVideoPath(pathname) {
        if (!pathname || typeof pathname !== 'string') return false;
        return /^uploads\/(videos|video)\//.test(pathname);
    }

    function getTopLevelFolders(blobs, basePath) {
        basePath = (basePath || 'uploads').replace(/^\/+|\/+$/g, '');
        const folderSet = {};
        const excluded = new Set(['json', 'json-data', 'videos', 'video']);

        blobs.forEach(function(blob) {
            if (!blob.pathname) return;
            const parts = blob.pathname.split('/');
            const baseIndex = parts.indexOf(basePath);
            if (baseIndex === -1) return;

            const nextPart = parts[baseIndex + 1];
            if (nextPart && parts.length > baseIndex + 2 && !excluded.has(nextPart.toLowerCase())) {
                folderSet[nextPart] = true;
            }
        });

        return Object.keys(folderSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    function getRandomBlobsFromFolders(blobs, basePath, count) {
        basePath = (basePath || 'uploads').replace(/^\/+|\/+$/g, '');
        count = count || 3;

        const folders = getTopLevelFolders(blobs, basePath);
        const result = {};

        folders.forEach(function(folder) {
            const prefix = basePath + '/' + folder + '/';
            const blobsInFolder = blobs.filter(function(blob) {
                return blob.pathname && blob.pathname.startsWith(prefix);
            });

            const total = blobsInFolder.length;

            const shuffled = blobsInFolder.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const randomImages = shuffled.slice(0, count);

            result[folder] = {
                total: total,
                images: randomImages
            };
        });

        return result;
    }

    function saveCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Cache save failed:', e);
        }
    }

    function loadCache(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('Cache load failed:', e);
            return null;
        }
    }

    function clearCache(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Cache clear failed:', e);
        }
    }

    function createEmitter(prefix) {
        var listeners = {};
        return {
            on: function(event, callback) {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(callback);
            },
            off: function(event, callback) {
                if (!listeners[event]) return;
                listeners[event] = listeners[event].filter(function(cb) {
                    return cb !== callback;
                });
            },
            emit: function(event, data) {
                if (!listeners[event]) return;
                listeners[event].forEach(function(cb) {
                    try {
                        cb(data);
                    } catch (e) {
                        console.error('[' + (prefix || 'Emitter') + '] Listener error for event "' + event + '":', e);
                    }
                });
            }
        };
    }

    function getAuthHeaders(apiSecretKey) {
        var headers = {};
        if (apiSecretKey) {
            headers['Authorization'] = 'Bearer ' + apiSecretKey;
        }
        return headers;
    }

    function formatFileSize(bytes) {
        if (!bytes || typeof bytes !== 'number' || bytes < 0) return '';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1024).toFixed(1) + ' KB';
    }

    function getFileNameFromPath(path) {
        if (!path || typeof path !== 'string') return '';
        return path.replace(/^.*\//, '');
    }

    function isFileNameDuplicate(fileName, list) {
        if (!fileName) return false;
        var lower = fileName.toLowerCase();
        return list.some(function (item) {
            return getFileNameFromPath(item.pathname).toLowerCase() === lower;
        });
    }

    function filterDuplicateFiles(newFiles, existingList) {
        if (!newFiles || !newFiles.length) return [];
        if (!existingList || !existingList.length) return newFiles.slice();

        var existingNames = {};
        for (var i = 0; i < existingList.length; i++) {
            var name = getFileNameFromPath(existingList[i].pathname).toLowerCase();
            if (name) existingNames[name] = true;
        }

        return newFiles.filter(function (file) {
            return !existingNames[file.name.toLowerCase()];
        });
    }

    function createModalHelpers(modalOverlay, modalMessage, modalButtons) {
        function closeModal() {
            modalOverlay.classList.add('hidden', 'opacity-0');
            modalOverlay.classList.remove('flex', 'opacity-100');
            modalButtons.innerHTML = '';
            const box = modalOverlay.querySelector('.modal-box');
            if (box) {
                box.classList.remove('scale-100', 'translate-y-0');
                box.classList.add('scale-95', 'translate-y-2');
            }
        }

        function showAlert(msg, cb) {
            modalMessage.textContent = msg;
            modalOverlay.querySelector('.text-4xl i').className = 'fa-solid fa-circle-info';
            modalButtons.innerHTML = `<button class="bg-[#057c94] hover:bg-[#046a80] text-white px-4 py-1 rounded-full text-[10px] font-semibold shadow-md transition-all min-w-[60px]" id="modal-ok-btn">OK</button>`;
            modalOverlay.classList.remove('hidden', 'opacity-0');
            modalOverlay.classList.add('flex', 'opacity-100');
            const box = modalOverlay.querySelector('.modal-box');
            if (box) {
                box.classList.remove('scale-95', 'translate-y-2');
                box.classList.add('scale-100', 'translate-y-0');
            }
            document.getElementById('modal-ok-btn').onclick = function() {
                closeModal();
                if (cb) cb();
            };
            modalOverlay.onclick = function(e) {
                if (e.target === modalOverlay) {
                    closeModal();
                    if (cb) cb();
                }
            };
        }

        function showConfirm(msg, onConfirm, onCancel) {
            modalMessage.textContent = msg;
            modalOverlay.querySelector('.text-4xl i').className = 'fa-solid fa-triangle-exclamation';
            modalButtons.innerHTML = `
                <button class="bg-white/10 hover:bg-white/20 text-gray-300 px-4 py-1 rounded-full text-[10px] font-semibold border border-white/15 transition-all min-w-[60px]" id="modal-cancel-btn">Cancel</button>
                <button class="bg-red-700 hover:bg-red-800 text-white px-4 py-1 rounded-full text-[10px] font-semibold shadow-md transition-all min-w-[60px]" id="modal-confirm-btn">Confirm</button>
            `;
            modalOverlay.classList.remove('hidden', 'opacity-0');
            modalOverlay.classList.add('flex', 'opacity-100');
            const box = modalOverlay.querySelector('.modal-box');
            if (box) {
                box.classList.remove('scale-95', 'translate-y-2');
                box.classList.add('scale-100', 'translate-y-0');
            }
            document.getElementById('modal-cancel-btn').onclick = function() {
                closeModal();
                if (onCancel) onCancel();
            };
            document.getElementById('modal-confirm-btn').onclick = function() {
                closeModal();
                if (onConfirm) onConfirm();
            };
            modalOverlay.onclick = function(e) {
                if (e.target === modalOverlay) {
                    closeModal();
                    if (onCancel) onCancel();
                }
            };
        }

        return {
            closeModal: closeModal,
            showAlert: showAlert,
            showConfirm: showConfirm
        };
    }

    function updateClock(clockDay, clockHours, clockMinutes, clockAmpm) {
        const now = new Date();
        const day = now.toLocaleDateString('en-US', { weekday: 'short' });
        let h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        clockDay.textContent = day + ',';
        clockHours.textContent = String(h).padStart(2, '0');
        clockMinutes.textContent = m;
        clockAmpm.textContent = ampm;
    }

    function formatFullDate(dateInput) {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function formatToMonthYear(dateInput) {
        if (!dateInput) return '';
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[date.getMonth()] + ', ' + date.getFullYear();
    }

    function formatDuration(seconds) {
        if (!seconds) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    return {
        isSkippedPath,
        isVideoPath,
        getTopLevelFolders,
        getRandomBlobsFromFolders,
        saveCache,
        loadCache,
        clearCache,
        createEmitter,
        getAuthHeaders,
        formatFileSize,
        getFileNameFromPath,
        isFileNameDuplicate,
        filterDuplicateFiles,
        createModalHelpers,
        updateClock,
        formatFullDate,
        formatToMonthYear,
        formatDuration
    };
})();

var FolderExplorer = (function() {
    'use strict';

    class FolderExplorer {
        constructor(rawData) {
            if (!rawData || !Array.isArray(rawData.blobs)) {
                throw new Error('Invalid data: expected { blobs: [...] }');
            }
            this.blobs = rawData.blobs;
            this.storeId = rawData.storeId || '';

            this.treeRoot = this._buildTree();
            this._currentPath = [];
            this._selectedFile = null;
            this._listeners = { change: [] };
        }

        static create(rawData) {
            return new FolderExplorer(rawData);
        }

        navigateToFolder(pathParts) {
            if (!Array.isArray(pathParts)) pathParts = [];
            let node = this.treeRoot;
            for (const part of pathParts) {
                if (!node.children[part]) {
                    this._emitChange();
                    return false;
                }
                node = node.children[part];
            }
            this._currentPath = pathParts.slice();
            this._selectedFile = null;
            this._emitChange();
            return true;
        }

        selectFile(blob) {
            if (!blob || !blob.pathname) {
                this._selectedFile = null;
                this._emitChange();
                return;
            }
            const pathParts = blob.pathname.split('/');
            pathParts.pop();
            this._currentPath = pathParts;
            this._selectedFile = blob;
            this._emitChange();
        }

        getCurrentPath() { return this._currentPath.slice(); }
        getCurrentPathString() { return this._currentPath.join('/'); }
        getSelectedFile() { return this._selectedFile; }

        getChildFolders(pathParts) {
            const node = this._getNode(pathParts || this._currentPath);
            if (!node) return [];
            return Object.keys(node.children).sort((a, b) =>
                a.localeCompare(b, undefined, { numeric: true })
            );
        }

        getFilesInCurrentFolder() {
            const node = this._getNode(this._currentPath);
            if (!node) return [];
            const files = this._getAllFilesRecursive(node);
            return files.sort((a, b) => {
                const nameA = a.pathname.split('/').pop();
                const nameB = b.pathname.split('/').pop();
                return nameA.localeCompare(nameB);
            });
        }

        getAllFiles() { return this.blobs.slice(); }

        searchFiles(query) {
            if (!query || !query.trim()) return this.getFilesInCurrentFolder();
            const term = query.trim().toLowerCase();
            return this.getFilesInCurrentFolder().filter(b => {
                return b.pathname.split('/').pop().toLowerCase().includes(term);
            });
        }

        getTotalStats() {
            const totalSize = this.blobs.reduce((sum, b) => sum + b.size, 0);
            return {
                count: this.blobs.length,
                size: totalSize,
                sizeFormatted: BlobUtils.formatFileSize(totalSize)
            };
        }

        static formatSize(bytes) { return BlobUtils.formatFileSize(bytes); }
        static formatDate(iso) { return BlobUtils.formatFullDate(iso); }

        on(event, callback) {
            if (event === 'change' && typeof callback === 'function') {
                this._listeners.change.push(callback);
            }
        }

        off(event, callback) {
            if (event === 'change') {
                this._listeners.change = this._listeners.change.filter(cb => cb !== callback);
            }
        }

        _emitChange() {
            this._listeners.change.forEach(cb => { try { cb(); } catch (e) {} });
        }

        _buildTree() {
            const root = { name: '', isFolder: true, children: {}, files: [], fullPath: '' };
            this.blobs.forEach(b => {
                const parts = b.pathname.split('/');
                let current = root;
                let acc = '';
                parts.forEach((part, idx) => {
                    acc += (acc ? '/' : '') + part;
                    if (idx === parts.length - 1) {
                        current.files.push({ name: part, fullPath: b.pathname, blob: b });
                    } else {
                        if (!current.children[part]) {
                            current.children[part] = {
                                name: part,
                                isFolder: true,
                                children: {},
                                files: [],
                                fullPath: acc
                            };
                        }
                        current = current.children[part];
                    }
                });
            });
            return root;
        }

        _getNode(pathParts) {
            let node = this.treeRoot;
            if (!pathParts || pathParts.length === 0) return node;
            for (const part of pathParts) {
                if (!node.children[part]) return null;
                node = node.children[part];
            }
            return node;
        }

        _getAllFilesRecursive(node) {
            let results = node.files.map(f => f.blob);
            for (const key in node.children) {
                results = results.concat(this._getAllFilesRecursive(node.children[key]));
            }
            return results;
        }
    }

    return FolderExplorer;
})();

function createMediaDB(type) {
    'use strict';

    const isVideo = type === 'video';
    const label = isVideo ? 'Video' : 'Image';
    const cacheKey = `${type}DB_cache_v1`;

    const emitter = BlobUtils.createEmitter(`${label}DB`);
    const _on = emitter.on;
    const _off = emitter.off;
    const _emit = emitter.emit;

    const _jfrKey = {
        "iv": "a4EroL5JUEgVloj1",
        "salt": "PtvozUTEvgxEqQUpQY3yyA==",
        "ciphertext": "ne2yiSgFCpDpDbjMmcW4wlNoFo2ogXbhH2sPHFup9SvlfRpay7PtKJnq1SJLdg2Pt9NHtDwf/+vncciJoKhzmxW53NuQA6X+BrTtXAhlMTI="
    };

    let _apiBase = 'https://media-blob-db-two.vercel.app/api';
    let _uploadCategory = isVideo ? 'videos' : 'screenshots';
    let _storeId = null;

    // Threshold for switching to direct upload (under Vercel 4.5 MB body limit)
    let _uploadThreshold = 4 * 1024 * 1024;

    let _apiSecretKey = (function() {
        try {
            if (typeof process !== 'undefined' && process.env && process.env.API_SECRET_KEY) {
                return process.env.API_SECRET_KEY;
            }
        } catch (e) {}
        return null;
    })();

    let _items = [];
    let _selectedFiles = [];
    let _slideshowItems = [];
    let _slideshowIndex = 0;
    let _slideshowOpen = false;
    let _fetchPromise = null;

    function configure(options) {
        if (!options || typeof options !== 'object') return;
        if (typeof options.apiBase === 'string' && options.apiBase.length > 0) {
            _apiBase = options.apiBase.replace(/\/+$/, '');
        }
        if (typeof options.uploadCategory === 'string' && options.uploadCategory.length > 0) {
            _uploadCategory = options.uploadCategory;
        }
        if (typeof options.apiSecretKey === 'string') {
            _apiSecretKey = options.apiSecretKey;
        }
        if (typeof options.uploadThreshold === 'number') {
            _uploadThreshold = options.uploadThreshold;
        }
        _emit('configured', { apiBase: _apiBase, uploadCategory: _uploadCategory });
    }

    function _filterBlobs(blobs) {
        return blobs.filter(blob => {
            if (BlobUtils.isSkippedPath(blob.pathname)) return false;
            if (!isVideo && BlobUtils.isVideoPath(blob.pathname)) return false;
            return true;
        });
    }

    function fetchData() {
        if (_fetchPromise) return _fetchPromise;

        const cached = BlobUtils.loadCache(cacheKey);
        if (cached && cached.blobs && Array.isArray(cached.blobs)) {
            _items = cached.blobs;
            if (cached.storeId) _storeId = cached.storeId;
            _emit(`${type}sLoaded`, {
                [type + 's']: _items,
                count: _items.length,
                storeId: _storeId,
                fromCache: true
            });
            return Promise.resolve(_items);
        }

        _emit(`${type}sLoading`);

        // CHANGED: /blobs → /server
        _fetchPromise = fetch(_apiBase + '/server?_=' + Date.now(), {
            headers: BlobUtils.getAuthHeaders(_apiSecretKey)
        })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => {
                _items = _filterBlobs(data.blobs || []);
                if (data.storeId) _storeId = data.storeId;

                BlobUtils.saveCache(cacheKey, {
                    blobs: _items,
                    storeId: _storeId
                });

                _fetchPromise = null;
                _emit(`${type}sLoaded`, {
                    [type + 's']: _items,
                    count: _items.length,
                    storeId: _storeId,
                    fromCache: false
                });
                return _items;
            })
            .catch(err => {
                _fetchPromise = null;
                _emit(`${type}sFetchError`, { error: err, message: err.message });
                throw err;
            });

        return _fetchPromise;
    }

    function deleteItem(pathname) {
        if (!pathname) return Promise.reject(new Error('Pathname is required'));

        _emit(`${type}Deleting`, { pathname });

        // CHANGED: /blobs → /server
        return fetch(_apiBase + '/server', {
            method: 'DELETE',
            headers: Object.assign({ 'Content-Type': 'application/json' }, BlobUtils.getAuthHeaders(_apiSecretKey)),
            body: JSON.stringify({ pathname }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Delete failed (HTTP ' + res.status + ')');
                return res.json().catch(() => ({ success: true }));
            })
            .then(data => new Promise(resolve => setTimeout(() => resolve(data), 300)))
            .then(data => {
                _emit(`${type}Deleted`, { pathname, result: data });
                BlobUtils.clearCache(cacheKey);
                return data;
            })
            .catch(err => {
                _emit(`${type}DeleteError`, { pathname, error: err, message: err.message });
                throw err;
            });
    }

    function testConnection() {
        _emit('connectionTesting');
        // CHANGED: /blobs → /server
        return fetch(_apiBase + '/server?limit=1', {
            headers: BlobUtils.getAuthHeaders(_apiSecretKey)
        })
            .then(res => {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(data => {
                if (data.storeId) _storeId = data.storeId;
                const result = { connected: true, storeId: _storeId, message: 'Connected successfully' };
                _emit('connectionTested', result);
                return result;
            })
            .catch(err => {
                const result = { connected: false, storeId: null, message: err.message };
                _emit('connectionTested', result);
                return result;
            });
    }

    function addFiles(files) {
        if (!files) {
            _emit('filesAdded', { added: 0, skipped: 0, duplicates: [], totalProcessed: 0 });
            return { added: 0, skipped: 0, duplicates: [], totalProcessed: 0 };
        }

        const fileArray = Array.from(files);
        const mediaFiles = fileArray.filter(f => f.type && f.type.startsWith(isVideo ? 'video/' : 'image/'));
        const nonMediaCount = fileArray.length - mediaFiles.length;

        if (mediaFiles.length === 0) {
            const result = { added: 0, skipped: nonMediaCount, duplicates: [], totalProcessed: fileArray.length };
            _emit('filesAdded', result);
            _emit(`no${label}Files`, { nonMediaCount });
            return result;
        }

        const allExisting = _items.map(item => ({ pathname: item.pathname }));
        const selectedAsMedia = _selectedFiles.map(f => ({ pathname: f.name }));
        const combinedExisting = allExisting.concat(selectedAsMedia);
        const uniqueFiles = BlobUtils.filterDuplicateFiles(mediaFiles, combinedExisting);
        const skipped = mediaFiles.length - uniqueFiles.length;

        if (uniqueFiles.length > 0) {
            _selectedFiles = _selectedFiles.concat(uniqueFiles);
        }

        const result = {
            added: uniqueFiles.length,
            skipped: skipped + nonMediaCount,
            duplicates: mediaFiles.filter(f => uniqueFiles.indexOf(f) === -1).map(f => f.name),
            totalProcessed: fileArray.length,
            totalSelected: _selectedFiles.length,
        };

        _emit('filesAdded', result);
        _emit('selectionChanged', { selectedFiles: _selectedFiles, count: _selectedFiles.length });
        return result;
    }

    function clearSelectedFiles() {
        _selectedFiles = [];
        _emit('selectionChanged', { selectedFiles: [], count: 0 });
        _emit('selectionCleared');
    }

    function getSelectedFiles() { return _selectedFiles.slice(); }

    function _uploadSingleFile(formData, category, onProgress) {
        return new Promise((resolve, reject) => {
            const timestamp = formData.get('lastModified') || Date.now();
            formData.set('lastModified', timestamp);
            // CHANGED: /uploads → /server
            const queryUrl = `${_apiBase}/server?category=${encodeURIComponent(category)}&lastModified=${timestamp}`;
            const xhr = new XMLHttpRequest();
            xhr.open('POST', queryUrl, true);
            if (_apiSecretKey) xhr.setRequestHeader('Authorization', 'Bearer ' + _apiSecretKey);
            xhr.upload.onprogress = e => {
                if (e.lengthComputable && typeof onProgress === 'function') {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };
            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(new Error('Invalid response')); }
                } else {
                    reject(new Error('HTTP ' + xhr.status + ' ' + xhr.statusText));
                }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.ontimeout = () => reject(new Error('Timeout'));
            xhr.send(formData);
        });
    }

    // ============================================================
    // Direct-upload helpers (bypass Vercel 4.5 MB body limit)
    // ============================================================

    function _requestPresign(file, category) {
        // CHANGED: /uploads → /server
        const url = _apiBase + '/server?action=presign&date=' + Date.now();
        const fd = new FormData();
        fd.append('filename', file.name);
        fd.append('category', category);
        fd.append('lastModified', file.lastModified || Date.now());

        return fetch(url, {
            method: 'POST',
            headers: BlobUtils.getAuthHeaders(_apiSecretKey),
            body: fd,
        })
            .then(res => {
                if (!res.ok) {
                    return res.json()
                        .catch(() => ({}))
                        .then(errData => { throw new Error(errData.error || ('Presign failed (HTTP ' + res.status + ')')); });
                }
                return res.json();
            })
            .then(data => {
                if (!data || !data.presignedUrl) {
                    throw new Error('Server did not return presignedUrl');
                }
                return data.presignedUrl;
            });
    }

    function _putToPresignedUrl(file, presignedUrl, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignedUrl, true);
            xhr.upload.onprogress = e => {
                if (e.lengthComputable && typeof onProgress === 'function') {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };
            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    try { resolve(JSON.parse(xhr.responseText)); }
                    catch (e) { reject(new Error('Invalid response from blob storage')); }
                } else {
                    reject(new Error('HTTP ' + xhr.status + ' ' + xhr.statusText));
                }
            };
            xhr.onerror   = () => reject(new Error('Network error during direct upload'));
            xhr.ontimeout = () => reject(new Error('Upload timeout'));
            xhr.send(file);
        });
    }

    function _uploadFileDirect(file, onProgress, category) {
        return _requestPresign(file, category)
            .then(presignedUrl => _putToPresignedUrl(file, presignedUrl, onProgress));
    }

    function _uploadFileSmart(file, onProgress, category) {
        if (file.size <= _uploadThreshold) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('lastModified', file.lastModified || Date.now());
            return _uploadSingleFile(formData, category, onProgress);
        }
        return _uploadFileDirect(file, onProgress, category);
    }

    // ============================================================

    function _generateThumbnail(file, callback) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.currentTime = 1;
        video.addEventListener('loadeddata', () => {
            const canvas = document.createElement('canvas');
            const aspectRatio = video.videoWidth / video.videoHeight;
            let width = 640, height = 360;
            if (aspectRatio <= 1.78) {
                width = 360 * aspectRatio;
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(video, 0, 0, width, height);
            canvas.toBlob(blob => {
                callback(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                }));
            }, 'image/jpeg', 0.85);
        });
        video.addEventListener('error', () => {
            const canvas = document.createElement('canvas');
            canvas.width = 640; canvas.height = 360;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1a2e36'; ctx.fillRect(0,0,640,360);
            ctx.fillStyle = '#ffffff'; ctx.font = '40px Arial';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('🎬', 320, 180);
            canvas.toBlob(blob => {
                callback(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg', lastModified: Date.now()
                }));
            }, 'image/jpeg');
        });
        video.load();
    }

    function _uploadImage(file, onProgress) {
        return _uploadFileSmart(
            file,
            p => onProgress && onProgress({ phase: 'image', percent: p }),
            _uploadCategory
        );
    }

    function _uploadVideo(file, onProgress) {
        return new Promise((resolve, reject) => {
            _generateThumbnail(file, thumbnailFile => {
                const videoCategory = _uploadCategory;
                const thumbCategory = _uploadCategory + '/thumbnails';

                _uploadFileSmart(
                    file,
                    p => onProgress && onProgress({ phase: 'video', percent: p * 0.9, fileName: file.name }),
                    videoCategory
                )
                .then(videoResult => {
                    const thumbForm = new FormData();
                    thumbForm.append('image', thumbnailFile);
                    thumbForm.append('lastModified', Date.now());

                    return _uploadSingleFile(
                        thumbForm,
                        thumbCategory,
                        p => onProgress && onProgress({ phase: 'thumbnail', percent: 90 + p * 0.1, fileName: file.name })
                    )
                    .then(thumbResult => ({ videoResult, thumbResult }))
                    .catch(err => {
                        console.warn('Thumbnail upload failed:', err);
                        return { videoResult, thumbResult: { error: err.message } };
                    });
                })
                .then(({ videoResult, thumbResult }) => {
                    resolve({
                        video: videoResult,
                        thumbnail: thumbResult,
                        videoPath: videoCategory + '/' + file.name,
                        thumbnailPath: thumbCategory + '/' + file.name.replace(/\.[^.]+$/, '.jpg')
                    });
                })
                .catch(reject);
            });
        });
    }

    function uploadFiles(files, onProgress, categories) {
        if (!files || !files.length) return Promise.resolve({ success: 0, total: 0, failed: [] });

        const total = files.length;
        let completed = 0;
        const failed = [];

        if (!categories || !Array.isArray(categories) || categories.length !== total) {
            categories = files.map(() => _uploadCategory);
        }

        _emit('uploadStarted', { total, files: files.map(f => f.name) });

        const processNext = index => {
            if (index >= total) {
                const result = { success: completed, total, failed: failed.slice() };
                BlobUtils.clearCache(cacheKey);
                _emit('uploadComplete', result);
                if (completed > 0) {
                    _selectedFiles = [];
                    _emit('selectionChanged', { selectedFiles: [], count: 0 });
                }
                return Promise.resolve(result);
            }

            const file = files[index];
            const uploadFn = isVideo ? _uploadVideo : _uploadImage;
            return uploadFn(file, p => {
                const overall = Math.min(
                    100,
                    Math.round((completed / total) * 100 + (p.percent / total))
                );
                const progressData = {
                    overallPercent: overall,
                    currentFileIndex: index,
                    totalFiles: total,
                    completed,
                    failed: failed.length,
                    currentFileName: file.name,
                    phase: p.phase,
                    phaseLabel: p.phase === 'video' ? 'Uploading video'
                              : p.phase === 'thumbnail' ? 'Uploading thumbnail'
                              : 'Uploading image'
                };
                if (typeof onProgress === 'function') onProgress(progressData);
                _emit('uploadProgress', progressData);
            })
            .then(() => {
                completed++;
                return processNext(index + 1);
            })
            .catch(err => {
                failed.push({ name: file.name, error: err.message || 'Unknown error' });
                return processNext(index + 1);
            });
        };

        return processNext(0);
    }

    function uploadSelectedFiles(onProgress) {
        if (_selectedFiles.length === 0) return Promise.resolve({ success: 0, total: 0, failed: [] });
        return uploadFiles(_selectedFiles.slice(), onProgress);
    }

    function openSlideshow(index, urls) {
        let items = urls;
        if (!items || !items.length) items = _items.map(item => item.url);
        if (!items.length) return null;

        _slideshowItems = items;
        _slideshowIndex = Math.min(Math.max(0, index), items.length - 1);
        _slideshowOpen = true;

        const state = getSlideshowState();
        _emit('slideshowOpened', state);
        return state;
    }

    function closeSlideshow() {
        _slideshowOpen = false;
        _emit('slideshowClosed', { wasOpen: true });
    }

    function nextSlide() {
        if (!_slideshowOpen || _slideshowItems.length <= 1) return null;
        _slideshowIndex = (_slideshowIndex + 1) % _slideshowItems.length;
        const state = getSlideshowState();
        _emit('slideshowChanged', state);
        return state;
    }

    function prevSlide() {
        if (!_slideshowOpen || _slideshowItems.length <= 1) return null;
        _slideshowIndex = (_slideshowIndex - 1 + _slideshowItems.length) % _slideshowItems.length;
        const state = getSlideshowState();
        _emit('slideshowChanged', state);
        return state;
    }

    function getSlideshowState() {
        return {
            isOpen: _slideshowOpen,
            items: _slideshowItems.slice(),
            currentIndex: _slideshowIndex,
            currentUrl: _slideshowItems[_slideshowIndex] || null,
            total: _slideshowItems.length,
            type
        };
    }

    return {
        type,
        configure,
        getApiBase: () => _apiBase,
        getStoreId: () => _storeId,
        getJfrKey: () => _jfrKey,
        getUploadCategory: () => _uploadCategory,
        on: _on,
        off: _off,
        fetchData,
        deleteItem,
        testConnection,
        getItems: () => _items.slice(),
        addFiles,
        clearSelectedFiles,
        getSelectedFiles,
        filterDuplicateFiles: BlobUtils.filterDuplicateFiles,
        uploadFiles,
        uploadSelectedFiles,
        openSlideshow,
        closeSlideshow,
        nextSlide,
        prevSlide,
        getSlideshowState,
        formatFileSize: BlobUtils.formatFileSize,
        getFileNameFromPath: BlobUtils.getFileNameFromPath,
        isFileNameDuplicate: (fileName) => BlobUtils.isFileNameDuplicate(fileName, _items)
    };
}

function createMediaApp(mediaDB, type) {
    'use strict';

    const isVideo = type === 'video';
    const label = isVideo ? 'video' : 'image';

    let explorer = null;

    let galleryGrid, summaryTotal, summaryLast, pageTitle, contentDesc;
    let fileInput, dropZone, previewGrid, uploadBtn, clearBtn, progressBar, progressText, uploadProgressDiv;
    let storeIdDisplay, apiEndpointDisplay, testResult;
    let clockDay, clockHours, clockMinutes, clockAmpm;
    let slideshowOverlay, slideshowImg, slideshowVideo, slideshowLoader, slideshowCounter;
    let modalOverlay, modalMessage, modalButtons;
    let dropdownRow, folderUpBtn;
    let categoryInput, saveCategoryBtn;
    let secretInput, setBtn;

    let modalHelpers;

    function getStorageKey() {
        return type === 'video' ? 'vid-blob-db-key' : 'img-blob-db-key';
    }

    function showUnlockModal(show) {
        const unlockModal = document.getElementById('unlock-modal');
        const unlockPassword = document.getElementById('unlock-password');
        if (show) {
            unlockModal.classList.remove('hidden');
            unlockModal.classList.add('flex');
            setTimeout(() => unlockPassword.focus(), 100);
        } else {
            unlockModal.classList.add('hidden');
            unlockModal.classList.remove('flex');
        }
    }

    function attemptUnlock() {
        const unlockPassword = document.getElementById('unlock-password');
        const unlockBtn = document.getElementById('unlock-btn');
        const unlockError = document.getElementById('unlock-error');
        const unlockErrorMsg = document.getElementById('unlock-error-msg');
        const password = unlockPassword.value.trim();
        if (!password) {
            unlockErrorMsg.textContent = 'Please enter a password.';
            unlockError.classList.remove('hidden');
            return;
        }
        unlockBtn.disabled = true;
        unlockBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Unlocking…';
        unlockError.classList.add('hidden');
        const jfrKey = mediaDB.getJfrKey();
        KeyEncryptor.decrypt(jfrKey, password)
            .then(decrypted => {
                localStorage.setItem(getStorageKey(), decrypted);
                window.location.reload();
            })
            .catch(err => {
                modalHelpers.showAlert('❌ Unlock failed: ' + err.message);
                unlockErrorMsg.textContent = 'Invalid password. Please try again.';
                unlockError.classList.remove('hidden');
                unlockPassword.value = '';
                unlockPassword.focus();
                unlockBtn.disabled = false;
                unlockBtn.innerHTML = '<i class="fa-solid fa-key"></i> Unlock';
            });
    }

    function syncPathFromDropdowns() {
        if (!explorer) return;
        const selects = dropdownRow.querySelectorAll('select');
        const newPath = [];
        for (const select of selects) {
            const val = select.value;
            if (!val) break;
            newPath.push(val);
        }
        explorer.navigateToFolder(newPath);
        renderDropdowns();
        renderGalleryFromExplorer();
        updateFolderUpBtn();
    }

    function renderDropdowns() {
        if (!explorer) return;
        dropdownRow.innerHTML = '';
        const currentPath = explorer.getCurrentPath();
        for (let i = 0; i <= currentPath.length; i++) {
            const parentParts = currentPath.slice(0, i);
            const siblings = explorer.getChildFolders(parentParts);
            if (siblings.length === 0) break;
            const selectedValue = (i < currentPath.length) ? currentPath[i] : '';
            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-center overflow-hidden h-full';
            const select = document.createElement('select');
            select.className = 'bg-[#1a2e36] border border-cyan-400/30 rounded-md p-0.5 px-1 text-xs text-cyan-100 focus:outline-none focus:border-cyan-400/70 appearance-none cursor-pointer max-w-[56px] h-full max-h-full truncate';
            select.innerHTML = `<option value="">${i === 0 ? 'Select folder...' : 'Select...'}</option>`;
            siblings.forEach(folder => {
                const opt = document.createElement('option');
                opt.value = folder;
                opt.textContent = folder;
                if (folder === selectedValue) opt.selected = true;
                select.appendChild(opt);
            });
            select.addEventListener('change', syncPathFromDropdowns);
            wrapper.appendChild(select);
            dropdownRow.appendChild(wrapper);
        }
    }

    function updateFolderUpBtn() {
        if (!explorer) return;
        const path = explorer.getCurrentPath();
        folderUpBtn.disabled = path.length === 0;
        folderUpBtn.onclick = () => {
            if (path.length === 0) return;
            const parent = path.slice(0, -1);
            explorer.navigateToFolder(parent);
            renderDropdowns();
            renderGalleryFromExplorer();
            updateFolderUpBtn();
        };
    }

    function isVideoFile(blob) {
        if (!blob) return false;
        if (blob.type && blob.type.startsWith('video/')) return true;
        const ext = blob.pathname ? blob.pathname.split('.').pop().toLowerCase() : '';
        return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v', '3gp'].includes(ext);
    }

    function renderTopLevelFolderCards() {
        const allBlobs = explorer ? explorer.getAllFiles() : mediaDB.getItems();
        const foldersData = BlobUtils.getRandomBlobsFromFolders(allBlobs, 'uploads', 3);
        if (Object.keys(foldersData).length === 0) {
            galleryGrid.innerHTML = '<div class="col-span-full text-center text-white/40 text-[10px] mt-8">No folders available.</div>';
            updateSummaryForFolderView(0, 0);
            return;
        }
        const folderCount = Object.keys(foldersData).length;
        const totalImages = Object.values(foldersData).reduce((sum, data) => sum + data.total, 0);
        updateSummaryForFolderView(folderCount, totalImages);

        let html = '';
        for (const [name, data] of Object.entries(foldersData)) {
            html += renderFolderCard(name, data);
        }
        galleryGrid.innerHTML = html;
        galleryGrid.querySelectorAll('.folder').forEach(folderEl => {
            folderEl.addEventListener('click', () => {
                const folderName = folderEl.dataset.folder;
                if (!folderName) return;
                explorer.navigateToFolder(['uploads', folderName]);
                renderDropdowns();
                renderGalleryFromExplorer();
                updateFolderUpBtn();
            });
        });
    }

    function renderFolderCard(folderName, folderData) {
        const photos = (folderData.images || []).slice(0, 3);
        const posClasses = ['pos-1', 'pos-2', 'pos-3'];
        let photosHTML = photos.map((photo, index) => {
            const posClass = posClasses[index] || 'pos-1';
            return `<div class="pc-photo absolute w-full h-full p-[5%_5%_10%] rounded-[2%] overflow-hidden ${posClass}">
                        <div class="pc-img w-full h-full bg-cover bg-center bg-[#1a2e36] rounded-[1%]" style="background-image: url('${photo.url}');"></div>
                    </div>`;
        }).join('');
        const displayName = folderName.charAt(0).toUpperCase() + folderName.slice(1);
        return `<div class="folder relative w-[85%] aspect-square mx-auto rotate-[${(Math.random()*6-3).toFixed(2)}deg] transition-transform duration-300 hover:rotate-0 hover:-translate-y-1 hover:scale-[1.02] hover:z-30" data-folder="${folderName}">
                    <button type="button" class="folder-btn absolute w-full h-full left-0 top-0 bg-transparent border-0 p-0 m-0 font-inherit text-inherit cursor-pointer overflow-visible focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4] focus-visible:ring-offset-2">
                        <div class="folder-name absolute bottom-[5%] left-[5%] rotate-[-3deg] origin-bottom-left font-bold text-[1em] leading-none text-[#e5e7eb] tracking-normal whitespace-nowrap z-50 pointer-events-none bg-[#1a2e36]/90 rounded-md px-2 py-1 border border-cyan-400/20">${displayName}</div>
                        ${photosHTML}
                        <div class="absolute left-[-8px] top-[-8px] z-50 font-bold text-lg text-cyan-300 flex items-center justify-center"><i class="fa-solid fa-folder-open"></i></div>
                        <div class="absolute right-[-8px] top-[-8px] z-50 bg-[#2b2820] text-white font-bold tracking-wider py-0 px-[3px] rounded-full border-[1.5px] border-white count-badge pointer-events-none flex items-center justify-center"><span class="text-[0.6em]">${folderData.total}</span></div>
                    </button>
                </div>`;
    }

    function updateSummaryForFolderView(folderCount, totalImages) {
        const summaryContainer = document.getElementById('id-summary-container');
        if (!summaryContainer) return;
        summaryContainer.innerHTML = `
            <span><i class="fa-solid fa-folder-open text-cyan-300 mr-1"></i> Folder: <span id="summary-total-count" class="text-white font-semibold">${folderCount}</span></span>
            <span class="text-white/20">|</span>
            <span><i class="fa-regular fa-image text-cyan-300 mr-1"></i> Total Images: <span id="summary-last-upload" class="text-white font-semibold">${totalImages}</span></span>
        `;
        summaryTotal = document.getElementById('summary-total-count');
        summaryLast = document.getElementById('summary-last-upload');
    }

    function resetSummaryToNormal() {
        const summaryContainer = document.getElementById('id-summary-container');
        if (!summaryContainer) return;
        summaryContainer.innerHTML = `
            <span><i class="fa-solid fa-video text-cyan-300 mr-1"></i> Total: <span id="summary-total-count" class="text-white font-semibold">0</span></span>
            <span class="text-white/20">|</span>
            <span><i class="fa-regular fa-clock text-cyan-300 mr-1"></i> Last upload: <span id="summary-last-upload" class="text-white font-semibold">—</span></span>
        `;
        summaryTotal = document.getElementById('summary-total-count');
        summaryLast = document.getElementById('summary-last-upload');
    }

    function renderGalleryFromExplorer() {
        if (!explorer) return;
        if (explorer.getCurrentPathString() === 'uploads') {
            renderTopLevelFolderCards();
            return;
        }
        resetSummaryToNormal();
        const allFiles = explorer.getFilesInCurrentFolder();
        const files = allFiles.filter(file => !isVideoFile(file));
        summaryTotal.textContent = files.length;

        if (files.length > 0) {
            const last = files.reduce((a, b) => {
                const aDate = a.lastModified ?? a.uploadedAt;
                const bDate = b.lastModified ?? b.uploadedAt;
                return aDate > bDate ? a : b;
            });
            const displayDate = last.lastModified ?? last.uploadedAt;
            summaryLast.textContent = displayDate ? BlobUtils.formatFullDate(displayDate) : '—';
        } else {
            summaryLast.textContent = '—';
        }

        if (files.length === 0) {
            galleryGrid.innerHTML = '<div class="col-span-full text-center text-white/40 text-[10px] mt-8">No images in this folder.</div>';
            return;
        }

        galleryGrid.innerHTML = files.map((img, idx) => {
            const sizeText = FolderExplorer.formatSize(img.size);
            const dateText = BlobUtils.formatToMonthYear(img.lastModified || img.uploadedAt);
            const fileName = img.pathname.split('/').pop();
            return `<div class="image-card relative bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-transform duration-150 hover:scale-[1.02] cursor-pointer w-full flex items-center justify-center" data-index="${idx}">
                        <div class="aspect-square relative flex items-center justify-center bg-white/10 animate-pulse w-[90%]">
                            <img src="${img.url}" alt="${fileName}" class="max-w-full h-full object-cover opacity-0 transition-opacity duration-500" loading="lazy"
                                onload="this.style.opacity='1'; this.parentElement.classList.remove('bg-white/10','animate-pulse');"
                                onerror="this.style.display='none'; this.parentElement.classList.remove('bg-white/10','animate-pulse'); this.parentElement.innerHTML+='<div class=&quot;absolute inset-0 flex items-center justify-center text-white/30&quot;><i class=&quot;fa-solid fa-image&quot;></i></div>';" />
                            <button class="delete-btn absolute top-1 right-1 bg-black/50 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] transition-colors z-10" data-path="${img.pathname}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                        <div class="absolute bottom-0 left-0 w-full p-[2px] flex justify-between bg-gradient-to-t from-black/70 to-transparent rounded-b-lg flex-nowrap overflow-hidden max-w-full min-w-0 items-center">
                            <div class="flex-1 truncate text-[7px] text-white/80" title="${img.pathname}">${fileName}</div>
                            <div class="text-[7px] text-cyan-300 text-right">${sizeText}</div>
                        </div>
                        <span class="absolute top-[0px] left-[0px] p-[2px] text-[7px] text-white bg-gradient-to-t from-black/70 to-transparent rounded-b-lg truncate">${dateText}</span>
                    </div>`;
        }).join('');

        attachImageCardHandlers(files);
    }

    function attachImageCardHandlers(files) {
        galleryGrid.querySelectorAll('.image-card').forEach(card => {
            card.addEventListener('click', e => {
                if (e.target.closest('.delete-btn')) return;
                const index = parseInt(card.dataset.index, 10);
                if (!isNaN(index)) {
                    const urls = files.map(f => f.url);
                    mediaDB.openSlideshow(index, urls);
                }
            });
        });
        galleryGrid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const path = btn.dataset.path;
                modalHelpers.showConfirm(`Delete "${path.split('/').pop()}"?`, async () => {
                    await mediaDB.deleteItem(path);
                    mediaDB.fetchData();
                });
            });
        });
    }

    function renderVideoGallery() {
        const files = mediaDB.getItems().filter(blob => {
            const path = blob.pathname || '';
            return path.startsWith('uploads/videos/') && !path.includes('/thumbnails/');
        });
        summaryTotal.textContent = files.length;

        if (files.length > 0) {
            const last = files.reduce((a, b) => {
                const aDate = a.lastModified ?? a.uploadedAt;
                const bDate = b.lastModified ?? b.uploadedAt;
                return aDate > bDate ? a : b;
            });
            const displayDate = last.lastModified ?? last.uploadedAt;
            summaryLast.textContent = displayDate ? BlobUtils.formatFullDate(displayDate) : '—';
        } else {
            summaryLast.textContent = '—';
        }

        if (files.length === 0) {
            galleryGrid.innerHTML = '<div class="col-span-full text-center text-white/40 text-[10px] mt-8">No videos found.</div>';
            return;
        }

        const allBlobs = mediaDB.getItems();
        galleryGrid.innerHTML = files.map((vid, idx) => {
            const sizeText = BlobUtils.formatFileSize(vid.size);
            const dateText = BlobUtils.formatToMonthYear(vid.lastModified || vid.uploadedAt);
            const fileName = vid.pathname ? vid.pathname.split('/').pop() : 'unknown';
            const baseName = fileName.replace(/\.[^.]+$/, '');
            const thumbPath = 'uploads/videos/thumbnails/' + baseName + '.jpg';
            const thumbBlob = allBlobs.find(b => b.pathname === thumbPath);
            const thumbnailUrl = thumbBlob ? thumbBlob.url : null;
            return `<div class="video-card relative bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-transform duration-150 hover:scale-[1.02] cursor-pointer w-full flex items-center justify-center" data-index="${idx}">
                        <div class="aspect-square relative flex items-center justify-center bg-black/50 w-[90%]">
                            <video src="${vid.url}" class="max-w-full h-full object-cover opacity-0 transition-opacity duration-500" muted preload="metadata" poster="${thumbnailUrl || ''}"
                                onloadedmetadata="this.style.opacity='1'; this.parentElement.classList.remove('bg-black/50');"
                                onerror="this.style.display='none'; this.parentElement.classList.remove('bg-black/50');"></video>
                            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div class="w-6 h-6 rounded-full bg-black/60 hover:bg-black/40 flex items-center justify-center transition-colors"><i class="fa-solid fa-play text-white text-sm ml-0.5"></i></div>
                            </div>
                            <button class="delete-btn absolute top-[1px] right-[1px] bg-black/50 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[8px] transition-colors z-10" data-path="${vid.pathname}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                            ${vid.duration ? `<span class="absolute bottom-12 right-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded">${BlobUtils.formatDuration(vid.duration)}</span>` : ''}
                        </div>
                        <div class="absolute bottom-0 left-0 w-full p-[2px] flex justify-between bg-gradient-to-t from-black/70 to-transparent rounded-b-lg flex-nowrap overflow-hidden max-w-full min-w-0 items-center">
                            <div class="flex-1 truncate text-[7px] text-white/80" title="${vid.pathname || ''}">${fileName}</div>
                            <div class="text-[7px] text-cyan-300 text-right">${sizeText}</div>
                        </div>
                        <span class="absolute top-[0px] left-[0px] p-[2px] text-[7px] text-white bg-gradient-to-t from-black/70 to-transparent rounded-b-lg truncate">${dateText}</span>
                    </div>`;
        }).join('');

        galleryGrid.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', e => {
                if (e.target.closest('.delete-btn')) return;
                const index = parseInt(card.dataset.index, 10);
                if (!isNaN(index)) {
                    const urls = files.map(f => f.url);
                    mediaDB.openSlideshow(index, urls);
                }
            });
        });
        galleryGrid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const path = btn.dataset.path;
                modalHelpers.showConfirm(`Delete "${path ? path.split('/').pop() : 'video'}"?`, async () => {
                    if (path) {
                        const fileName = path.split('/').pop();
                        const baseName = fileName.replace(/\.[^.]+$/, '');
                        const thumbnailPath = 'uploads/videos/thumbnails/' + baseName + '.jpg';
                        try { await mediaDB.deleteItem(thumbnailPath); } catch (e) {}
                        await mediaDB.deleteItem(path);
                        mediaDB.fetchData();
                    }
                });
            });
        });
    }

    function initExplorer(images, storeId) {
        const valid = images.filter(img => img && typeof img.pathname === 'string' && img.pathname.length > 0);
        explorer = FolderExplorer.create({ blobs: valid, storeId: storeId || '' });
        explorer.navigateToFolder(['uploads']);
        renderDropdowns();
        renderGalleryFromExplorer();
        updateFolderUpBtn();
    }

    function compressIfLarge(file) {
        if (file.size <= 4.5 * 1024 * 1024) return Promise.resolve(file);
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxW = 1920;
                let w = img.width, h = img.height;
                if (w > maxW) { h = (maxW / w) * h; w = maxW; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob(blob => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: file.lastModified }));
                }, 'image/jpeg', 0.85);
            };
            img.onerror = () => resolve(file);
            img.src = URL.createObjectURL(file);
        });
    }

    function clearSelectionUI() {
        mediaDB.clearSelectedFiles();
        renderPreviews([]);
        fileInput.value = '';
        uploadProgressDiv.classList.add('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    }

    function renderPreviews(files) {
        previewGrid.innerHTML = '';
        files.forEach((file, idx) => {
            const url = URL.createObjectURL(file);
            const div = document.createElement('div');
            div.className = 'relative aspect-square rounded overflow-hidden border border-white/20';
            div.dataset.index = idx;
            div.dataset.uploaded = 'false';

            if (isVideo) {
                const container = document.createElement('div');
                container.className = 'w-full h-full relative';
                container.style.background = '#1a2e36';

                const video = document.createElement('video');
                video.src = url;
                video.muted = true;
                video.preload = 'metadata';
                video.className = 'w-full h-full object-cover';
                video.style.opacity = '0';
                container.appendChild(video);

                const canvas = document.createElement('canvas');
                canvas.className = 'w-full h-full object-cover';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                container.appendChild(canvas);

                const overlay = document.createElement('div');
                overlay.className = 'absolute inset-0 flex items-center justify-center pointer-events-none';
                overlay.innerHTML = `<div class="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"><i class="fa-solid fa-play text-white/80 text-xs"></i></div>`;
                container.appendChild(overlay);

                div.appendChild(container);

                const nameDiv = document.createElement('div');
                nameDiv.className = 'absolute bottom-0 left-0 right-0 bg-black/60 text-[6px] text-white truncate px-1';
                nameDiv.textContent = file.name;
                div.appendChild(nameDiv);

                const statusBtn = document.createElement('span');
                statusBtn.className = 'absolute top-0 right-0 bg-red-500/80 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full cursor-pointer remove-file transition-all duration-300 hover:scale-110';
                statusBtn.textContent = '×';
                statusBtn.dataset.index = idx;
                statusBtn.title = 'Remove from queue';
                div.appendChild(statusBtn);

                previewGrid.appendChild(div);

                const vid = video;
                const canv = canvas;

                vid.addEventListener('loadedmetadata', function() {
                    const seekTime = Math.min(1, this.duration * 0.1);
                    this.currentTime = seekTime;
                });

                vid.addEventListener('seeked', function() {
                    try {
                        const vw = this.videoWidth || 320;
                        const vh = this.videoHeight || 180;
                        canv.width = vw;
                        canv.height = vh;
                        const ctx = canv.getContext('2d');
                        ctx.drawImage(this, 0, 0, vw, vh);
                        canv.style.display = 'none';
                        this.style.opacity = '1';
                    } catch (e) {
                        canv.style.display = 'none';
                        this.style.opacity = '1';
                    }
                });

                vid.addEventListener('error', function() {
                    canv.style.display = 'none';
                    this.style.opacity = '1';
                });

                if (vid.readyState >= 2) {
                    vid.dispatchEvent(new Event('loadedmetadata'));
                }
            } else {
                const img = document.createElement('img');
                img.src = url;
                img.className = 'w-full h-full object-cover';
                div.appendChild(img);

                const nameDiv = document.createElement('div');
                nameDiv.className = 'absolute bottom-0 left-0 right-0 bg-black/60 text-[6px] text-white truncate px-1';
                nameDiv.textContent = file.name;
                div.appendChild(nameDiv);

                const removeBtn = document.createElement('span');
                removeBtn.className = 'absolute top-0 right-0 bg-red-500/80 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full cursor-pointer remove-file';
                removeBtn.textContent = '×';
                removeBtn.dataset.index = idx;
                div.appendChild(removeBtn);

                previewGrid.appendChild(div);
            }
        });

        previewGrid.querySelectorAll('.remove-file').forEach(el => {
            el.addEventListener('click', e => {
                e.stopPropagation();
                const idx = parseInt(el.dataset.index, 10);
                const filesArr = mediaDB.getSelectedFiles();
                filesArr.splice(idx, 1);
                mediaDB.clearSelectedFiles();
                if (filesArr.length) mediaDB.addFiles(filesArr);
                else renderPreviews([]);
            });
        });

        uploadBtn.disabled = files.length === 0;
    }

    function loadSlideshowImage(url, index, total) {
        slideshowImg.classList.remove('loaded');
        slideshowLoader.style.display = 'block';
        slideshowImg.style.opacity = '0';
        slideshowCounter.textContent = (index + 1) + ' / ' + total;
        const img = new Image();
        img.onload = () => { slideshowImg.src = url; slideshowLoader.style.display = 'none'; slideshowImg.style.opacity = '1'; };
        img.onerror = () => { slideshowLoader.style.display = 'none'; slideshowImg.style.opacity = '1'; slideshowImg.alt = 'Failed to load'; };
        img.src = url;
        if (img.complete) { slideshowImg.src = url; slideshowLoader.style.display = 'none'; slideshowImg.style.opacity = '1'; }
    }

    function loadSlideshowVideo(url, index, total) {
        slideshowVideo.pause();
        slideshowVideo.currentTime = 0;
        slideshowVideo.removeAttribute('poster');
        slideshowVideo.style.opacity = '0';
        slideshowVideo.classList.remove('loaded');
        if (slideshowLoader) slideshowLoader.style.display = 'block';
        if (slideshowCounter) slideshowCounter.textContent = (index + 1) + ' / ' + total;
        const playPauseBtn = document.getElementById('slideshow-play-pause');
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        const thumbnailUrl = url.replace('/videos/', '/videos/thumbnails/').replace(/\.[^.]+$/, '.jpg');
        slideshowVideo.poster = thumbnailUrl;
        slideshowVideo.src = url;
        slideshowVideo.load();
        slideshowVideo.onloadedmetadata = () => { if (slideshowLoader) slideshowLoader.style.display = 'none'; slideshowVideo.style.opacity = '1'; };
        slideshowVideo.oncanplay = () => { if (slideshowLoader) slideshowLoader.style.display = 'none'; slideshowVideo.style.opacity = '1'; };
        slideshowVideo.onerror = e => { console.error('Video error:', e); if (slideshowLoader) slideshowLoader.style.display = 'none'; slideshowVideo.style.opacity = '1'; };
        if (slideshowVideo.readyState >= 2) { if (slideshowLoader) slideshowLoader.style.display = 'none'; slideshowVideo.style.opacity = '1'; }
    }

    function setActiveTab(tabBtn) {
        const common = 'flex-1 text-center py-0.5 text-[9px] transition-colors';
        const active = 'text-white border-b-[1.5px] border-cyan-400 font-medium';
        const inactive = 'text-white/60 border-b-[1.5px] border-transparent hover:text-white hover:border-cyan-400/50';
        document.querySelectorAll('#tab-bar .tab-btn').forEach(btn => {
            const icon = btn.querySelector('i');
            if (btn === tabBtn) {
                btn.className = `tab-btn ${common} ${active}`;
                if (icon) icon.classList.add('text-cyan-300');
            } else {
                btn.className = `tab-btn ${common} ${inactive}`;
                if (icon) icon.classList.remove('text-cyan-300');
            }
        });
        document.querySelectorAll('#tab-container > div > [id^="tab-pane-"]').forEach(p => p.classList.add('hidden'));
        const paneId = 'tab-pane-' + tabBtn.id.replace('tab-', '');
        const pane = document.getElementById(paneId);
        if (pane) pane.classList.remove('hidden');
        if (tabBtn.dataset.title) contentDesc.textContent = tabBtn.dataset.title;
    }

    function setActiveNav(navBtn) {
        document.querySelectorAll('#app-sidebar .nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn === navBtn);
        });
    }

    function init() {
        const storedKey = localStorage.getItem(getStorageKey());
        const unlockModal = document.getElementById('unlock-modal');
        const unlockPassword = document.getElementById('unlock-password');
        const unlockBtn = document.getElementById('unlock-btn');
        const unlockError = document.getElementById('unlock-error');
        const unlockErrorMsg = document.getElementById('unlock-error-msg');

        galleryGrid = document.getElementById('gallery-grid');
        summaryTotal = document.getElementById('summary-total-count');
        summaryLast = document.getElementById('summary-last-upload');
        pageTitle = document.getElementById('page-title');
        contentDesc = document.getElementById('content-desc');
        fileInput = document.getElementById('file-input');
        dropZone = document.getElementById('drop-zone');
        previewGrid = document.getElementById('file-preview-grid');
        uploadBtn = document.getElementById('upload-btn');
        clearBtn = document.getElementById('clear-btn');
        progressBar = document.getElementById('progress-bar');
        progressText = document.getElementById('progress-text');
        uploadProgressDiv = document.getElementById('upload-progress');
        storeIdDisplay = document.getElementById('store-id-display');
        apiEndpointDisplay = document.getElementById('api-endpoint-display');
        testResult = document.getElementById('test-result');
        clockDay = document.getElementById('clock-day');
        clockHours = document.getElementById('clock-hours');
        clockMinutes = document.getElementById('clock-minutes');
        clockAmpm = document.getElementById('clock-ampm');
        slideshowOverlay = document.getElementById('slideshow-overlay');
        slideshowImg = document.getElementById('slideshow-image');
        slideshowVideo = document.getElementById('slideshow-video');
        slideshowLoader = document.querySelector('.slideshow-loader');
        slideshowCounter = document.getElementById('slideshow-counter');
        modalOverlay = document.getElementById('custom-modal-overlay');
        modalMessage = document.getElementById('modal-message');
        modalButtons = document.getElementById('modal-buttons');
        dropdownRow = document.getElementById('dropdown-row');
        folderUpBtn = document.getElementById('folder-up-btn');
        categoryInput = document.getElementById('upload-category-input');
        saveCategoryBtn = document.getElementById('save-category-btn');
        secretInput = document.getElementById('api-secretkey-input');
        setBtn = document.getElementById('set-secretkey-btn');

        modalHelpers = BlobUtils.createModalHelpers(modalOverlay, modalMessage, modalButtons);

        if (!storedKey) {
            showUnlockModal(true);
            unlockBtn.addEventListener('click', attemptUnlock);
            unlockPassword.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); attemptUnlock(); } });
            return;
        }

        mediaDB.configure({ apiSecretKey: storedKey });

        if (secretInput && storedKey) secretInput.value = storedKey;

        if (setBtn) {
            setBtn.addEventListener('click', () => {
                const newKey = secretInput.value.trim();
                if (!newKey) { modalHelpers.showAlert('Please enter a valid secret key.'); return; }
                localStorage.setItem(getStorageKey(), newKey);
                mediaDB.configure({ apiSecretKey: newKey });
                modalHelpers.showAlert('Secret key saved successfully!');
            });
        }

        BlobUtils.updateClock(clockDay, clockHours, clockMinutes, clockAmpm);
        setInterval(() => BlobUtils.updateClock(clockDay, clockHours, clockMinutes, clockAmpm), 1000);

        mediaDB.on(`${type}sLoaded`, data => {
            const items = data[type + 's'] || [];
            storeIdDisplay.textContent = data.storeId || '—';
            apiEndpointDisplay.textContent = mediaDB.getApiBase();
            if (!isVideo) {
                initExplorer(items, data.storeId);
            } else {
                renderVideoGallery();
            }
        });

        mediaDB.on(`${type}sFetchError`, data => {
            galleryGrid.innerHTML = `<div class="col-span-full text-center text-red-400 text-[10px] mt-8"><i class="fa-solid fa-triangle-exclamation mr-1"></i> ${data.message}</div>`;
        });

        mediaDB.on(`${type}sLoading`, () => {
            galleryGrid.innerHTML = `<div class="col-span-full text-center text-white/50 text-[10px] mt-8"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Loading…</div>`;
        });

        mediaDB.on('uploadStarted', () => {
            uploadProgressDiv.classList.remove('hidden');
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
            uploadBtn.disabled = true;
            clearBtn.disabled = true;
        });

        mediaDB.on('uploadProgress', p => {
            const pct = Number(p.overallPercent || 0).toFixed(0);
            progressBar.style.width = pct + '%';
            progressText.textContent = pct + '%';
        });

        mediaDB.on('uploadComplete', result => {
            uploadProgressDiv.classList.add('hidden');
            uploadBtn.disabled = false;
            clearBtn.disabled = false;
            if (result.failed.length === 0) {
                modalHelpers.showAlert(`✅ Successfully uploaded ${result.success} ${type}(s)!`);
            } else {
                const msg = `Uploaded ${result.success} of ${result.total}. Errors:\n${result.failed.map(f => f.name + ': ' + f.error).join('\n')}`;
                modalHelpers.showAlert(msg);
            }
            clearSelectionUI();
            mediaDB.fetchData();
        });

        mediaDB.on('slideshowOpened', state => {
            if (!state) return;
            slideshowOverlay.classList.remove('hidden', 'opacity-0');
            slideshowOverlay.classList.add('flex', 'opacity-100');
            document.body.style.overflow = 'hidden';
            if (isVideo) loadSlideshowVideo(state.currentUrl, state.currentIndex, state.total);
            else loadSlideshowImage(state.currentUrl, state.currentIndex, state.total);
        });
        mediaDB.on('slideshowClosed', () => {
            slideshowOverlay.classList.add('hidden', 'opacity-0');
            slideshowOverlay.classList.remove('flex', 'opacity-100');
            document.body.style.overflow = '';
        });
        mediaDB.on('slideshowChanged', state => {
            if (!state) return;
            if (isVideo) loadSlideshowVideo(state.currentUrl, state.currentIndex, state.total);
            else loadSlideshowImage(state.currentUrl, state.currentIndex, state.total);
        });

        fileInput.addEventListener('change', function() { if (this.files.length) mediaDB.addFiles(this.files); this.value = ''; });
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-cyan-400', 'bg-cyan-400/10'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-cyan-400', 'bg-cyan-400/10'));
        dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('border-cyan-400', 'bg-cyan-400/10'); if (e.dataTransfer.files.length) mediaDB.addFiles(e.dataTransfer.files); });
        dropZone.addEventListener('click', () => fileInput.click());

        uploadBtn.addEventListener('click', async () => {
            const files = mediaDB.getSelectedFiles();
            if (!files.length) return;
            if (!isVideo) {
                const processed = await Promise.all(files.map(compressIfLarge));
                const baseCategory = mediaDB.getUploadCategory();
                const categories = processed.map(file => {
                    const d = new Date(file.lastModified);
                    return `${baseCategory}/${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
                });
                mediaDB.uploadFiles(processed, null, categories);
            } else {
                uploadBtn.disabled = true;
                uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
                const baseCategory = mediaDB.getUploadCategory();
                const categories = files.map(file => {
                    const d = new Date(file.lastModified);
                    return `${baseCategory}/${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
                });
                try {
                    await mediaDB.uploadFiles(files, null, categories);
                } catch (error) {
                    modalHelpers.showAlert('❌ Upload failed: ' + error.message);
                } finally {
                    uploadBtn.disabled = false;
                    uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload All';
                }
            }
        });

        clearBtn.addEventListener('click', clearSelectionUI);
        mediaDB.on('selectionChanged', data => renderPreviews(data.selectedFiles));
        mediaDB.on('selectionCleared', () => renderPreviews([]));

        categoryInput.value = mediaDB.getUploadCategory();
        mediaDB.on('configured', config => { if (config.uploadCategory) categoryInput.value = config.uploadCategory; });
        saveCategoryBtn.addEventListener('click', () => {
            const newCategory = categoryInput.value.trim();
            if (!newCategory) return modalHelpers.showAlert('Category name cannot be empty.');
            mediaDB.configure({ uploadCategory: newCategory });
            modalHelpers.showAlert(`Upload category updated to "${newCategory}".`);
        });

        document.getElementById('test-connection-btn').addEventListener('click', () => {
            testResult.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Testing…';
            mediaDB.testConnection().then(result => {
                if (result.connected) {
                    storeIdDisplay.textContent = result.storeId || '—';
                    apiEndpointDisplay.textContent = mediaDB.getApiBase();
                    testResult.innerHTML = '<i class="fa-solid fa-check-circle text-green-400 mr-1"></i> Connected';
                    testResult.className = 'text-[9px] text-green-400 self-center';
                } else {
                    testResult.innerHTML = '<i class="fa-solid fa-circle-xmark text-red-400 mr-1"></i> ' + result.message;
                    testResult.className = 'text-[9px] text-red-400 self-center';
                }
            });
        });

        document.querySelectorAll('#tab-bar .tab-btn').forEach(btn => btn.addEventListener('click', () => setActiveTab(btn)));
        document.querySelectorAll('#app-sidebar .nav-btn').forEach(btn => btn.addEventListener('click', () => {
            setActiveNav(btn);
            const tabId = btn.id.replace('nav-', 'tab-');
            const tabBtn = document.getElementById(tabId);
            if (tabBtn) setActiveTab(tabBtn);
        }));

        document.getElementById('refresh-btn').addEventListener('click', () => {
            BlobUtils.clearCache(`${type}DB_cache_v1`);
            mediaDB.fetchData();
        });

        document.querySelector('.close-btn').addEventListener('click', () => mediaDB.closeSlideshow());
        document.getElementById('slideshow-prev').addEventListener('click', () => mediaDB.prevSlide());
        document.getElementById('slideshow-next').addEventListener('click', () => mediaDB.nextSlide());

        document.addEventListener('keydown', e => {
            if (!mediaDB.getSlideshowState().isOpen) return;
            if (e.key === 'Escape') mediaDB.closeSlideshow();
            if (e.key === 'ArrowLeft') mediaDB.prevSlide();
            if (e.key === 'ArrowRight') mediaDB.nextSlide();
            if (isVideo && (e.key === ' ' || e.key === 'Spacebar')) {
                e.preventDefault();
                const video = document.getElementById('slideshow-video');
                const playBtn = document.getElementById('slideshow-play-pause');
                if (!video) return;
                if (video.paused) {
                    video.play().then(() => playBtn && (playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'));
                } else {
                    video.pause();
                    playBtn && (playBtn.innerHTML = '<i class="fa-solid fa-play"></i>');
                }
            }
        });

        slideshowOverlay.addEventListener('click', e => { if (e.target === slideshowOverlay) mediaDB.closeSlideshow(); });
        let touchStartX = 0;
        slideshowOverlay.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
        slideshowOverlay.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) diff > 0 ? mediaDB.nextSlide() : mediaDB.prevSlide();
        });

        apiEndpointDisplay.textContent = mediaDB.getApiBase();
        mediaDB.fetchData();
    }

    return {
        init,
        showAlert: (msg, cb) => modalHelpers.showAlert(msg, cb),
        showConfirm: (msg, onConfirm, onCancel) => modalHelpers.showConfirm(msg, onConfirm, onCancel)
    };
}

var ImageDB = createMediaDB('image');
var VideoDB = createMediaDB('video');
var ImageDBApp = createMediaApp(ImageDB, 'image');
var VideoDBApp = createMediaApp(VideoDB, 'video');

var ImageBlob = {
    ImageDB,
    FolderExplorer,
    ImageDBApp
};

var VideoBlob = {
    VideoDB,
    VideoDBApp
};

window.KeyEncryptor = KeyEncryptor;
window.BlobUtils = BlobUtils;
window.FolderExplorer = FolderExplorer;
window.ImageBlob = ImageBlob;
window.VideoBlob = VideoBlob;
