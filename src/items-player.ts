import { Dialog } from '@material/mwc-dialog';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { AppContainer } from './app-container';
import { Item } from './types';
import { playWord, sleep } from './util';


@customElement('items-player')
export class ItemsPlayer extends LitElement {
  private app: AppContainer;
  private items: Item[] = []
  get activeItems () { return this.items.filter(i=>i.a) }

  @state() projectName = ''

  private _timeout?: NodeJS.Timeout;
  @property({type: Boolean, reflect: true}) private playing = false
  @state() pauseTimeS = 60;
  @state() repeatCount = 2;
  private _historyList: Item[] = [];
  get isPlaying () { return this.playing }

  @query('mwc-dialog') dialog!: Dialog;

  constructor (app: AppContainer) {
    super()
    this.app = app
  }

  static styles = css`
  #playButton {
    --mdc-theme-primary: #2196f3;
  }
  :host([playing]) #playButton {
    --mdc-theme-primary: red;
  }
  `

  render () {
    return html`
    <mwc-button id="playButton" raised icon="${this.playing ? 'stop' : 'play_arrow'}" @click=${()=>{this.toggleStart()}}>${this.playing ? 'stop' : 'play'}</mwc-button>
    <mwc-dialog heading='Play \"${this.projectName}\"' style="/*--mdc-dialog-min-width:calc(100vw - 24px)*/"
        @opened=${e => { this.shadowRoot!.querySelectorAll('mwc-slider').forEach(el => el.layout()) }}>
      <p>pause between (seconds)</p>
      <mwc-slider
        discrete
        withTickMarks
        min=0
        max=100
        step=5
        value=${this.pauseTimeS}
        @change=${e => { this.pauseTimeS = e.detail.value }}
      ></mwc-slider>
      <p>how many times</p>
      <mwc-slider
        discrete
        withTickMarks
        min=1
        max=10
        value=${this.repeatCount}
        @change=${e => { this.repeatCount = e.detail.value }}
      ></mwc-slider>

      <mwc-formfield label="includes inactive items (not implemented yet)">
        <mwc-checkbox></mwc-checkbox>
      </mwc-formfield>

      ${this.projectName == 'all projects' ? html`
      <p style="font-weight:bold">Note: You're about to play the items of all the projects!</p>
      ` : nothing}

      <mwc-button outlined slot="secondaryAction" dialogAction=close>close</mwc-button>
      <mwc-button unelevated slot=primaryAction
        @click=${() => { this.toggleStart() }}>start</mwc-button>
    </mwc-dialog>
    `
  }

  refill (items: Item[]) {
    this.items = items;
  }

  // removeItemFromBag (item: Item) {
  //   this.items.splice(this.items.indexOf(item))
  // }
  // addItemToBag (item: Item) {
  //   this.items.push(item)
  // }

  toggleStart() {
    if (this.playing) {
      this.clearTimeout()
      this.playing = false
    }
    else {
      if (this.dialog.open) {
        this.dialog.close()
        this.playing = true
        this.runTimeout(true)
      }
      else {
        this.dispatchEvent(new CustomEvent('initiate-start'))
        this.dialog.show()
      }
      // this.running = true
    }
    this.app.requestUpdate()
  }
  stop() {
    if (this.playing) {
      this.toggleStart()
    }
  }

  pickRandomItem() {
    // Filter the items
    let candidates = this.activeItems.filter(item => !this._historyList.includes(item))
    if (candidates.length == 0) {
      this._historyList = []
      candidates = this.activeItems // @TODO filter if "include inactive items" is checked
      if (candidates.length == 0) { return null }
    }
    return candidates[~~(Math.random() * candidates.length)]
  }

  clearTimeout() {
    if (this._timeout) {
      clearTimeout(this._timeout)
      this._timeout = undefined
    }
  }

  runTimeout(prerun = false) {
    if (!this.playing) { return }

    this.clearTimeout()

    this._timeout = setTimeout(async () => {
      if (!this.playing) { return }
      let item = await this.pickRandomItem()
      if (item) {
        // if (this.isCurrentViewCurrentProject) {
        //   // this.app.highlightItemFromValue(item.v)
        // }
        this.app.itemBottomBar.item = item
        this._historyList.push(item)
        for (let i = 0; i < this.repeatCount; ++i) {
          if (!this.playing) { return }
          if (i !== 0) {
            await sleep(3000)
          }
          if (!this.playing) { return }
          await playWord(item.v)
        }
      }
      else {
        // If the item is null, that means there is no active items to select
        // We stop everything
        window.toast('Nothing else to play.')
        this.stop()
        return
      }
      if (this.playing) {
        this.runTimeout()
      }
    }, prerun ? 0 : this.pauseTimeS * 1000)
  }
}