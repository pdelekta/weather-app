class CoreDomElements {
    constructor() {
        this.searchInput = document.getElementById("search-input");
        this.searchButton = document.getElementById("search-button");
        this.searchContainer = document.querySelector(".search-view");
        this.searchForm = this.searchContainer.querySelector(".search-view__form");
        this.dailyForecastElement = document.querySelector(".daily-forecast");
        this.weeklyForecastElement = document.querySelector(".weekly-forecast");
        this.errorElementTemplate = document.importNode(document.getElementById("error").content, true);
        this.currentWeatherTemperatureElement = document.querySelector(".current-weather__temperature");
        this.weatherLocationCityElement = document.querySelector(".current-weather__location-city");
        this.weatherLocationCountryElement = document.querySelector(
            ".current-weather__location-country"
        );
        this.precipitationElement = document.getElementById("precipitation");
        this.humidityElement = document.getElementById("humidity");
        this.windElement = document.getElementById("wind");
        this.currentWeatherIconElement = document.querySelector(".current-weather__icon");
        this.dayForecastElements = document.querySelectorAll(".day-forecast");
        this.hourlyForecastElements = document.querySelectorAll(".hourly-forecast__forecast");
    }

    showSearch() {
        this.searchForm.style.display = "flex";
    }

    hideSearch() {
        this.searchForm.style.display = "none";
    }

    showLoader() {
        const containerFirstChild = this.searchContainer.firstElementChild;
        if (containerFirstChild.classList.contains("lds-ellipsis"))
            throw new Error("Loader jest już aktywny, nie można dodac drugiego");
        const loader = document.importNode(document.getElementById("loader").content, true);
        this.searchContainer.insertBefore(loader, this.searchForm);
    }

    hideLoader() {
        const containerFirstChild = this.searchContainer.firstElementChild;
        if (!containerFirstChild.classList.contains("lds-ellipsis")) return;
        containerFirstChild.remove();
    }

    showResults() {
        this.searchContainer.style.display = "none";
        this.dailyForecastElement.style.display = "flex";
        this.weeklyForecastElement.style.display = "flex";
    }

    hideError() {
        const errorMessageElement =
            document.querySelector(".search-view__form .search-view__error-message") || "";
        if (errorMessageElement) errorMessageElement.remove();
    }

    showError(error) {
        if (!error) return;
        this.hideError();
        const errorElement = this.errorElementTemplate.cloneNode(true);
        errorElement.firstElementChild.innerText = error;
        this.searchForm.insertBefore(errorElement, this.searchButton);
    }
}

