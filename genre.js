document.addEventListener("DOMContentLoaded", function () {
    const genreTitle = document.getElementById("genreTitle");
    const genreMovies = document.getElementById("genreMovies");
    const loadingDiv = document.getElementById("loading");
    const startYear = document.getElementById("startYear");
    const endYear = document.getElementById("endYear");
    const languageFilter = document.getElementById("languageFilter");
    const filterBtn = document.getElementById("filterBtn");
    const clearFilterBtn = document.getElementById("clearFilterBtn");
    const seeMoreBtn = document.getElementById("seeMoreBtn");

    const BACKEND_URL = "http://localhost:8000";
    const urlParams = new URLSearchParams(window.location.search);
    const genre = urlParams.get("genre");

    let currentPage = 1; // Track the current page for pagination
    let currentFilters = { yearRange: "", language: "" }; // Store current filters

    if (genre) {
        genreTitle.textContent = `${genre} Movies`;
        fetchGenreMovies(genre, "", "", 1); // Initial fetch
    }

    // Apply Filters button
    filterBtn.addEventListener("click", () => {
        const start = startYear.value;
        const end = endYear.value;
        const yearRange = (start && end) ? `${start}-${end}` : "";
        const language = languageFilter.value;

        // Validation
        if (yearRange && (start > end || start < 1900 || end > 2025)) {
            alert("Please enter a valid year range (1900-2025, start ≤ end).");
            return;
        }

        currentPage = 1; // Reset to first page
        currentFilters = { yearRange, language };
        genreMovies.innerHTML = ""; // Clear current movies
        fetchGenreMovies(genre, yearRange, language, currentPage);
    });

    // Clear Filters button
    clearFilterBtn.addEventListener("click", () => {
        startYear.value = "";
        endYear.value = "";
        languageFilter.value = "";
        currentPage = 1;
        currentFilters = { yearRange: "", language: "" };
        genreMovies.innerHTML = "";
        fetchGenreMovies(genre, "", "", 1);
    });

    // See More button
    seeMoreBtn.addEventListener("click", () => {
        currentPage += 1;
        fetchGenreMovies(genre, currentFilters.yearRange, currentFilters.language, currentPage, true);
    });

    async function fetchGenreMovies(genre, yearRange, language, page, append = false) {
        if (loadingDiv) loadingDiv.style.display = "block";
        if (!append) genreMovies.innerHTML = ""; // Clear movies unless appending

        try {
            const queryParams = new URLSearchParams({
                movie: `${genre} movie`,
                genre: genre,
                page: page,
                ...(yearRange && { year: yearRange }),
                ...(language && { language: language })
            });
            const response = await fetch(`${BACKEND_URL}/recommend/?${queryParams.toString()}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            if (loadingDiv) loadingDiv.style.display = "none";

            if (data.recommendations && data.recommendations.length > 0) {
                displayMovies(data.recommendations, append);
                seeMoreBtn.style.display = "block"; // Show "See More" if there are results
            } else {
                if (!append) {
                    genreMovies.innerHTML = `<p>No movies found for ${genre}${language ? ` in ${language.toUpperCase()}` : ""}${yearRange ? ` from ${yearRange}` : ""}. Try broadening your filters (e.g., wider year range or different language).</p>`;
                }
                seeMoreBtn.style.display = "none"; // Hide "See More" if no more results
            }
        } catch (error) {
            if (loadingDiv) loadingDiv.style.display = "none";
            genreMovies.innerHTML = `<p>Error: ${error.message || "Failed to fetch movies"}</p>`;
            console.error("Fetch error:", error);
            seeMoreBtn.style.display = "none";
        }
    }

    function displayMovies(movies, append) {
        const container = genreMovies;
        movies.forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("trending-card");
            movieCard.innerHTML = `
                <img src="${movie.poster}" alt="${movie.title}">
                <h3>${movie.title}</h3>
            `;
            movieCard.addEventListener("click", () => {
                window.location.href = `movie-details.html?id=${movie.id}`;
            });
            container.appendChild(movieCard);
        });
    }
});