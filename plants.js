// Plants Hub Module - Complete Plant Care System with Journey Tracking
// FIXED: Updated to use Perenual API v2 endpoints and completed all missing functions

// API Configuration
const PLANT_APIS = {
  perenual: {
    baseUrl: "https://perenual.com/api/v2", // Updated to v2
    // Free tier: 100 requests/day, 3000 species access
    apiKey: "sk-oDIp68a763c187fad11963", // You'll need to sign up at perenual.com
    endpoints: {
      species: "/species-list", // Updated endpoint
      details: "/species/details", // Updated endpoint
      careGuide: "/species-care-guide-list", // Updated endpoint
    },
  },
  // Backup API for free plant data
  housePlants: {
    baseUrl: "https://garden-api-fzyw.onrender.com",
    endpoints: {
      plants: "/plants",
      details: "/", // + plant id
    },
  },
};

// Plant care state management
let plantCareState = {
  myPlants: [],
  reminders: [],
  plantJourney: {},
  searchResults: [],
  isLoading: false,
  lastApiCall: 0,
  apiCooldown: 60000, // 1 minute between API calls
};

// Common houseplant data (fallback when APIs are limited)
const COMMON_HOUSEPLANTS = [
  {
    id: "snake-plant",
    common_name: "Snake Plant",
    scientific_name: ["Sansevieria trifasciata"],
    type: "houseplant",
    watering: "Minimal",
    watering_frequency: 14, // days
    sunlight: ["Low to bright indirect light"],
    care_level: "Easy",
    image:
      "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?w=300&h=200&fit=crop",
    care_tips: [
      "Water every 2-3 weeks",
      "Allow soil to dry completely between waterings",
      "Thrives in low light conditions",
      "Very drought tolerant",
    ],
    common_problems: ["Overwatering", "Root rot"],
    benefits: ["Air purifying", "Low maintenance", "Architectural appeal"],
  },
  {
    id: "pothos",
    common_name: "Golden Pothos",
    scientific_name: ["Epipremnum aureum"],
    type: "houseplant",
    watering: "Moderate",
    watering_frequency: 7, // days
    sunlight: ["Bright indirect light"],
    care_level: "Easy",
    image:
      "https://images.unsplash.com/photo-1586093248204-3d6ddb5d9b1a?w=300&h=200&fit=crop",
    care_tips: [
      "Water when top inch of soil is dry",
      "Thrives in bright, indirect light",
      "Can tolerate lower light conditions",
      "Trim to encourage bushier growth",
    ],
    common_problems: ["Yellowing leaves from overwatering", "Pest issues"],
    benefits: ["Fast growing", "Air purifying", "Easy propagation"],
  },
  {
    id: "monstera",
    common_name: "Monstera Deliciosa",
    scientific_name: ["Monstera deliciosa"],
    type: "houseplant",
    watering: "Moderate",
    watering_frequency: 10, // days
    sunlight: ["Bright indirect light"],
    care_level: "Moderate",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
    care_tips: [
      "Water when top 2 inches of soil are dry",
      "Provide support for climbing",
      "Clean leaves regularly for best appearance",
      "Increase humidity if possible",
    ],
    common_problems: ["Brown leaf tips", "Lack of fenestrations"],
    benefits: ["Dramatic foliage", "Instagram-worthy", "Air purifying"],
  },
  {
    id: "fiddle-leaf-fig",
    common_name: "Fiddle Leaf Fig",
    scientific_name: ["Ficus lyrata"],
    type: "houseplant",
    watering: "Moderate",
    watering_frequency: 7, // days
    sunlight: ["Bright indirect light"],
    care_level: "Challenging",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
    care_tips: [
      "Consistent watering schedule",
      "Bright, indirect light near window",
      "Don't move it around once settled",
      "Wipe leaves weekly to prevent dust buildup",
    ],
    common_problems: ["Leaf drop from stress", "Brown spots", "Overwatering"],
    benefits: ["Statement plant", "Large dramatic leaves", "Tree-like growth"],
  },
  {
    id: "rubber-plant",
    common_name: "Rubber Plant",
    scientific_name: ["Ficus elastica"],
    type: "houseplant",
    watering: "Moderate",
    watering_frequency: 10, // days
    sunlight: ["Bright indirect light"],
    care_level: "Easy",
    image:
      "https://images.unsplash.com/photo-1597411646095-6e60f644c7f9?w=300&h=200&fit=crop",
    care_tips: [
      "Water when top inch is dry",
      "Bright light but not direct sun",
      "Clean glossy leaves regularly",
      "Prune to maintain shape",
    ],
    common_problems: ["Leaf drop", "Pest issues", "Stretching"],
    benefits: ["Glossy attractive leaves", "Air purifying", "Easy care"],
  },
  {
    id: "peace-lily",
    common_name: "Peace Lily",
    scientific_name: ["Spathiphyllum"],
    type: "houseplant",
    watering: "Regular",
    watering_frequency: 5, // days
    sunlight: ["Low to medium light"],
    care_level: "Easy",
    image:
      "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=300&h=200&fit=crop",
    care_tips: [
      "Keep soil consistently moist",
      "Droopy leaves indicate need for water",
      "Thrives in lower light",
      "Remove spent flowers",
    ],
    common_problems: ["Brown leaf tips", "No flowers", "Overwatering"],
    benefits: [
      "Beautiful white flowers",
      "Low light tolerance",
      "Air purifying",
    ],
  },
];

// Initialize Plants Hub
function initializePlantsHub() {
  console.log("🌱 Initializing Plants Hub...");

  // Load saved data from localStorage
  loadSavedData();

  // Set up event listeners
  setupEventListeners();

  // Update UI
  updateReminders();
  renderMyPlants();

  // Show welcome message for new users
  if (plantCareState.myPlants.length === 0) {
    setTimeout(() => {
      showStatus(
        "Welcome to your plant journey! Add your first plant to get started. 🌿",
        "success"
      );
    }, 1000);
  } else {
    checkOverdueReminders();
  }

  console.log("✅ Plants Hub initialized successfully!");
}

