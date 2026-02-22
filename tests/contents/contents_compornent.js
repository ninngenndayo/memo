class MyCard extends HTMLElement {
  static get observedAttributes() {
    return ['title'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          
          box-sizing: border-box;
          font-family: system-ui, sans-serif;
        }

        .card {
          border: 1px solid #dcdcdc;
          border-radius: 12px;
          padding: 12px;
          background: #fff;
        }

        .title {
          margin: 0 0 8px;
          font-size: 1rem;
          font-weight: 700;
        }

        .content {
          color: #333;
          line-height: 1.5;
        }
      </style>

      <article class="card" part="card">
        <h3 class="title" part="title"></h3>
        <div class="content" part="content">
          <slot>デフォルト本文</slot>
        </div>
      </article>
    `;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && name === 'title') {
      this.render();
    }
  }

  render() {
    const title = this.getAttribute('title') ?? 'タイトルなし';
    const titleNode = this.shadowRoot.querySelector('.title');
    if (titleNode) {
      titleNode.textContent = title;
    }
  }
}

if (!customElements.get('my-card')) {
  customElements.define('my-card', MyCard);
}
