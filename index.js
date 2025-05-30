import React, { useState, useEffect } from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";

function formatNumber(num) {
  if (num === undefined || num === null) return "-";
  return num.toLocaleString();
}

function App() {
  const [gameId, setGameId] = useState("");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  async function fetchStats(id) {
    setError("");
    setStats(null);
    try {
      const gameInfoRes = await fetch(
        `https://games.roblox.com/v1/games?universeIds=${id}`
      );
      const gameInfoData = await gameInfoRes.json();
      if (!gameInfoData.data || gameInfoData.data.length === 0) {
        setError("Game not found.");
        return;
      }
      const game = gameInfoData.data[0];
      const universeId = game.universeId;

      const favorites = game.favoriteCount;
      const likes = game.likes;
      const visits = game.playing || game.maxPlayers || 0; // playing is current players online
      // There is no direct "revenue" endpoint, but you can get developer products sales if you have API access.
      // For now, show approximate total visits instead of revenue.
      // You can expand this later with your own backend.

      setStats({
        name: game.name,
        favorites,
        likes,
        visits,
      });
    } catch {
      setError("Failed to fetch game data.");
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!gameId.trim()) {
      setError("Please enter a game ID.");
      return;
    }
    fetchStats(gameId.trim());
  }

  return (
    <div>
      <h1>Roblox Game Stats Tracker</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="gameId">Enter your Roblox Game ID</label>
        <input
          type="number"
          id="gameId"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="e.g. 123456789"
        />
      </form>

      {error && <div className="error">{error}</div>}

      {stats && (
        <div className="stats">
          <div className="stat">
            <div>Name:</div>
            <div>{stats.name}</div>
          </div>
          <div className="stat">
            <div>Likes:</div>
            <div>{formatNumber(stats.likes)}</div>
          </div>
          <div className="stat">
            <div>Favorites:</div>
            <div>{formatNumber(stats.favorites)}</div>
          </div>
          <div className="stat">
            <div>Players Online:</div>
            <div>{formatNumber(stats.visits)}</div>
          </div>
        </div>
      )}

      <footer>
        Powered by Roblox Public API • Made for you by ChatGPT
      </footer>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
