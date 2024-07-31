
// Spotify Authentication
const clientId = '09c4ac31d0494b50bfd36866da4ef42f';
const redirectUri = 'https://moncriefemail.wixsite.com/rtjbr'; // Replace with your redirect URI
let accessToken = '';

function getSpotifyAuthUrl() {
    const scopes = 'streaming user-read-email user-read-private';
    return `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
}

function getAccessToken() {
    const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
        if (item) {
            const parts = item.split('=');
            acc[parts[0]] = decodeURIComponent(parts[1]);
        }
        return acc;
    }, {});

    accessToken = hash.access_token;

    if (accessToken) {
        sessionStorage.setItem('spotifyAccessToken', accessToken);
    } else {
        accessToken = sessionStorage.getItem('spotifyAccessToken');
    }

    if (!accessToken) {
        window.location.href = getSpotifyAuthUrl();
    }
}

function animateElement(element) {
    element.classList.add('spin-animation');
    setTimeout(() => {
        element.classList.remove('spin-animation');
    }, 300);
}

function adjustButtonSpacing() {
    const pairs = JSON.parse(sessionStorage.getItem('pairs') || '[]');
    const buttons = document.querySelectorAll('button');
    const spacing = pairs.length ? 10 / pairs.length : 10;

    buttons.forEach(button => {
        button.style.marginBottom = `${spacing}vh`;
    });
}

document.getElementById('spinChoices').addEventListener('click', function() {
    const numberOfChoices = Math.floor(Math.random() * 10) + 1;
    const element = document.getElementById('numberOfChoices');
    element.innerText = `Choices: ${numberOfChoices}`;
    animateElement(element);
    sessionStorage.setItem('choices', numberOfChoices);
});

document.getElementById('spinPair').addEventListener('click', function() {
    const decades = ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
    const genres = ['rock', 'pop', 'hip-hop', 'country', 'jazz', 'classical', 'electronic'];
    const numberOfChoices = sessionStorage.getItem('choices') || 1;
    let selectedPairs = [];

    for (let i = 0; i < numberOfChoices; i++) {
        const decade = decades[Math.floor(Math.random() * decades.length)];
        const genre = genres[Math.floor(Math.random() * genres.length)];
        selectedPairs.push(`${decade} - ${genre}`);
    }

    const element = document.getElementById('pairs');
    element.innerText = `Pairs: ${selectedPairs.join(', ')}`;
    animateElement(element);
    sessionStorage.setItem('pairs', JSON.stringify(selectedPairs));
    adjustButtonSpacing();
});

document.getElementById('spinPick').addEventListener('click', function() {
    const pairs = JSON.parse(sessionStorage.getItem('pairs'));
    const pickedChoice = pairs[Math.floor(Math.random() * pairs.length)];
    const element = document.getElementById('chosen');
    element.innerText = `Chosen: ${pickedChoice}`;
    animateElement(element);

    const [decade, genre] = pickedChoice.split(' - ');
    playSpotifySongs(decade.trim(), genre.trim());
});

document.getElementById('spinSongs').addEventListener('click', function() {
    const numberOfSongs = Math.floor(Math.random() * 10) + 1;
    const element = document.getElementById('numberOfSongs');
    element.innerText = `Number of Songs: ${numberOfSongs}`;
    animateElement(element);
});

// Play Spotify songs based on the selected decade and genre
async function playSpotifySongs(decade, genre) {
    if (!accessToken) {
        getAccessToken();
        return;
    }

    const query = `genre:${genre} year:${decade}`;
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    if (data.tracks && data.tracks.items.length > 0) {
        const trackUris = data.tracks.items.map(track => track.uri);

        // Play the first track in the user's Spotify player
        const playResponse = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uris: trackUris })
        });

        if (!playResponse.ok) {
            console.error('Error playing Spotify tracks:', playResponse.statusText);
        }
    } else {
        console.log('No tracks found for the selected decade and genre.');
    }
}

// Initialize Spotify access token
getAccessToken();
