from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import ollama
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_API_KEY = "11cc69e94b73b857e509404280670f21"
TMDB_API_URL = "https://api.themoviedb.org/3"

users = []

class UserSignup(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

GENRE_IDS = {
    "action": 28,
    "horror": 27,
    "romance": 10749,
    "sci-fi": 878,
    "drama": 18,
    "comedy": 35,
    "thriller": 53,
    "mystery": 9648,
    "animation": 16,
    "documentary": 99,
    "fantasy": 14,
    "adventure": 12
}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Movie Recommendation API!"}

@app.post("/signup")
async def signup(user: UserSignup):
    if any(u["email"] == user.email for u in users):
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    
    users.append({
        "username": user.username,
        "email": user.email,
        "password": user.password
    })
    return {"message": "User registered successfully."}

@app.post("/login")
async def login(user: UserLogin):
    for u in users:
        if u["email"] == user.email and u["password"] == user.password:
            return {"message": "Login successful."}
    raise HTTPException(status_code=401, detail="Invalid email or password.")

@app.get("/api/now-playing")
def get_now_playing():
    now_playing_url = f"{TMDB_API_URL}/movie/now_playing?api_key={TMDB_API_KEY}&language=en-US&page=1"
    response = requests.get(now_playing_url)
    data = response.json()

    new_movies = []
    if "results" in data:
        for movie in data["results"][:5]:  # Limit to 5 movies
            new_movies.append({
                "id": movie["id"],
                "title": movie["title"],
                "poster": f"https://image.tmdb.org/t/p/original{movie['backdrop_path']}" if movie.get("backdrop_path") else "https://via.placeholder.com/1280x720?text=No+Image",
                "overview": movie["overview"]
            })
    return {"results": new_movies}

@app.get("/api/trending")
def get_trending(page: int = 1):
    trending_url = f"{TMDB_API_URL}/trending/movie/day?api_key={TMDB_API_KEY}&page={page}"
    response = requests.get(trending_url)
    data = response.json()

    trending_movies = []
    if "results" in data:
        for movie in data["results"][:5]:
            trending_movies.append({
                "id": movie["id"],
                "title": movie["title"],
                "poster": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else "https://via.placeholder.com/200x300?text=No+Image",
            })
    return {"results": trending_movies}

@app.get("/recommend/")
def recommend(movie: str, genre: str = "", language: str = "", year: str = "", page: int = 1):
    params = {
        "api_key": TMDB_API_KEY,
        "sort_by": "popularity.desc",
        "page": page
    }
    
    if genre.lower() in GENRE_IDS:
        params["with_genres"] = GENRE_IDS[genre.lower()]
    
    if language:
        params["with_original_language"] = language.lower()
    
    if year:
        start_year, end_year = year.split("-")
        params["primary_release_date.gte"] = f"{start_year}-01-01"
        params["primary_release_date.lte"] = f"{end_year}-12-31"
    else:
        params["primary_release_date.gte"] = "2015-01-01"

    response = requests.get(f"{TMDB_API_URL}/discover/movie", params=params)
    data = response.json()

    if "results" not in data or not data["results"]:
        return {"input_movie": movie, "recommendations": []}

    movies = data["results"][:20]
    movie_list_str = "\n".join([f"{m['title']} ({m['release_date'][:4]})" for m in movies])

    prompt = f"""
    You are a movie recommendation system. Given the input "{movie}", here is a list of movies:
    {movie_list_str}
    Recommend the top 5 movies that are most similar in genre, story, and audience appeal.
    Return only movie names in a comma-separated format: Movie1, Movie2, Movie3, Movie4, Movie5
    DO NOT add explanations or extra words.
    """

    response = ollama.chat(model="gemma2:2b", messages=[{"role": "user", "content": prompt}])
    movie_list = response['message']['content'].strip().split("\n")[-1]
    recommended_movies = [rec.strip() for rec in movie_list.split(",") if rec.strip()]

    movie_details = []
    for rec_movie in recommended_movies[:5]:
        for movie in movies:
            if movie["title"].lower() == rec_movie.lower():
                movie_details.append({
                    "id": movie["id"],
                    "title": movie["title"],
                    "poster": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else "https://via.placeholder.com/200x300?text=No+Image"
                })
                break

    return {"input_movie": movie, "recommendations": movie_details}

@app.get("/movie-details/")
def movie_details(id: int):
    details_response = requests.get(f"{TMDB_API_URL}/movie/{id}", params={"api_key": TMDB_API_KEY})
    details = details_response.json()

    credits_response = requests.get(f"{TMDB_API_URL}/movie/{id}/credits", params={"api_key": TMDB_API_KEY})
    credits = credits_response.json()

    director = next((crew["name"] for crew in credits.get("crew", []) if crew["job"] == "Director"), "N/A")
    cast = ", ".join([actor["name"] for actor in credits.get("cast", [])[:3]]) if credits.get("cast") else "N/A"

    videos_response = requests.get(f"{TMDB_API_URL}/movie/{id}/videos", params={"api_key": TMDB_API_KEY})
    videos = videos_response.json()
    trailer_url = next((f"https://www.youtube.com/watch?v={video['key']}" for video in videos.get("results", []) if video["type"] == "Trailer"), "N/A")

    platforms = [{"name": "Netflix", "free": False}, {"name": "YouTube", "free": True}] \
                if "Action" in [g["name"] for g in details.get("genres", [])] \
                else [{"name": "Amazon Prime", "free": False}]

    return {
        "id": id,
        "title": details.get("title", "N/A"),
        "release_date": details.get("release_date", "N/A"),
        "director": director,
        "cast": cast,
        "imdb_rating": details.get("vote_average", "N/A"),
        "runtime": details.get("runtime", "N/A"),
        "genres": ", ".join([g["name"] for g in details.get("genres", [])]),
        "language": details.get("original_language", "N/A").upper(),
        "overview": details.get("overview", "No overview available."),
        "poster": f"https://image.tmdb.org/t/p/w500{details['poster_path']}" if details.get("poster_path") else "https://via.placeholder.com/200x300?text=No+Image",
        "trailer_url": trailer_url,
        "platforms": platforms
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)