const API_KEY = "f202b4cfb8894fa0ad2144441250508";

class WeatherApp {
  constructor() {
    this.apiKey = API_KEY;
    this.currentTheme = "gradient1";
    this.isDarkMode = false;
    this.currentWeatherData = null;

    this.initializeApp();
    this.bindEvents();
    this.loadDefaultLocation();
  }

  initializeApp() {
    const savedTheme = localStorage.getItem("weatherTheme") || "sunny";
    const savedMode = localStorage.getItem("darkMode") === "true";

    this.currentTheme = savedTheme;
    this.isDarkMode = savedMode;

    this.applyTheme();
    this.applyDarkMode();
  }

  bindEvents() {
    document
      .getElementById("searchBtn")
      .addEventListener("click", () => this.searchWeather());

    document.getElementById("cityInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.searchWeather();
    });

    document
      .getElementById("themeToggle")
      .addEventListener("click", () => this.toggleDarkMode());

    document
      .getElementById("locationBtn")
      .addEventListener("click", () => this.getCurrentLocation());

    document.querySelectorAll(".theme-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        const theme = e.currentTarget.dataset.theme;
        this.changeTheme(theme);
      });
    });
  }

  async loadDefaultLocation() {
    try {
      await this.getCurrentLocation();
    } catch {
      await this.fetchWeatherData("Delhi");
    }
  }

  async getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError("Geolocation not supported.");
      return;
    }

    this.showLoading();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await this.fetchWeatherByCoords(latitude, longitude);
      },
      () => {
        this.showError("Failed to get location. Try searching manually.");
      }
    );
  }

  async searchWeather() {
    const input = document.getElementById("cityInput");
    const city = input.value.trim();

    if (!city) {
      this.showError("Please enter a city name.");
      return;
    }

    await this.fetchWeatherData(city);
    input.value = "";
  }

  async fetchWeatherData(city) {
    this.showLoading();
    this.hideError();

    try {
      const rawData = await this.fetchRealWeatherData(city);
      const weatherData = this.processApiResponse(rawData);
      this.currentWeatherData = weatherData;
      this.displayWeatherData(weatherData);
      this.showWeatherCard();
    } catch (error) {
      this.handleApiError(error);
    } finally {
      this.hideLoading();
    }
  }

  async fetchWeatherByCoords(lat, lon) {
    this.showLoading();
    this.hideError();

    try {
      const rawData = await this.fetchRealWeatherByCoords(lat, lon);
      const weatherData = this.processApiResponse(rawData);
      this.currentWeatherData = weatherData;
      this.displayWeatherData(weatherData);
      this.showWeatherCard();
    } catch (error) {
      this.handleApiError(error);
    } finally {
      this.hideLoading();
    }
  }

  async fetchRealWeatherData(city) {
    const res = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${city}&days=5&aqi=yes&alerts=yes`
    );
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  async fetchRealWeatherByCoords(lat, lon) {
    const res = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${lat},${lon}&days=5&aqi=yes&alerts=yes`
    );
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  processApiResponse(data) {
    return {
      location: {
        name: data.location.name,
        country: data.location.country,
        localtime: data.location.localtime,
      },
      current: {
        temp_c: data.current.temp_c,
        condition: {
          text: data.current.condition.text,
          icon: this.mapWeatherIcon(data.current.condition.code),
        },
        wind_kph: data.current.wind_kph,
        humidity: data.current.humidity,
        precip_mm: data.current.precip_mm,
        uv: data.current.uv,
      },
      forecast: {
        forecastday: data.forecast.forecastday.map((day) => ({
          date: day.date,
          day: {
            maxtemp_c: day.day.maxtemp_c,
            mintemp_c: day.day.mintemp_c,
            condition: {
              text: day.day.condition.text,
              icon: this.mapWeatherIcon(day.day.condition.code),
            },
          },
        })),
      },
    };
  }

  mapWeatherIcon(code) {
    const map = {
      1000: "fas fa-sun",
      1003: "fas fa-cloud-sun",
      1006: "fas fa-cloud",
      1009: "fas fa-cloud",
      1030: "fas fa-smog",
      1063: "fas fa-cloud-rain",
      1180: "fas fa-cloud-rain",
      1183: "fas fa-cloud-rain",
      1186: "fas fa-cloud-rain",
      1189: "fas fa-cloud-rain",
      1192: "fas fa-cloud-showers-heavy",
      1195: "fas fa-cloud-showers-heavy",
    };
    return map[code] || "fas fa-cloud";
  }

  displayWeatherData(data) {
    document.getElementById(
      "cityName"
    ).textContent = `${data.location.name}, ${data.location.country}`;
    document.getElementById("currentTemp").textContent = Math.round(
      data.current.temp_c
    );
    document.getElementById("weatherDesc").textContent =
      data.current.condition.text;
    document.getElementById("mainWeatherIcon").className =
      data.current.condition.icon;

    const now = new Date(data.location.localtime);
    document.getElementById("currentDate").textContent = this.formatDate(now);
    document.getElementById("currentTime").textContent = this.formatTime(now);

    document.getElementById("sunriseTime").textContent = "6:00 AM";
    document.getElementById("sunsetTime").textContent = "7:21 PM";

    document.getElementById("windSpeed").textContent = `${Math.round(
      data.current.wind_kph
    )} km/h`;
    document.getElementById(
      "humidity"
    ).textContent = `${data.current.humidity}%`;
    document.getElementById("rainChance").textContent = `${(
      data.current.precip_mm * 50
    ).toFixed(1)}%`;

    const airQuality = Math.floor(Math.random() * 5) + 1;
    document.getElementById("airQuality").textContent = `${airQuality}/5`;
    document.querySelector("#airQuality").nextElementSibling.textContent =
      this.getAirQualityText(airQuality);

    const uv = Math.round(data.current.uv);
    document.getElementById("uvIndex").textContent = `${uv}/10`;
    document.querySelector("#uvIndex").nextElementSibling.textContent =
      this.getUVIndexText(uv);

    this.updateForecast(data.forecast.forecastday);
  }

  updateForecast(forecastData) {
    const container = document.getElementById("forecastContainer");
    container.innerHTML = "";

    const days = ["Today", "Fri", "Sat", "Sun"];
    forecastData.slice(0, 4).forEach((day, i) => {
      const div = document.createElement("div");
      div.className = "forecast-item";
      div.innerHTML = `
                <div class="day">${days[i]}</div>
                <i class="${day.day.condition.icon}"></i>
                <div class="temp">${Math.round(day.day.maxtemp_c)}°</div>
            `;
      container.appendChild(div);
    });
  }

  getAirQualityText(v) {
    return (
      ["Good", "Fair", "Moderate", "Poor", "Very Poor"][v - 1] || "Moderate"
    );
  }

  getUVIndexText(v) {
    if (v <= 2) return "Low";
    if (v <= 5) return "Moderate";
    if (v <= 7) return "High";
    if (v <= 10) return "Very High";
    return "Extreme";
  }

  formatDate(date) {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  }

  formatTime(date) {
    return date.toLocaleString("en-US", {
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.applyDarkMode();
    this.savePreferences();
  }

  applyDarkMode() {
    const body = document.body;
    const icon = document.getElementById("themeToggle").querySelector("i");
    body.classList.toggle("dark-mode", this.isDarkMode);
    icon.className = this.isDarkMode ? "fas fa-sun" : "fas fa-moon";
  }

  changeTheme(theme) {
    this.currentTheme = theme;
    this.applyTheme();
    this.savePreferences();
    loadWeatherAnimation(theme);
  }

  applyTheme() {
    const card = document.getElementById("weatherCard");
    card.className = card.className.replace(/gradient\d+/g, "");
    card.classList.add(this.currentTheme);

    document.querySelectorAll(".theme-option").forEach((opt) => {
      opt.classList.toggle("active", opt.dataset.theme === this.currentTheme);
    });
  }

  savePreferences() {
    localStorage.setItem("weatherTheme", this.currentTheme);
    localStorage.setItem("darkMode", this.isDarkMode.toString());
  }

  showLoading() {
    this.hideAllSections();
    document.getElementById("loadingSpinner").classList.remove("hidden");
  }

  hideLoading() {
    document.getElementById("loadingSpinner").classList.add("hidden");
  }

  showWeatherCard() {
    this.hideAllSections();
    const card = document.getElementById("weatherCard");
    card.classList.remove("hidden");
    card.classList.add("fade-in");
  }

  showError(msg) {
    this.hideAllSections();
    const error = document.getElementById("errorMessage");
    error.querySelector("p").textContent = msg;
    error.classList.remove("hidden");
  }

  hideError() {
    document.getElementById("errorMessage").classList.add("hidden");
  }

  hideAllSections() {
    document.getElementById("loadingSpinner").classList.add("hidden");
    document.getElementById("weatherCard").classList.add("hidden");
    document.getElementById("errorMessage").classList.add("hidden");
  }

  handleApiError(error) {
    console.error("API Error:", error);

    if (error.message.includes("404")) {
      this.showError("City not found.");
    } else if (error.message.includes("401")) {
      this.showError("Invalid API key.");
    } else if (error.message.includes("429")) {
      this.showError("Too many requests.");
    } else if (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    ) {
      this.showError("Network error. Check your connection.");
    } else {
      this.showError("Failed to fetch weather data.");
    }
  }
}

function loadWeatherAnimation(theme) {
  // Hide all containers
  document.querySelectorAll('.weather-animations > div').forEach(div => {
    div.classList.add('hidden');
  });

  // Show the one matching the theme
  switch (theme) {
    case 'rainy':
      document.querySelector('.rain-container').classList.remove('hidden');
      break;
    case 'snowy':
      document.querySelector('.snow-container').classList.remove('hidden');
      break;
    case 'cloudy':
      document.querySelector('.clouds-container').classList.remove('hidden');
      break;
    case 'sunny':
      document.querySelector('.sun-rays-container').classList.remove('hidden');
      break;
    case 'thunder':
      document.querySelector('.lightning-container').classList.remove('hidden');
      break;
    case 'foggy':
      document.querySelector('.fog-container').classList.remove('hidden');
      break;
  }
}



document.addEventListener("DOMContentLoaded", () => {
  new WeatherApp();

  document.documentElement.style.scrollBehavior = "smooth";

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const input = document.getElementById("cityInput");
      if (document.activeElement === input) input.blur();
    }
  });

  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  document.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 100) {
      const options = document.querySelectorAll(".theme-option");
      const active = document.querySelector(".theme-option.active");
      const currentIndex = Array.from(options).indexOf(active);
      const newIndex =
        diff > 0
          ? (currentIndex + 1) % options.length
          : (currentIndex - 1 + options.length) % options.length;
      options[newIndex].click();
    }
  });
});