// Load saved data from localStorage
function loadSavedData() {
  try {
    const savedPlants = localStorage.getItem("myPlants");
    const savedReminders = localStorage.getItem("plantReminders");
    const savedJourney = localStorage.getItem("plantJourney");

    if (savedPlants) {
      plantCareState.myPlants = JSON.parse(savedPlants);
    }

    if (savedReminders) {
      plantCareState.reminders = JSON.parse(savedReminders);
    }

    if (savedJourney) {
      plantCareState.plantJourney = JSON.parse(savedJourney);
    }

    console.log(
      `📖 Loaded ${plantCareState.myPlants.length} plants from storage`
    );
  } catch (error) {
    console.error("Error loading saved data:", error);
  }
}

// Save data to localStorage
function saveData() {
  try {
    localStorage.setItem("myPlants", JSON.stringify(plantCareState.myPlants));
    localStorage.setItem(
      "plantReminders",
      JSON.stringify(plantCareState.reminders)
    );
    localStorage.setItem(
      "plantJourney",
      JSON.stringify(plantCareState.plantJourney)
    );
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Search input Enter key
  const searchInput = document.getElementById("plantSearchInput");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchPlants();
      }
    });
  }

  // Check reminders every minute
  setInterval(updateReminders, 60000);
}

// API Functions - UPDATED FOR V2
async function searchPlantsAPI(query) {
  try {
    // Rate limiting
    const now = Date.now();
    if (now - plantCareState.lastApiCall < plantCareState.apiCooldown) {
      console.log("🚫 API rate limited, using local data");
      return searchLocalPlants(query);
    }

    console.log(`🔍 Searching API for: ${query}`);
    plantCareState.lastApiCall = now;

    // Try Perenual API first (with your API key) - UPDATED TO V2
    if (
      PLANT_APIS.perenual.apiKey &&
      PLANT_APIS.perenual.apiKey !== "sk-YOUR-API-KEY"
    ) {
      try {
        console.log("🌿 Using Perenual API v2 with your key...");
        // FIXED: Updated to v2 endpoint format
        const perenualUrl = `${PLANT_APIS.perenual.baseUrl}${
          PLANT_APIS.perenual.endpoints.species
        }?key=${PLANT_APIS.perenual.apiKey}&q=${encodeURIComponent(
          query
        )}&page=1`;

        console.log(`🌐 Perenual v2 API URL: ${perenualUrl}`);

        const response = await fetch(perenualUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            console.log(
              `✅ Perenual API v2 returned ${data.data.length} results`
            );
            return processPerenualAPI(data.data, query);
          }
        } else if (response.status === 401) {
          console.warn(
            "🔒 Invalid Perenual API key, falling back to local data"
          );
          showStatus("Invalid API key. Using local plant database.", "warning");
        } else {
          console.warn(`🌍 Perenual API v2 error: ${response.status}`);
          const errorText = await response.text();
          console.warn("Error response:", errorText);
        }
      } catch (error) {
        console.warn("Perenual API v2 failed:", error);
      }
    }

    // Try backup API (no key required)
    try {
      console.log("📄 Trying backup Garden API...");
      const response = await fetch(
        `${PLANT_APIS.housePlants.baseUrl}${PLANT_APIS.housePlants.endpoints.plants}`
      );
      if (response.ok) {
        const data = await response.json();
        return processHousePlantsAPI(data, query);
      }
    } catch (error) {
      console.warn("Backup API failed:", error);
    }

    // If all APIs fail, use local data
    console.log("📚 All APIs failed, using local plant database");
    return searchLocalPlants(query);
  } catch (error) {
    console.error("API search error:", error);
    return searchLocalPlants(query);
  }
}

// Process Perenual API response - UPDATED FOR V2 FORMAT
function processPerenualAPI(data, query) {
  if (!data || !Array.isArray(data)) {
    return searchLocalPlants(query);
  }

  const processedPlants = data
    .slice(0, 8) // Limit to 8 results
    .map((plant) => ({
      id: `perenual-${plant.id}` || `perenual-${Date.now()}-${Math.random()}`,
      common_name: plant.common_name || "Unknown Plant",
      scientific_name: plant.scientific_name || ["Unknown"],
      type: plant.type || "plant",
      watering: plant.watering || "Moderate",
      watering_frequency: estimateWateringFrequency(plant.watering),
      sunlight: plant.sunlight || ["Bright indirect light"],
      care_level: determineCareLevel(plant),
      image:
        plant.default_image?.regular_url ||
        plant.default_image?.medium_url ||
        getPlaceholderPlantImage(),
      care_tips: generatePerenualCareTips(plant),
      common_problems: [
        "Monitor watering needs",
        "Watch for pests",
        "Adjust light as needed",
      ],
      benefits: [
        "Adds natural beauty",
        "May improve air quality",
        "Connects you with nature",
      ],
      source: "Perenual API v2",
      cycle: plant.cycle,
      attracts: plant.attracts,
      propagation: plant.propagation,
      hardiness: plant.hardiness,
    }));

  return processedPlants.length > 0
    ? processedPlants
    : searchLocalPlants(query);
}

// Generate care tips from Perenual data
function generatePerenualCareTips(plant) {
  const tips = [];

  if (plant.watering) {
    const wateringText =
      typeof plant.watering === "string" ? plant.watering : "as needed";
    tips.push(`Water ${wateringText.toLowerCase()}`);
  }

  if (plant.sunlight && Array.isArray(plant.sunlight)) {
    tips.push(
      `Provide ${plant.sunlight[0]?.toLowerCase() || "bright indirect light"}`
    );
  } else if (plant.sunlight) {
    tips.push(`Provide ${plant.sunlight.toLowerCase()}`);
  }

  if (plant.cycle) {
    tips.push(`Growth cycle: ${plant.cycle}`);
  }

  if (plant.propagation && Array.isArray(plant.propagation)) {
    tips.push(`Can be propagated by ${plant.propagation.join(", ")}`);
  }

  // Default tips
  tips.push("Monitor for pests regularly");
  tips.push("Rotate occasionally for even growth");

  return tips;
}

