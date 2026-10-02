/* =========================================================
   SKYCAST WEATHER DASHBOARD
   Dynamic Weather Application
========================================================= */

/* =========================
   API
========================= */

const GEO_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


/* =========================
   DOM ELEMENTS
========================= */

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const weatherDashboard = document.getElementById("weatherDashboard");

const errorTitle = document.getElementById("errorTitle");
const errorMessage = document.getElementById("errorMessage");
const retryBtn = document.getElementById("retryBtn");

const unitToggle = document.getElementById("unitToggle");
const locationBtn = document.getElementById("locationBtn");

const favoriteBtn = document.getElementById("favoriteBtn");

const clearRecentBtn = document.getElementById("clearRecent");
const recentSection = document.getElementById("recentSection");
const recentSearches = document.getElementById("recentSearches");

const favoritesList = document.getElementById("favoritesList");

const hourlyForecast = document.getElementById("hourlyForecast");
const dailyForecast = document.getElementById("dailyForecast");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");


/* =========================
   STATE
========================= */

let currentCity = null;
let currentWeather = null;

let unit = localStorage.getItem("skycastUnit") || "C";

let recentCities =
    JSON.parse(localStorage.getItem("skycastRecent")) || [];

let favoriteCities =
    JSON.parse(localStorage.getItem("skycastFavorites")) || [];


/* =========================
   WEATHER CODES
========================= */

const weatherCodes = {

    0: {
        text: "Clear Sky",
        icon: "sun"
    },

    1: {
        text: "Mainly Clear",
        icon: "sun"
    },

    2: {
        text: "Partly Cloudy",
        icon: "cloud-sun"
    },

    3: {
        text: "Overcast",
        icon: "cloud"
    },

    45: {
        text: "Fog",
        icon: "cloud-fog"
    },

    48: {
        text: "Rime Fog",
        icon: "cloud-fog"
    },

    51: {
        text: "Light Drizzle",
        icon: "cloud-drizzle"
    },

    53: {
        text: "Moderate Drizzle",
        icon: "cloud-drizzle"
    },

    55: {
        text: "Dense Drizzle",
        icon: "cloud-drizzle"
    },

    61: {
        text: "Light Rain",
        icon: "cloud-rain"
    },

    63: {
        text: "Moderate Rain",
        icon: "cloud-rain"
    },

    65: {
        text: "Heavy Rain",
        icon: "cloud-rain"
    },

    71: {
        text: "Light Snow",
        icon: "snowflake"
    },

    73: {
        text: "Moderate Snow",
        icon: "snowflake"
    },

    75: {
        text: "Heavy Snow",
        icon: "snowflake"
    },

    80: {
        text: "Rain Showers",
        icon: "cloud-rain"
    },

    81: {
        text: "Rain Showers",
        icon: "cloud-rain"
    },

    82: {
        text: "Heavy Rain Showers",
        icon: "cloud-rain"
    },

    95: {
        text: "Thunderstorm",
        icon: "cloud-lightning"
    },

    96: {
        text: "Thunderstorm + Hail",
        icon: "cloud-lightning"
    },

    99: {
        text: "Heavy Thunderstorm",
        icon: "cloud-lightning"
    }

};


/* =========================
   INITIALIZATION
========================= */

document.addEventListener("DOMContentLoaded", () => {

    updateUnitButton();

    renderRecentSearches();

    renderFavorites();

    lucide.createIcons();

});


/* =========================
   SEARCH CITY
========================= */

searchForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        showError(
            "Enter a city",
            "Please enter a city name to search."
        );
        return;
    }

    await searchCity(city);

});


/* =========================
   SEARCH FUNCTION
========================= */

async function searchCity(city) {

    showLoading();

    try {

        const location = await getCityCoordinates(city);

        if (!location) {

            showError(
                "City not found",
                `We couldn't find "${city}". Please try another city.`
            );

            return;
        }

        const weather = await getWeather(
            location.latitude,
            location.longitude
        );

        currentCity = location;

        currentWeather = weather;

        addRecentCity(location);

        renderWeather(location, weather);

        hideLoading();

        weatherDashboard.classList.remove("hidden");

        errorState.classList.add("hidden");

        updateFavoriteButton();

    } catch (error) {

        console.error(error);

        showError(
            "Weather unavailable",
            "Something went wrong while getting weather data."
        );

    }

}


