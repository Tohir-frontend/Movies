let url = `https://yts.mx/api/v2/list_movies.json`;
let genresUrl = `https://yts.mx/api/v2/list_movies.json?limit=1`;
let currentPage = 1;
let currentSearchParams = {};
let allGenres = [];

const btn = document.getElementById("btn");
const search = document.getElementById("search");
const year = document.getElementById("year");
const janr = document.getElementById("janr");
const rating = document.getElementById("rating");
const size = document.getElementById("size");
const count = document.getElementById("count");

btn.addEventListener("click", () => {
    currentPage = 1;
    searchMovies();
});

function searchMovies(page = 1) {
    let searchUrl = url + "?";
    let params = [];

    // Page parameter
    params.push(`page=${page}`);
    params.push(`limit=20`);

    // Search term
    if (search.value.trim()) {
        params.push(`query_term=${encodeURIComponent(search.value.trim())}`);
    }

    // Year filter
    if (year.value.trim()) {
        const yearValue = parseInt(year.value.trim());
        if (yearValue >= 1900 && yearValue <= new Date().getFullYear()) {
            params.push(`year=${yearValue}`);
        }
    }

    // Genre filter
    if (janr.value) {
        params.push(`genre=${janr.value}`);
    }

    // Rating filter
    if (rating.value) {
        params.push(`minimum_rating=${rating.value}`);
    }

    // Store current search parameters
    currentSearchParams = {
        search: search.value.trim(),
        year: year.value.trim(),
        genre: janr.value,
        rating: rating.value,
        size: size.value
    };

    // Join parameters
    searchUrl += params.join("&");
    currentPage = page;

    getMovies(searchUrl);
}
async function getMovies(params) {
    const res = await fetch(params);

    if (res.ok && res.status === 200) {
        const data = await res.json();
        viewData(data);
    }
}

// Fetch all available genres and initialize the app
async function initializeApp() {
    await fetchAllGenres();
    getMovies(url);
}

// Fetch all available genres from YTS API
async function fetchAllGenres() {
    try {
        const res = await fetch(`https://yts.mx/api/v2/list_movies.json?limit=50&sort_by=year`);
        if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.movies) {
                const genreSet = new Set();
                data.data.movies.forEach(movie => {
                    if (movie.genres) {
                        movie.genres.forEach(genre => genreSet.add(genre.toLowerCase()));
                    }
                });
                allGenres = Array.from(genreSet).sort();
                updateGenreDropdown();
            }
        }
    } catch (error) {
        console.error('Error fetching genres:', error);
        // Use default genres if API fails
        allGenres = ['action', 'adventure', 'animation', 'biography', 'comedy', 'crime', 'documentary',
                    'drama', 'family', 'fantasy', 'film-noir', 'history', 'horror', 'music', 'musical',
                    'mystery', 'romance', 'sci-fi', 'sport', 'thriller', 'war', 'western'];
        updateGenreDropdown();
    }
}

// Update genre dropdown with all available genres
function updateGenreDropdown() {
    const genreSelect = document.getElementById('janr');
    // Keep the "All" option
    genreSelect.innerHTML = '<option value="">All</option>';
    
    allGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
        genreSelect.appendChild(option);
    });
}

initializeApp();

const main = document.getElementById("main");

