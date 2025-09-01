// Utility function to shorten movie titles
function shortenTitle(title, maxLength = 20) {
  if (title.length <= maxLength) return title;
  
  // Try to break at word boundaries
  const words = title.split(' ');
  let shortened = '';
  
  for (let word of words) {
    if ((shortened + word).length <= maxLength - 3) {
      shortened += (shortened ? ' ' : '') + word;
    } else {
      break;
    }
  }
  
  return shortened + (shortened.length < title.length ? '...' : '');
}

// Show movie info modal instead of auto-opening
function showMovieInfo(movie) {
  // Remove existing modal if any
  const existingModal = document.getElementById('movieInfoModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'movieInfoModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  `;
  
  modal.innerHTML = `
    <div style="
      background: rgba(248, 246, 240, 0.95);
      border: 2px solid #3498db;
      border-radius: 20px;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 30px rgba(52, 152, 219, 0.4);
      transform: scale(0.8);
      transition: transform 0.3s ease;
    ">
      <img src="${movie.image}" alt="${movie.title}" 
           style="
             width: 120px;
             height: 180px;
             object-fit: cover;
             border-radius: 12px;
             margin: 0 auto 1rem;
             box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
           "
           onerror="this.src='${getPlaceholderImage()}';">
      
      <div style="
        font-size: 1.2rem;
        font-weight: 700;
        color: #3498db;
        margin-bottom: 0.5rem;
      ">${movie.title}</div>
      
      <div style="
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 1rem;
      ">
        ${movie.year} • ${movie.type === "movie" ? "🎬 Movie" : "📺 TV Show"}
        ${movie.rating !== "N/A" ? ` • ⭐ ${movie.rating}` : ""}
      </div>
      
      <div style="
        font-size: 0.85rem;
        color: #444;
        line-height: 1.4;
        margin-bottom: 1.5rem;
        max-height: 100px;
        overflow-y: auto;
      ">${movie.overview}</div>
      
      <div style="
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      ">
        <a href="${movie.tmdbUrl}" target="_blank" style="
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          font-size: 0.9rem;
          background: linear-gradient(135deg, #3498db, #5dade2);
          color: white;
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          🎬 View on TMDB
        </a>
        <button onclick="closeMovieInfo()" style="
          padding: 0.75rem 1.5rem;
          border: 2px solid #ccc;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          background: rgba(248, 246, 240, 0.8);
          color: #333;
        " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
          ✕ Close
        </button>
      </div>
    </div>
  `;

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeMovieInfo();
    }
  });

  document.body.appendChild(modal);
  
  // Show with animation
  setTimeout(() => {
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    const content = modal.querySelector('div');
    if (content) {
      content.style.transform = 'scale(1)';
    }
  }, 10);

  // Show toast
  if (typeof showToast === "function") {
    showToast(`🎬 "${movie.title}" selected!`, "success");
  }
}

// Close movie info modal
function closeMovieInfo() {
  const modal = document.getElementById('movieInfoModal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    const content = modal.querySelector('div');
    if (content) {
      content.style.transform = 'scale(0.8)';
    }
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}// Enhanced Movies & Shows Hub - TMDB API Integration with Watch Later & Spinner

// TMDB API Configuration
const TMDB_CONFIG = {
  apiKey: "3fd2be6f0c70a2a598f084ddfb75487c",
  baseUrl: "https://api.themoviedb.org/3",
  imageBaseUrl: "https://image.tmdb.org/t/p/w500",
  imageBaseUrlSmall: "https://image.tmdb.org/t/p/w300",
};

// IndexedDB setup for Watch Later functionality
class WatchLaterDB {
  constructor() {
    this.dbName = 'MoviesHubDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        if (!this.db.objectStoreNames.contains('watchLater')) {
          const store = this.db.createObjectStore('watchLater', { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('addedAt', 'addedAt', { unique: false });
        }
      };
    });
  }

  async add(item) {
    const transaction = this.db.transaction(['watchLater'], 'readwrite');
    const store = transaction.objectStore('watchLater');
    return store.add({
      ...item,
      addedAt: new Date().toISOString()
    });
  }

  async remove(id) {
    const transaction = this.db.transaction(['watchLater'], 'readwrite');
    const store = transaction.objectStore('watchLater');
    return store.delete(id);
  }

  async getAll() {
    const transaction = this.db.transaction(['watchLater'], 'readonly');
    const store = transaction.objectStore('watchLater');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async exists(id) {
    const transaction = this.db.transaction(['watchLater'], 'readonly');
    const store = transaction.objectStore('watchLater');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    const transaction = this.db.transaction(['watchLater'], 'readwrite');
    const store = transaction.objectStore('watchLater');
    return store.clear();
  }
}

// Enhanced movie state management
let movieState = {
  currentGenre: "popular",
  currentPage: 1,
  totalPages: 1,
  currentMovies: [],
  genres: {},
  isLoading: false,
  lastFetch: 0,
  selectedCategory: "movie", // movie or tv
  watchLaterDB: new WatchLaterDB(),
  watchLaterItems: [],
  spinnerMovies: [],
  isSpinning: false
};

// Genre mappings from TMDB
const GENRE_CATEGORIES = {
  popular: { name: "Popular Now", endpoint: "popular", icon: "🔥" },
  trending: { name: "Trending", endpoint: "trending", icon: "📈" },
  topRated: { name: "Top Rated", endpoint: "top_rated", icon: "⭐" },
  upcoming: { name: "Coming Soon", endpoint: "upcoming", icon: "🎬" },
  action: { name: "Action", genreId: 28, icon: "💥" },
  comedy: { name: "Comedy", genreId: 35, icon: "😄" },
  drama: { name: "Drama", genreId: 18, icon: "🎭" },
  horror: { name: "Horror", genreId: 27, icon: "👻" },
  romance: { name: "Romance", genreId: 10749, icon: "💕" },
  scifi: { name: "Sci-Fi", genreId: 878, icon: "🚀" },
  fantasy: { name: "Fantasy", genreId: 14, icon: "🧙" },
  thriller: { name: "Thriller", genreId: 53, icon: "😱" },
  animation: { name: "Animation", genreId: 16, icon: "🎨" },
  family: { name: "Family", genreId: 10751, icon: "👨‍👩‍👧‍👦" },
};

// Initialize Watch Later functionality
async function initWatchLater() {
  try {
    await movieState.watchLaterDB.init();
    await loadWatchLaterItems();
    console.log("✅ Watch Later DB initialized");
  } catch (error) {
    console.error("❌ Watch Later DB initialization failed:", error);
    if (typeof showToast === "function") {
      showToast("Failed to load watch later list", "error");
    }
  }
}

// Load watch later items from IndexedDB
async function loadWatchLaterItems() {
  try {
    movieState.watchLaterItems = await movieState.watchLaterDB.getAll();
    renderWatchLaterSection();
    updateWatchLaterCounter();
  } catch (error) {
    console.error("Error loading watch later items:", error);
  }
}

// Toggle item in watch later list
async function toggleWatchLater(item, buttonElement) {
  try {
    const exists = await movieState.watchLaterDB.exists(item.id);
    
    if (exists) {
      await movieState.watchLaterDB.remove(item.id);
      buttonElement.textContent = "❤️";
      buttonElement.classList.remove("added");
      if (typeof showToast === "function") {
        showToast(`Removed "${item.title}" from watch later`, "success");
      }
    } else {
      await movieState.watchLaterDB.add(item);
      buttonElement.textContent = "💖";
      buttonElement.classList.add("added");
      if (typeof showToast === "function") {
        showToast(`Added "${item.title}" to watch later`, "success");
      }
    }
    
    await loadWatchLaterItems();
  } catch (error) {
    console.error("Error toggling watch later:", error);
    if (typeof showToast === "function") {
      showToast("Failed to update watch later list", "error");
    }
  }
}

// Remove item from watch later
async function removeFromWatchLater(id) {
  try {
    await movieState.watchLaterDB.remove(parseInt(id));
    await loadWatchLaterItems();
    if (typeof showToast === "function") {
      showToast("Removed from watch later", "success");
    }
  } catch (error) {
    console.error("Error removing from watch later:", error);
    if (typeof showToast === "function") {
      showToast("Failed to remove item", "error");
    }
  }
}

// Render watch later section
function renderWatchLaterSection() {
  const grid = document.getElementById("watchLaterGrid");
  const subtitle = document.getElementById("watchLaterSubtitle");
  
  if (!grid) return;

  if (movieState.watchLaterItems.length === 0) {
    grid.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 1rem; grid-column: 1 / -1;">
        Add movies and shows to your watch later list by clicking the ❤️ button!
      </div>
    `;
    if (subtitle) subtitle.textContent = "Your personal collection";
    return;
  }

  if (subtitle) {
    subtitle.textContent = `${movieState.watchLaterItems.length} items saved`;
  }
  
  grid.innerHTML = "";

  movieState.watchLaterItems
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    .forEach(item => {
      const watchLaterItem = document.createElement("div");
      watchLaterItem.className = "watch-later-item";
      
      watchLaterItem.innerHTML = `
        <img src="${item.image}" alt="${item.title}" 
             loading="lazy"
             onerror="this.src='${getPlaceholderImage()}';">
        <button class="watch-later-remove" onclick="removeFromWatchLater('${item.id}')">
          ✕
        </button>
        <div class="watch-later-content">
          <div class="watch-later-item-title">${item.title}</div>
        </div>
      `;

      watchLaterItem.addEventListener("click", (e) => {
        if (!e.target.classList.contains("watch-later-remove")) {
          openMovieDetails(item);
        }
      });

      grid.appendChild(watchLaterItem);
    });
}

// Update watch later counter in header
function updateWatchLaterCounter() {
  const counter = document.getElementById("watchLaterCount");
  const button = document.getElementById("watchLaterCounter");
  
  if (counter) {
    counter.textContent = movieState.watchLaterItems.length;
  }

  if (button) {
    button.onclick = () => {
      const section = document.getElementById("watchLaterSection");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    };
  }
}

// Movie Spinner functionality
function createMovieSpinner() {
  if (movieState.currentMovies.length < 6) {
    if (typeof showToast === "function") {
      showToast("Need at least 6 movies loaded for spinner", "error");
    }
    return;
  }

  // Get 8 random movies for the spinner
  const shuffled = [...movieState.currentMovies].sort(() => 0.5 - Math.random());
  movieState.spinnerMovies = shuffled.slice(0, 8);

  const spinner = document.getElementById("movieSpinner");
  if (!spinner) return;

  // Clear existing segments
  const existingSegments = spinner.querySelectorAll(".spinner-segment");
  existingSegments.forEach(segment => segment.remove());

  // Define colors for each segment
  const segmentColors = [
    'linear-gradient(45deg, #e74c3c, #c0392b)',
    'linear-gradient(45deg, #3498db, #2980b9)',
    'linear-gradient(45deg, #f39c12, #e67e22)',
    'linear-gradient(45deg, #27ae60, #229954)',
    'linear-gradient(45deg, #9b59b6, #8e44ad)',
    'linear-gradient(45deg, #e91e63, #ad1457)',
    'linear-gradient(45deg, #ff5722, #d84315)',
    'linear-gradient(45deg, #607d8b, #455a64)'
  ];

  // Create 8 segments (45 degrees each)
  movieState.spinnerMovies.forEach((movie, index) => {
    const segment = document.createElement("div");
    segment.className = "spinner-segment";
    
    const angle = (360 / 8) * index;
    
    // Proper positioning for segments to fill the entire circle
    segment.style.cssText = `
      position: absolute;
      width: 50%;
      height: 50%;
      top: 50%;
      left: 50%;
      transform-origin: 0 0;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(${angle}deg);
      background: ${segmentColors[index]};
    `;

    // Add the triangular clip path using pseudo-element
    segment.style.setProperty('clip-path', 'polygon(0 0, 100% 0, 0 100%)');
    
    // Create text element
    const textElement = document.createElement("div");
    textElement.style.cssText = `
      position: absolute;
      top: 20%;
      left: 10%;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      text-align: center;
      line-height: 1.1;
      padding: 0.3rem;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      word-wrap: break-word;
      max-width: 60px;
      z-index: 10;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      transform: rotate(${-angle + 22.5}deg);
    `;
    textElement.textContent = movie.title;

    segment.appendChild(textElement);

    segment.addEventListener("click", () => {
      if (!movieState.isSpinning) {
        openMovieDetails(movie);
      }
    });

    // Add hover effect
    segment.addEventListener("mouseenter", () => {
      segment.style.filter = "brightness(1.2)";
      segment.style.borderColor = "rgba(255, 255, 255, 0.5)";
    });

    segment.addEventListener("mouseleave", () => {
      segment.style.filter = "";
      segment.style.borderColor = "rgba(255, 255, 255, 0.2)";
    });

    spinner.appendChild(segment);
  });

  // Show spinner container
  const spinnerContainer = document.getElementById("spinnerContainer");
  if (spinnerContainer) {
    spinnerContainer.style.display = "block";
  }
}

// Spin the wheel animation
function spinWheel() {
  if (movieState.isSpinning) return;
  
  if (movieState.currentMovies.length < 6) {
    if (typeof showToast === "function") {
      showToast("Load some movies first!", "error");
    }
    return;
  }

  movieState.isSpinning = true;
  const randomBtn = document.getElementById("randomPickBtn");
  if (randomBtn) {
    randomBtn.disabled = true;
    randomBtn.textContent = "🎲 Spinning...";
  }

  // Create or refresh spinner
  createMovieSpinner();

  const spinner = document.getElementById("movieSpinner");
  if (!spinner) return;

  // Add spinning animation
  spinner.classList.add("spinner-spinning");

  // Calculate final rotation - pointer is at top (12 o'clock)
  // Each segment is 45 degrees, we want to land in the middle of a segment
  const randomIndex = Math.floor(Math.random() * 8);
  const segmentAngle = 360 / 8; // 45 degrees per segment
  const segmentCenter = (randomIndex * segmentAngle) + (segmentAngle / 2); // Center of the segment
  
  // The pointer is at the top, so we need to rotate so the selected segment is at the top
  // We want multiple full rotations plus landing on the selected segment
  const finalAngle = 1800 + (360 - segmentCenter); // 5 full rotations, then position selected segment at top

  spinner.style.transform = `rotate(${finalAngle}deg)`;

  // After animation completes
  setTimeout(() => {
    const selectedMovie = movieState.spinnerMovies[randomIndex];
    
    // Highlight the selected segment briefly
    const segments = spinner.querySelectorAll(".spinner-segment");
    if (segments[randomIndex]) {
      segments[randomIndex].style.filter = "brightness(1.5) saturate(1.3)";
      segments[randomIndex].style.transform += " scale(1.05)";
      
      setTimeout(() => {
        segments[randomIndex].style.filter = "";
        segments[randomIndex].style.transform = segments[randomIndex].style.transform.replace(" scale(1.05)", "");
      }, 1000);
    }
    
    openMovieDetails(selectedMovie);
    
    // Reset
    movieState.isSpinning = false;
    if (randomBtn) {
      randomBtn.disabled = false;
      randomBtn.textContent = "🎲 Spin for Random Pick";
    }
    
    // Remove animation class
    spinner.classList.remove("spinner-spinning");
    spinner.style.transform = "rotate(0deg)";
    
    if (typeof showToast === "function") {
      showToast(`🎯 Spinner selected: "${selectedMovie.title}"!`, "success");
    }
  }, 3000);
}

// Fetch movies from TMDB API
async function fetchMoviesFromTMDB(category = "popular", page = 1) {
  try {
    movieState.isLoading = true;
    showLoadingState();

    let url;
    const categoryInfo = GENRE_CATEGORIES[category];

    if (!categoryInfo) {
      throw new Error("Invalid category");
    }

    // Build API URL based on category type
    if (categoryInfo.endpoint) {
      // Special endpoints like popular, trending, top_rated
      if (categoryInfo.endpoint === "trending") {
        url = `${TMDB_CONFIG.baseUrl}/trending/${movieState.selectedCategory}/week?api_key=${TMDB_CONFIG.apiKey}&page=${page}`;
      } else {
        url = `${TMDB_CONFIG.baseUrl}/${movieState.selectedCategory}/${categoryInfo.endpoint}?api_key=${TMDB_CONFIG.apiKey}&page=${page}`;
      }
    } else if (categoryInfo.genreId) {
      // Genre-based filtering
      url = `${TMDB_CONFIG.baseUrl}/discover/${movieState.selectedCategory}?api_key=${TMDB_CONFIG.apiKey}&with_genres=${categoryInfo.genreId}&page=${page}&sort_by=popularity.desc`;
    }

    console.log(
      `🎬 Fetching ${categoryInfo.name} ${movieState.selectedCategory} (page ${page})...`
    );

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error("No results found");
    }

    // Process movies/shows
    const processedItems = data.results.map((item) => ({
      id: item.id,
      title: item.title || item.name, // movies have 'title', TV shows have 'name'
      originalTitle: item.original_title || item.original_name,
      overview: item.overview || "No description available.",
      releaseDate: item.release_date || item.first_air_date,
      year: item.release_date
        ? new Date(item.release_date).getFullYear()
        : item.first_air_date
        ? new Date(item.first_air_date).getFullYear()
        : "TBA",
      rating: item.vote_average
        ? Math.round(item.vote_average * 10) / 10
        : "N/A",
      voteCount: item.vote_count || 0,
      popularity: item.popularity || 0,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      genreIds: item.genre_ids || [],
      adult: item.adult || false,
      image: item.poster_path
        ? `${TMDB_CONFIG.imageBaseUrlSmall}${item.poster_path}`
        : getPlaceholderImage(),
      tmdbUrl: `https://www.themoviedb.org/${movieState.selectedCategory}/${item.id}`,
      type: movieState.selectedCategory,
    }));

    movieState.currentMovies =
      page === 1
        ? processedItems
        : [...movieState.currentMovies, ...processedItems];
    movieState.currentPage = page;
    movieState.totalPages = Math.min(data.total_pages, 500); // TMDB limits to 500 pages
    movieState.lastFetch = Date.now();

    console.log(
      `✅ Loaded ${processedItems.length} ${movieState.selectedCategory} (page ${page}/${movieState.totalPages})`
    );

    return processedItems;
  } catch (error) {
    console.error("❌ Error fetching from TMDB:", error);
    showErrorMessage(
      `Failed to load ${movieState.selectedCategory}: ${error.message}`
    );
    return [];
  } finally {
    movieState.isLoading = false;
  }
}

