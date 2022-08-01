import { Button } from '@material/mwc-button';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { AppContainer } from './app-container';
import { sharedStyles } from './styles/sharedStyles';
import { Item } from './types';
import { googleImageSearch, jisho, playWord } from './util';


@customElement('item-bottom-bar')
export class ItemBottomBar extends LitElement {
  private app!: AppContainer;

  @state() item!: Item;

  @query('#controls [icon="volume_up"]') volumeUpButton?: Button;
  @query('#controls [icon="images"]') imagesButton?: Button;
  @query('#controls #jishoButton') jishoButton?: Button;

  constructor () {
    super()
    window.addEventListener('keydown', (e) => {
      if (e.code == 'KeyA' && this.imagesButton) {
        this.imagesButton.click()
      }
      if (e.code == 'KeyG' && this.jishoButton) {
        this.jishoButton.click()
      }
      if (e.code == 'KeyS' && this.volumeUpButton) {
        this.volumeUpButton.click()
      }
    })
  }

  static styles = [sharedStyles, css`
  #container {
    display: flex;
    align-items: center;
    padding: 17px;
    background-color: #e0e0e0;
  }
  `]

  render () {
    if (this.item == undefined) { return nothing }
    return html`
    <div id=container>
      <item-formatter value="${this.item.v}" style="flex:1"></item-formatter>
      <div id=controls>
        <mwc-icon-button icon=volume_up @click=${()=>{playWord(this.item.v)}}></mwc-icon-button>
        <mwc-icon-button icon=images @click=${()=>{googleImageSearch(this.item.v.replace(/\((.*)\)/g, ''))}}></mwc-icon-button>
        <mwc-icon-button id=jishoButton @click=${()=>{jisho(this.item.v.replace(/\((.*)\)/g, ''))}}>
          <img src="./img/jisho.ico" style="width:20px;height:20px">
        </mwc-icon-button>
        <mwc-icon-button icon="${this.item.a ? 'remove_red_eye' : 'visibility_off'}"
          style="color:${this.item.a ? 'green' : 'red'}"
          @click=${()=>{this.onEyeClick()}}></mwc-icon-button>
      </div>
    </div>
    `
  }

  onEyeClick () {
    this.item.a = !this.item.a;
    this.requestUpdate()
    this.app.requestUpdate()
  }
}