function viewData(data) {
    main.textContent = "";

    if (!data.data || !data.data.movies || data.data.movies.length === 0) {
        main.innerHTML =
            '<div class="col-12"><div class="alert alert-warning">No movies found.</div></div>';
        count.textContent = "0";
        updatePagination(1, 1);
        return;
    }

    // Apply size filtering if selected (client-side filtering)
    let moviesToShow = data.data.movies;
    if (size.value) {
        moviesToShow = filterMoviesBySize(data.data.movies, size.value);
    }

    // Update results count - use API data for total count
    const totalMovies = data.data.movie_count || moviesToShow.length;
    count.textContent = totalMovies;

    // Calculate total pages based on API pagination info
    const limit = data.data.limit || 20;
    const totalPages = Math.ceil(totalMovies / limit);
    updatePagination(currentPage, totalPages);

    if (moviesToShow.length === 0) {
        main.innerHTML =
            '<div class="col-12"><div class="alert alert-warning">No movies found matching the size filter.</div></div>';
        return;
    }

    moviesToShow.map((item) => {
        const colDiv = document.createElement("div");
        colDiv.classList.add("col-md-6", "mb-4");

        const card = document.createElement("div");
        card.classList.add("card", "h-100");
        card.style.maxWidth = "100%";

        // Movie poster
        const img = document.createElement("img");
        img.src = item.large_cover_image || item.medium_cover_image;
        img.alt = item.title;
        img.classList.add("card-img-top");
        img.style.height = "250px";
        img.style.objectFit = "cover";

        const cardbody = document.createElement("div");
        cardbody.classList.add("card-body", "d-flex", "flex-column");

        // Movie title
        const title = document.createElement("h5");
        title.classList.add("card-title", "mb-2");
        title.textContent = item.title;

        // Year with calendar icon
        const yearDiv = document.createElement("div");
        yearDiv.classList.add("d-flex", "align-items-center", "mb-2");
        yearDiv.innerHTML = `
            <svg width="16" height="16" fill="currentColor" class="bi bi-calendar me-2" viewBox="0 0 16 16">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
            </svg>
            <span>${item.year}</span>
        `;

        // File size display
        const sizeDiv = document.createElement("div");
        sizeDiv.classList.add("d-flex", "align-items-center", "mb-2");
        const fileSize = getFileSize(item);
        sizeDiv.innerHTML = `
            <svg width="16" height="16" fill="currentColor" class="bi bi-hdd me-2" viewBox="0 0 16 16">
                <path d="M4.5 11a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zM3 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
                <path d="M16 11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9.51c0-.418.105-.83.305-1.197l2.472-4.531A1.5 1.5 0 0 1 4.094 3h7.812a1.5 1.5 0 0 1 1.317.782l2.472 4.53c.2.368.305.78.305 1.198V11zM3.655 4.26 1.592 8.043c-.081.146-.123.304-.123.468v2.489c0 .552.448 1 1 1h12c.552 0 1-.448 1-1v-2.489c0-.164-.042-.322-.123-.468L13.345 4.26A.5.5 0 0 0 12.906 4H3.094a.5.5 0 0 0-.44.26z"/>
            </svg>
            <span class="text-muted">${fileSize}</span>
        `;

        // Star rating
        const ratingDiv = document.createElement("div");
        ratingDiv.classList.add("d-flex", "align-items-center", "mb-3");
        const starRating = createStarRating(item.rating || 0);
        ratingDiv.innerHTML = `
            <span class="me-2">${starRating}</span>
            <span class="fw-bold">${item.rating || "N/A"}</span>
        `;

        // Button group
        const buttonGroup = document.createElement("div");
        buttonGroup.classList.add("d-flex", "gap-1", "mt-auto", "flex-wrap");

        const watchMovieBtn = document.createElement("button");
        watchMovieBtn.classList.add("btn", "btn-success", "btn-sm");
        watchMovieBtn.textContent = "Watch Movie";
        watchMovieBtn.onclick = () => watchMovie(item);

        const watchTrailerBtn = document.createElement("button");
        watchTrailerBtn.classList.add("btn", "btn-outline-primary", "btn-sm");
        watchTrailerBtn.textContent = "Trailer";
        watchTrailerBtn.onclick = () => watchTrailer(item);

        const moreInfoBtn = document.createElement("button");
        moreInfoBtn.classList.add("btn", "btn-outline-secondary", "btn-sm");
        moreInfoBtn.textContent = "Info";
        moreInfoBtn.onclick = () => showMoreInfo(item);

        const downloadBtn = document.createElement("button");
        downloadBtn.classList.add("btn", "btn-outline-success", "btn-sm");
        downloadBtn.textContent = "Download";
        downloadBtn.onclick = () => downloadMovie(item);

        const bookmarkBtn = document.createElement("button");
        bookmarkBtn.classList.add("btn", "btn-outline-warning", "btn-sm");
        bookmarkBtn.textContent = "Bookmark";
        bookmarkBtn.onclick = () => addToBookmark(item);

        buttonGroup.appendChild(watchMovieBtn);
        buttonGroup.appendChild(watchTrailerBtn);
        buttonGroup.appendChild(downloadBtn);
        buttonGroup.appendChild(moreInfoBtn);
        buttonGroup.appendChild(bookmarkBtn);

        cardbody.appendChild(title);
        cardbody.appendChild(yearDiv);
        cardbody.appendChild(sizeDiv);
        cardbody.appendChild(ratingDiv);
        cardbody.appendChild(buttonGroup);

        card.appendChild(img);
        card.appendChild(cardbody);
        colDiv.appendChild(card);

        main.appendChild(colDiv);
    });
}

// Bookmarked movies array
let bookmarkedMovies = JSON.parse(localStorage.getItem('bookmarkedMovies')) || [
    'Avengers: Infinity War',
    'The Avengers',
    '12 Years a Slave'
];

// Create star rating display
function createStarRating(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<span class="text-warning">★</span>';
    }
    
    // Half star
    if (halfStar) {
        stars += '<span class="text-warning">☆</span>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<span class="text-muted">☆</span>';
    }
    
    return stars;
}

// Get file size from movie data
function getFileSize(movie) {
    if (movie.torrents && movie.torrents.length > 0) {
        // Find the largest torrent size
        let maxSize = 0;
        movie.torrents.forEach(torrent => {
            if (torrent.size_bytes) {
                maxSize = Math.max(maxSize, torrent.size_bytes);
            }
        });
        
        if (maxSize > 0) {
            return formatFileSize(maxSize);
        }
        
        // Fallback to size string if available
        const sizeString = movie.torrents[0].size;
        if (sizeString) {
            return sizeString;
        }
    }
    
    // Estimate size based on quality and runtime
    return estimateFileSize(movie);
}

// Format file size in bytes to human readable format
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Estimate file size based on movie properties
function estimateFileSize(movie) {
    const runtime = movie.runtime || 120; // Default 2 hours
    let estimatedGB = 0;
    
    // Base estimation: ~1GB per hour for standard quality
    estimatedGB = (runtime / 60) * 1;
    
    // Adjust based on available quality info
    if (movie.torrents && movie.torrents.length > 0) {
        const hasHD = movie.torrents.some(t => t.quality && (t.quality.includes('1080') || t.quality.includes('720')));
        const has4K = movie.torrents.some(t => t.quality && t.quality.includes('2160'));
        
        if (has4K) {
            estimatedGB *= 4; // 4K is roughly 4x larger
        } else if (hasHD) {
            estimatedGB *= 2; // HD is roughly 2x larger
        }
    }
    
    return `~${estimatedGB.toFixed(1)} GB`;
}

// Filter movies by size
function filterMoviesBySize(movies, sizeFilter) {
    if (!sizeFilter) return movies;
    
    return movies.filter(movie => {
        const sizeInGB = getMovieSizeInGB(movie);
        
        switch (sizeFilter) {
            case 'small':
                return sizeInGB < 1;
            case 'medium':
                return sizeInGB >= 1 && sizeInGB < 2;
            case 'large':
                return sizeInGB >= 2 && sizeInGB < 4;
            case 'xlarge':
                return sizeInGB >= 4;
            default:
                return true;
        }
    });
}

