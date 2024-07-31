// Spotify Web API credentials
window.onSpotifyWebPlaybackSDKReady = () => {
  console.log('Spotify Web Playback SDK is ready.');
};

const CLIENT_ID = 'be28e1d8b65340b1a67721878f91a959';
const REDIRECT_URI = 'http://localhost:5500/audio_visualizer.html';
const SCOPES = 'user-read-private user-read-email playlist-read-private streaming';

// Store access token globally
let accessToken = 'BQBpB4LEh9Hk8ZYyMdtXLO9oAPhGH7Xgo7oGmhrxd0wvCEbuiEA-W7PS8wA-plLlXqbf8oeceAero4PRmEhtXLpSL840kpc0wjAiwBGCaQsdjG57ce7WuuT4bjCO_0yC5gjTAmP755GlsC1ogLJRLn3Wy4dFkcdbedTl081SEYM_zT-sbPU6nnITBx8pagwqEv2VQQbz4eRh-xaiTlPeGdZ9GQ3Baug-HCOvVDg';
let player;

// Function to authorize Spotify
// function authorizeSpotify() {
//     const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${encodeURIComponent(SCOPES)}&response_type=token`;
//     window.location.href = url;
// }

// // Function to handle the callback after authorization
// function handleCallback() {
//     const params = new URLSearchParams(window.location.hash.substring(1));
//     console.log(params)
//     accessToken = params.get('access_token');
//     // You can store the access token and use it to make API requests
//     console.log('Access Token:', accessToken);
// }

// // Function to get user's playlists
function getUserPlaylists() {
    if (!accessToken) {
        console.log('Access token not available. Please authorize Spotify first.');
        return;
    }

    fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const playlistsDiv = document.getElementById('playlists');
        playlistsDiv.innerHTML = '';

        data.items.forEach(playlist => {
            const playlistItem = document.createElement('div');
            playlistItem.textContent = playlist.name;
            playlistItem.addEventListener('click', () => playPlaylist(playlist.id));
            playlistsDiv.appendChild(playlistItem);
        });
    })
    .catch(error => {
        console.log('Error fetching user playlists:', error);
    });
}

// Function to search for a track
function searchTrack() {
    if (!accessToken) {
        console.log('Access token not available. Please authorize Spotify first.');
        return;
    }

    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value;

    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const searchResultsDiv = document.getElementById('searchResults');
        searchResultsDiv.innerHTML = '';

        data.tracks.items.forEach(track => {
            const trackItem = document.createElement('div');
            trackItem.textContent = `${track.name} - ${track.artists[0].name}`;
            trackItem.addEventListener('click', () => playTrack(track.uri));
            searchResultsDiv.appendChild(trackItem);
        });
    })
    .catch(error => {
        console.log('Error searching for a track:', error);
    });
}

// Function to play a playlist
function playPlaylist(playlistId) {
    if (!accessToken) {
        console.log('Access token not available. Please authorize Spotify first.');
        return;
    }

    if (player) {
        player.disconnect();
    }

    player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => { cb(accessToken); }
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('Device ID:', device_id);

        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                context_uri: `spotify:playlist:${playlistId}`
            })
        })
        .then(response => {
            if (response.status === 403) {
                console.log('Playback control not allowed on the current device.');
            } else if (response.status === 404) {
                console.log('Playlist not found.');
            } else if (response.status === 204) {
                console.log('Playback started successfully.');
            }
        })
        .catch(error => {
            console.log('Error playing playlist:', error);
        });
    });
    player.connect();
  }

    


// Function to play a track
function playTrack(trackUri) {
    if (!accessToken) {
        console.log('Access token not available. Please authorize Spotify first.');
        return;
    }

    if (player) {
        player.disconnect();
    }

    player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => { cb(accessToken); }
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('Device ID:', device_id);

        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: [trackUri]
            })
        })
        .then(response => {
            if (response.status === 403) {
                console.log('Playback control not allowed on the current device.');
            } else if (response.status === 404) {
                console.log('Track not found.');
            } else if (response.status === 204) {
                console.log('Playback started successfully.');
            }
        })
        .catch(error => {
            console.log('Error playing track:', error);
        });
    });

    player.connect();
}

// Event listener to handle the callback after authorization
// window.addEventListener('hashchange', handleCallback, false);


function playSpotify() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add controls for camera movement
    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    // Create a geometry for the visualization
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Set up Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let analyserNode;
    let dataArray;
    let audioStream;

    // Request microphone access and start audio visualization
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioStream = stream;
        const sourceNode = audioContext.createMediaStreamSource(stream);

        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        const bufferLength = analyserNode.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        sourceNode.connect(analyserNode);

        updateVisualization();
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });

    // Update the visualization with audio data
    function updateVisualization() {
      // Get the frequency data from the analyser node
      analyserNode.getByteFrequencyData(dataArray);

      // Modify the cube's scale based on the audio data
      const scale = (dataArray[0] / 128) * 2;
      cube.scale.set(scale, scale, scale);

      // Render the scene
      renderer.render(scene, camera);

      // Call the updateVisualization function again on the next frame
      requestAnimationFrame(updateVisualization);
    }
  }