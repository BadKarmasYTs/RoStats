const addGameForm = document.getElementById('addGameForm');
const universeIdInput = document.getElementById('universeIdInput');
const gamesContainer = document.getElementById('gamesContainer');

let trackedGames = JSON.parse(localStorage.getItem('trackedGames')) || [];

const extractGameIdFromUrl = (url) => {
  const match = url.match(/roblox\.com\/games\/(\d+)/);
  return match ? match[1] : null;
};

const getUniverseIdFromGameId = async (gameId) => {
  try {
    const response = await fetch(`https://games.roblox.com/v1/games?placeId=${gameId}`);
    if (!response.ok) throw new Error('Failed to get Universe ID');
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].universeId;
    } else {
      throw new Error('Game data not found');
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};


const fetchGameData = async (universeId) => {
  try {
    const [gameRes, votesRes, favoritesRes] = await Promise.all([
      fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
      fetch(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`),
      fetch(`https://games.roblox.com/v1/games/${universeId}/favorites/count`)
    ]);

    const gameData = await gameRes.json();
    const votesData = await votesRes.json();
    const favoritesData = await favoritesRes.json();

    if (!gameData.data || gameData.data.length === 0) {
      throw new Error('Game not found');
    }

    return {
      id: universeId,
      name: gameData.data[0].name,
      playing: gameData.data[0].playing,
      likes: votesData.data[0].upVotes,
      dislikes: votesData.data[0].downVotes,
      favorites: favoritesData.favoritesCount
    };
  } catch (error) {
    console.error(error);
    alert('Failed to fetch game data.');
    return null;
  }
};

const renderGameCard = (game) => {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.id = `game-${game.id}`;

  const header = document.createElement('div');
  header.className = 'game-header';

  const title = document.createElement('div');
  title.className = 'game-title';
  title.textContent = game.name;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-button';
  removeBtn.textContent = 'Remove';
  removeBtn.onclick = () => removeGame(game.id);

  header.appendChild(title);
  header.appendChild(removeBtn);

  const stats = document.createElement('div');
  stats.className = 'stats';

  const playingStat = document.createElement('div');
  playingStat.className = 'stat';
  playingStat.innerHTML = `<div class="stat-value">${game.playing}</div><div class="stat-label">Playing</div>`;

  const likesStat = document.createElement('div');
  likesStat.className = 'stat';
  likesStat.innerHTML = `<div class="stat-value">${game.likes}</div><div class="stat-label">Likes</div>`;

  const favoritesStat = document.createElement('div');
  favoritesStat.className = 'stat';
  favoritesStat.innerHTML = `<div class="stat-value">${game.favorites}</div><div class="stat-label">Favorites</div>`;

  stats.appendChild(playingStat);
  stats.appendChild(likesStat);
  stats.appendChild(favoritesStat);

  const canvas = document.createElement('canvas');
  canvas.id = `chart-${game.id}`;

  card.appendChild(header);
  card.appendChild(stats);
  card.appendChild(canvas);

  gamesContainer.appendChild(card);

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Playing', 'Likes', 'Favorites'],
      datasets: [{
        label: 'Stats',
        data: [game.playing, game.likes, game.favorites],
        backgroundColor: ['#007aff', '#34c759', '#ff9500']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
};

const addGame = async (gameUrl) => {
  const gameId = extractGameIdFromUrl(gameUrl);
  if (!gameId) {
    alert('Invalid Roblox game URL.');
    return;
  }

  const universeId = await getUniverseIdFromGameId(gameId);
  if (!universeId) {
    alert('Failed to get Universe ID.');
    return;
  }

  if (trackedGames.includes(universeId)) {
    alert('Game already tracked.');
    return;
  }

  const gameData = await fetchGameData(universeId);
  if (gameData) {
    trackedGames.push(universeId);
    localStorage.setItem('trackedGames', JSON.stringify(trackedGames));
    renderGameCard(gameData);
  }
};

const removeGame = (universeId) => {
  trackedGames = trackedGames.filter(id => id !== universeId);
  localStorage.setItem('trackedGames', JSON.stringify(trackedGames));
  const card = document.getElementById(`game-${universeId}`);
  if (card) {
    gamesContainer.removeChild(card);
  }
};

const initialize = async () => {
  for (const universeId of trackedGames) {
    const gameData = await fetchGameData(universeId);
    if (gameData) {
      renderGameCard(gameData);
    }
  }
};

addGameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = universeIdInput.value.trim();
  if (url) {
    addGame(url);
    universeIdInput.value = '';
  }
});

initialize();