// Get movie size in GB for filtering
function getMovieSizeInGB(movie) {
    if (movie.torrents && movie.torrents.length > 0) {
        let maxSizeGB = 0;
        movie.torrents.forEach(torrent => {
            if (torrent.size_bytes) {
                const sizeGB = torrent.size_bytes / (1024 * 1024 * 1024);
                maxSizeGB = Math.max(maxSizeGB, sizeGB);
            } else if (torrent.size) {
                // Parse size string like "1.2 GB"
                const match = torrent.size.match(/(\d+\.?\d*)\s*(GB|MB)/i);
                if (match) {
                    let size = parseFloat(match[1]);
                    if (match[2].toUpperCase() === 'MB') {
                        size = size / 1024; // Convert MB to GB
                    }
                    maxSizeGB = Math.max(maxSizeGB, size);
                }
            }
        });
        
        if (maxSizeGB > 0) {
            return maxSizeGB;
        }
    }
    
    // Estimate based on runtime and quality
    const runtime = movie.runtime || 120;
    let estimatedGB = (runtime / 60) * 1;
    
    if (movie.torrents && movie.torrents.length > 0) {
        const hasHD = movie.torrents.some(t => t.quality && (t.quality.includes('1080') || t.quality.includes('720')));
        const has4K = movie.torrents.some(t => t.quality && t.quality.includes('2160'));
        
        if (has4K) {
            estimatedGB *= 4;
        } else if (hasHD) {
            estimatedGB *= 2;
        }
    }
    
    return estimatedGB;
}

// Add movie to bookmarks
function addToBookmark(movie) {
    if (!bookmarkedMovies.includes(movie.title)) {
        bookmarkedMovies.push(movie.title);
        localStorage.setItem('bookmarkedMovies', JSON.stringify(bookmarkedMovies));
        updateBookmarkedList();
        alert(`"${movie.title}" has been added to bookmarks!`);
    } else {
        alert(`"${movie.title}" is already in bookmarks!`);
    }
}

// Remove movie from bookmarks
function removeBookmark(movieTitle) {
    bookmarkedMovies = bookmarkedMovies.filter(title => title !== movieTitle);
    localStorage.setItem('bookmarkedMovies', JSON.stringify(bookmarkedMovies));
    updateBookmarkedList();
}

// Update bookmarked movies list in UI
function updateBookmarkedList() {
    const bookmarkedList = document.getElementById('bookmarked-list');
    bookmarkedList.innerHTML = '';
    
    bookmarkedMovies.forEach(title => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        li.innerHTML = `
            <span>${title}</span>
            <button class="btn btn-danger btn-sm" onclick="removeBookmark('${title}')">Remove</button>
        `;
        bookmarkedList.appendChild(li);
    });
}

// Watch movie function - Stream online without downloading
function watchMovie(movie) {
    // Check if movie has required data
    if (!movie.imdb_code) {
        alert('Sorry, this movie cannot be streamed because it lacks the required IMDB information.');
        return;
    }
    
    // Create streaming modal
    const streamingHTML = `
        <div id="streaming-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                   background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: #1a1a1a; border-radius: 10px; padding: 20px; max-width: 90%; max-height: 90%;
                       width: 800px; position: relative; color: white;">
                <button onclick="closeStreamingModal()"
                        style="position: absolute; top: 10px; right: 15px; background: none; border: none;
                               color: white; font-size: 24px; cursor: pointer; z-index: 1001;">&times;</button>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: white; margin: 0;">${movie.title} (${movie.year})</h3>
                    <button onclick="runStreamingDiagnostic('${movie.title}', '${movie.imdb_code}')"
                            style="background: #6c757d; color: white; border: none; padding: 6px 12px;
                                   border-radius: 4px; cursor: pointer; font-size: 12px;">
                        🔧 Diagnostic
                    </button>
                </div>
                
                <div id="video-container" style="width: 100%; height: 400px; background: #000; border-radius: 8px; position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="margin-bottom: 20px;">
                            <svg width="64" height="64" fill="white" viewBox="0 0 16 16">
                                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                            </svg>
                        </div>
                        <p style="color: #ccc; margin-bottom: 20px;">Click below to start streaming</p>
                        <div id="streaming-options">
                            ${movie.torrents ? movie.torrents.map(torrent => `
                                <button onclick="startStreaming('${movie.title}', '${torrent.quality}', '${movie.imdb_code}')"
                                        style="background: #28a745; color: white; border: none; padding: 10px 20px;
                                               border-radius: 5px; margin: 5px; cursor: pointer; font-size: 14px;">
                                    Stream ${torrent.quality}
                                </button>
                            `).join('') : `
                                <button onclick="startStreaming('${movie.title}', 'HD', '${movie.imdb_code}')"
                                        style="background: #28a745; color: white; border: none; padding: 10px 20px;
                                               border-radius: 5px; margin: 5px; cursor: pointer; font-size: 14px;">
                                    Stream Movie
                                </button>
                            `}
                        </div>
                        
                        <div style="margin-top: 20px; font-size: 12px; color: #888;">
                            <p>💡 Having trouble? Try the diagnostic tool above</p>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 15px; font-size: 14px; color: #ccc;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
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
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', streamingHTML);
}

// Run streaming diagnostic
async function runStreamingDiagnostic(title, imdbCode) {
    const diagnosticModal = `
        <div id="diagnostic-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                   background: rgba(0,0,0,0.95); z-index: 1002; display: flex; align-items: center; justify-content: center;">
            <div style="background: #1a1a1a; border-radius: 10px; padding: 30px; max-width: 600px; width: 90%;
                       position: relative; color: white; max-height: 80vh; overflow-y: auto;">
                <button onclick="closeDiagnosticModal()"
                        style="position: absolute; top: 15px; right: 20px; background: none; border: none;
                               color: white; font-size: 24px; cursor: pointer;">&times;</button>
                
                <h3 style="margin-bottom: 25px; color: white;">🔧 Streaming Diagnostic for "${title}"</h3>
                
                <div id="diagnostic-results" style="font-size: 14px;">
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <div class="loading-spinner" style="width: 16px; height: 16px; border: 2px solid #333;
                                 border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
                            <span>Running diagnostic tests...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', diagnosticModal);
    
    // Run diagnostic tests
    const results = await performDiagnosticTests(title, imdbCode);
    displayDiagnosticResults(results);
}

