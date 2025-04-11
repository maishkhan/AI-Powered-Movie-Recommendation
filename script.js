document.addEventListener("DOMContentLoaded", function () {
    const exploreBtn = document.getElementById("exploreBtn");
    const movieInput = document.getElementById("movieInput");
    const trendingList = document.getElementById("trending-list");
    const loadingDiv = document.getElementById("loading");
    const leftArrow = document.getElementById("leftArrow");
    const rightArrow = document.getElementById("rightArrow");
    const progressBar = document.getElementById("progressBar");
    const seeMoreBtn = document.getElementById("seeMoreBtn");
    const authBtn = document.getElementById("authBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const authModal = document.getElementById("authModal");
    const closeModal = document.getElementById("closeModal");
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginMessage = document.getElementById("loginMessage");
    const signupMessage = document.getElementById("signupMessage");
    const slideshowContainer = document.getElementById("slideshowContainer");

    const BACKEND_URL = "http://localhost:8000";
    let currentPage = 1;

    // Check if user is logged in
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
        authBtn.style.display = "none";
        logoutBtn.style.display = "block";
    }

    // Auth Modal Handling
    authBtn.addEventListener("click", () => {
        authModal.style.display = "block";
    });

    closeModal.addEventListener("click", () => {
        authModal.style.display = "none";
        loginMessage.textContent = "";
        signupMessage.textContent = "";
    });

    window.addEventListener("click", (e) => {
        if (e.target === authModal) {
            authModal.style.display = "none";
            loginMessage.textContent = "";
            signupMessage.textContent = "";
        }
    });

    loginTab.addEventListener("click", () => {
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
        loginForm.style.display = "block";
        signupForm.style.display = "none";
        loginMessage.textContent = "";
        signupMessage.textContent = "";
    });

    signupTab.addEventListener("click", () => {
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
        signupForm.style.display = "block";
        loginForm.style.display = "none";
        loginMessage.textContent = "";
        signupMessage.textContent = "";
    });

    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("signupUsername").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;

        try {
            const response = await fetch(`${BACKEND_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                signupMessage.textContent = "Signup successful! Please login.";
                signupMessage.style.color = "#00ff00";
                signupForm.reset();
                loginTab.click();
            } else {
                signupMessage.textContent = data.detail || "Signup failed.";
                signupMessage.style.color = "#ff2e63";
            }
        } catch (error) {
            signupMessage.textContent = "Error: Unable to signup.";
            signupMessage.style.color = "#ff2e63";
            console.error("Signup error:", error);
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("loggedInUser", email);
                authModal.style.display = "none";
                authBtn.style.display = "none";
                logoutBtn.style.display = "block";
                loginMessage.textContent = "Login successful!";
                loginMessage.style.color = "#00ff00";
                loginForm.reset();
            } else {
                loginMessage.textContent = data.detail || "Login failed.";
                loginMessage.style.color = "#ff2e63";
            }
        } catch (error) {
            loginMessage.textContent = "Error: Unable to login.";
            loginMessage.style.color = "#ff2e63";
            console.error("Login error:", error);
        }
    });

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        authBtn.style.display = "block";
        logoutBtn.style.display = "none";
    });

    // Fetch New Movies for Slideshow
    async function fetchNewMovies() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/now-playing`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                displaySlides(data.results.slice(0, 5)); // Show top 5 new movies
            } else {
                slideshowContainer.innerHTML = "<p>No new movies found.</p>";
            }
        } catch (error) {
            slideshowContainer.innerHTML = `<p>Error: ${error.message || "Failed to fetch new movies"}</p>`;
            console.error("Fetch error:", error);
        }
    }

    // Display Slides
    function displaySlides(movies) {
        movies.forEach((movie, index) => {
            const slide = document.createElement("div");
            slide.classList.add("slide", "fade");
            slide.innerHTML = `
                <img src="${movie.poster}" alt="${movie.title}">
            `;
            slideshowContainer.appendChild(slide);
        });

        // Start the slideshow
        showSlides();
    }

    // Slideshow Logic
    let slideIndex = 0;
    function showSlides() {
        const slides = document.getElementsByClassName("slide");
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        slideIndex++;
        if (slideIndex > slides.length) {
            slideIndex = 1;
        }
        slides[slideIndex - 1].style.display = "block";
        setTimeout(showSlides, 5000); // Change slide every 5 seconds
    }

    // Search Functionality
    exploreBtn.addEventListener("click", function () {
        const query = movieInput.value.trim();
        if (query) {
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }
    });
// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
    // Fetch Trending Movies
    async function fetchTrendingMovies(page, append = false) {
        if (loadingDiv) loadingDiv.style.display = "block";

        try {
            const response = await fetch(`${BACKEND_URL}/api/trending?page=${page}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            if (loadingDiv) loadingDiv.style.display = "none";

            if (data.results && data.results.length > 0) {
                displayMovies(data.results, append);
                setupCarousel();
                seeMoreBtn.style.display = "block";
            } else {
                if (!append) {
                    trendingList.innerHTML = "<p>No trending movies found.</p>";
                }
                seeMoreBtn.style.display = "none";
            }
        } catch (error) {
            if (loadingDiv) loadingDiv.style.display = "none";
            trendingList.innerHTML = `<p>Error: ${error.message || "Failed to fetch trending movies"}</p>`;
            console.error("Fetch error:", error);
            seeMoreBtn.style.display = "none";
        }
    }

    function displayMovies(movies, append) {
        const container = trendingList;
        if (!append) container.innerHTML = "";

        movies.forEach(movie => {
            fetchMovieDetails(movie.id).then(details => {
                const movieCard = document.createElement("div");
                movieCard.classList.add("trending-card");
                movieCard.innerHTML = `
                    <img src="${movie.poster}" alt="${movie.title}">
                    <div class="rating-circle">${details.imdb_rating ? (details.imdb_rating * 10).toFixed(0) + "/0" : "N/A"}</div>
                    <h3>${movie.title}</h3>
                    <p>${details.genres || "Unknown"}</p>
                `;
                movieCard.addEventListener("click", () => {
                    window.location.href = `movie-details.html?id=${movie.id}`;
                });
                container.appendChild(movieCard);
            });
        });
    }

    async function fetchMovieDetails(movieId) {
        try {
            const response = await fetch(`${BACKEND_URL}/movie-details/?id=${movieId}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching movie details:", error);
            return { genres: "Unknown", imdb_rating: "N/A" };
        }
    }

    function setupCarousel() {
        const scrollAmount = 300;
        let isDragging = false;
        let startX;
        let scrollLeft;

        leftArrow.addEventListener("click", () => {
            trendingList.scrollBy({ left: -scrollAmount, behavior: "smooth" });
            updateProgressBar();
        });

        rightArrow.addEventListener("click", () => {
            trendingList.scrollBy({ left: scrollAmount, behavior: "smooth" });
            updateProgressBar();
        });

        trendingList.addEventListener("mousedown", (e) => {
            isDragging = true;
            startX = e.pageX - trendingList.offsetLeft;
            scrollLeft = trendingList.scrollLeft;
            trendingList.style.cursor = "grabbing";
        });

        trendingList.addEventListener("mouseleave", () => {
            isDragging = false;
            trendingList.style.cursor = "grab";
        });

        trendingList.addEventListener("mouseup", () => {
            isDragging = false;
            trendingList.style.cursor = "grab";
        });

        trendingList.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - trendingList.offsetLeft;
            const walk = (x - startX) * 2;
            trendingList.scrollLeft = scrollLeft - walk;
            updateProgressBar();
        });

        trendingList.addEventListener("scroll", updateProgressBar);
        updateProgressBar();
    }

    function updateProgressBar() {
        const maxScroll = trendingList.scrollWidth - trendingList.clientWidth;
        const scrollPosition = trendingList.scrollLeft;
        const progress = (scrollPosition / maxScroll) * 100;
        progressBar.style.width = `${progress}%`;

        leftArrow.style.display = scrollPosition > 0 ? "block" : "none";
        rightArrow.style.display = scrollPosition < maxScroll ? "block" : "none";
    }

    seeMoreBtn.addEventListener("click", () => {
        currentPage += 1;
        fetchTrendingMovies(currentPage, true);
    });

    // Load initial data
    fetchNewMovies();
    fetchTrendingMovies(currentPage);
});