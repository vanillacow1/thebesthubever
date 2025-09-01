console.log("🌲 Bean's Cozy Hub - Starting up...");

// Love notes rotation
const loveNotes = [
  "You brighten my day 💛",
  "You're the best, Bean 🌸",
  "Love you endlessly 💕",
  "You're magical, truly ✨",
  "Welcome to your sanctuary 🌲",
  "Cozy vibes await 🍄",
  "Your creativity inspires 🎨",
  "Making magic happen ⭐",
];

let noteIndex = 0;

// Initialize love notes rotation
function initializeLoveNotes() {
  const noteEl = document.getElementById("loveNote");
  if (noteEl) {
    // Set initial note
    noteEl.textContent = loveNotes[0];

    // Start rotation
    setInterval(() => {
      noteIndex = (noteIndex + 1) % loveNotes.length;
      noteEl.textContent = loveNotes[noteIndex];
    }, 5000); // Changed to 5 seconds for better reading time

    console.log("💚 Love notes initialized with", loveNotes.length, "messages");
  }
}

// To-do app integration functions
function openTodoApp() {
  console.log("🔧 Opening Bean's To-Do app...");
  const modal = document.getElementById("todoModal");
  const iframe = document.getElementById("todoFrame");

  if (modal && iframe) {
    // Set the iframe source
    iframe.src = "https://vanillacow1.github.io/Bean-to-do/";

    // Show the modal
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Prevent background scrolling

    // Add loading feedback
    const clickedCard = event?.target?.closest(".todo-button");
    if (clickedCard) {
      clickedCard.style.transform = "scale(0.95)";
      setTimeout(() => {
        clickedCard.style.transform = "";
      }, 200);
    }

    console.log("✅ To-Do app opened in modal");
    showToast("Opening your to-do app! ✔", "success");
  } else {
    console.error("❌ To-Do modal elements not found");
    showToast("Sorry, couldn't open to-do app", "error");
  }
}

function closeTodoApp() {
  console.log("🔒 Closing Bean's To-Do app...");
  const modal = document.getElementById("todoModal");
  const iframe = document.getElementById("todoFrame");

  if (modal && iframe) {
    // Hide the modal
    modal.style.display = "none";
    document.body.style.overflow = ""; // Restore background scrolling

    // Clear iframe source to stop any running processes
    iframe.src = "";

    console.log("✅ To-Do app closed");
  }
}

// Global status message utility
function showStatus(message, type = "info") {
  console.log(`[${type.toUpperCase()}] ${message}`);

  const statusEl = document.getElementById("statusMessage");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
    statusEl.style.display = "block";

    // Auto-hide non-error messages
    if (type !== "error") {
      setTimeout(() => {
        statusEl.style.display = "none";
      }, 3000);
    }
  } else {
    // If no status element, show as toast for individual pages
    showToast(message, type);
  }
}

