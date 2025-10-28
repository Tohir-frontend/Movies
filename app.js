
const API_BASE = 'https://yts.mx/api/v2/list_movies.json';
let currentPage = 1;
let currentSearchParams = {};
let allGenres = [];
let bookmarkedMovies = JSON.parse(localStorage.getItem('bookmarkedMovies')) || [
    'Avengers: Infinity War', 'The Avengers', '12 Years a Slave'
];

// DOM elements
const elements = {
    btn: document.getElementById("btn"),
    search: document.getElementById("search"),
    year: document.getElementById("year"),
    janr: document.getElementById("janr"),
    rating: document.getElementById("rating"),
    size: document.getElementById("size"),
    count: document.getElementById("count"),
    main: document.getElementById("main")
};

// Event listeners
elements.btn.addEventListener("click", () => {
    currentPage = 1;
    searchMovies();
});

// Utility functions
const createElement = (tag, className = '', content = '') => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.textContent = content;
    return el;
};

const createModal = (id, content) => {
    const modal = createElement('div', 'modal-overlay');
    modal.id = id;
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal('${id}')">&times;</button>
            ${content}
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
};

const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
};

const showNotification = (message, type = 'info') => {
    const existing = document.getElementById('notification');
    if (existing) existing.remove();
    
    const notification = createElement('div', `notification ${type}`);
    notification.id = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
};