// Get placeholder image for movies without posters
function getPlaceholderImage() {
  return `https://images.unsplash.com/photo-1489599735188-900089b31391?w=300&h=450&fit=crop&q=80`;
}

// Search movies/shows
async function searchMovies(query, page = 1) {
  try {
    if (!query.trim()) return [];

    movieState.isLoading = true;
    showLoadingState();

    const url = `${TMDB_CONFIG.baseUrl}/search/${
      movieState.selectedCategory
    }?api_key=${TMDB_CONFIG.apiKey}&query=${encodeURIComponent(
      query
    )}&page=${page}`;

    console.log(`🔍 Searching for "${query}"...`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);

    const data = await response.json();
    const results = data.results || [];

    console.log(`✅ Found ${results.length} search results`);
    
    // Process search results
    const processedResults = results.map((item) => ({
      id: item.id,
      title: item.title || item.name,
      overview: item.overview || "No description available.",
      year: item.release_date
        ? new Date(item.release_date).getFullYear()
        : item.first_air_date
        ? new Date(item.first_air_date).getFullYear()
        : "TBA",
      rating: item.vote_average
        ? Math.round(item.vote_average * 10) / 10
        : "N/A",
      voteCount: item.vote_count || 0,
      image: item.poster_path
        ? `${TMDB_CONFIG.imageBaseUrlSmall}${item.poster_path}`
        : getPlaceholderImage(),
      tmdbUrl: `https://www.themoviedb.org/${movieState.selectedCategory}/${item.id}`,
      type: movieState.selectedCategory,
    }));

    return processedResults;
  } catch (error) {
    console.error("❌ Search error:", error);
    showErrorMessage(`Search failed: ${error.message}`);
    return [];
  } finally {
    movieState.isLoading = false;
  }
}