// Perform diagnostic tests
async function performDiagnosticTests(title, imdbCode) {
    const results = {
        internetConnection: false,
        imdbCode: !!imdbCode,
        serviceAvailability: [],
        movieAge: null,
        recommendations: []
    };
    
    // Test internet connection
    try {
        await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
        results.internetConnection = true;
    } catch (error) {
        results.internetConnection = false;
    }
    
    // Test streaming services
    const services = [
        { name: 'VidSrc', url: `https://vidsrc.to/embed/movie/${imdbCode}` },
        { name: '2Embed', url: `https://www.2embed.to/embed/imdb/movie?id=${imdbCode}` },
        { name: 'MultiEmbed', url: `https://multiembed.mov/?video_id=${imdbCode}&tmdb=1` }
    ];
    
    for (const service of services) {
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 3000);
            
            await fetch(service.url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            results.serviceAvailability.push({ name: service.name, available: true });
        } catch (error) {
            results.serviceAvailability.push({ name: service.name, available: false });
        }
    }
    
    // Check movie age (newer movies are less likely to be available)
    const currentYear = new Date().getFullYear();
    const movieYear = parseInt(title.match(/\((\d{4})\)/)?.[1] || currentYear);
    results.movieAge = currentYear - movieYear;
    
    // Generate recommendations
    if (!results.internetConnection) {
        results.recommendations.push('Check your internet connection');
    }
    if (!results.imdbCode) {
        results.recommendations.push('Movie lacks IMDB information required for streaming');
    }
    if (results.movieAge < 1) {
        results.recommendations.push('Very new movies may not be available on free streaming services');
    }
    if (results.serviceAvailability.every(s => !s.available)) {
        results.recommendations.push('All streaming services appear to be blocked or down');
        results.recommendations.push('Try using a VPN or check back later');
    }
    
    return results;
}

