import { getExactSearch } from 'japanese-data-module';
import { css, html, LitElement, nothing } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { sharedStyles } from './styles/sharedStyles';
import { Item } from './types';
import { jisho, playJapaneseAudio, playWord } from './util';

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
    const project = window.app.projectsManager.getProjectFromItem(this.item)
    const otherProjects = window.app.projectsManager.getProjectsFromItemValue(this.item.v).filter(p => p !== project)

    return html`
      <div style="display: flex;align-items: center;flex:1">
        <div style="flex:1">
          <item-formatter value=${this.item.v} id=text></item-formatter>
          ${otherProjects.length ? html`<mwc-icon style="color:grey;cursor:default" title="${otherProjects.map(p=>p.name).join('\n')}">workspaces</mwc-icon>` : nothing}
        </div>
        <!-- <span style="flex:1" id=text jp>${this.item.v}${exactSearch ? `(${exactSearch[4]})` : ''}</span> -->
        <mwc-icon-button icon="volume_up" @click=${(e)=>{e.stopPropagation(); this.playWord()}}></mwc-icon-button>
        <mwc-icon-button @click=${(e)=>{e.stopPropagation(); jisho(this.item.v.replace(/\((.+)\)/g, ''))}}><img src="./img/jisho.ico"></mwc-icon-button>
        <mwc-icon-button icon="remove_red_eyes" @click=${(e)=>{this.onEyeIconClick(e)}}></mwc-icon-button>
        <mwc-icon-button icon="edit" @click=${(e)=>{e.stopPropagation(); this.dispatchEvent(new CustomEvent('edit'))}}></mwc-icon-button>
        <mwc-icon-button icon="delete" @click=${(e)=>{this.onDeleteIconClick(e)}}></mwc-icon-button>
      </div>
    `
  }

  playWord () { playWord(this.item.v) }

  onEyeIconClick(e) {
    e.stopPropagation()
    this.item.a = !this.item.a
    this.requestUpdate()
    this.dispatchEvent(new CustomEvent('activeToggle'))
  }

  onDeleteIconClick (e) {
    e.stopPropagation()
    const accept = confirm('are you sure to delete this item')
    if (accept) {
      this.dispatchEvent(new CustomEvent('delete'))
    }
  }
}