// Determine care level from Perenual data
function determineCareLevel(plant) {
  if (plant.care_level) return plant.care_level;

  // Estimate based on watering frequency
  if (plant.watering) {
    const watering = plant.watering.toLowerCase();
    if (watering.includes("frequent") || watering.includes("daily"))
      return "Challenging";
    if (watering.includes("minimal") || watering.includes("rare"))
      return "Easy";
  }

  return "Moderate";
}

// Process House Plants API response
function processHousePlantsAPI(data, query) {
  if (!data || !Array.isArray(data)) {
    return searchLocalPlants(query);
  }

  const filteredPlants = data
    .filter((plant) => {
      const searchTerm = query.toLowerCase();
      return (
        plant.common_name?.toLowerCase().includes(searchTerm) ||
        plant.scientific_name?.toLowerCase().includes(searchTerm) ||
        plant.family?.toLowerCase().includes(searchTerm)
      );
    })
    .slice(0, 8)
    .map((plant) => ({
      id: plant._id || `api-${Date.now()}-${Math.random()}`,
      common_name: plant.common_name || "Unknown Plant",
      scientific_name: plant.scientific_name
        ? [plant.scientific_name]
        : ["Unknown"],
      type: "houseplant",
      watering: plant.watering || "Moderate",
      watering_frequency: estimateWateringFrequency(plant.watering),
      sunlight: plant.sunlight ? [plant.sunlight] : ["Bright indirect light"],
      care_level: plant.care_level || "Moderate",
      image: plant.image || getPlaceholderPlantImage(),
      care_tips: generateCareTips(plant),
      common_problems: ["Monitor for pests", "Adjust watering as needed"],
      benefits: ["Adds greenery to space", "May improve air quality"],
      source: "HousePlants API",
    }));

  return filteredPlants.length > 0 ? filteredPlants : searchLocalPlants(query);
}

// Search local plant database
function searchLocalPlants(query) {
  const searchTerm = query.toLowerCase();

  return COMMON_HOUSEPLANTS.filter((plant) => {
    return (
      plant.common_name.toLowerCase().includes(searchTerm) ||
      plant.scientific_name.some((name) =>
        name.toLowerCase().includes(searchTerm)
      ) ||
      plant.type.toLowerCase().includes(searchTerm)
    );
  });
}

// Estimate watering frequency based on watering description
function estimateWateringFrequency(watering) {
  if (!watering) return 7;

  const wateringLower = watering.toLowerCase();
  if (wateringLower.includes("frequent") || wateringLower.includes("often"))
    return 3;
  if (wateringLower.includes("regular") || wateringLower.includes("moderate"))
    return 7;
  if (wateringLower.includes("minimal") || wateringLower.includes("rare"))
    return 14;
  if (wateringLower.includes("weekly")) return 7;
  if (wateringLower.includes("daily")) return 1;

  return 7; // Default
}

// Generate care tips based on plant data
function generateCareTips(plant) {
  const tips = [];

  if (plant.watering) {
    tips.push(`Water ${plant.watering.toLowerCase()}`);
  }
  if (plant.sunlight) {
    tips.push(`Provide ${plant.sunlight.toLowerCase()}`);
  }
  if (plant.humidity) {
    tips.push(`Maintain ${plant.humidity.toLowerCase()} humidity`);
  }

  tips.push("Monitor for pests regularly");
  tips.push("Rotate plant occasionally for even growth");

  return tips;
}

// Get placeholder image for plants
function getPlaceholderPlantImage() {
  const placeholders = [
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=300&h=200&fit=crop",
  ];
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}