// UI Functions
function showLoadingState() {
  const container = document.getElementById("movieCards");
  if (!container) return;

  container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 2rem; width: 100%; color: var(--text-muted);">
          <div class="loading-spinner"></div>
          <span>Loading ${movieState.selectedCategory}...</span>
        </div>
      `;
}

function showErrorMessage(message) {
  const container = document.getElementById("movieCards");
  if (!container) return;

  container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); width: 100%;">
          <p style="margin-bottom: 1rem;">${message}</p>
          <button onclick="loadMovies()" style="
            padding: 0.75rem 1.5rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Try Again</button>
        </div>
      `;
}

// Create movie/show card with watch later functionality
async function createMovieCard(item) {
  const card = document.createElement("div");
  card.className = "movie-card";

  // Check if item is in watch later
  const isInWatchLater = await movieState.watchLaterDB.exists(item.id);

  // Determine rating color
  const ratingColor =
    item.rating >= 8 ? "#27ae60" : item.rating >= 6 ? "#f39c12" : "#e74c3c";

  card.innerHTML = `
        <div class="movie-poster">
          <img src="${item.image}" alt="${item.title}" 
               loading="lazy"
               onerror="this.src='${getPlaceholderImage()}';">
          
          ${
            item.rating !== "N/A"
              ? `
            <div class="rating-badge ${
              item.rating >= 8
                ? "rating-good"
                : item.rating >= 6
                ? "rating-okay"
                : "rating-poor"
            }">
              ⭐ ${item.rating}
            </div>
          `
              : ""
          }
          
          <div class="year-badge">
            ${item.year}
          </div>
          
          <div class="type-badge">
            ${item.type === "movie" ? "🎬 Movie" : "📺 TV Show"}
          </div>

          <button class="watch-later-btn ${isInWatchLater ? "added" : ""}" 
                  onclick="event.stopPropagation(); toggleWatchLater(${JSON.stringify(item).replace(/"/g, '&quot;')}, this)">
            ${isInWatchLater ? "💖" : "❤️"}
          </button>
        </div>
        
        <div class="movie-content">
          <h4 class="movie-title">${item.title}</h4>
          
          <p class="movie-overview">${item.overview}</p>
          
          <div class="movie-meta">
            ${
              item.voteCount > 0
                ? `
              <span class="meta-tag">${item.voteCount.toLocaleString()} votes</span>
            `
                : ""
            }
          </div>
        </div>
      `;

  // Click handler for main card - now shows info modal instead of auto-opening
  card.addEventListener("click", (e) => {
    if (!e.target.classList.contains("watch-later-btn")) {
      showMovieInfo(item);
    }
  });

  return card;
}