/* =========================
   GEOCODING API
========================= */

async function getCityCoordinates(city) {

    const url =
        `${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    return data.results[0];

}


/* =========================
   WEATHER API
========================= */

async function getWeather(latitude, longitude) {

    const params = new URLSearchParams({

        latitude,
        longitude,

        current:
            "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,visibility",

        hourly:
            "temperature_2m,weather_code,precipitation_probability",

        daily:
            "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",

        timezone: "auto",

        forecast_days: "6"

    });

    const response =
        await fetch(`${WEATHER_API}?${params}`);

    if (!response.ok) {
        throw new Error("Weather request failed");
    }

    return await response.json();

}


/* =========================
   RENDER WEATHER
========================= */

function renderWeather(location, weather) {

    document.getElementById("cityName").textContent =
        location.name;

    document.getElementById("weatherDate").textContent =
        formatCurrentDate(
            weather.current.time
        );

    renderCurrentWeather(weather);

    renderWeatherDetails(weather);

    renderSunInformation(weather);

    renderHourlyForecast(weather);

    renderDailyForecast(weather);

    updateWeatherIcon(weather);

    updateDynamicBackground(weather);

    lucide.createIcons();

}


/* =========================
   CURRENT WEATHER
========================= */

function renderCurrentWeather(weather) {

    const current =
        weather.current;

    const temperature =
        convertTemperature(
            current.temperature_2m
        );

    const feelsLike =
        convertTemperature(
            current.apparent_temperature
        );

    document.getElementById("temperature").textContent =
        Math.round(temperature);

    document.getElementById("feelsLike").textContent =
        `${Math.round(feelsLike)}°`;

    document.getElementById("weatherCondition").textContent =
        getWeatherInfo(
            current.weather_code
        ).text;

    const todayMin =
        weather.daily.temperature_2m_min[0];

    const todayMax =
        weather.daily.temperature_2m_max[0];

    document.getElementById("minTemp").textContent =
        `${Math.round(convertTemperature(todayMin))}°`;

    document.getElementById("maxTemp").textContent =
        `${Math.round(convertTemperature(todayMax))}`;

}


/* =========================
   WEATHER DETAILS
========================= */

function renderWeatherDetails(weather) {

    const current =
        weather.current;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("windSpeed").textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;

    document.getElementById("windDirection").textContent =
        getWindDirection(
            current.wind_direction_10m
        );

    document.getElementById("visibility").textContent =
        formatVisibility(
            current.visibility
        );

    document.getElementById("pressure").textContent =
        `${Math.round(current.pressure_msl)} hPa`;

    document.getElementById("cloudiness").textContent =
        `${current.cloud_cover}%`;

    document.getElementById("uvIndex").textContent =
        "N/A";

    document.getElementById("precipitation").textContent =
        `${current.precipitation || 0} mm`;

}


/* =========================
   SUN INFORMATION
========================= */

function renderSunInformation(weather) {

    const sunrise =
        weather.daily.sunrise[0];

    const sunset =
        weather.daily.sunset[0];

    document.getElementById("sunrise").textContent =
        formatTime(sunrise);

    document.getElementById("sunset").textContent =
        formatTime(sunset);

    const localTime =
        new Date(
            weather.current.time
        );

    document.getElementById("localTime").textContent =
        localTime.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

    updateSunProgress(
        sunrise,
        sunset,
        weather.current.time
    );

}


/* =========================
   SUN PROGRESS
========================= */

function updateSunProgress(
    sunrise,
    sunset,
    currentTime
) {

    const start =
        new Date(sunrise).getTime();

    const end =
        new Date(sunset).getTime();

    const now =
        new Date(currentTime).getTime();

    let progress =
        ((now - start) / (end - start)) * 100;

    progress =
        Math.max(0, Math.min(100, progress));

    const bar =
        document.getElementById("sunProgress");

    if (bar) {
        bar.style.width = `${progress}%`;
    }

}


/* =========================
   HOURLY FORECAST
========================= */

function renderHourlyForecast(weather) {

    hourlyForecast.innerHTML = "";

    const currentTime =
        new Date(weather.current.time);

    let startIndex = 0;

    for (
        let i = 0;
        i < weather.hourly.time.length;
        i++
    ) {

        if (
            new Date(
                weather.hourly.time[i]
            ) >= currentTime
        ) {

            startIndex = i;

            break;

        }

    }

    const endIndex =
        Math.min(
            startIndex + 12,
            weather.hourly.time.length
        );

    for (
        let i = startIndex;
        i < endIndex;
        i++
    ) {

        const time =
            weather.hourly.time[i];

        const temp =
            convertTemperature(
                weather.hourly.temperature_2m[i]
            );

        const code =
            weather.hourly.weather_code[i];

        const info =
            getWeatherInfo(code);

        const card =
            document.createElement("div");

        card.className = "hour-card";

        card.innerHTML = `

            <div class="hour-time">
                ${formatHour(time)}
            </div>

            <div class="hour-icon">
                <i data-lucide="${info.icon}"></i>
            </div>

            <div class="hour-temp">
                ${Math.round(temp)}°
            </div>

            <div class="hour-condition">
                ${info.text}
            </div>

        `;

        hourlyForecast.appendChild(card);

    }

    lucide.createIcons();

}


/* =========================
   DAILY FORECAST
========================= */

function renderDailyForecast(weather) {

    dailyForecast.innerHTML = "";

    const days =
        Math.min(
            5,
            weather.daily.time.length
        );

    for (
        let i = 0;
        i < days;
        i++
    ) {

        const date =
            weather.daily.time[i];

        const code =
            weather.daily.weather_code[i];

        const info =
            getWeatherInfo(code);

        const min =
            convertTemperature(
                weather.daily.temperature_2m_min[i]
            );

        const max =
            convertTemperature(
                weather.daily.temperature_2m_max[i]
            );

        const card =
            document.createElement("div");

        card.className = "day-card";

        card.innerHTML = `

            <div>
                <div class="day-name">
                    ${getDayName(date, i)}
                </div>

                <div class="day-date">
                    ${formatShortDate(date)}
                </div>
            </div>

            <div class="day-icon">
                <i data-lucide="${info.icon}"></i>
            </div>

            <div class="day-condition">
                ${info.text}
            </div>

            <div class="day-temp">
                ${Math.round(max)}° / ${Math.round(min)}°
            </div>

        `;

        dailyForecast.appendChild(card);

    }

    lucide.createIcons();

}


/* =========================
   WEATHER ICON
========================= */

function updateWeatherIcon(weather) {

    const container =
        document.getElementById("weatherIcon");

    const info =
        getWeatherInfo(
            weather.current.weather_code
        );

    container.innerHTML =
        `<i data-lucide="${info.icon}"></i>`;

    lucide.createIcons();

}


/* =========================
   WEATHER INFORMATION
========================= */

function getWeatherInfo(code) {

    return (
        weatherCodes[code] || {
            text: "Unknown",
            icon: "cloud"
        }
    );

}


/* =========================
   TEMPERATURE
========================= */

function convertTemperature(celsius) {

    if (unit === "C") {
        return celsius;
    }

    return (
        celsius * 9 / 5
    ) + 32;

}


/* =========================
   UNIT TOGGLE
========================= */

unitToggle.addEventListener(
    "click",
    () => {

        unit =
            unit === "C"
                ? "F"
                : "C";

        localStorage.setItem(
            "skycastUnit",
            unit
        );

        updateUnitButton();

        if (
            currentCity &&
            currentWeather
        ) {

            renderWeather(
                currentCity,
                currentWeather
            );

        }

    }
);


function updateUnitButton() {

    unitToggle.innerHTML = `

        <i data-lucide="thermometer"></i>

        <span>
            °${unit} / °${unit === "C" ? "F" : "C"}
        </span>

    `;

    lucide.createIcons();

}


/* =========================
   MY LOCATION
========================= */

locationBtn.addEventListener(
    "click",
    () => {

        if (!navigator.geolocation) {

            showError(
                "Location unavailable",
                "Your browser does not support location services."
            );

            return;

        }

        showLoading();

        navigator.geolocation.getCurrentPosition(

            async (position) => {

                try {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;

                    const weather =
                        await getWeather(
                            latitude,
                            longitude
                        );

                    const location =
                        await reverseGeocode(
                            latitude,
                            longitude
                        );

                    currentCity =
                        location;

                    currentWeather =
                        weather;

                    renderWeather(
                        location,
                        weather
                    );

                    hideLoading();

                    weatherDashboard.classList.remove(
                        "hidden"
                    );

                    errorState.classList.add(
                        "hidden"
                    );

                    updateFavoriteButton();

                } catch (error) {

                    console.error(error);

                    showError(
                        "Location weather failed",
                        "We couldn't get weather for your current location."
                    );

                }

            },

            () => {

                showError(
                    "Location permission denied",
                    "Please allow location access and try again."
                );

            }

        );

    }
);


/* =========================
   REVERSE GEOCODING
========================= */

async function reverseGeocode(
    latitude,
    longitude
) {

    const url =
        `${GEO_API}?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`;

    try {

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (
            data.results &&
            data.results.length
        ) {

            return data.results[0];

        }

    } catch (error) {

        console.error(error);

    }

    return {

        name: "My Location",

        latitude,

        longitude

    };

}


/* =========================
   RECENT SEARCHES
========================= */

function addRecentCity(city) {

    recentCities =
        recentCities.filter(
            item =>
                item.name.toLowerCase() !==
                city.name.toLowerCase()
        );

    recentCities.unshift({

        name: city.name,

        latitude: city.latitude,

        longitude: city.longitude

    });

    recentCities =
        recentCities.slice(0, 6);

    localStorage.setItem(
        "skycastRecent",
        JSON.stringify(recentCities)
    );

    renderRecentSearches();

}


function renderRecentSearches() {

    recentSearches.innerHTML = "";

    if (!recentCities.length) {

        recentSection.classList.add(
            "hidden"
        );

        return;

    }

    recentSection.classList.remove(
        "hidden"
    );

    recentCities.forEach(city => {

        const button =
            document.createElement("button");

        button.className =
            "recent-item";

        button.textContent =
            city.name;

        button.addEventListener(
            "click",
            () => {

                loadSavedCity(city);

            }
        );

        recentSearches.appendChild(
            button
        );

    });

}


clearRecentBtn.addEventListener(
    "click",
    () => {

        recentCities = [];

        localStorage.removeItem(
            "skycastRecent"
        );

        renderRecentSearches();

        showToast(
            "Recent searches cleared"
        );

    }
);


/* =========================
   LOAD SAVED CITY
========================= */

async function loadSavedCity(city) {

    showLoading();

    try {

        const weather =
            await getWeather(
                city.latitude,
                city.longitude
            );

        currentCity =
            city;

        currentWeather =
            weather;

        renderWeather(
            city,
            weather
        );

        hideLoading();

        weatherDashboard.classList.remove(
            "hidden"
        );

        errorState.classList.add(
            "hidden"
        );

        updateFavoriteButton();

    } catch (error) {

        showError(
            "Weather unavailable",
            "Couldn't load this saved city."
        );

    }

}


/* =========================
   FAVORITES
========================= */

favoriteBtn.addEventListener(
    "click",
    () => {

        if (!currentCity) {
            return;
        }

        const exists =
            favoriteCities.some(
                city =>
                    city.name.toLowerCase() ===
                    currentCity.name.toLowerCase()
            );

        if (exists) {

            favoriteCities =
                favoriteCities.filter(
                    city =>
                        city.name.toLowerCase() !==
                        currentCity.name.toLowerCase()
                );

            showToast(
                `${currentCity.name} removed from favorites`
            );

        } else {

            favoriteCities.push({

                name: currentCity.name,

                latitude: currentCity.latitude,

                longitude: currentCity.longitude

            });

            showToast(
                `${currentCity.name} added to favorites`
            );

        }

        localStorage.setItem(
            "skycastFavorites",
            JSON.stringify(
                favoriteCities
            )
        );

        renderFavorites();

        updateFavoriteButton();

    }
);


/* =========================
   UPDATE FAVORITE BUTTON
========================= */

function updateFavoriteButton() {

    if (!currentCity) {
        return;
    }

    const exists =
        favoriteCities.some(
            city =>
                city.name.toLowerCase() ===
                currentCity.name.toLowerCase()
        );

    favoriteBtn.innerHTML =
        exists
            ? `<i data-lucide="star" fill="currentColor"></i>`
            : `<i data-lucide="star"></i>`;

    favoriteBtn.title =
        exists
            ? "Remove from favorites"
            : "Add to favorites";

    lucide.createIcons();

}


/* =========================
   RENDER FAVORITES
========================= */

function renderFavorites() {

    favoritesList.innerHTML = "";

    if (!favoriteCities.length) {

        favoritesList.innerHTML = `

            <p class="no-favorites">
                No favorite cities yet.
            </p>

        `;

        return;

    }

    favoriteCities.forEach(city => {

        const item =
            document.createElement("div");

        item.className =
            "favorite-city";

        item.innerHTML = `

            <div>

                <strong>
                    ${city.name}
                </strong>

                <small>
                    Saved city
                </small>

            </div>

            <button
                title="Remove favorite"
                aria-label="Remove favorite"
            >
                <i data-lucide="x"></i>
            </button>

        `;

        item.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest("button")
                ) {

                    return;

                }

                loadSavedCity(city);

            }
        );

        item
            .querySelector("button")
            .addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    favoriteCities =
                        favoriteCities.filter(
                            saved =>
                                saved.name !==
                                city.name
                        );

                    localStorage.setItem(
                        "skycastFavorites",
                        JSON.stringify(
                            favoriteCities
                        )
                    );

                    renderFavorites();

                    updateFavoriteButton();

                    showToast(
                        `${city.name} removed`
                    );

                }
            );

        favoritesList.appendChild(item);

    });

    lucide.createIcons();

}


/* =========================
   LOADING
========================= */

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    weatherDashboard.classList.add(
        "hidden"
    );

}


function hideLoading() {

    loadingState.classList.add(
        "hidden"
    );

}


/* =========================
   ERROR
========================= */

function showError(
    title,
    message
) {

    loadingState.classList.add(
        "hidden"
    );

    weatherDashboard.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );

    errorTitle.textContent =
        title;

    errorMessage.textContent =
        message;

    lucide.createIcons();

}


/* =========================
   RETRY
========================= */

retryBtn.addEventListener(
    "click",
    () => {

        if (currentCity) {

            loadSavedCity(
                currentCity
            );

        } else {

            cityInput.focus();

        }

    }
);


/* =========================
   WIND DIRECTION
========================= */

function getWindDirection(degrees) {

    const directions = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"
    ];

    const index =
        Math.round(degrees / 45) % 8;

    return directions[index];

}


/* =========================
   VISIBILITY
========================= */

function formatVisibility(meters) {

    if (!meters) {
        return "N/A";
    }

    return `${(meters / 1000).toFixed(1)} km`;

}


/* =========================
   DATE
========================= */

function formatCurrentDate(dateString) {

    return new Date(
        dateString
    ).toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    );

}


/* =========================
   TIME
========================= */

function formatTime(dateString) {

    return new Date(
        dateString
    ).toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* =========================
   HOUR FORMAT
========================= */

function formatHour(dateString) {

    return new Date(
        dateString
    ).toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* =========================
   DAY NAME
========================= */

function getDayName(
    dateString,
    index
) {

    if (index === 0) {
        return "Today";
    }

    return new Date(
        dateString
    ).toLocaleDateString(
        "en-US",
        {
            weekday: "long"
        }
    );

}


/* =========================
   SHORT DATE
========================= */

function formatShortDate(dateString) {

    return new Date(
        dateString
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================
   DYNAMIC BACKGROUND
========================= */

function updateDynamicBackground(weather) {

    const code =
        weather.current.weather_code;

    const isDay =
        isCurrentlyDay(
            weather.current.time,
            weather.daily.sunrise[0],
            weather.daily.sunset[0]
        );

    if (isDay) {

        document.body.style.background =
            `
            radial-gradient(
                circle at 10% 10%,
                rgba(59, 130, 246, 0.18),
                transparent 30%
            ),
            radial-gradient(
                circle at 90% 20%,
                rgba(14, 165, 233, 0.15),
                transparent 30%
            ),
            #07111f
            `;

    } else {

        document.body.style.background =
            `
            radial-gradient(
                circle at 15% 15%,
                rgba(79, 70, 229, 0.14),
                transparent 30%
            ),
            radial-gradient(
                circle at 85% 30%,
                rgba(30, 64, 175, 0.12),
                transparent 30%
            ),
            #050b15
            `;

    }

}


/* =========================
   DAY / NIGHT
========================= */

function isCurrentlyDay(
    current,
    sunrise,
    sunset
) {

    const time =
        new Date(current).getTime();

    return (
        time >= new Date(sunrise).getTime() &&
        time <= new Date(sunset).getTime()
    );

}


/* =========================
   TOAST
========================= */

let toastTimer;

function showToast(message) {

    toastMessage.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}