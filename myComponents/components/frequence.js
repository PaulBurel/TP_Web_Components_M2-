class frequence extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
            .slider{
                accent-color: white;
            }
            </style>
            <div id="frequence">
                <div>
                    <label>60Hz</label>
                    <input class="slider" type="range" value="0" step="1" min="-30" max="30" id="f1"></input>
                </div>
                <div>
                    <label>170Hz</label>
                    <input class="slider" type="range" value="0" step="1" min="-30" max="30" id="f2"></input>
                </div>
                <div>
                    <label>350Hz</label>
                    <input class="slider" type="range" value="0" step="1" min="-30" max="30" id="f3"></input>
                </div>
                <div>
                    <label>1000Hz</label>
                    <input class="slider"type="range" value="0" step="1" min="-30" max="30" id="f4"></input>
                </div>
                <div>
                    <label>3500Hz</label>
                    <input class="slider" type="range" value="0" step="1" min="-30" max="30" id="f5"></input>
                </div>
                <div>
                    <label>10000Hz</label>
                    <input class="slider" type="range" value="0" step="1" min="-30" max="30" id="f6"></input>
                </div>
            </div>
        `;
        this.initFrequence();
    }

    initFrequence() {
        console.log("initFrequence");
        setTimeout(() => {
            if (this.filters != null) {
                this.defineListenerFrenquence();
            }
        });
    }

    defineListenerFrenquence() {
        this.shadowRoot.querySelector("#f1").addEventListener('input', (evt) => {
            this.filters[0].gain.value = parseFloat(evt.target.value);
        });
        this.shadowRoot.querySelector("#f2").addEventListener('input', (evt) => {
            this.filters[1].gain.value = parseFloat(evt.target.value);
        });
        this.shadowRoot.querySelector("#f3").addEventListener('input', (evt) => {
            this.filters[2].gain.value = parseFloat(evt.target.value);
        });
        this.shadowRoot.querySelector("#f4").addEventListener('input', (evt) => {
            this.filters[3].gain.value = parseFloat(evt.target.value);
        });
        this.shadowRoot.querySelector("#f5").addEventListener('input', (evt) => {
            this.filters[4].gain.value = parseFloat(evt.target.value);
        });
        this.shadowRoot.querySelector("#f6").addEventListener('input', (evt) => {
            this.filters[5].gain.value = parseFloat(evt.target.value);
        });
    }
}
customElements.define("my-frequence", frequence);