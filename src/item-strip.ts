import { getExactSearch } from 'japanese-data-module';
import { css, html, LitElement } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { sharedStyles } from './styles/sharedStyles';
import { Item } from './types';
import { playJapaneseAudio } from './util';

@customElement('item-strip')
export class ItemStrip extends LitElement {
  @state()
  item!: Item;

  @property({type: Boolean, reflect: true})
  active: boolean = false;

  get textPart () {
    return this.shadowRoot!.querySelector('#text')!.textContent!;
  }

  static styles = [sharedStyles, css`
  :host {
    display: flex;
    align-items: center;
    /* background-color: #c0c0c0; */
    padding: 5px 0 5px 12px;
  }

  :host(:not([active])) {
    opacity: 0.4;
  }

  :host(:hover) {
    background-color: #eee;
  }

  mwc-icon-button {
    --mdc-icon-button-size: 38px;
    --mdc-icon-size: 24px;
    color: grey;
  }

  #text {
    font-size: 1.5em;
    position: relative;
    top: -2px;
  }
  `]

  render() {
    this[this.item.a ? 'setAttribute' : 'removeAttribute']('active', '')
    const exactSearch = getExactSearch(this.item.v)

    return html`
      <div style="display: flex;align-items: center;flex:1">
        <span style="flex:1" id=text jp>${this.item.v}${exactSearch ? `(${exactSearch[4]})` : ''}</span>
        <mwc-icon-button icon="remove_red_eyes"
          @click=${()=>{this.onEyeIconClick()}}></mwc-icon-button>
        <mwc-icon-button icon="edit"></mwc-icon-button>
        <mwc-icon-button icon="delete" @click=${()=>{this.onDeleteIconClick()}}></mwc-icon-button>
      </div>
    `
  }

  playAudio () {
    const hiraganaMatch = this.textPart.match(/\((.+)\)/)
    if (hiraganaMatch) {
      playJapaneseAudio(hiraganaMatch[1])
    }
    else {
      playJapaneseAudio(this.item.v)
    }
  }

  onEyeIconClick() {
    this.item.a = !this.item.a
    this.requestUpdate()
    this.fireChange()
  }

  onDeleteIconClick () {
    const accept = confirm('are you sure to delete this item')
    if (accept) {
      this.dispatchEvent(new CustomEvent('delete'))
    }
  }

  fireChange () {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {}
    }))
  }
}