class balance extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
            </style>
            <div id="balance">
                Gauche <input type="range" value="0" step="0.1" min="-1" max="1" id="balance"></input> Droite
            </div>  
        `;
        this.balance = this.shadowRoot.querySelector('#balance');
        this.initBalance();
    }

    initBalance() {
        console.log("initBalance");
        setTimeout(() => {
            this.defineListenerBalance();
        });
    }

    defineListenerBalance() {
        this.balance.addEventListener('input', (evt) => {
            this.stereoPanner.pan.value = evt.target.value;
        });
    }
}
customElements.define("my-balance", balance);