// UI Functions
async function searchPlants() {
  const searchInput = document.getElementById("plantSearchInput");
  const resultsContainer = document.getElementById("searchResults");

  if (!searchInput || !resultsContainer) return;

  const query = searchInput.value.trim();
  if (!query) {
    showStatus("Please enter a plant name to search", "info");
    return;
  }

  // Show loading state
  resultsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
        <div class="loading-spinner"></div>
        <span>Searching for "${query}"...</span>
      </div>
    `;

  try {
    const results = await searchPlantsAPI(query);
    plantCareState.searchResults = results;
    renderSearchResults(results);

    if (results.length > 0) {
      showStatus(
        `🌿 Found ${results.length} plants matching "${query}"!`,
        "success"
      );
    } else {
      showStatus(
        `No plants found for "${query}". Try different keywords!`,
        "info"
      );
    }
  } catch (error) {
    console.error("Search error:", error);
    showStatus("Search failed. Please try again.", "error");
    renderSearchResults([]);
  }
}

// Show random plants from our database - UPDATED FOR V2
async function showRandomPlants() {
  // Try to get random plants from Perenual API first - UPDATED TO V2
  if (
    PLANT_APIS.perenual.apiKey &&
    PLANT_APIS.perenual.apiKey !== "sk-YOUR-API-KEY"
  ) {
    try {
      console.log("🎲 Getting random plants from Perenual API v2...");

      // Get random page of plants (houseplants specifically) - UPDATED TO V2
      const randomPage = Math.floor(Math.random() * 5) + 1; // Pages 1-5
      // FIXED: Updated to v2 endpoint format
      const perenualUrl = `${PLANT_APIS.perenual.baseUrl}${PLANT_APIS.perenual.endpoints.species}?key=${PLANT_APIS.perenual.apiKey}&page=${randomPage}&indoor=1`;

      console.log(`🌐 Random plants v2 API URL: ${perenualUrl}`);

      const response = await fetch(perenualUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          // Shuffle and take 6 random plants
          const shuffled = [...data.data].sort(() => 0.5 - Math.random());
          const randomPlants = shuffled.slice(0, 6);
          const processedPlants = processPerenualAPI(randomPlants, "");

          if (processedPlants.length > 0) {
            plantCareState.searchResults = processedPlants;
            renderSearchResults(processedPlants);
            showStatus(
              `🎲 Here are ${processedPlants.length} random plants from our database!`,
              "success"
            );
            return;
          }
        }
      } else {
        console.warn(`Random plants API error: ${response.status}`);
        const errorText = await response.text();
        console.warn("Error response:", errorText);
      }
    } catch (error) {
      console.warn("Failed to get random plants from API v2:", error);
    }
  }

  // Fallback to local plants
  const shuffled = [...COMMON_HOUSEPLANTS].sort(() => 0.5 - Math.random());
  const randomPlants = shuffled.slice(0, 6);

  plantCareState.searchResults = randomPlants;
  renderSearchResults(randomPlants);

  showStatus("🎲 Here are some popular houseplants to consider!", "success");
}

// Render search results
function renderSearchResults(results) {
  const container = document.getElementById("searchResults");
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = `
        <div style="grid-column: 1 / -1;" class="empty-state">
          <h4>No plants found</h4>
          <p>Try searching for popular plants like "snake plant", "pothos", or "monstera"</p>
        </div>
      `;
    return;
  }

  container.innerHTML = "";

  results.forEach((plant) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.onclick = () => showPlantDetails(plant);

    card.innerHTML = `
        <div class="result-image">
          ${
            plant.image
              ? `<img src="${plant.image}" alt="${plant.common_name}" loading="lazy">`
              : "🌿"
          }
        </div>
        <div class="result-info">
          <div class="result-name">${plant.common_name}</div>
          <div class="result-scientific">${
            plant.scientific_name?.[0] || ""
          }</div>
          <div class="result-care">💧 ${plant.watering} • ☀️ ${
      plant.care_level
    }</div>
        </div>
      `;

    container.appendChild(card);
  });
}

// Show plant details in modal
function showPlantDetails(plant) {
  const modal = document.getElementById("plantModal");
  const modalContent = document.getElementById("modalContent");

  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 200px; height: 150px; margin: 0 auto 1rem; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, var(--primary-light), var(--primary));">
          ${
            plant.image
              ? `<img src="${plant.image}" alt="${plant.common_name}" style="width: 100%; height: 100%; object-fit: cover;">`
              : '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 3rem;">🌿</div>'
          }
        </div>
        <h2 style="font-family: 'Pacifico', cursive; color: var(--primary-light); margin-bottom: 0.5rem;">${
          plant.common_name
        }</h2>
        <p style="font-style: italic; color: var(--text-muted); margin-bottom: 1rem;">${
          plant.scientific_name?.[0] || ""
        }</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: rgba(39, 174, 96, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💧</div>
          <div style="font-weight: 600; margin-bottom: 0.3rem;">Watering</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${
            plant.watering
          }</div>
        </div>
        <div style="background: rgba(39, 174, 96, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">☀️</div>
          <div style="font-weight: 600; margin-bottom: 0.3rem;">Light</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${
            plant.sunlight?.[0] || "Bright indirect"
          }</div>
        </div>
        <div style="background: rgba(39, 174, 96, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📊</div>
          <div style="font-weight: 600; margin-bottom: 0.3rem;">Care Level</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">${
            plant.care_level
          }</div>
        </div>
      </div>
      
      ${
        plant.care_tips
          ? `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: var(--primary-light); margin-bottom: 0.75rem;">🌿 Care Tips</h4>
          <ul style="list-style: none; padding: 0;">
            ${plant.care_tips
              .map(
                (tip) =>
                  `<li style="background: rgba(39, 174, 96, 0.05); padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 6px; border-left: 3px solid var(--primary);">• ${tip}</li>`
              )
              .join("")}
          </ul>
        </div>
      `
          : ""
      }
      
      ${
        plant.benefits
          ? `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: var(--primary-light); margin-bottom: 0.75rem;">✨ Benefits</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${plant.benefits
              .map(
                (benefit) =>
                  `<span style="background: var(--primary); color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">${benefit}</span>`
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }
      
      <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
        <button onclick="addPlantToGarden('${
          plant.id
        }')" style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); border: none; padding: 0.8rem 1.5rem; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; flex: 1;">
          🌱 Add to My Garden
        </button>
        <button onclick="closeModal()" style="background: var(--surface); border: 1px solid var(--border); padding: 0.8rem 1.5rem; border-radius: 12px; color: var(--text); cursor: pointer;">
          Close
        </button>
      </div>
    `;

  modal.classList.add("active");
}

// Close modal
function closeModal() {
  const modal = document.getElementById("plantModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Add plant to user's garden
function addPlantToGarden(plantId) {
  const plant =
    plantCareState.searchResults.find((p) => p.id === plantId) ||
    COMMON_HOUSEPLANTS.find((p) => p.id === plantId);

  if (!plant) {
    showStatus("Plant not found", "error");
    return;
  }

  // Check if plant already exists
  const existingPlant = plantCareState.myPlants.find(
    (p) => p.plantId === plantId
  );
  if (existingPlant) {
    showStatus("This plant is already in your garden!", "info");
    return;
  }

  // Create unique plant instance
  const plantInstance = {
    id: generateId(),
    plantId: plantId,
    nickname: plant.common_name,
    species: plant.common_name,
    scientific_name: plant.scientific_name?.[0] || "",
    image: plant.image,
    watering_frequency: plant.watering_frequency || 7,
    care_level: plant.care_level,
    sunlight: plant.sunlight?.[0] || "Bright indirect light",
    watering: plant.watering,
    care_tips: plant.care_tips || [],
    added_date: new Date().toISOString(),
    last_watered: null,
    last_fertilized: null,
    notes: [],
    health_status: "healthy",
  };

  // Add to user's plants
  plantCareState.myPlants.push(plantInstance);

  // Create initial reminders
  createReminders(plantInstance);

  // Initialize journey entry
  addJourneyEntry(
    plantInstance.id,
    "added",
    `Added ${plant.common_name} to garden`,
    {
      species: plant.common_name,
      care_level: plant.care_level,
    }
  );

  // Save and update UI
  saveData();
  renderMyPlants();
  updateReminders();
  closeModal();

  showStatus(`🌱 ${plant.common_name} added to your garden!`, "success");
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create reminders for a plant
function createReminders(plant) {
  const now = new Date();

  // Water reminder
  const waterDate = new Date(
    now.getTime() + plant.watering_frequency * 24 * 60 * 60 * 1000
  );
  plantCareState.reminders.push({
    id: generateId(),
    plantId: plant.id,
    plantName: plant.nickname,
    type: "water",
    title: `Water ${plant.nickname}`,
    description: `Time to water your ${plant.species}`,
    dueDate: waterDate.toISOString(),
    completed: false,
    recurring: true,
    recurringDays: plant.watering_frequency,
  });

  // Fertilizer reminder (monthly)
  const fertilizeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  plantCareState.reminders.push({
    id: generateId(),
    plantId: plant.id,
    plantName: plant.nickname,
    type: "fertilize",
    title: `Fertilize ${plant.nickname}`,
    description: `Monthly fertilizing for your ${plant.species}`,
    dueDate: fertilizeDate.toISOString(),
    completed: false,
    recurring: true,
    recurringDays: 30,
  });
}

// Render user's plants
function renderMyPlants() {
  const container = document.getElementById("plantsContainer");
  if (!container) return;

  if (plantCareState.myPlants.length === 0) {
    container.innerHTML = `
        <div class="empty-state">
          <h4>Your garden is empty</h4>
          <p>Start by adding your first plant or searching for one below!</p>
        </div>
      `;
    return;
  }

  container.innerHTML = "";

  plantCareState.myPlants.forEach((plant) => {
    const card = document.createElement("div");
    card.className = "plant-card";
    card.onclick = () => showMyPlantDetails(plant);

    // Determine plant status
    const nextWatering = getNextWateringDate(plant);
    const isOverdue = nextWatering && new Date() > new Date(nextWatering);
    const isDueSoon =
      nextWatering &&
      !isOverdue &&
      new Date(nextWatering) - new Date() < 24 * 60 * 60 * 1000; // Due within 24 hours

    let statusClass = "";
    let statusEmoji = "🟢";

    if (isOverdue) {
      statusClass = "urgent";
      statusEmoji = "🔴";
    } else if (isDueSoon) {
      statusClass = "needs-water";
      statusEmoji = "🟡";
    }

    card.innerHTML = `
        <div class="plant-image">
          ${
            plant.image
              ? `<img src="${plant.image}" alt="${plant.nickname}" loading="lazy">`
              : "🌿"
          }
          <div class="plant-status ${statusClass}"></div>
        </div>
        <div class="plant-info">
          <div class="plant-name">${plant.nickname}</div>
          <div class="plant-species">${plant.scientific_name}</div>
          <div class="plant-next-care">
            ${statusEmoji} ${
      nextWatering
        ? isOverdue
          ? "Overdue watering!"
          : isDueSoon
          ? "Water today"
          : `Water in ${Math.ceil(
              (new Date(nextWatering) - new Date()) / (24 * 60 * 60 * 1000)
            )} days`
        : "No reminders"
    }
          </div>
        </div>
      `;

    container.appendChild(card);
  });
}

// Get next watering date for a plant
function getNextWateringDate(plant) {
  const waterReminder = plantCareState.reminders.find(
    (r) => r.plantId === plant.id && r.type === "water" && !r.completed
  );
  return waterReminder ? waterReminder.dueDate : null;
}

// Show detailed view of user's plant
function showMyPlantDetails(plant) {
  const modal = document.getElementById("plantModal");
  const modalContent = document.getElementById("modalContent");

  if (!modal || !modalContent) return;

  const nextWatering = getNextWateringDate(plant);
  const lastWatered = plant.last_watered
    ? new Date(plant.last_watered).toLocaleDateString()
    : "Never";
  const daysSinceAdded = Math.floor(
    (new Date() - new Date(plant.added_date)) / (24 * 60 * 60 * 1000)
  );

  modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 200px; height: 150px; margin: 0 auto 1rem; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, var(--primary-light), var(--primary));">
          ${
            plant.image
              ? `<img src="${plant.image}" alt="${plant.nickname}" style="width: 100%; height: 100%; object-fit: cover;">`
              : '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 3rem;">🌿</div>'
          }
        </div>
        <h2 style="font-family: 'Pacifico', cursive; color: var(--primary-light); margin-bottom: 0.5rem;">${
          plant.nickname
        }</h2>
        <p style="font-style: italic; color: var(--text-muted); margin-bottom: 0.5rem;">${
          plant.scientific_name
        }</p>
        <p style="font-size: 0.8rem; color: var(--text-secondary);">In your garden for ${daysSinceAdded} days</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: rgba(39, 174, 96, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💧</div>
          <div style="font-size: 0.7rem; font-weight: 600; margin-bottom: 0.3rem;">Last Watered</div>
          <div style="font-size: 0.7rem; color: var(--text-secondary);">${lastWatered}</div>
        </div>
        <div style="background: rgba(39, 174, 96, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⏰</div>
          <div style="font-size: 0.7rem; font-weight: 600; margin-bottom: 0.3rem;">Next Watering</div>
          <div style="font-size: 0.7rem; color: var(--text-secondary);">${
            nextWatering
              ? new Date(nextWatering).toLocaleDateString()
              : "Not scheduled"
          }</div>
        </div>
        <div style="background: rgba(39, 174, 96, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">❤️</div>
          <div style="font-size: 0.7rem; font-weight: 600; margin-bottom: 0.3rem;">Health</div>
          <div style="font-size: 0.7rem; color: var(--text-secondary);">${
            plant.health_status
          }</div>
        </div>
      </div>
      
      <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <button onclick="waterPlantNow('${
          plant.id
        }')" style="background: linear-gradient(135deg, #3498db, #5dade2); border: none; padding: 0.6rem 1rem; border-radius: 8px; color: white; font-size: 0.8rem; cursor: pointer;">
          💧 Water Now
        </button>
        <button onclick="fertilizePlantNow('${
          plant.id
        }')" style="background: linear-gradient(135deg, #f39c12, #f8c471); border: none; padding: 0.6rem 1rem; border-radius: 8px; color: white; font-size: 0.8rem; cursor: pointer;">
          🌱 Fertilize
        </button>
        <button onclick="addPlantNote('${
          plant.id
        }')" style="background: linear-gradient(135deg, #9b59b6, #bb77d4); border: none; padding: 0.6rem 1rem; border-radius: 8px; color: white; font-size: 0.8rem; cursor: pointer;">
          📝 Add Note
        </button>
      </div>
      
      ${
        plant.care_tips && plant.care_tips.length > 0
          ? `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: var(--primary-light); margin-bottom: 0.75rem;">🌿 Care Tips</h4>
          <div style="background: rgba(39, 174, 96, 0.05); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--primary);">
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${plant.care_tips
                .slice(0, 3)
                .map(
                  (tip) =>
                    `<li style="margin-bottom: 0.5rem; font-size: 0.8rem;">• ${tip}</li>`
                )
                .join("")}
            </ul>
          </div>
        </div>
      `
          : ""
      }
      
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="showPlantJourney('${
          plant.id
        }')" style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); border: none; padding: 0.8rem 1.5rem; border-radius: 12px; color: white; font-weight: 600; cursor: pointer; flex: 1;">
          📖 View Journey
        </button>
        <button onclick="removePlantFromGarden('${
          plant.id
        }')" style="background: rgba(231, 76, 60, 0.1); border: 1px solid #e74c3c; padding: 0.8rem 1rem; border-radius: 12px; color: #e74c3c; cursor: pointer;" onclick="if(confirm('Remove this plant from your garden?')) removePlantFromGarden('${
    plant.id
  }')">
          🗑️ Remove
        </button>
        <button onclick="closeModal()" style="background: var(--surface); border: 1px solid var(--border); padding: 0.8rem 1.5rem; border-radius: 12px; color: var(--text); cursor: pointer;">
          Close
        </button>
      </div>
    `;

  modal.classList.add("active");
}