// Toast notification for individual pages
function showToast(message, type = "info") {
  // Remove existing toast
  const existingToast = document.getElementById("globalToast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.id = "globalToast";
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 300px;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 500;
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  `;

  // Set colors based on type
  if (type === "success") {
    toast.style.background = "linear-gradient(135deg, #27ae60, #2ecc71)";
    toast.style.color = "white";
    toast.style.border = "1px solid #2ecc71";
  } else if (type === "error") {
    toast.style.background = "linear-gradient(135deg, #e74c3c, #ec7063)";
    toast.style.color = "white";
    toast.style.border = "1px solid #e74c3c";
  } else if (type === "info") {
    toast.style.background = "rgba(52, 152, 219, 0.95)";
    toast.style.color = "white";
    toast.style.border = "1px solid #3498db";
  } else {
    toast.style.background = "rgba(0, 0, 0, 0.8)";
    toast.style.color = "white";
    toast.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  }

  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 10);

  // Auto-remove
  setTimeout(
    () => {
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    },
    type === "error" ? 5000 : 3000
  );
}

// Loading state management for any container
function showLoadingState(containerId, message = "Loading...") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container '${containerId}' not found for loading state`);
    return;
  }

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; padding: 2rem; color: #666;">
      <div class="loading-spinner"></div>
      <span style="margin-left: 0.5rem;">${message}</span>
    </div>
  `;
}

// Skeleton loading for lists
function showSkeletonLoading(containerId, itemCount = 5) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const skeletons = Array.from(
    { length: itemCount },
    (_, i) => `
    <div class="skeleton-item" style="margin-bottom: 1rem;">
      <div class="loading-skeleton" style="width: 60px; height: 60px; border-radius: 8px; margin-bottom: 0.5rem;"></div>
      <div class="loading-skeleton" style="height: 16px; width: 80%; margin-bottom: 0.5rem; border-radius: 4px;"></div>
      <div class="loading-skeleton" style="height: 14px; width: 60%; border-radius: 4px;"></div>
    </div>
  `
  ).join("");

  container.innerHTML = skeletons;
}

// Section loading state management
function addSectionLoadingState(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add("loading");
  }
}

function removeSectionLoadingState(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove("loading");
  }
}

// Enhanced module initialization with error handling and status
async function initializeModule(moduleName, initFunction, required = false) {
  try {
    console.log(`🔧 Initializing ${moduleName}...`);

    if (typeof initFunction === "function") {
      // Try to initialize the module
      await initFunction();
      console.log(`✅ ${moduleName} initialized successfully`);
      return true;
    } else {
      console.warn(`⚠️ ${moduleName} initialization function not found`);
      if (required) {
        showStatus(`${moduleName} module not available`, "error");
      }
      return false;
    }
  } catch (error) {
    console.error(`❌ Error initializing ${moduleName}:`, error);
    if (required) {
      showStatus(
        `Failed to initialize ${moduleName}: ${error.message}`,
        "error"
      );
    }
    return false;
  }
}

// To-do app initialization and event handlers
function initializeTodoApp() {
  console.log("✔ Initializing To-Do app integration...");

  // Set up modal close handlers
  setupTodoModalHandlers();

  console.log("✅ To-Do app integration ready");
}

function setupTodoModalHandlers() {
  // Close modal when clicking outside of it
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("todoModal");
    if (event.target === modal) {
      closeTodoApp();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      const modal = document.getElementById("todoModal");
      if (modal && modal.style.display === "block") {
        closeTodoApp();
      }
    }
  });

  console.log("🎯 To-Do modal event handlers set up");
}

// Games Hub initialization function - NEW
function initializeGamesHub() {
  console.log("🎮 Initializing Games Hub...");

  // Check if we're on the games page
  if (
    typeof initializeGamesHub !== "undefined" &&
    window.location.pathname.includes("games.html")
  ) {
    // Games hub initialization is handled by the games.html file itself
    console.log("✅ Games Hub page detected, using embedded initialization");
    return true;
  }

  // For other pages, just mark as ready
  console.log("✅ Games Hub integration ready");
  return true;
}

// Main app initialization
async function initializeApp() {
  console.log("🚀 Initializing Bean's Cozy Hub...");

  // Initialize love notes first (for homepage)
  initializeLoveNotes();

  // Initialize to-do app functionality
  initializeTodoApp();

  // Add global loading styles if not present
  if (!document.querySelector("style[data-loading-styles]")) {
    const loadingStyles = document.createElement("style");
    loadingStyles.setAttribute("data-loading-styles", "true");
    loadingStyles.textContent = `
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }

      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .section.loading {
        opacity: 0.6;
        pointer-events: none;
      }
    `;
    document.head.appendChild(loadingStyles);
    console.log("🎨 Global loading styles added");
  }

  // Initialize modules based on current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  console.log(`📍 Current page: ${currentPage}`);

  // Track initialization results
  const initResults = {};

  // Always try to initialize core modules (for cross-page functionality)
  try {
    // YouTube creators module
    if (typeof initializeYouTubeModule === "function") {
      initResults.creators = await initializeModule(
        "Creators Hub (YouTube)",
        initializeYouTubeModule
      );
    }

    // Recipes module
    if (typeof initializeRecipesHub === "function") {
      initResults.recipes = await initializeModule(
        "Recipes Hub",
        initializeRecipesHub
      );
    }

    // Movies module
    if (typeof initializeMoviesHub === "function") {
      initResults.movies = await initializeModule(
        "Movies Hub (TMDB)",
        initializeMoviesHub
      );
    }

    // Games module - NEW
    initResults.games = await initializeModule(
      "Games Hub (RAWG)",
      initializeGamesHub
    );

    // Plants module
    if (typeof initializePlantsHub === "function") {
      initResults.plants = await initializeModule(
        "Plants Hub (Garden Care)",
        initializePlantsHub
      );
    }
  } catch (error) {
    console.error("❌ Error during module initialization:", error);
  }

  // Page-specific initialization
  switch (currentPage) {
    case "index.html":
    case "":
      console.log("🏡 Homepage detected - setting up navigation");
      initializeHomepage();
      break;

    case "music.html":
      console.log("🎵 Music page detected - simplified Spotify connection");
      // Music hub is now self-contained with inline JS
      console.log("🎧 Music hub ready (self-contained)");
      break;

    case "recipes.html":
      console.log("🍲 Recipes page detected");
      if (!initResults.recipes) {
        showStatus("Recipes module failed to load", "error");
      }
      break;

    case "knitting.html":
      console.log(
        "🧶 Knitting page detected - self-contained with Reddit integration"
      );
      // Knitting hub is now self-contained in the HTML file with real Reddit API
      console.log(
        "🧶 Knitting hub ready (self-contained with live Reddit data)"
      );
      break;

    case "creators.html":
      console.log("📺 Creators page detected");
      if (!initResults.creators) {
        showStatus("Creators module failed to load", "error");
      }
      break;

    case "movies.html":
      console.log("🎬 Movies page detected");
      if (!initResults.movies) {
        showStatus("Movies module failed to load", "error");
      }
      break;

    case "games.html": // NEW
      console.log("🎮 Games page detected");
      if (!initResults.games) {
        showStatus("Games module failed to load", "error");
      } else {
        console.log("🎮 Games Hub fully operational!");
      }
      break;

    case "plants.html":
      console.log("🌱 Plants page detected");
      if (!initResults.plants) {
        showStatus("Plants module failed to load", "error");
      } else {
        console.log("🌿 Plants Hub fully operational!");
      }
      break;

    default:
      console.log("📄 Unknown page, initializing base functionality");
  }

  // Set up universal feature buttons (for any page that has them)
  setupUniversalButtons();

  // Add global mobile touch feedback
  addGlobalTouchFeedback();

  // Report initialization completion
  const successCount = Object.values(initResults).filter(Boolean).length;
  const totalCount = Object.keys(initResults).length;

  console.log(
    `🎉 App initialization complete! (${successCount}/${totalCount} modules loaded)`
  );

  if (successCount > 0) {
    console.log(
      "✅ Successfully loaded:",
      Object.keys(initResults)
        .filter((key) => initResults[key])
        .join(", ")
    );
  }

  if (successCount < totalCount) {
    console.log(
      "⚠️ Failed to load:",
      Object.keys(initResults)
        .filter((key) => !initResults[key])
        .join(", ")
    );
  }

  // Show welcome message on homepage
  if (currentPage === "index.html" || currentPage === "") {
    setTimeout(() => {
      showToast("Welcome to your cozy hub, Bean! 🌲✨", "success");
    }, 1000);
  }
}

// Homepage-specific initialization
function initializeHomepage() {
  console.log("🏡 Setting up homepage navigation...");

  // Set up navigation cards - includes all sections including games
  const navCards = document.querySelectorAll(".nav-card:not(.coming-soon)");
  navCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      const section = this.classList[1]; // Get the section class (music, recipes, etc.)
      if (section) {
        console.log(`🧭 Navigating to ${section} page`);
        // Add loading animation
        this.style.transform = "scale(0.95)";
        setTimeout(() => {
          window.location.href = `${section}.html`;
        }, 200);
      }
    });
  });

  // Add click feedback to coming soon cards
  const comingSoonCards = document.querySelectorAll(".nav-card.coming-soon");
  comingSoonCards.forEach((card) => {
    card.addEventListener("click", function () {
      showToast("This section is growing! Check back soon 🌱", "info");
    });
  });

  // Set up to-do button
  const todoButton = document.querySelector(".todo-button");
  if (todoButton) {
    todoButton.addEventListener("click", openTodoApp);
    console.log("✔ To-Do button connected");
  }

  console.log(`🎯 Navigation set up for ${navCards.length} active sections`);
}

// Set up universal feature buttons that might appear on any page
function setupUniversalButtons() {
  // Generic feature buttons
  const buttons = [
    {
      id: "addPlantBtn",
      message: "Plant care features now available! 🌱 Check the Plants hub!",
    },
    { id: "surpriseMeBtn", message: "Surprise content loading... ✨" },
    { id: "randomContentBtn", message: "Finding something random for you! 🎲" },
    { id: "shareBtn", message: "Sharing features coming soon! 📤" },
    { id: "settingsBtn", message: "Settings panel coming soon! ⚙️" },
  ];

  buttons.forEach(({ id, message }) => {
    const btn = document.getElementById(id);
    if (btn && !btn.hasAttribute("data-initialized")) {
      btn.setAttribute("data-initialized", "true");
      btn.addEventListener("click", () => {
        showToast(message, "info");
        console.log(`📘 Button clicked: ${id}`);
      });
    }
  });
}

// Add global touch feedback for mobile devices
function addGlobalTouchFeedback() {
  // Add touch feedback to common interactive elements
  const interactiveSelectors = [
    ".nav-card:not(.coming-soon)",
    ".todo-button",
    ".back-btn",
    ".connect-btn",
    ".random-btn",
    ".refresh-btn",
    ".filter-btn",
    ".toggle-btn",
    "button:not(.control-btn)",
    ".card-item",
    ".song-row",
    ".playlist-item",
    ".recipe-card",
    ".pattern-card",
    ".video-card",
    ".movie-card",
    ".game-card", // NEW - Games Hub selector
    ".discovery-item",
    ".action-btn",
    ".refresh-panel-btn",
    // Plants Hub selectors
    ".plant-card",
    ".result-card",
    ".reminder-item",
    ".search-btn",
    // Knitting Hub selectors
    ".content-card",
    ".source-tab",
    ".load-more-btn",
    // Games Hub selectors - NEW
    ".shelf-item",
    ".recommendation-card",
    ".filter-btn",
    ".sort-btn",
  ];

  interactiveSelectors.forEach((selector) => {
    document.addEventListener(
      "touchstart",
      function (e) {
        if (e.target.matches(selector) || e.target.closest(selector)) {
          const element = e.target.matches(selector)
            ? e.target
            : e.target.closest(selector);
          if (element && !element.hasAttribute("data-touch-feedback")) {
            element.setAttribute("data-touch-feedback", "true");
            const originalTransform = element.style.transform;
            element.style.transform = "scale(0.95)";
            element.style.transition = "transform 0.1s ease";

            const resetTransform = () => {
              element.style.transform = originalTransform;
              element.removeAttribute("data-touch-feedback");
            };

            element.addEventListener("touchend", resetTransform, {
              once: true,
            });
            element.addEventListener("touchcancel", resetTransform, {
              once: true,
            });
          }
        }
      },
      { passive: true }
    );
  });

  console.log("📱 Global touch feedback enabled (including Games Hub)");
}

// Navigation function - supports all sections including games
function navigateTo(section) {
  // Add loading animation
  const clickedCard = event?.target?.closest(".nav-card");
  if (clickedCard) {
    clickedCard.style.transform = "scale(0.95)";

    // Navigate to any section including games
    console.log(`🧭 Navigating to ${section} Hub...`);
    setTimeout(() => {
      window.location.href = `${section}.html`;
    }, 200);
  }
}

// Error handling for missing modules
window.addEventListener("error", function (e) {
  console.error("💥 Global error caught:", e.error);
  if (
    e.error.message.includes("module") ||
    e.error.message.includes("function")
  ) {
    showToast(
      "Some features may not be available. Please refresh the page.",
      "error"
    );
  }
});

// Performance monitoring
window.addEventListener("load", function () {
  const loadTime = performance.now();
  console.log(`⚡ Page loaded in ${Math.round(loadTime)}ms`);

  // Report any console errors for debugging
  if (console.error !== console.log) {
    const originalError = console.error;
    console.error = function (...args) {
      originalError.apply(console, args);
      // Could send to analytics here
    };
  }
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  // If script loads after DOM is ready
  initializeApp();
}

// Export functions for global use
window.AppUtils = {
  showStatus,
  showToast,
  showLoadingState,
  showSkeletonLoading,
  addSectionLoadingState,
  removeSectionLoadingState,
  initializeModule,
  navigateTo,
  openTodoApp,
  closeTodoApp,
};

// Make functions globally available for HTML onclick handlers
window.openTodoApp = openTodoApp;
window.closeTodoApp = closeTodoApp;
window.navigateTo = navigateTo;

console.log("🌲 Bean's Cozy Hub app.js loaded successfully!");
