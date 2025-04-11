document.addEventListener("DOMContentLoaded", function () {
    const searchList = document.getElementById("search-list");
    const loadingDiv = document.getElementById("loading");

    const TMDB_API_KEY = "11cc69e94b73b857e509404280670f21";
    const BASE_URL = "https://api.themoviedb.org/3";

    // Get query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("query");

    async function fetchSearchResults() {
        if (loadingDiv) {
            loadingDiv.style.display = "block";
        }

        try {
            const response = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (loadingDiv) {
                loadingDiv.style.display = "none";
            }

            if (!data.results || data.results.length === 0) {
                searchList.innerHTML = "<p>No movies found.</p>";
                return;
            }

            displaySearchResults(data.results);
        } catch (error) {
            if (loadingDiv) {
                loadingDiv.style.display = "none";
            }
            searchList.innerHTML = `<p>Error: ${error.message || "Failed to fetch search results"}</p>`;
            console.error("Fetch error:", error);
        }
    }

    function displaySearchResults(movies) {
        searchList.innerHTML = "";
        movies.forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("trending-card");
            movieCard.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                <h3>${movie.title}</h3>
                <p>${movie.genre_ids.map(id => getGenreName(id)).join(", ")}</p>
            `;
            movieCard.addEventListener("click", () => {
                window.location.href = `movie-details.html?id=${movie.id}`;
            });
            searchList.appendChild(movieCard);
        });
    }

    function getGenreName(genreId) {
        const genres = {
            28: "Action",
            12: "Adventure",
            16: "Animation",
            35: "Comedy",
            80: "Crime",
            99: "Documentary",
            18: "Drama",
            10751: "Family",
            14: "Fantasy",
            36: "History",
            27: "Horror",
            10402: "Music",
            9648: "Mystery",
            10749: "Romance",
            878: "Sci-Fi",
            10770: "TV Movie",
            53: "Thriller",
            10752: "War",
            37: "Western"
        };
        return genres[genreId] || "Unknown";
    }

    if (query) {
        fetchSearchResults();
    } else {
        searchList.innerHTML = "<p>Please enter a search query.</p>";
    }
});