// Display diagnostic results
function displayDiagnosticResults(results) {
    const diagnosticResults = document.getElementById('diagnostic-results');
    
    const getStatusIcon = (status) => status ? '✅' : '❌';
    const getStatusColor = (status) => status ? '#28a745' : '#dc3545';
    
    diagnosticResults.innerHTML = `
        <div style="margin-bottom: 25px;">
            <h4 style="color: #ffc107; margin-bottom: 15px;">Test Results:</h4>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="color: ${getStatusColor(results.internetConnection)}; margin-right: 10px;">
                        ${getStatusIcon(results.internetConnection)}
                    </span>
                    <span>Internet Connection</span>
                </div>
                
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="color: ${getStatusColor(results.imdbCode)}; margin-right: 10px;">
                        ${getStatusIcon(results.imdbCode)}
                    </span>
                    <span>IMDB Code Available</span>
                </div>
                
                <div style="margin-bottom: 8px;">
                    <span style="color: #17a2b8; margin-right: 10px;">📅</span>
                    <span>Movie Age: ${results.movieAge} years</span>
                </div>
            </div>
            
            <h5 style="color: #17a2b8; margin-bottom: 10px;">Streaming Services Status:</h5>
            ${results.serviceAvailability.map(service => `
                <div style="display: flex; align-items: center; margin-bottom: 5px; margin-left: 20px;">
                    <span style="color: ${getStatusColor(service.available)}; margin-right: 10px;">
                        ${getStatusIcon(service.available)}
                    </span>
                    <span>${service.name}</span>
                </div>
            `).join('')}
        </div>
        
        ${results.recommendations.length > 0 ? `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #ffc107; margin-bottom: 15px;">💡 Recommendations:</h4>
                ${results.recommendations.map(rec => `
                    <div style="margin-bottom: 8px; margin-left: 20px;">
                        <span style="color: #17a2b8; margin-right: 8px;">•</span>
                        <span>${rec}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 25px;">
            <button onclick="closeDiagnosticModal()"
                    style="background: #007bff; color: white; border: none; padding: 10px 20px;
                           border-radius: 5px; cursor: pointer; font-weight: 500;">
                Close Diagnostic
            </button>
        </div>
    `;
}

// Close diagnostic modal
function closeDiagnosticModal() {
    const modal = document.getElementById('diagnostic-modal');
    if (modal) {
        modal.remove();
    }
}

// Start streaming function with multiple service fallbacks
function startStreaming(title, quality, imdbCode) {
    const videoContainer = document.getElementById('video-container');
    
    // Show loading state
    videoContainer.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
            <div style="margin-bottom: 20px;">
                <div class="loading-pulse" style="width: 40px; height: 40px; border: 3px solid #333; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <p>Loading movie player...</p>
            <p style="font-size: 12px; color: #ccc; margin-top: 10px;">Trying multiple streaming services...</p>
        </div>
    `;
    
    // Add spin animation if not already added
    if (!document.getElementById('spin-animation')) {
        const style = document.createElement('style');
        style.id = 'spin-animation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Array of streaming services to try with improved URLs and timeouts
    const streamingServices = [
        {
            name: 'VidSrc',
            url: `https://vidsrc.to/embed/movie/${imdbCode}`,
            timeout: 10000
        },
        {
            name: '2Embed',
            url: `https://www.2embed.to/embed/imdb/movie?id=${imdbCode}`,
            timeout: 10000
        },
        {
            name: 'SuperEmbed',
            url: `https://multiembed.mov/directstream.php?video_id=${imdbCode}&tmdb=1`,
            timeout: 10000
        },
        {
            name: 'VidSrc Pro',
            url: `https://vidsrc.pro/embed/movie/${imdbCode}`,
            timeout: 10000
        },
        {
            name: 'MoviesAPI',
            url: `https://moviesapi.club/movie/${imdbCode}`,
            timeout: 10000
        }
    ];
    
    let currentServiceIndex = 0;
    
    function tryNextService() {
        if (currentServiceIndex >= streamingServices.length) {
            showStreamingError(title, imdbCode);
            return;
        }
        
        const service = streamingServices[currentServiceIndex];
        
        // Update loading message with progress
        const loadingDiv = videoContainer.querySelector('div');
        if (loadingDiv) {
            const progressText = `Trying ${service.name}... (${currentServiceIndex + 1}/${streamingServices.length})`;
            loadingDiv.querySelector('p:last-child').textContent = progressText;
        }
        
        // Test connection to service first
        testServiceConnection(service.url).then(isReachable => {
            if (!isReachable) {
                console.log(`${service.name} is not reachable, trying next service...`);
                currentServiceIndex++;
                tryNextService();
                return;
            }
            
            setTimeout(() => {
                try {
                    // Create iframe for streaming
                    const iframe = document.createElement('iframe');
                    iframe.src = service.url;
                    iframe.style.cssText = `
                        width: 100%;
                        height: 100%;
                        border: none;
                        border-radius: 8px;
                        opacity: 0;
                        transition: opacity 0.3s;
                    `;
                    iframe.setAttribute('allowfullscreen', '');
                    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
                    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');
                    
                    let loaded = false;
                    
                    // Success handler
                    iframe.onload = function() {
                        if (!loaded) {
                            loaded = true;
                            iframe.style.opacity = '1';
                            
                            videoContainer.innerHTML = '';
                            videoContainer.appendChild(iframe);
                            
                            // Add now playing overlay with service status
                            const overlay = document.createElement('div');
                            overlay.style.cssText = `
                                position: absolute;
                                bottom: 10px;
                                left: 10px;
                                background: rgba(0,0,0,0.8);
                                color: white;
                                padding: 8px 12px;
                                border-radius: 6px;
                                font-size: 12px;
                                font-weight: 500;
                                z-index: 10;
                            `;
                            overlay.innerHTML = `
                                <div>Now Playing: ${title} (${quality})</div>
                                <div style="font-size: 10px; opacity: 0.8;">Source: ${service.name} • Click for fullscreen</div>
                            `;
                            videoContainer.appendChild(overlay);
                            
                            // Add connection quality indicator
                            setTimeout(() => {
                                addConnectionQualityIndicator(overlay);
                            }, 2000);
                        }
                    };
                    
                    // Error handler
                    iframe.onerror = function() {
                        if (!loaded) {
                            loaded = true;
                            currentServiceIndex++;
                            tryNextService();
                        }
                    };
                    
                    // Timeout fallback
                    setTimeout(() => {
                        if (!loaded) {
                            loaded = true;
                            currentServiceIndex++;
                            tryNextService();
                        }
                    }, service.timeout);
                    
                    // Add iframe to container temporarily to test loading
                    iframe.style.display = 'none';
                    videoContainer.appendChild(iframe);
                    
                } catch (error) {
                    currentServiceIndex++;
                    tryNextService();
                }
            }, 1000);
        });
    }
    
    // Test if a streaming service is reachable
    async function testServiceConnection(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // Add connection quality indicator
    function addConnectionQualityIndicator(overlay) {
        const qualityDot = document.createElement('div');
        qualityDot.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #28a745;
            animation: pulse 2s infinite;
        `;
        qualityDot.title = 'Streaming quality: Good';
        overlay.appendChild(qualityDot);
    }
    
    // Start trying services
    tryNextService();
}

// Show streaming error with alternatives and retry option
function showStreamingError(title, imdbCode) {
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white; padding: 20px;">
            <div style="margin-bottom: 20px;">
                <svg width="48" height="48" fill="#dc3545" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
            </div>
            <h4 style="margin-bottom: 15px;">Video Currently Unavailable</h4>
            <p style="margin-bottom: 20px; color: #ccc;">This movie might not be available due to:</p>
            
            <div style="text-align: left; max-width: 300px; margin: 0 auto 25px; color: #aaa; font-size: 14px;">
                <p>• Regional restrictions</p>
                <p>• Temporary service downtime</p>
                <p>• Movie not yet available online</p>
                <p>• Network connectivity issues</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <button onclick="startStreaming('${title}', 'HD', '${imdbCode}')"
                        style="background: #17a2b8; color: white; border: none; padding: 12px 24px;
                               border-radius: 6px; margin: 5px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                    🔄 Try Again
                </button>
                <button onclick="checkMovieAvailability('${title}', '${imdbCode}')"
                        style="background: #6c757d; color: white; border: none; padding: 12px 24px;
                               border-radius: 6px; margin: 5px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                    🔍 Check Availability
                </button>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px; max-width: 350px; margin: 0 auto;">
                <a href="https://vidsrc.to/embed/movie/${imdbCode}" target="_blank"
                   style="display: block; background: #007bff; color: white; padding: 12px 20px;
                          text-decoration: none; border-radius: 6px; font-weight: 500; transition: all 0.2s;">
                    🎬 Try VidSrc (New Tab)
                </a>
                <a href="https://www.2embed.to/embed/imdb/movie?id=${imdbCode}" target="_blank"
                   style="display: block; background: #28a745; color: white; padding: 12px 20px;
                          text-decoration: none; border-radius: 6px; font-weight: 500; transition: all 0.2s;">
                    🎥 Try 2Embed (New Tab)
                </a>
                <a href="https://multiembed.mov/?video_id=${imdbCode}&tmdb=1" target="_blank"
                   style="display: block; background: #6f42c1; color: white; padding: 12px 20px;
                          text-decoration: none; border-radius: 6px; font-weight: 500; transition: all 0.2s;">
                    📺 Try MultiEmbed (New Tab)
                </a>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + new Date().getFullYear() + ' full movie')}" target="_blank"
                   style="display: block; background: #dc3545; color: white; padding: 12px 20px;
                          text-decoration: none; border-radius: 6px; font-weight: 500; transition: all 0.2s;">
                    🔍 Search on YouTube
                </a>
                <a href="https://www.imdb.com/title/${imdbCode}/" target="_blank"
                   style="display: block; background: #f39c12; color: white; padding: 12px 20px;
                          text-decoration: none; border-radius: 6px; font-weight: 500; transition: all 0.2s;">
                    📖 View on IMDB
                </a>
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
                External links open in new tabs. Some services may require VPN or may be region-restricted.
            </p>
        </div>
    `;
}

// Check movie availability across different platforms
function checkMovieAvailability(title, imdbCode) {
    const availabilityModal = `
        <div id="availability-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                   background: rgba(0,0,0,0.9); z-index: 1001; display: flex; align-items: center; justify-content: center;">
            <div style="background: #1a1a1a; border-radius: 10px; padding: 30px; max-width: 500px; width: 90%;
                       position: relative; color: white;">
                <button onclick="closeAvailabilityModal()"
                        style="position: absolute; top: 15px; right: 20px; background: none; border: none;
                               color: white; font-size: 24px; cursor: pointer;">&times;</button>
                
                <h3 style="margin-bottom: 20px; color: white;">Checking "${title}" Availability</h3>
                
                <div style="margin-bottom: 25px;">
                    <h4 style="color: #28a745; margin-bottom: 15px;">✅ Try These Platforms:</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <a href="https://www.netflix.com/search?q=${encodeURIComponent(title)}" target="_blank"
                           style="display: block; background: #e50914; color: white; padding: 10px 15px;
                                  text-decoration: none; border-radius: 5px; font-weight: 500;">
                            Netflix
                        </a>
                        <a href="https://www.amazon.com/s?k=${encodeURIComponent(title + ' movie')}&i=instant-video" target="_blank"
                           style="display: block; background: #ff9900; color: white; padding: 10px 15px;
                                  text-decoration: none; border-radius: 5px; font-weight: 500;">
                            Amazon Prime Video
                        </a>
                        <a href="https://www.hulu.com/search?q=${encodeURIComponent(title)}" target="_blank"
                           style="display: block; background: #1ce783; color: white; padding: 10px 15px;
                                  text-decoration: none; border-radius: 5px; font-weight: 500;">
                            Hulu
                        </a>
                        <a href="https://www.disneyplus.com/search?q=${encodeURIComponent(title)}" target="_blank"
                           style="display: block; background: #113ccf; color: white; padding: 10px 15px;
                                  text-decoration: none; border-radius: 5px; font-weight: 500;">
                            Disney+
                        </a>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #ffc107; margin-bottom: 15px;">🔍 Search Engines:</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <a href="https://www.google.com/search?q=${encodeURIComponent(title + ' watch online free')}" target="_blank"
                           style="display: block; background: #4285f4; color: white; padding: 10px 15px;
                                  text-decoration: none; border-radius: 5px; font-weight: 500;">
                            Google Search
                        </a>
                        <a href="https://yandex.com/search/?text=${encodeURIComponent(title + ' смотреть онлайн')}" target="_blank"
                           style="display: block; background: #fc3f1d; color: white; padding: 10px 15px;
                                  text-decoration: none; border-radius: 5px; font-weight: 500;">
                            Yandex Search
                        </a>
                    </div>
                </div>
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    These are legitimate streaming platforms. Always use legal sources when possible.
                </p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', availabilityModal);
}

// Close availability modal
function closeAvailabilityModal() {
    const modal = document.getElementById('availability-modal');
    if (modal) {
        modal.remove();
    }
}

// Close streaming modal
function closeStreamingModal() {
    const modal = document.getElementById('streaming-modal');
    if (modal) {
        modal.remove();
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.id === 'streaming-modal') {
        closeStreamingModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeStreamingModal();
    }
});

// Watch trailer function
function watchTrailer(movie) {
    if (movie.yt_trailer_code) {
        window.open(`https://www.youtube.com/watch?v=${movie.yt_trailer_code}`, '_blank');
    } else {
        alert('Trailer not available for this movie.');
    }
}

// Download movie function
function downloadMovie(movie) {
    if (!movie.torrents || movie.torrents.length === 0) {
        // Show alternative download options if no torrents available
        showAlternativeDownloadOptions(movie);
        return;
    }

    // Create download modal with quality options
    const downloadHTML = `
        <div id="download-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                   background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: #1a1a1a; border-radius: 10px; padding: 20px; max-width: 600px; width: 90%;
                       position: relative; color: white; max-height: 90vh; overflow-y: auto;">
                <button onclick="closeDownloadModal()"
                        style="position: absolute; top: 10px; right: 15px; background: none; border: none;
                               color: white; font-size: 24px; cursor: pointer; z-index: 1001;">&times;</button>
                
                <h3 style="color: white; margin-bottom: 20px;">Download "${movie.title}" (${movie.year})</h3>
                
                <div style="margin-bottom: 20px;">
                    <p style="color: #ccc; margin-bottom: 15px;">Choose quality to download:</p>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${movie.torrents.map(torrent => `
                            <div style="background: #2d2d2d; padding: 15px; border-radius: 8px; border: 1px solid #444;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <div>
                                        <strong style="color: #28a745;">${torrent.quality || 'Unknown Quality'}</strong>
                                        <span style="color: #ccc; margin-left: 10px;">${torrent.size || 'Size unknown'}</span>
                                    </div>
                                    <div style="font-size: 12px; color: #999;">
                                        ${torrent.type || 'web'} • ${torrent.video_codec || 'H.264'}
                                    </div>
                                </div>
                                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                                    <a href="${torrent.url || '#'}"
                                       ${!torrent.url ? 'onclick="alert(\'Direct torrent link not available. Use magnet link instead.\'); return false;"' : ''}
                                       style="background: ${torrent.url ? '#007bff' : '#6c757d'}; color: white; padding: 8px 16px; text-decoration: none;
                                              border-radius: 5px; font-size: 14px; display: inline-block;">
                                        📥 Download Torrent
                                    </a>
                                    <button onclick="copyMagnetLink('${torrent.hash}', '${movie.title}', '${movie.year}')"
                                            style="background: #28a745; color: white; border: none; padding: 8px 16px;
                                                   border-radius: 5px; cursor: pointer; font-size: 14px;">
                                        🧲 Copy Magnet Link
                                    </button>
                                    <button onclick="openMagnetLink('${torrent.hash}', '${movie.title}', '${movie.year}')"
                                            style="background: #17a2b8; color: white; border: none; padding: 8px 16px;
                                                   border-radius: 5px; cursor: pointer; font-size: 14px;">
                                        🚀 Open in Client
                                    </button>
                                </div>
                                <div style="margin-top: 8px; font-size: 12px; color: #999;">
                                    Seeds: ${torrent.seeds || 'N/A'} | Peers: ${torrent.peers || 'N/A'} |
                                    Date: ${torrent.date_uploaded || 'Unknown'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="background: #1b2d1b; padding: 15px; border-radius: 8px; border: 1px solid #28a745; margin-bottom: 15px;">
                    <h4 style="color: #28a745; margin-bottom: 10px; font-size: 16px;">💡 Download Tips</h4>
                    <p style="font-size: 14px; color: #ccc; margin-bottom: 8px;">
                        • <strong>Magnet links</strong> work directly with torrent clients
                    </p>
                    <p style="font-size: 14px; color: #ccc; margin-bottom: 8px;">
                        • Choose higher quality for better video, but larger file size
                    </p>
                    <p style="font-size: 14px; color: #ccc; margin-bottom: 0;">
                        • Check seeds/peers count - higher numbers mean faster downloads
                    </p>
                </div>
                
                <div style="background: #2d1b1b; padding: 15px; border-radius: 8px; border: 1px solid #dc3545;">
                    <h4 style="color: #dc3545; margin-bottom: 10px; font-size: 16px;">⚠️ Important Notice</h4>
                    <p style="font-size: 14px; color: #ccc; margin-bottom: 8px;">
                        • Install a torrent client: <strong>qBittorrent</strong> (recommended), BitTorrent, or uTorrent
                    </p>
                    <p style="font-size: 14px; color: #ccc; margin-bottom: 8px;">
                        • Use VPN for privacy and security when downloading
                    </p>
                    <p style="font-size: 14px; color: #ccc; margin-bottom: 0;">
                        • Respect copyright laws in your country
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', downloadHTML);
}

// Show alternative download options when torrents are not available
function showAlternativeDownloadOptions(movie) {
    const alternativeHTML = `
        <div id="download-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                   background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: #1a1a1a; border-radius: 10px; padding: 30px; max-width: 500px; width: 90%;
                       position: relative; color: white;">
                <button onclick="closeDownloadModal()"
                        style="position: absolute; top: 15px; right: 20px; background: none; border: none;
                               color: white; font-size: 24px; cursor: pointer;">&times;</button>
                
                <h3 style="color: white; margin-bottom: 20px;">Download "${movie.title}" (${movie.year})</h3>
                
                <div style="text-align: center; margin-bottom: 25px;">
                    <svg width="64" height="64" fill="#ffc107" viewBox="0 0 16 16" style="margin-bottom: 15px;">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    <h4 style="color: #ffc107; margin-bottom: 15px;">No Direct Download Available</h4>
                    <p style="color: #ccc; margin-bottom: 25px;">This movie doesn't have torrent links available, but you can try these alternatives:</p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <a href="https://www.google.com/search?q=${encodeURIComponent(movie.title + ' ' + movie.year + ' download torrent')}" target="_blank"
                       style="display: block; background: #4285f4; color: white; padding: 12px 20px;
                              text-decoration: none; border-radius: 6px; font-weight: 500; text-align: center;">
                        🔍 Search on Google
                    </a>
                    <a href="https://1337x.to/search/${encodeURIComponent(movie.title + ' ' + movie.year)}/1/" target="_blank"
                       style="display: block; background: #dc3545; color: white; padding: 12px 20px;
                              text-decoration: none; border-radius: 6px; font-weight: 500; text-align: center;">
                        🏴‍☠️ Search on 1337x
                    </a>
                    <a href="https://thepiratebay.org/search.php?q=${encodeURIComponent(movie.title + ' ' + movie.year)}" target="_blank"
                       style="display: block; background: #28a745; color: white; padding: 12px 20px;
                              text-decoration: none; border-radius: 6px; font-weight: 500; text-align: center;">
                        🏴‍☠️ Search on TPB
                    </a>
                    <a href="https://rarbg.to/torrents.php?search=${encodeURIComponent(movie.title + ' ' + movie.year)}" target="_blank"
                       style="display: block; background: #6f42c1; color: white; padding: 12px 20px;
                              text-decoration: none; border-radius: 6px; font-weight: 500; text-align: center;">
                        🏴‍☠️ Search on RARBG
                    </a>
                </div>
                
                <div style="background: #2d1b1b; padding: 15px; border-radius: 8px; border: 1px solid #dc3545; margin-top: 20px;">
                    <p style="font-size: 12px; color: #ccc; text-align: center; margin: 0;">
                        ⚠️ External links open in new tabs. Use VPN and antivirus protection. Respect copyright laws.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alternativeHTML);
}

// Copy magnet link to clipboard
function copyMagnetLink(hash, title = '', year = '') {
    if (!hash) {
        alert('Magnet link not available');
        return;
    }
    
    // Create a proper display name for the torrent
    const displayName = title && year ? `${title} (${year})` : 'Movie';
    const encodedName = encodeURIComponent(displayName);
    
    // Updated tracker list with working trackers
    const trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
        'udp://9.rarbg.to:2710/announce',
        'udp://exodus.desync.com:6969/announce',
        'udp://tracker.cyberia.is:6969/announce',
        'udp://explodie.org:6969/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://tracker.tiny-vps.com:6969/announce',
        'udp://retracker.lanta-net.ru:2710/announce',
        'udp://open.stealth.si:80/announce'
    ];
    
    const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
    const magnetLink = `magnet:?xt=urn:btih:${hash}&dn=${encodedName}&${trackerParams}`;
    
    // Try to copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(magnetLink).then(() => {
            showNotification('✅ Magnet link copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback method
            copyToClipboardFallback(magnetLink);
        });
    } else {
        // Fallback method for older browsers
        copyToClipboardFallback(magnetLink);
    }
}

// Open magnet link directly in torrent client
function openMagnetLink(hash, title = '', year = '') {
    if (!hash) {
        alert('Magnet link not available');
        return;
    }
    
    const displayName = title && year ? `${title} (${year})` : 'Movie';
    const encodedName = encodeURIComponent(displayName);
    
    const trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
        'udp://9.rarbg.to:2710/announce',
        'udp://exodus.desync.com:6969/announce',
        'udp://tracker.cyberia.is:6969/announce',
        'udp://explodie.org:6969/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://tracker.tiny-vps.com:6969/announce',
        'udp://retracker.lanta-net.ru:2710/announce',
        'udp://open.stealth.si:80/announce'
    ];
    
    const trackerParams = trackers.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
    const magnetLink = `magnet:?xt=urn:btih:${hash}&dn=${encodedName}&${trackerParams}`;
    
    try {
        // Try to open magnet link directly
        window.location.href = magnetLink;
        showNotification('🚀 Opening in torrent client...', 'info');
    } catch (error) {
        // Fallback to copying if direct opening fails
        copyMagnetLink(hash, title, year);
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.getElementById('download-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };
    
    const notification = document.createElement('div');
    notification.id = 'download-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add slide-in animation
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Fallback method to copy text
function copyToClipboardFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        alert('Magnet link copied to clipboard!');
    } catch (err) {
        alert('Could not copy magnet link. Please copy manually:\n\n' + text);
    }
    
    document.body.removeChild(textArea);
}

// Close download modal
function closeDownloadModal() {
    const modal = document.getElementById('download-modal');
    if (modal) {
        modal.remove();
    }
}

// Show more info function
function showMoreInfo(movie) {
    const info = `
Title: ${movie.title}
Year: ${movie.year}
Rating: ${movie.rating || 'N/A'}
Runtime: ${movie.runtime || 'N/A'} minutes
Genres: ${movie.genres ? movie.genres.join(', ') : 'Unknown'}
Summary: ${movie.summary || 'No summary available'}
    `;
    alert(info);
}

// Initialize bookmarked list on page load
document.addEventListener('DOMContentLoaded', function() {
    updateBookmarkedList();
});


// Pagination functions
function updatePagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Don't show pagination if there's only one page or no pages
    if (totalPages <= 1) {
        return;
    }

    // Previous button
    if (currentPage > 1) {
        const prevLi = document.createElement('li');
        prevLi.classList.add('page-item');
        const prevLink = document.createElement('a');
        prevLink.classList.add('page-link');
        prevLink.href = '#';
        prevLink.textContent = 'Previous';
        prevLink.onclick = (e) => {
            e.preventDefault();
            goToPage(currentPage - 1);
        };
        prevLi.appendChild(prevLink);
        pagination.appendChild(prevLi);
    }

    // Calculate page range to show
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // First page and ellipsis if needed
    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.classList.add('page-item');
        const firstLink = document.createElement('a');
        firstLink.classList.add('page-link');
        firstLink.href = '#';
        firstLink.textContent = '1';
        firstLink.onclick = (e) => {
            e.preventDefault();
            goToPage(1);
        };
        firstLi.appendChild(firstLink);
        pagination.appendChild(firstLi);

        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.classList.add('page-item', 'disabled');
            ellipsisLi.innerHTML = '<span class="page-link">...</span>';
            pagination.appendChild(ellipsisLi);
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.classList.add('page-item');
        if (i === currentPage) {
            li.classList.add('active');
        }
        const link = document.createElement('a');
        link.classList.add('page-link');
        link.href = '#';
        link.textContent = i;
        link.onclick = (e) => {
            e.preventDefault();
            goToPage(i);
        };
        li.appendChild(link);
        pagination.appendChild(li);
    }

    // Last page and ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.classList.add('page-item', 'disabled');
            ellipsisLi.innerHTML = '<span class="page-link">...</span>';
            pagination.appendChild(ellipsisLi);
        }

        const lastLi = document.createElement('li');
        lastLi.classList.add('page-item');
        const lastLink = document.createElement('a');
        lastLink.classList.add('page-link');
        lastLink.href = '#';
        lastLink.textContent = totalPages;
        lastLink.onclick = (e) => {
            e.preventDefault();
            goToPage(totalPages);
        };
        lastLi.appendChild(lastLink);
        pagination.appendChild(lastLi);
    }

    // Next button
    if (currentPage < totalPages) {
        const nextLi = document.createElement('li');
        nextLi.classList.add('page-item');
        const nextLink = document.createElement('a');
        nextLink.classList.add('page-link');
        nextLink.href = '#';
        nextLink.textContent = 'Next';
        nextLink.onclick = (e) => {
            e.preventDefault();
            goToPage(currentPage + 1);
        };
        nextLi.appendChild(nextLink);
        pagination.appendChild(nextLi);
    }
}

function goToPage(page) {
    // Don't restore form values, keep current search state
    currentPage = page;
    searchMovies(page);
    
    // Scroll to top of results
    document.querySelector('.col-8').scrollIntoView({ behavior: 'smooth' });
}