// Water plant now
function waterPlantNow(plantId) {
  const plant = plantCareState.myPlants.find((p) => p.id === plantId);
  if (!plant) return;

  // Update last watered date
  plant.last_watered = new Date().toISOString();

  // Mark water reminder as completed and create next one
  const waterReminder = plantCareState.reminders.find(
    (r) => r.plantId === plantId && r.type === "water" && !r.completed
  );

  if (waterReminder) {
    waterReminder.completed = true;

    // Create next watering reminder
    const nextWaterDate = new Date(
      Date.now() + plant.watering_frequency * 24 * 60 * 60 * 1000
    );
    plantCareState.reminders.push({
      id: generateId(),
      plantId: plant.id,
      plantName: plant.nickname,
      type: "water",
      title: `Water ${plant.nickname}`,
      description: `Time to water your ${plant.species}`,
      dueDate: nextWaterDate.toISOString(),
      completed: false,
      recurring: true,
      recurringDays: plant.watering_frequency,
    });
  }

  // Add to journey
  addJourneyEntry(plantId, "watered", `Watered ${plant.nickname}`, {
    notes: "Regular watering maintenance",
  });

  saveData();
  updateReminders();
  renderMyPlants();
  closeModal();

  showStatus(`💧 ${plant.nickname} has been watered!`, "success");
}

