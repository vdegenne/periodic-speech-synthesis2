import { getExactSearch } from 'japanese-data-module';
import { css, html, LitElement } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { sharedStyles } from './styles/sharedStyles';
import { Item } from './types';
import { playJapaneseAudio, playWord } from './util';

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
    flex: 1;
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
        <item-formatter value=${this.item.v} id=text></item-formatter>
        <!-- <span style="flex:1" id=text jp>${this.item.v}${exactSearch ? `(${exactSearch[4]})` : ''}</span> -->
        <mwc-icon-button icon="volume_up" @click=${()=>{this.playWord()}}></mwc-icon-button>
        <mwc-icon-button icon="remove_red_eyes" @click=${()=>{this.onEyeIconClick()}}></mwc-icon-button>
        <mwc-icon-button icon="edit" @click=${()=>{window.toast('yet to come')}}></mwc-icon-button>
        <mwc-icon-button icon="delete" @click=${()=>{this.onDeleteIconClick()}}></mwc-icon-button>
      </div>
    `
  }

  playWord () { playWord(this.item.v) }

  onEyeIconClick() {
    this.item.a = !this.item.a
    this.requestUpdate()
    this.dispatchEvent(new CustomEvent('activeToggle'))
  }

  onDeleteIconClick () {
    const accept = confirm('are you sure to delete this item')
    if (accept) {
      this.dispatchEvent(new CustomEvent('delete'))
    }
  }
}