class Weather {
    constructor() {
        this.domElements = new CoreDomElements();
        this.options = {
            key: "8443282d9aa146d7bd8511f2f704f611",
            lang: "pl",
            days: 7,
            hours: 15,
        };
        this.headers = {};
        this.rapidOptions = {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": "011c647cf0msh349d44b30e57cdep13bcb5jsn26aa5f532a29",
                "X-RapidAPI-Host": "weatherbit-v1-mashape.p.rapidapi.com",
            },
        };
        this.apiTypes = ["current", "weekly", "hourly"];
        this.registerEventListeners();
        this.baseApiURL = "https://api.weatherbit.io/v2.0";
        this.currentWeatherApiURL = `${this.baseApiURL}/current?key=${this.options.key}&lang=${this.options.lang}`;
        this.weeklyWeatherApiURL = `${this.baseApiURL}/forecast/daily?key=${this.options.key}&lang=${this.options.lang}`;
        this.days = ["Niedz.", "Pon.", "Wt.", "Śr.", "Czw.", "Pt.", "Sob."];
    }

    getApiURL(type) {
        switch (type) {
            case "current":
                return `${this.currentWeatherApiURL}&city=${this.city}`;
                break;
            case "weekly":
                return `${this.weeklyWeatherApiURL}&city=${this.city}`;
                break;
            case "hourly":
                return `https://weatherbit-v1-mashape.p.rapidapi.com/forecast/3hourly/geosearch?city=${this.city}`;
                break;
        }
    }

    async fetchWeatherApi(URL, options) {
        try {
            const response = await fetch(URL, options);
            if (response.statusText !== "OK" && response.statusText !== "") {
                this.domElements.hideLoader();
                this.domElements.showSearch();
                if (response.statusText === "No Content")
                    throw new Error("Nie znaleziono takiej lokalizacji, spróbuj ponownie");
                else throw new Error(response.statusText);
            } else {
                const responseObject = (await response.json()) || "";
                return responseObject;
            }
        } catch (error) {
            this.domElements.showError(error.message);
        }
    }

    async prepareData() {
        const preparedData = {};
        for (const type of this.apiTypes) {
            let apiResponse = {};
            const apiURL = this.getApiURL(type);
            if (type === "hourly") {
                apiResponse = await this.fetchWeatherApi(apiURL, this.rapidOptions);
            } else {
                apiResponse = await this.fetchWeatherApi(apiURL);
            }
            preparedData[type] = apiResponse;
        }
        return preparedData;
    }

    async onSubmit() {
        this.domElements.hideError();
        this.domElements.showLoader();
        this.domElements.hideSearch();
        const data = await this.prepareData();
        if (
            typeof data.current !== "undefined" ||
            typeof data.weekly !== "undefined" ||
            typeof data.hourly !== "undefined"
        ) {
            this.renderData(data);
            this.domElements.showResults();
        }
    }

    renderData({ current, weekly, hourly }) {
        this.renderCurrent(current.data[0]);
        this.renderWeekly(weekly.data);
        this.renderHourly(hourly.data);
    }

    renderCurrent(data) {
        this.domElements.currentWeatherIconElement.src = `https://www.weatherbit.io/static/img/icons/${data.weather.icon}.png`;
        this.domElements.currentWeatherTemperatureElement.innerText = `${data.temp.toFixed(0)}°`;
        this.domElements.weatherLocationCityElement.innerText = data.city_name;
        this.domElements.weatherLocationCountryElement.innerText = data.country_code;
        this.domElements.precipitationElement.innerText = `${data.precip} mm/h`;
        this.domElements.humidityElement.innerText = `${data.rh}%`;
        this.domElements.windElement = `${data.wind_spd} m/s`;
    }

    renderWeekly(data) {
        this.domElements.dayForecastElements.forEach((day, index) => {
            day.querySelector("img").src = `https://www.weatherbit.io/static/img/icons/${
                data[index + 1].weather.icon
            }.png`;
            day.querySelector(".day-temperature").innerText = `${data[index + 1].high_temp.toFixed(0)}°`;
            day.querySelector(".night-temperature").innerText = `${data[index + 1].low_temp.toFixed(
                0
            )}°`;
            const date = new Date(data[index + 1].datetime);
            day.querySelector(".day-forecast__day").innerText = this.days[date.getDay()];
        });
    }

    renderHourly(data) {
        this.domElements.hourlyForecastElements.forEach((forecast, index) => {
            forecast.querySelector(".forecast__temperature").innerText = `${data[index].temp.toFixed(
                0
            )}°`;
            //const date = new Date(data[index].timestamp_local)

            const utcDate = new Date(data[index].timestamp_utc);
            const utcOffset = new Date().getTimezoneOffset() / -60;
            const localHour = utcDate.getHours() + utcOffset;
            utcDate.setHours(localHour);
            forecast.querySelector(".forecast__hour").innerText = `${utcDate.getHours()}:00`;
        });
    }

    registerEventListeners() {
        this.domElements.searchForm.addEventListener("submit", e => {
            e.preventDefault();
            const query = this.domElements.searchInput.value.toLowerCase().trim();
            this.city = query;
            if (query) {
                this.onSubmit();
            } else {
                this.domElements.showError("Nie możesz przesłać pustego pola");
            }
        });

        this.domElements.currentWeatherIconElement.addEventListener("load", () => {
            this.domElements.currentWeatherIconElement.classList.remove("skeleton");
        });
    }
}

const weather = new Weather();