// Fertilize plant now
function fertilizePlantNow(plantId) {
  const plant = plantCareState.myPlants.find((p) => p.id === plantId);
  if (!plant) return;

  // Update last fertilized date
  plant.last_fertilized = new Date().toISOString();

  // Mark fertilize reminder as completed and create next one
  const fertilizeReminder = plantCareState.reminders.find(
    (r) => r.plantId === plantId && r.type === "fertilize" && !r.completed
  );

  if (fertilizeReminder) {
    fertilizeReminder.completed = true;

    // Create next fertilize reminder (30 days)
    const nextFertilizeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    plantCareState.reminders.push({
      id: generateId(),
      plantId: plant.id,
      plantName: plant.nickname,
      type: "fertilize",
      title: `Fertilize ${plant.nickname}`,
      description: `Monthly fertilizing for your ${plant.species}`,
      dueDate: nextFertilizeDate.toISOString(),
      completed: false,
      recurring: true,
      recurringDays: 30,
    });
  }

  // Add to journey
  addJourneyEntry(plantId, "fertilized", `Fertilized ${plant.nickname}`, {
    notes: "Monthly fertilizer application",
  });

  saveData();
  updateReminders();
  closeModal();

  showStatus(`🌱 ${plant.nickname} has been fertilized!`, "success");
}

// Add plant note
function addPlantNote(plantId) {
  const note = prompt("Add a note about your plant:");
  if (!note || !note.trim()) return;

  const plant = plantCareState.myPlants.find((p) => p.id === plantId);
  if (!plant) return;

  // Add note to plant
  if (!plant.notes) plant.notes = [];
  plant.notes.push({
    id: generateId(),
    text: note.trim(),
    date: new Date().toISOString(),
  });

  // Add to journey
  addJourneyEntry(plantId, "note", `Added note: ${note.trim()}`, {
    note: note.trim(),
  });

  saveData();
  closeModal();

  showStatus(`📝 Note added to ${plant.nickname}!`, "success");
}

