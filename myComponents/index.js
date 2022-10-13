import './libs/webaudio-controls.js';
import './components/balance.js';
import './components/frequence.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;

const getBaseURL = () => {
    return new URL('.', import.meta.url);
};

const template = document.createElement("template");
template.innerHTML = /*html*/`
    <style>
    canvas {
        border:1px solid black;
    }
    </style>
    <canvas id="myCanvas" width=400></canvas>
    <audio id="myPlayer" crossorigin="anonymous"></audio>        
    <br>

    <webaudio-knob id="volumeKnob" 
      src="./assets/imgs/LittlePhatty.png" 
      value=5 min=0 max=20 step=0.01 
      diameter="32" 
      tooltip="Volume: %d">
    </webaudio-knob>
    <br>
    Progression : <input id="progress" type="range" value=0>
    </br>
    <button id="play">Play</button> 
    <button id="pause">Pause</button>
    <button id="avance10">+10s</button>
    <button id="recule10">-10s</button>
    <button id="stop">Stop</button>
    <button id="next">Next</button>
    <button id="previous">Previous</button>
    <br>
    <label>Vitesse de lecture
        0 <input id="vitesseLecture" type="range" min=0.2 max=4 step=0.1 value=1> 4
    </label>
    <my-balance id="balance"></my-balance>
    <br>
    <my-frequence id="frequence"></my-frequence>
    
    
`;

class MyAudioPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.playList = [
            {
                url: "/myComponents/assets/audio/0.mp3",
                author: "Tame Impala",
                title: "Let It Happen",
                index: 0,
            },
            {
                url: "/myComponents/assets/audio/1.mp3",
                author: "Tame Impala",
                title: "Eventually",
                index: 1,
            },
            {
                url: "/myComponents/assets/audio/2.mp3",
                author: "Tame Impala",
                title: "Less I Know The Better",
                index: 2,
            },
            {
                url: "/myComponents/assets/audio/3.mp3",
                author: "Tame Impala",
                title: "Borderline",
                index: 3,
            }
        ];
        this.currentSoundObject = this.playList[0];
        console.log(this.currentSoundObject);
    }

    connectedCallback() {
        // Appelée automatiquement par le browser
        // quand il insère le web component dans le DOM
        // de la page du parent..

        // On clone le template HTML/CSS (la gui du wc)
        // et on l'ajoute dans le shadow DOM
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // fix relative URLs
        this.fixRelativeURLs();

        this.player = this.shadowRoot.querySelector("#myPlayer");
        this.player.src = this.getAttribute("src");
        this.player.src = this.currentSoundObject.url;

        this.balance = this.shadowRoot.querySelector("#balance");
        console.log(this.balance);

        this.frequence = this.shadowRoot.querySelector("#frequence");
        console.log(this.frequence);

        // récupérer le canvas
        this.canvas = this.shadowRoot.querySelector("#myCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Récupération du contexte WebAudio
        this.audioCtx = new AudioContext();
        this.sourceNode = this.audioCtx.createMediaElementSource(this.player);
        this.filters = [];
        this.analyser;



        // On construit un graphe webaudio pour capturer
        // le son du lecteur et pouvoir le traiter
        // en insérant des "noeuds" webaudio dans le graphe
        this.buildAudioGraph();
        this.initAudio();

        // on définit les écouteurs etc.
        this.defineListeners();

        // on démarre l'animation
        requestAnimationFrame(() => {
            this.animationLoop();
        });
    }

    buildAudioGraph() {
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 1024;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        // Set filters
        [60, 170, 350, 1000, 3500, 10000].forEach((freq, i) => {
            var eq = this.audioCtx.createBiquadFilter();
            eq.frequency.value = freq;
            eq.type = "peaking";
            eq.gain.value = 0;
            this.filters.push(eq);
        });
        // Connect filters in serie
        this.sourceNode.connect(this.filters[0]);
        for (var i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
        // connect the last filter to the speakers
        this.filters[this.filters.length - 1].connect(this.analyser);

        this.masterGain = this.audioCtx.createGain();
        this.masterGain.value = 1;
        this.filters[this.filters.length - 1].connect(this.masterGain);
        this.stereoPanner = this.audioCtx.createStereoPanner();
        this.masterGain.connect(this.stereoPanner);
        this.stereoPanner.connect(this.analyser);

        this.analyser.connect(this.audioCtx.destination);

    }

    initAudio(){
        console.log("initAudio");
        console.log(this.filters);
        this.balance.stereoPanner = this.stereoPanner;
        this.frequence.filters = this.filters;
    }


    animationLoop() {
        // 1 on efface le canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 2 on dessine les objets
        //this.ctx.fillRect(10+Math.random()*20, 10, 100, 100);

        // Get the analyser data
        this.analyser.getByteFrequencyData(this.dataArray);

        let barWidth = this.canvas.width / this.bufferLength;
        let barHeight;
        let x = 0;

        // values go from 0 to 256 and the canvas heigt is 100. Let's rescale
        // before drawing. This is the scale factor
        let heightScale = this.canvas.height / 128;

        for (let i = 0; i < this.bufferLength; i++) {
            barHeight = this.dataArray[i];

            this.ctx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
            barHeight *= heightScale;
            this.ctx.fillRect(x, this.canvas.height - barHeight / 2, barWidth, barHeight / 2);

            // 2 is the number of pixels between bars
            x += barWidth + 1;
        }
        // 3 on deplace les objets

        // 4 On demande au navigateur de recommencer l'animation
        requestAnimationFrame(() => {
            this.animationLoop();
        });
    }

    fixRelativeURLs() {
        const elems = this.shadowRoot.querySelectorAll("webaudio-knob, webaudio-slider, webaudio-switch, img, balance");
        elems.forEach(e => {
            const path = e.src;
            if (path.startsWith(".")) {
                e.src = getBaseURL() + path;
            }
        });
    }

    defineListeners() {
        this.shadowRoot.querySelector("#play").onclick = () => {
            this.player.play();
            this.audioCtx.resume();
        }

        this.shadowRoot.querySelector("#pause").onclick = () => {
            this.player.pause();
        }

        this.shadowRoot.querySelector("#stop").onclick = () => {
            this.player.pause();
            this.player.currentTime = 0;
        }

        this.shadowRoot.querySelector("#next").onclick = () => {
            this.player.pause();
            this.player.currentTime = 0;
            if (this.currentSoundObject.index === this.playList.length - 1) {
                this.currentSoundObject = this.playList[0];
            } else {
                this.currentSoundObject = this.playList[this.currentSoundObject.index + 1];
            }
            this.player.src = this.currentSoundObject.url;
            this.player.play();
        }

        this.shadowRoot.querySelector("#previous").onclick = () => {
            this.player.pause();
            this.player.currentTime = 0;
            if (this.currentSoundObject.index === 0) {
                this.currentSoundObject = this.playList[this.playList.length - 1];
            } else {
                this.currentSoundObject = this.playList[this.currentSoundObject.index - 1];
            }
            this.player.src = this.currentSoundObject.url;
            this.player.play();
        }

        this.shadowRoot.querySelector("#avance10").onclick = () => {
            this.player.currentTime += 10;
        }

        this.shadowRoot.querySelector("#recule10").onclick = () => {
            this.player.currentTime -= 10;
        }

        this.shadowRoot.querySelector("#stop").onclick = () => {
            this.player.pause();
            this.player.currentTime = 0;
        }

        this.shadowRoot.querySelector("#vitesseLecture").oninput = (event) => {
            this.player.playbackRate = parseFloat(event.target.value);
            console.log("vitesse =  " + this.player.playbackRate);
        }

        this.shadowRoot.querySelector("#progress").onchange = (event) => {
            this.player.currentTime = parseFloat(event.target.value);
        }

        this.shadowRoot.querySelector('#volumeKnob').addEventListener('input', (evt) => {
            this.player.volume = evt.target.value;
        });

        this.player.ontimeupdate = (event) => {
            let progressSlider = this.shadowRoot.querySelector("#progress");
            progressSlider.max = this.player.duration;
            progressSlider.min = 0;
            progressSlider.value = this.player.currentTime;
        }
    }

    // L'API du Web Component

}

customElements.define("my-player", MyAudioPlayer);
