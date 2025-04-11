document.addEventListener("DOMContentLoaded", function () {
    const movieDetailsContainer = document.getElementById("movieDetails");
    const loadingDiv = document.getElementById("loading");

    const BACKEND_URL = "http://localhost:8000";

    // Get movie ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get("id");

    if (!movieId) {
        movieDetailsContainer.innerHTML = "<p>Error: No movie ID provided.</p>";
        loadingDiv.style.display = "none";
        return;
    }

    // Fetch movie details
    async function fetchMovieDetails() {
        try {
            const response = await fetch(`${BACKEND_URL}/movie-details/?id=${movieId}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            loadingDiv.style.display = "none";
            displayMovieDetails(data);
        } catch (error) {
            loadingDiv.style.display = "none";
            movieDetailsContainer.innerHTML = `<p>Error: ${error.message || "Failed to fetch movie details"}</p>`;
            console.error("Fetch error:", error);
        }
    }

    // Display movie details
    function displayMovieDetails(movie) {
        // Format the platforms (watch options)
        const watchOptions = movie.platforms.map(platform => 
            `<a href="#">${platform.name} (${platform.free ? "Free" : "Paid"})</a>`
        ).join(", ");

        movieDetailsContainer.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
            <div class="movie-info">
                <h2>${movie.title}</h2>
                <div class="info-column">
                    <p><span>Date:</span> ${movie.release_date}</p>
                    <p><span>Director:</span> ${movie.director}</p>
                    <p><span>Cast:</span> ${movie.cast}</p>
                    <p><span>Rating:</span> ${movie.imdb_rating}</p>
                    <p><span>Duration:</span> ${movie.runtime} minutes</p>
                    <p><span>Genre:</span> ${movie.genres}</p>
                    <p><span>Language:</span> ${movie.language}</p>
                    <p><span>Overview:</span> \${movie.overview}</p>
                    <p class="trailer"><span>Trailer:</span> <a href="${movie.trailer_url}" target="_blank">${movie.trailer_url === "N/A" ? "Not Available" : "Watch on YouTube"}</a></p>
                    <p class="watch"><span>Watch On:</span> ${watchOptions}</p>
                </div>
        `;
    }

    // Load movie details
    fetchMovieDetails();
});