// Remove plant from garden
function removePlantFromGarden(plantId) {
  if (!confirm("Are you sure you want to remove this plant from your garden?"))
    return;

  const plant = plantCareState.myPlants.find((p) => p.id === plantId);
  if (!plant) return;

  // Remove plant
  plantCareState.myPlants = plantCareState.myPlants.filter(
    (p) => p.id !== plantId
  );

  // Remove associated reminders
  plantCareState.reminders = plantCareState.reminders.filter(
    (r) => r.plantId !== plantId
  );

  // Add final journey entry
  addJourneyEntry(plantId, "removed", `Removed ${plant.nickname} from garden`, {
    reason: "Plant removed by user",
  });

  saveData();
  renderMyPlants();
  updateReminders();
  closeModal();

  showStatus(`${plant.nickname} has been removed from your garden`, "info");
}

// Journey Functions
function addJourneyEntry(plantId, action, description, metadata = {}) {
  if (!plantCareState.plantJourney[plantId]) {
    plantCareState.plantJourney[plantId] = [];
  }

  plantCareState.plantJourney[plantId].push({
    id: generateId(),
    action,
    description,
    date: new Date().toISOString(),
    metadata,
  });

  // Keep only last 50 entries per plant
  if (plantCareState.plantJourney[plantId].length > 50) {
    plantCareState.plantJourney[plantId] =
      plantCareState.plantJourney[plantId].slice(-50);
  }
}

// Show plant journey
function showPlantJourney(plantId) {
  const plant = plantCareState.myPlants.find((p) => p.id === plantId);
  const journey = plantCareState.plantJourney[plantId] || [];

  if (!plant) return;

  const modal = document.getElementById("journeyModal");
  const modalContent = document.getElementById("journeyContent");

  if (!modal || !modalContent) return;

  const sortedJourney = [...journey].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  modalContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h2 style="font-family: 'Pacifico', cursive; color: var(--primary-light); margin-bottom: 0.5rem;">📖 ${
          plant.nickname
        }'s Journey</h2>
        <p style="color: var(--text-secondary);">Track your plant's growth and care history</p>
      </div>
      
      <div style="max-height: 400px; overflow-y: auto;">
        ${
          sortedJourney.length === 0
            ? `
          <div class="empty-state">
            <h4>No journey entries yet</h4>
            <p>Start caring for your plant to build its story!</p>
          </div>
        `
            : sortedJourney
                .map((entry) => {
                  const date = new Date(entry.date);
                  const actionIcons = {
                    added: "🌱",
                    watered: "💧",
                    fertilized: "🌿",
                    note: "📝",
                    repotted: "🪴",
                    pruned: "✂️",
                    moved: "📍",
                    removed: "👋",
                  };

                  return `
            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(39, 174, 96, 0.05); border-radius: 8px; margin-bottom: 0.75rem; border-left: 3px solid var(--primary);">
              <div style="font-size: 1.5rem; flex-shrink: 0;">${
                actionIcons[entry.action] || "📌"
              }</div>
              <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${
                  entry.description
                }</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                  ${date.toLocaleDateString()} at ${date.toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </div>
                ${
                  entry.metadata.note
                    ? `<div style="font-size: 0.8rem; margin-top: 0.5rem; font-style: italic; color: var(--text-secondary);">"${entry.metadata.note}"</div>`
                    : ""
                }
              </div>
            </div>
          `;
                })
                .join("")
        }
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
        <button onclick="exportJourney('${plantId}')" style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); border: none; padding: 0.8rem 1.5rem; border-radius: 12px; color: white; font-weight: 600; cursor: pointer;">
          📤 Export Journey
        </button>
        <button onclick="closeJourneyModal()" style="background: var(--surface); border: 1px solid var(--border); padding: 0.8rem 1.5rem; border-radius: 12px; color: var(--text); cursor: pointer;">
          Close
        </button>
      </div>
    `;

  modal.classList.add("active");
}

// Close journey modal
function closeJourneyModal() {
  const modal = document.getElementById("journeyModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// Export plant journey
function exportJourney(plantId) {
  const plant = plantCareState.myPlants.find((p) => p.id === plantId);
  const journey = plantCareState.plantJourney[plantId] || [];

  if (!plant || journey.length === 0) {
    showStatus("No journey data to export", "info");
    return;
  }

  const exportData = {
    plant: {
      nickname: plant.nickname,
      species: plant.species,
      scientific_name: plant.scientific_name,
      added_date: plant.added_date,
    },
    journey: journey.map((entry) => ({
      action: entry.action,
      description: entry.description,
      date: entry.date,
      metadata: entry.metadata,
    })),
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${plant.nickname.replace(/\s+/g, "_")}_journey.json`;
  link.click();

  showStatus(`📤 Journey exported for ${plant.nickname}!`, "success");
}