// Open movie/show details - now shows info modal
function openMovieDetails(item) {
  console.log(`🎬 Showing info for: ${item.title}`);
  showMovieInfo(item);
}`, "success");
  }
}

// Create genre filter buttons
function createGenreFilters() {
  const genreContainer = document.getElementById("genreButtons");
  if (!genreContainer) return;

  genreContainer.innerHTML = "";

  Object.entries(GENRE_CATEGORIES).forEach(([key, genre]) => {
    const button = document.createElement("button");
    button.textContent = `${genre.icon} ${genre.name}`;
    button.className = `filter-btn ${
      movieState.currentGenre === key ? "active" : ""
    }`;

    button.addEventListener("click", () => {
      movieState.currentGenre = key;
      movieState.currentMovies = [];
      movieState.currentPage = 1;
      createGenreFilters(); // Refresh active states
      loadMovies(key);
    });

    genreContainer.appendChild(button);
  });
}

// Create type selector (Movies vs TV Shows)
function createTypeSelector() {
  const typeButtons = document.querySelectorAll(".type-btn");
  typeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-type");
      movieState.selectedCategory = type;
      movieState.currentMovies = [];
      movieState.currentPage = 1;

      // Update active states
      typeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      loadMovies(movieState.currentGenre);
    });
  });
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById("movieSearchInput");
  const searchBtn = document.getElementById("movieSearchBtn");

  const handleSearch = async () => {
    const query = searchInput.value.trim();
    if (query) {
      const results = await searchMovies(query);
      await renderMovies(results, `Search: "${query}"`);
      
      // Reset genre filter to show we're in search mode
      movieState.currentGenre = "search";
      createGenreFilters();
    }
  };

  if (searchBtn) searchBtn.addEventListener("click", handleSearch);
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }
}

// Render movies/shows with enhanced watch later integration
async function renderMovies(items, categoryName = null) {
  const container = document.getElementById("movieCards");
  if (!container) return;

  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: var(--text-muted); width: 100%;">
            <p>No ${movieState.selectedCategory === "movie" ? "movies" : "TV shows"} found. Try a different category!</p>
          </div>
        `;
    return;
  }

  // Create cards with async watch later check
  for (const item of items) {
    const card = await createMovieCard(item);
    container.appendChild(card);
  }

  // Show load more button if there are more pages (not for search results)
  const loadMoreSection = document.getElementById("loadMoreSection");
  if (
    movieState.currentPage < movieState.totalPages &&
    !categoryName?.includes("Search")
  ) {
    if (loadMoreSection) {
      loadMoreSection.style.display = "block";
      const loadMoreBtn = document.getElementById("loadMoreBtn");
      if (loadMoreBtn) {
        loadMoreBtn.textContent = `Load More ${
          movieState.selectedCategory === "movie" ? "Movies" : "TV Shows"
        } (Page ${movieState.currentPage + 1})`;
        loadMoreBtn.onclick = () => loadMoreMovies();
      }
    }
  } else {
    if (loadMoreSection) {
      loadMoreSection.style.display = "none";
    }
  }

  // Show success message
  const genreName =
    categoryName || GENRE_CATEGORIES[movieState.currentGenre]?.name || "items";
  
  if (typeof showToast === "function") {
    showToast(
      `🎬 Loaded ${items.length} ${genreName.toLowerCase()}!`,
      "success"
    );
  }
}