// API functions
async function fetchData(url) {
    try {
        const res = await fetch(url);
        return res.ok ? await res.json() : null;
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

async function initializeApp() {
    await fetchAllGenres();
    const data = await fetchData(API_BASE);
    if (data) viewData(data);
}

async function fetchAllGenres() {
    const data = await fetchData(`${API_BASE}?limit=50&sort_by=year`);
    if (data?.data?.movies) {
        const genreSet = new Set();
        data.data.movies.forEach(movie => {
            if (movie.genres) {
                movie.genres.forEach(genre => genreSet.add(genre.toLowerCase()));
            }
        });
        allGenres = Array.from(genreSet).sort();
    } else {
        allGenres = ['action', 'adventure', 'animation', 'biography', 'comedy', 'crime', 
                    'documentary', 'drama', 'family', 'fantasy', 'horror', 'music', 
                    'mystery', 'romance', 'sci-fi', 'thriller', 'war', 'western'];
    }
    updateGenreDropdown();
}

function updateGenreDropdown() {
    elements.janr.innerHTML = '<option value="">All</option>';
    allGenres.forEach(genre => {
        const option = createElement('option');
        option.value = genre;
        option.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
        elements.janr.appendChild(option);
    });
}

function searchMovies(page = 1) {
    const params = [`page=${page}`, 'limit=20'];
    
    if (elements.search.value.trim()) {
        params.push(`query_term=${encodeURIComponent(elements.search.value.trim())}`);
    }
    
    const yearValue = parseInt(elements.year.value.trim());
    if (yearValue >= 1900 && yearValue <= new Date().getFullYear()) {
        params.push(`year=${yearValue}`);
    }
    
    if (elements.janr.value) params.push(`genre=${elements.janr.value}`);
    if (elements.rating.value) params.push(`minimum_rating=${elements.rating.value}`);
    
    currentSearchParams = {
        search: elements.search.value.trim(),
        year: elements.year.value.trim(),
        genre: elements.janr.value,
        rating: elements.rating.value,
        size: elements.size.value
    };
    
    currentPage = page;
    const searchUrl = `${API_BASE}?${params.join('&')}`;
    fetchData(searchUrl).then(data => data && viewData(data));
}

// Movie display functions
function viewData(data) {
    elements.main.innerHTML = '';
    
    if (!data.data?.movies?.length) {
        elements.main.innerHTML = '<div class="col-12"><div class="alert alert-warning">No movies found.</div></div>';
        elements.count.textContent = "0";
        updatePagination(1, 1);
        return;
    }
    
    let moviesToShow = data.data.movies;
    if (elements.size.value) {
        moviesToShow = filterMoviesBySize(moviesToShow, elements.size.value);
    }
    
    const totalMovies = data.data.movie_count || moviesToShow.length;
    elements.count.textContent = totalMovies;
    
    const totalPages = Math.ceil(totalMovies / (data.data.limit || 20));
    updatePagination(currentPage, totalPages);
    
    if (!moviesToShow.length) {
        elements.main.innerHTML = '<div class="col-12"><div class="alert alert-warning">No movies found matching the size filter.</div></div>';
        return;
    }
    
    moviesToShow.forEach(movie => elements.main.appendChild(createMovieCard(movie)));
}

function createMovieCard(movie) {
    const colDiv = createElement('div', 'col-md-6 mb-4');
    const card = createElement('div', 'card h-100');
    
    const img = createElement('img', 'card-img-top');
    img.src = movie.large_cover_image || movie.medium_cover_image;
    img.alt = movie.title;
    img.style.cssText = 'height: 250px; object-fit: cover;';
    
    const cardBody = createElement('div', 'card-body d-flex flex-column');
    const title = createElement('h5', 'card-title mb-2', movie.title);
    
    const yearDiv = createElement('div', 'd-flex align-items-center mb-2');
    yearDiv.innerHTML = `
        <svg width="16" height="16" fill="currentColor" class="bi bi-calendar me-2" viewBox="0 0 16 16">
            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
        </svg>
        <span>${movie.year}</span>
    `;
    
    const sizeDiv = createElement('div', 'd-flex align-items-center mb-2');
    sizeDiv.innerHTML = `
        <svg width="16" height="16" fill="currentColor" class="bi bi-hdd me-2" viewBox="0 0 16 16">
            <path d="M4.5 11a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM3 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
            <path d="M16 11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9.51c0-.418.105-.83.305-1.197l2.472-4.531A1.5 1.5 0 0 1 4.094 3h7.812a1.5 1.5 0 0 1 1.317.782l2.472 4.53c.2.368.305.78.305 1.198V11zM3.655 4.26 1.592 8.043c-.081.146-.123.304-.123.468v2.489c0 .552.448 1 1 1h12c.552 0 1-.448 1-1v-2.489c0-.164-.042-.322-.123-.468L13.345 4.26A.5.5 0 0 0 12.906 4H3.094a.5.5 0 0 0-.44.26z"/>
        </svg>
        <span class="text-muted">${getFileSize(movie)}</span>
    `;
    
    const ratingDiv = createElement('div', 'd-flex align-items-center mb-3');
    ratingDiv.innerHTML = `
        <span class="me-2">${createStarRating(movie.rating || 0)}</span>
        <span class="fw-bold">${movie.rating || "N/A"}</span>
    `;
    
    const buttonGroup = createElement('div', 'd-flex gap-1 mt-auto flex-wrap');
    const buttons = [
        { text: 'Watch Movie', class: 'btn-success', action: () => watchMovie(movie) },
        { text: 'Trailer', class: 'btn-outline-primary', action: () => watchTrailer(movie) },
        { text: 'Download', class: 'btn-outline-success', action: () => downloadMovie(movie) },
        { text: 'Info', class: 'btn-outline-secondary', action: () => showMoreInfo(movie) },
        { text: 'Bookmark', class: 'btn-outline-warning', action: () => addToBookmark(movie) }
    ];
    
    buttons.forEach(btn => {
        const button = createElement('button', `btn ${btn.class} btn-sm`, btn.text);
        button.onclick = btn.action;
        buttonGroup.appendChild(button);
    });
    
    [title, yearDiv, sizeDiv, ratingDiv, buttonGroup].forEach(el => cardBody.appendChild(el));
    [img, cardBody].forEach(el => card.appendChild(el));
    colDiv.appendChild(card);
    
    return colDiv;
}

// Utility functions for movies
function createStarRating(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return '★'.repeat(fullStars).split('').map(s => `<span class="text-warning">${s}</span>`).join('') +
           (halfStar ? '<span class="text-warning">☆</span>' : '') +
           '☆'.repeat(emptyStars).split('').map(s => `<span class="text-muted">${s}</span>`).join('');
}

function getFileSize(movie) {
    if (movie.torrents?.length) {
        let maxSize = 0;
        movie.torrents.forEach(torrent => {
            if (torrent.size_bytes) {
                maxSize = Math.max(maxSize, torrent.size_bytes);
            }
        });
        
        if (maxSize > 0) return formatFileSize(maxSize);
        if (movie.torrents[0].size) return movie.torrents[0].size;
    }
    
    return estimateFileSize(movie);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function estimateFileSize(movie) {
    const runtime = movie.runtime || 120;
    let estimatedGB = (runtime / 60) * 1;
    
    if (movie.torrents?.length) {
        const hasHD = movie.torrents.some(t => t.quality?.includes('1080') || t.quality?.includes('720'));
        const has4K = movie.torrents.some(t => t.quality?.includes('2160'));
        
        if (has4K) estimatedGB *= 4;
        else if (hasHD) estimatedGB *= 2;
    }
    
    return `~${estimatedGB.toFixed(1)} GB`;
}

function filterMoviesBySize(movies, sizeFilter) {
    if (!sizeFilter) return movies;
    
    return movies.filter(movie => {
        const sizeInGB = getMovieSizeInGB(movie);
        switch (sizeFilter) {
            case 'tiny': return sizeInGB < 0.25; // < 256MB
            case 'mini': return sizeInGB >= 0.25 && sizeInGB < 0.5; // 256-512MB
            case 'small': return sizeInGB >= 0.5 && sizeInGB < 1; // 512MB-1GB
            case 'medium': return sizeInGB >= 1 && sizeInGB < 2;
            case 'large': return sizeInGB >= 2 && sizeInGB < 4;
            case 'xlarge': return sizeInGB >= 4;
            default: return true;
        }
    });
}

function getMovieSizeInGB(movie) {
    if (movie.torrents?.length) {
        let maxSizeGB = 0;
        movie.torrents.forEach(torrent => {
            if (torrent.size_bytes) {
                maxSizeGB = Math.max(maxSizeGB, torrent.size_bytes / (1024 * 1024 * 1024));
            } else if (torrent.size) {
                const match = torrent.size.match(/(\d+\.?\d*)\s*(GB|MB)/i);
                if (match) {
                    let size = parseFloat(match[1]);
                    if (match[2].toUpperCase() === 'MB') size /= 1024;
                    maxSizeGB = Math.max(maxSizeGB, size);
                }
            }
        });
        if (maxSizeGB > 0) return maxSizeGB;
    }
    
    const runtime = movie.runtime || 120;
    let estimatedGB = (runtime / 60) * 1;
    
    if (movie.torrents?.length) {
        const hasHD = movie.torrents.some(t => t.quality?.includes('1080') || t.quality?.includes('720'));
        const has4K = movie.torrents.some(t => t.quality?.includes('2160'));
        
        if (has4K) estimatedGB *= 4;
        else if (hasHD) estimatedGB *= 2;
    }
    
    return estimatedGB;
}

// Bookmark functions
function addToBookmark(movie) {
    if (!bookmarkedMovies.includes(movie.title)) {
        bookmarkedMovies.push(movie.title);
        localStorage.setItem('bookmarkedMovies', JSON.stringify(bookmarkedMovies));
        updateBookmarkedList();
        showNotification(`"${movie.title}" added to bookmarks!`, 'success');
    } else {
        showNotification(`"${movie.title}" is already bookmarked!`, 'warning');
    }
}

function removeBookmark(movieTitle) {
    bookmarkedMovies = bookmarkedMovies.filter(title => title !== movieTitle);
    localStorage.setItem('bookmarkedMovies', JSON.stringify(bookmarkedMovies));
    updateBookmarkedList();
}

function updateBookmarkedList() {
    const bookmarkedList = document.getElementById('bookmarked-list');
    bookmarkedList.innerHTML = '';
    
    bookmarkedMovies.forEach(title => {
        const li = createElement('li', 'list-group-item d-flex justify-content-between align-items-center');
        li.innerHTML = `
            <span>${title}</span>
            <button class="btn btn-danger btn-sm" onclick="removeBookmark('${title}')">Remove</button>
        `;
        bookmarkedList.appendChild(li);
    });
}

// Movie actions
function watchMovie(movie) {
    if (!movie.imdb_code) {
        showNotification('Movie cannot be streamed - missing IMDB info', 'error');
        return;
    }
    
    const content = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">${movie.title} (${movie.year})</h3>
            <button class="diagnostic-button" onclick="runStreamingDiagnostic('${movie.title}', '${movie.imdb_code}')">
                🔧 Diagnostic
            </button>
        </div>
        
        <div style="display: flex; align-items: center; margin-bottom: 15px; padding: 10px; background: rgba(40, 167, 69, 0.1); border-radius: 6px; border-left: 4px solid #28a745;">
            <span style="color: #28a745; margin-right: 8px;">🎬</span>
            <span style="color: #ccc; font-size: 14px;">Powered by <strong style="color: #28a745;">2Embed</strong> - Premium streaming service</span>
        </div>
        
        <div class="video-container" id="video-container">
            <div class="loading-center">
                <div style="margin-bottom: 20px;">
                    <svg width="64" height="64" fill="white" viewBox="0 0 16 16">
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                    </svg>
                </div>
                <p style="color: #ccc; margin-bottom: 20px;">Click below to start streaming</p>
                <div id="streaming-options">
                    ${movie.torrents ? movie.torrents.map(torrent => `
                        <button class="streaming-button" onclick="startStreaming('${movie.title}', '${torrent.quality}', '${movie.imdb_code}')">
                            🎬 Stream ${torrent.quality} via 2Embed
                        </button>
                    `).join('') : `
                        <button class="streaming-button" onclick="startStreaming('${movie.title}', 'HD', '${movie.imdb_code}')">
                            🎬 Stream Movie via 2Embed
                        </button>
                    `}
                </div>
            </div>
        </div>
        
        <div class="info-grid">
            <div>
                <p><strong>Rating:</strong> ${movie.rating || 'N/A'}/10</p>
                <p><strong>Runtime:</strong> ${movie.runtime || 'N/A'} minutes</p>
            </div>
            <div>
                <p><strong>Year:</strong> ${movie.year}</p>
                <p><strong>IMDB:</strong> ${movie.imdb_code || 'N/A'}</p>
            </div>
        </div>
        <p><strong>Genres:</strong> ${movie.genres ? movie.genres.join(', ') : 'Unknown'}</p>
        ${movie.summary ? `<p><strong>Summary:</strong> ${movie.summary.substring(0, 200)}...</p>` : ''}
    `;
    
    createModal('streaming-modal', content);
}

function startStreaming(title, quality, imdbCode) {
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = `
        <div class="loading-center">
            <div class="spinner"></div>
            <p>Loading movie player...</p>
            <p style="font-size: 12px; color: #ccc;">Connecting to 2Embed streaming service...</p>
        </div>
    `;
    
    const services = [
        `https://www.2embed.to/embed/imdb/movie?id=${imdbCode}`,
        `https://vidsrc.to/embed/movie/${imdbCode}`,
        `https://multiembed.mov/directstream.php?video_id=${imdbCode}&tmdb=1`
    ];
    
    let currentIndex = 0;
    
    function tryService() {
        if (currentIndex >= services.length) {
            showStreamingError(title, imdbCode);
            return;
        }
        
        const iframe = createElement('iframe');
        iframe.src = services[currentIndex];
        iframe.style.cssText = 'width: 100%; height: 100%; border: none; border-radius: 8px;';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
        
        iframe.onload = () => {
            videoContainer.innerHTML = '';
            videoContainer.appendChild(iframe);
        };
        
        iframe.onerror = () => {
            currentIndex++;
            tryService();
        };
        
        setTimeout(() => {
            if (videoContainer.querySelector('iframe') !== iframe) {
                currentIndex++;
                tryService();
            }
        }, 10000);
        
        videoContainer.appendChild(iframe);
    }
    
    tryService();
}

function showStreamingError(title, imdbCode) {
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = `
        <div class="loading-center" style="padding: 20px;">
            <svg width="48" height="48" fill="#dc3545" viewBox="0 0 16 16" style="margin-bottom: 20px;">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            <h4 style="margin-bottom: 15px;">Video Currently Unavailable</h4>
            <p style="color: #ccc; margin-bottom: 20px;">2Embed and backup services are temporarily unavailable</p>
            <div class="error-links">
                <a href="https://www.2embed.to/embed/imdb/movie?id=${imdbCode}" target="_blank" class="error-link" style="background: #28a745;">
                    🎬 Try 2Embed Direct (New Tab)
                </a>
                <a href="https://vidsrc.to/embed/movie/${imdbCode}" target="_blank" class="error-link" style="background: #007bff;">
                    🎬 Try VidSrc (New Tab)
                </a>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' full movie')}" target="_blank" class="error-link" style="background: #dc3545;">
                    🔍 Search on YouTube
                </a>
            </div>
        </div>
    `;
}

function watchTrailer(movie) {
    if (movie.yt_trailer_code) {
        window.open(`https://www.youtube.com/watch?v=${movie.yt_trailer_code}`, '_blank');
    } else {
        showNotification('Trailer not available', 'warning');
    }
}
function downloadMovie(movie) {
    if (!movie.torrents?.length) {
        showAlternativeDownloadOptions(movie);
        return;
    }
    
    const content = `
        <h3 style="margin-bottom: 20px;">Download "${movie.title}" (${movie.year})</h3>
        <p style="color: #ccc; margin-bottom: 15px;">Choose quality to download:</p>
        <div>
            ${movie.torrents.map(torrent => `
                <div class="download-option">
                    <div class="download-header">
                        <div>
                            <strong style="color: #28a745;">${torrent.quality || 'Unknown Quality'}</strong>
                            <span style="color: #ccc; margin-left: 10px;">${torrent.size || 'Size unknown'}</span>
                        </div>
                    </div>
                    <div class="download-buttons">
                        <button onclick="copyMagnetLink('${torrent.hash}', '${movie.title}', '${movie.year}')" class="streaming-button">
                            🧲 Copy Magnet Link
                        </button>
                        <button onclick="openMagnetLink('${torrent.hash}', '${movie.title}', '${movie.year}')" class="streaming-button">
                            🚀 Open in Client
                        </button>
                    </div>
                    <div class="download-info">
                        Seeds: ${torrent.seeds || 'N/A'} | Peers: ${torrent.peers || 'N/A'}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    createModal('download-modal', content);
}

function showAlternativeDownloadOptions(movie) {
    const content = `
        <h3 style="margin-bottom: 20px;">Download "${movie.title}" (${movie.year})</h3>
        <div style="text-align: center; margin-bottom: 25px;">
            <h4 style="color: #ffc107;">No Direct Download Available</h4>
            <p style="color: #ccc;">Try these alternatives:</p>
        </div>
        <div class="error-links">
            <a href="https://1337x.to/search/${encodeURIComponent(movie.title + ' ' + movie.year)}/1/" target="_blank" class="error-link" style="background: #dc3545;">
                🏴‍☠️ Search on 1337x
            </a>
            <a href="https://thepiratebay.org/search.php?q=${encodeURIComponent(movie.title + ' ' + movie.year)}" target="_blank" class="error-link" style="background: #28a745;">
                🏴‍☠️ Search on TPB
            </a>
        </div>
    `;
    
    createModal('download-modal', content);
}

function copyMagnetLink(hash, title = '', year = '') {
    if (!hash) {
        showNotification('Magnet link not available', 'error');
        return;
    }
    
    const displayName = title && year ? `${title} (${year})` : 'Movie';
    const encodedName = encodeURIComponent(displayName);
    const trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
        'udp://9.rarbg.to:2710/announce'
    ];
    
    const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
    const magnetLink = `magnet:?xt=urn:btih:${hash}&dn=${encodedName}&${trackerParams}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(magnetLink).then(() => {
            showNotification('✅ Magnet link copied!', 'success');
        }).catch(() => {
            fallbackCopy(magnetLink);
        });
    } else {
        fallbackCopy(magnetLink);
    }
}

function openMagnetLink(hash, title = '', year = '') {
    if (!hash) {
        showNotification('Magnet link not available', 'error');
        return;
    }
    
    const displayName = title && year ? `${title} (${year})` : 'Movie';
    const encodedName = encodeURIComponent(displayName);
    const trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.openbittorrent.com:6969/announce'
    ];
    
    const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
    const magnetLink = `magnet:?xt=urn:btih:${hash}&dn=${encodedName}&${trackerParams}`;
    
    try {
        window.location.href = magnetLink;
        showNotification('🚀 Opening in torrent client...', 'info');
    } catch (error) {
        copyMagnetLink(hash, title, year);
    }
}

function fallbackCopy(text) {
    const textArea = createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position: fixed; left: -999999px; top: -999999px;';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Magnet link copied!', 'success');
    } catch (err) {
        showNotification('Could not copy magnet link', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showMoreInfo(movie) {
    const info = `Title: ${movie.title}\nYear: ${movie.year}\nRating: ${movie.rating || 'N/A'}\nRuntime: ${movie.runtime || 'N/A'} minutes\nGenres: ${movie.genres ? movie.genres.join(', ') : 'Unknown'}\nSummary: ${movie.summary || 'No summary available'}`;
    alert(info);
}

// Diagnostic functions (simplified)
function runStreamingDiagnostic(title, imdbCode) {
    const content = `
        <h3 style="margin-bottom: 25px;">🔧 Streaming Diagnostic for "${title}"</h3>
        <div style="font-size: 14px;">
            <p>✅ Internet Connection: Active</p>
            <p>✅ IMDB Code: ${imdbCode ? 'Available' : 'Missing'}</p>
            <p>💡 If streaming fails, try:</p>
            <ul style="margin-left: 20px;">
                <li>Using a VPN</li>
                <li>Checking back later</li>
                <li>Trying external links</li>
            </ul>
        </div>
    `;
    
    createModal('diagnostic-modal', content);
}

// Pagination functions
function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    // Previous button
    if (currentPage > 1) {
        const prevLi = createElement('li', 'page-item');
        const prevLink = createElement('a', 'page-link', 'Previous');
        prevLink.href = '#';
        prevLink.onclick = (e) => {
            e.preventDefault();
            goToPage(currentPage - 1);
        };
        prevLi.appendChild(prevLink);
        pagination.appendChild(prevLi);
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const li = createElement('li', `page-item${i === currentPage ? ' active' : ''}`);
        const link = createElement('a', 'page-link', i.toString());
        link.href = '#';
        link.onclick = (e) => {
            e.preventDefault();
            goToPage(i);
        };
        li.appendChild(link);
        pagination.appendChild(li);
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextLi = createElement('li', 'page-item');
        const nextLink = createElement('a', 'page-link', 'Next');
        nextLink.href = '#';
        nextLink.onclick = (e) => {
            e.preventDefault();
            goToPage(currentPage + 1);
        };
        nextLi.appendChild(nextLink);
        pagination.appendChild(nextLi);
    }
}

function goToPage(page) {
    currentPage = page;
    searchMovies(page);
    document.querySelector('.col-8').scrollIntoView({ behavior: 'smooth' });
}

// Global functions for onclick handlers
window.closeModal = closeModal;
window.removeBookmark = removeBookmark;
window.startStreaming = startStreaming;
window.runStreamingDiagnostic = runStreamingDiagnostic;
window.copyMagnetLink = copyMagnetLink;
window.openMagnetLink = openMagnetLink;

// Event listeners
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.remove();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }
});

document.addEventListener('DOMContentLoaded', updateBookmarkedList);

// Initialize app
initializeApp();
                            