// Reminder Functions
function updateReminders() {
  const container = document.getElementById("remindersContainer");
  if (!container) return;

  // Get upcoming reminders (not completed, due in next 7 days)
  const now = new Date();
  const upcoming = plantCareState.reminders
    .filter((r) => !r.completed)
    .filter((r) => {
      const dueDate = new Date(r.dueDate);
      const daysDiff = (dueDate - now) / (24 * 60 * 60 * 1000);
      return daysDiff <= 7; // Due within 7 days
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5); // Show max 5 reminders

  if (upcoming.length === 0) {
    container.innerHTML = `
        <div class="empty-state">
          <h4>No upcoming reminders</h4>
          <p>All your plants are well cared for! 🌿</p>
        </div>
      `;
    return;
  }

  container.innerHTML = "";

  upcoming.forEach((reminder) => {
    const dueDate = new Date(reminder.dueDate);
    const now = new Date();
    const isOverdue = dueDate < now;
    const isDueSoon = !isOverdue && dueDate - now < 24 * 60 * 60 * 1000;

    let className = "reminder-item";
    let timeText = "";

    if (isOverdue) {
      className += " urgent";
      const hoursOverdue = Math.floor((now - dueDate) / (60 * 60 * 1000));
      timeText = `Overdue by ${
        hoursOverdue < 24
          ? hoursOverdue + " hours"
          : Math.floor(hoursOverdue / 24) + " days"
      }`;
    } else if (isDueSoon) {
      className += " due-soon";
      timeText = "Due today";
    } else {
      const daysLeft = Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000));
      timeText = `Due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
    }

    const reminderEl = document.createElement("div");
    reminderEl.className = className;

    reminderEl.innerHTML = `
        <div class="reminder-icon">
          ${
            reminder.type === "water"
              ? "💧"
              : reminder.type === "fertilize"
              ? "🌱"
              : "📅"
          }
        </div>
        <div class="reminder-info">
          <div class="reminder-title">${reminder.title}</div>
          <div class="reminder-time">${timeText}</div>
        </div>
        <div class="reminder-actions">
          <button class="reminder-btn" onclick="completeReminder('${
            reminder.id
          }')">
            ✓ Done
          </button>
        </div>
      `;

    container.appendChild(reminderEl);
  });
}

// Complete a reminder
function completeReminder(reminderId) {
  const reminder = plantCareState.reminders.find((r) => r.id === reminderId);
  if (!reminder) return;

  const plant = plantCareState.myPlants.find((p) => p.id === reminder.plantId);
  if (!plant) return;

  // Mark as completed
  reminder.completed = true;

  // Update plant data based on reminder type
  if (reminder.type === "water") {
    plant.last_watered = new Date().toISOString();
    addJourneyEntry(
      plant.id,
      "watered",
      `Watered ${plant.nickname} (from reminder)`,
      {
        reminder_id: reminderId,
      }
    );
  } else if (reminder.type === "fertilize") {
    plant.last_fertilized = new Date().toISOString();
    addJourneyEntry(
      plant.id,
      "fertilized",
      `Fertilized ${plant.nickname} (from reminder)`,
      {
        reminder_id: reminderId,
      }
    );
  }

  // Create next recurring reminder if applicable
  if (reminder.recurring && reminder.recurringDays) {
    const nextDate = new Date(
      Date.now() + reminder.recurringDays * 24 * 60 * 60 * 1000
    );
    plantCareState.reminders.push({
      id: generateId(),
      plantId: reminder.plantId,
      plantName: reminder.plantName,
      type: reminder.type,
      title: reminder.title,
      description: reminder.description,
      dueDate: nextDate.toISOString(),
      completed: false,
      recurring: true,
      recurringDays: reminder.recurringDays,
    });
  }

  saveData();
  updateReminders();
  renderMyPlants();

  showStatus(`✅ ${reminder.title} completed!`, "success");
}

// Check for overdue reminders
function checkOverdueReminders() {
  const overdue = plantCareState.reminders.filter((r) => {
    return !r.completed && new Date(r.dueDate) < new Date();
  });

  if (overdue.length > 0) {
    showStatus(
      `⚠️ You have ${overdue.length} overdue plant care reminder${
        overdue.length !== 1 ? "s" : ""
      }!`,
      "warning"
    );
  }
}

// Quick Action Functions
function addNewPlant() {
  document.getElementById("plantSearchInput").focus();
  showStatus(
    "Search for a plant to add to your garden, or try 'Random Plants' for inspiration! 🌱",
    "info"
  );
}

function identifyPlant() {
  showStatus(
    "🔍 Plant identification feature coming soon! For now, try searching by name or browse random plants.",
    "info"
  );
}

function waterPlants() {
  const needsWater = plantCareState.reminders.filter(
    (r) =>
      r.type === "water" && !r.completed && new Date(r.dueDate) <= new Date()
  );

  if (needsWater.length === 0) {
    showStatus(
      "🌿 All your plants are well watered! Check back later.",
      "success"
    );
    return;
  }

  // Show list of plants that need watering
  const plantNames = needsWater.map((r) => r.plantName).join(", ");
  showStatus(`💧 Plants that need watering: ${plantNames}`, "info");
}

function viewJourney() {
  if (plantCareState.myPlants.length === 0) {
    showStatus(
      "📖 Add some plants to start tracking your garden journey!",
      "info"
    );
    return;
  }

  // Show journey for first plant, or let user choose
  if (plantCareState.myPlants.length === 1) {
    showPlantJourney(plantCareState.myPlants[0].id);
  } else {
    showStatus("📖 Click on any plant to view its individual journey!", "info");
  }
}

// Utility Functions
function showStatus(message, type = "info") {
  console.log(`[${type.toUpperCase()}] ${message}`);

  // Create toast notification
  const toast = document.createElement("div");
  toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1001;
      max-width: 350px;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 500;
      font-size: 0.9rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    `;

  // Set colors based on type
  if (type === "success") {
    toast.style.background = "linear-gradient(135deg, #27ae60, #2ecc71)";
    toast.style.color = "white";
  } else if (type === "error") {
    toast.style.background = "linear-gradient(135deg, #e74c3c, #ec7063)";
    toast.style.color = "white";
  } else if (type === "warning") {
    toast.style.background = "linear-gradient(135deg, #f39c12, #f8c471)";
    toast.style.color = "white";
  } else {
    toast.style.background = "rgba(39, 174, 96, 0.95)";
    toast.style.color = "white";
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
    type === "error" ? 6000 : 4000
  );
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("🌱 Initializing Plants Hub...");
  initializePlantsHub();
});

// Global exports for debugging and external use
window.PlantsHub = {
  state: plantCareState,
  searchPlants,
  addPlantToGarden,
  waterPlantNow,
  fertilizePlantNow,
  addPlantNote,
  showPlantJourney,
  updateReminders,
  saveData,
  loadSavedData,
};

console.log("🌿 Plants Hub module loaded successfully!");