// Load movies for a specific genre/category
async function loadMovies(category = "popular") {
  movieState.currentGenre = category;
  movieState.currentPage = 1;
  movieState.currentMovies = [];

  const items = await fetchMoviesFromTMDB(category, 1);
  if (items.length > 0) {
    await renderMovies(items);
  }
}

// Load more movies (pagination)
async function loadMoreMovies() {
  if (movieState.isLoading || movieState.currentPage >= movieState.totalPages) {
    return;
  }

  const nextPage = movieState.currentPage + 1;
  const newItems = await fetchMoviesFromTMDB(movieState.currentGenre, nextPage);

  if (newItems.length > 0) {
    await renderMovies(movieState.currentMovies); // Re-render all items including new ones
  }
}

// Initialize Enhanced Movies Hub
async function initializeMoviesHub() {
  console.log("🎬 Initializing Enhanced Movies & Shows Hub...");

  try {
    // Initialize Watch Later database first
    await initWatchLater();

    // Create genre filters
    createGenreFilters();

    // Setup type selector
    createTypeSelector();

    // Setup search functionality
    setupSearch();

    // Setup random pick spinner
    const randomBtn = document.getElementById("randomPickBtn");
    if (randomBtn) {
      randomBtn.addEventListener("click", spinWheel);
    }

    // Load initial movies
    await loadMovies("popular");

    console.log("✅ Enhanced Movies & Shows Hub ready!");
  } catch (error) {
    console.error("❌ Enhanced Movies Hub initialization failed:", error);
    if (typeof showToast === "function") {
      showToast("Failed to initialize Movies Hub", "error");
    }
  }
}

// Export functions for global access
if (typeof window !== "undefined") {
  window.initializeMoviesHub = initializeMoviesHub;
  window.loadMovies = loadMovies;
  window.toggleWatchLater = toggleWatchLater;
  window.removeFromWatchLater = removeFromWatchLater;
  window.spinWheel = spinWheel;
  window.showMovieInfo = showMovieInfo;
  window.closeMovieInfo = closeMovieInfo;
  window.shortenTitle = shortenTitle;
  window.movieState = movieState;
}

// Auto-initialize if DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMoviesHub);
  } else {
    initializeMoviesHub();
  }
}