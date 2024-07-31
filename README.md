# Audio-Visualiser
This application allows users to upload an audio file, and it then visualizes the audio in real-time using various themes. Below are the key details:


Key Features:

Audio File Upload:
Users can select and upload an audio file using a file input element.
The selected audio file is then played, and its audio data is analyzed for visualization.

Three.js Integration:
The project uses three.js for 3D graphics rendering.
Different themes for visualizing the audio are implemented using three.js.

Multiple Themes:
There are at least three different themes (Theme1, Theme2, Theme3) for visualizing the audio.
Users can switch between these themes using a graphical user interface (GUI).

Real-Time Audio Analysis:
The app uses the Web Audio API to analyze the audio signal in real-time.
An AnalyserNode is created to capture the frequency data of the audio.

Dynamic Sensitivity Adjustment:
Users can adjust the sensitivity (FFT size) of the visualizer using a slider in the GUI.
The sensitivity settings allow for finer or coarser visualization of the audio frequency data.

Responsive Design:
The visualizer is designed to take up the full width and height of the browser window.
The design ensures a seamless and immersive experience for the user.



File Structure and Components:

HTML Structure:
The HTML file sets up the basic structure and includes external CSS and JavaScript files.
It links to style.css and style_spotify.css for styling, and uses es-module-shims for module loading.

CSS:
Basic styles are defined for the body and canvas elements to ensure proper layout and fullscreen display.
Additional styles are provided for the file input label and other UI elements.

JavaScript Modules:
The visualizer imports several JavaScript modules, including three.js, simplex-noise, OrbitControls, GUI, and custom themes (theme1.js, theme2.js, theme3.js).
These modules provide the necessary functionality for rendering the 3D visualizations and handling user interactions.

Initialization and Event Handling:
The vizInit function initializes the visualizer, sets up event listeners for file input changes, and handles audio playback.
When an audio file is selected, it creates an AudioContext, connects the audio source to an AnalyserNode, and starts rendering the visualization based on the selected theme.


Usage:

To use the audio visualizer: 

Open the HTML file in a web browser.

Select an audio file using the file input element.

The audio will start playing, and the visualizer will display the audio data in real-time using the selected theme.

Use the GUI to switch between themes and adjust the sensitivity of the visualization.
