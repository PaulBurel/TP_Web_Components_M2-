import './libs/webaudio-controls.js';
import './components/balance.js';
import './components/frequence.js';

const AudioContext = window.AudioContext || window.webkitAudioContext;

const getBaseURL = () => {
    return new URL('.', import.meta.url);
};

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
        this.shadowRoot.innerHTML = `
        <style>
        .body {
            margin: 0 auto;
            padding: 1em;
            background: rgba(0, 0, 0,0.7);
            box-shadow: 0 0 50px black;
            text-align: center;
            width: 450px;
            height: auto;
            border-radius: 10px;
            color: white;
            font-family: 'Helvetica', sans-serif;
        }
        canvas {
            border:1px solid black;
            width: 90%;
        }
        .visu{
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .bar{
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 22%;
            height: 10%;
            background-color: #282828;
            border-radius: 12px;
            width: 800px;
        }
        .b{
            border-radius: 12px;
            background-color: #04AA6D;
            border: none;
            color: white;
            padding: 15px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
        }
        .sliderProg{
            width : 30%;
            accent-color: white;
        }
        .slider{
            accent-color: white;
        }
        
        
        </style>
        <div class="body">
        
        <div class="visu">
            <canvas id="myCanvas" width=400 height="400"></canvas>
            <audio id="myPlayer" crossorigin="anonymous"></audio>
        </div> 
        
        </br>

        <h1 id="titre">${this.currentSoundObject.author} - ${this.currentSoundObject.title}</h1>
        
        <span id="currentTime">00:00</span>
        <input class="sliderProg" id="progress" type="range" value=0>
        <span id="durée">--:--</span>
        
        <br>
        
        <button class="b" id="play">Play</button>
        <button class="b" id="pause">||</button>
        <button class="b" id="stop">Stop</button>
        <button class="b" id="previous"><<</button>    
        <button class="b" id="next">>></button>
        <button class="b" id="avance10">+10s</button>
        <button class="b" id="recule10">-10s</button>
        
        <br>
        
        <webaudio-knob id="vitesseLectureKnob" 
            src="./assets/imgs/silver.png" 
            value=1 min=0.2 max=4 step=0.01 
            diameter="50" 
            tooltip="Vitesse de lecture : %d">
        </webaudio-knob>
        <webaudio-knob id="volumeKnob" 
            src="./assets/imgs/silver.png" 
            value=5 min=0 max=20 step=0.01 
            diameter="50" 
            tooltip="Volume: %d">
        </webaudio-knob>

        <my-balance id="balance"></my-balance>
        <br>
        
        <my-frequence id="frequence"></my-frequence>
        
        </div>
        `;
        this.fixRelativeURLs();

        this.player = this.shadowRoot.querySelector("#myPlayer");

        this.player.src = this.getAttribute("src");
        this.player.src = this.currentSoundObject.url;
        this.updateTitre();

        this.balance = this.shadowRoot.querySelector("#balance");
        console.log(this.balance);

        this.frequence = this.shadowRoot.querySelector("#frequence");
        console.log(this.frequence);

        this.canvas = this.shadowRoot.querySelector("#myCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.audioCtx = new AudioContext();
        this.sourceNode = this.audioCtx.createMediaElementSource(this.player);
        this.filters = [];
        this.analyser;

        this.buildAudioGraph();
        this.initAudio();

        this.defineListeners();

        requestAnimationFrame(() => {
            this.animationLoop();
        });
    }

    buildAudioGraph() {
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 512;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        
        [60, 170, 350, 1000, 3500, 10000].forEach((freq, i) => {
            var eq = this.audioCtx.createBiquadFilter();
            eq.frequency.value = freq;
            eq.type = "peaking";
            eq.gain.value = 0;
            this.filters.push(eq);
        });
        
        this.sourceNode.connect(this.filters[0]);
        for (var i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
        this.filters[this.filters.length - 1].connect(this.analyser);

        this.masterGain = this.audioCtx.createGain();
        this.masterGain.value = 1;
        this.filters[this.filters.length - 1].connect(this.masterGain);

        this.stereoPanner = this.audioCtx.createStereoPanner();
        this.masterGain.connect(this.stereoPanner);
        this.stereoPanner.connect(this.analyser);

        this.analyser.connect(this.audioCtx.destination);
    }

    animationLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.analyser.getByteFrequencyData(this.dataArray);
        let barWidth = this.canvas.width / this.bufferLength;
        let barHeight;
        let x = 0;
        let heightScale = this.canvas.height / 128;
        for (let i = 0; i < this.bufferLength; i++) {
            barHeight = this.dataArray[i];
            this.ctx.fillStyle = 'rgb(' + (barHeight + 255) + ',255,255)';
            barHeight *= heightScale;
            this.ctx.fillRect(x, this.canvas.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
        
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
            this.updateTitre();
            this.updateDurée();
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
            this.updateTitre();
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

        this.shadowRoot.querySelector("#progress").onchange = (event) => {
            this.player.currentTime = parseFloat(event.target.value);
        }

        this.shadowRoot.querySelector('#volumeKnob').addEventListener('input', (evt) => {
            this.player.volume = evt.target.value;
        });

        this.shadowRoot.querySelector('#vitesseLectureKnob').oninput = (event) => {
            this.player.playbackRate = parseFloat(event.target.value);
            console.log("vitesse =  " + this.player.playbackRate);
        }

        this.shadowRoot.querySelector('#progress').addEventListener('input', (evt) => {
            this.player.currentTime = evt.target.value;
        });

        this.player.ontimeupdate = (event) => {
            let progressSlider = this.shadowRoot.querySelector("#progress");
            progressSlider.max = this.player.duration;
            progressSlider.min = 0;
            progressSlider.value = this.player.currentTime;

            let seconds = this.player.currentTime;
            this.shadowRoot.querySelector('#progress').value = seconds;
            let minutes = Math.floor(seconds / 60);
            minutes = (minutes >= 10) ? minutes : "0" + minutes;
            seconds = Math.floor(seconds % 60);
            seconds = (seconds >= 10) ? seconds : "0" + seconds;
            this.shadowRoot.querySelector('#currentTime').innerHTML = minutes + ":" + seconds;
        }

        this.player.onloadedmetadata = () => {
            this.updateDurée();
        }
    }

    updateDurée() {
        let seconds = this.player.duration;
        this.shadowRoot.querySelector('#progress').max = seconds;
        let minutes = Math.floor(seconds / 60);
        minutes = (minutes >= 10) ? minutes : "0" + minutes;
        seconds = Math.floor(seconds % 60);
        seconds = (seconds >= 10) ? seconds : "0" + seconds;
        this.shadowRoot.querySelector('#durée').innerHTML = minutes + ":" + seconds;
    }

    updateTitre() {
        this.shadowRoot.querySelector('#titre').innerHTML = `${this.currentSoundObject.author} - ${this.currentSoundObject.title}`;
    }

    initAudio() {
        console.log("initAudio");
        console.log(this.filters);
        this.balance.stereoPanner = this.stereoPanner;
        this.frequence.filters = this.filters;
    }
}

customElements.define("my-player", MyAudioPlayer);
