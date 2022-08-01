import { Dialog } from '@material/mwc-dialog';
import { css, html, LitElement, PropertyValueMap } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { AppContainer } from './app-container'
import { Item, Project } from './types'
import { isFullJapanese } from 'asian-regexps';
import { playJapaneseAudio, sleep } from './util';

@customElement('projects-manager')
export class ProjectsManager extends LitElement {
  private app: AppContainer;
  public projects: Project[] = this.getProjectsFromLocalStorage() || [];

  private _timeout?: NodeJS.Timeout;
  @state() pauseTimeS = 60;
  @state() repeatCount = 2;
  @property({type: Boolean, reflect: true}) private playing = false
  private _historyList: Item[] = [];
  @state() currentWord?: string;

  @query('mwc-dialog') dialog!: Dialog;

  constructor (app: AppContainer) {
    super()
    this.projects = this.getProjectsFromLocalStorage() || []
    // if (this.projects == null) {
    //   this.getProjectsFromRemote().then(data => {
    //     this.projects = data || []
    //   })
    // }
    this.app = app
  }

  public currentProjectName?: string;

  get currentProject () {
    if (!this.currentProjectName) return undefined;
    return this.projects.find(p=>p.name === this.currentProjectName)
  }
  get currentActiveItems () { return this.currentProject?.items.filter(i=>i.a) }
  get isPlaying() { return this.playing }


  static styles = css`
  #playButton {
    --mdc-theme-primary: green;
  }
  :host([playing]) #playButton {
    --mdc-theme-primary: red;
  }
  `

  render() {
    return html`
    <mwc-button id="playButton" raised icon="${this.playing ? 'stop' : 'play_arrow'}" @click=${()=>{this.toggleStart()}}>${this.playing ? 'stop' : 'play'}</mwc-button>
    <mwc-dialog style="--mdc-dialog-min-width:calc(100vw - 24px)"
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
      <mwc-button unelevated slot=primaryAction
        @click=${() => { this.toggleStart() }}>start</mwc-button>
    </mwc-dialog>
    `
  }

  projectExists (projectName: string): boolean {
    return this.projects.some(p=> p.name === projectName)
  }

  deleteProject(project: Project) {
    const accept = confirm(`Are you sure to delete "${project.name}" ?`)
    if (accept) {
      // Stop playing if we delete the project that is currently playing
      if (project === this.currentProject && this.playing) {
        this.toggleStart()
      }
      // Remove the project from the list
      this.projects.splice(this.projects.indexOf(project), 1)
      this.app.requestUpdate()
      this.saveProjectsToLocalStorage()
    }
  }

  addNewProject () {
    const projectName = prompt('new project title')
    if (projectName) {
      if (this.projects.find(p=>p.name==projectName)) {
        window.toast('This project already exists')
        return
      }
      else {
        this.projects.push({
          creationDate: Date.now(),
          updateDate: Date.now(),
          name: projectName,
          items: []
        })
        this.app.requestUpdate()
        this.saveProjectsToLocalStorage()
      }
    }
  }

  updateCurrentProjectNameFromHash () {
    this.currentProjectName = decodeURIComponent(window.location.hash.slice(1))
  }
  get isCurrentViewCurrentProject () {
    return this.currentProjectName == decodeURIComponent(window.location.hash.slice(1))
  }


  toggleStart() {
    if (this.playing) {
      this.clearTimeout()
      this.playing = false
    }
    else {
      if (this.dialog.open) {
        this.dialog.close()
        if (!window.location.hash) { return }
        this.updateCurrentProjectNameFromHash()
        this.playing = true
        this.runTimeout(true)
      }
      else {
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

  runTimeout(prerun = false) {
    if (!this.playing) { return }

    this.clearTimeout()

    this._timeout = setTimeout(async () => {
      if (!this.playing) { return }
      let item = await this.pickRandomItem()
      if (item) {
        if (this.isCurrentViewCurrentProject) {
          this.app.highlightItemFromValue(item.v)
        }
        // this.currentWord = word
        this._historyList.push(item)
        for (let i = 0; i < this.repeatCount; ++i) {
          if (!this.playing) { return }
          if (i !== 0) {
            await sleep(3000)
          }
          if (!this.playing) { return }
          await this.playWord(item.v)
        }
      }
      else {
        // If the item is null, that means there is no active items to select
        // We stop everything
        this.stop()
        return
      }
      if (this.playing) {
        this.runTimeout()
      }
    }, prerun ? 0 : this.pauseTimeS * 1000)
  }

  pickRandomItem() {
    // Filter the items
    let candidates = this.currentActiveItems!.filter(item => !this._historyList.includes(item))
    if (candidates.length == 0) {
      this._historyList = []
      candidates = this.currentActiveItems!
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


  async playWord(word: string) {
    if (word && isFullJapanese(word)) {
      document.title = word
      await playJapaneseAudio(word)
    }
    // await this.updateComplete
    // this.selectLineFromWord(word)
  }

  /** Data related */
  getProjectsFromLocalStorage () {
    if (localStorage.getItem('periodic-speech-synthesis:projects')) {
      return JSON.parse(localStorage.getItem('periodic-speech-synthesis:projects')!)
    }
    else {
      return undefined
    }
  }
  saveProjectsToLocalStorage () {
    localStorage.setItem('periodic-speech-synthesis:projects', JSON.stringify(this.projects))
  }

  async getProjectsFromRemote () {
    try {
      const response = await fetch('./data.json')
      if (response.status !== 200) {
        return null
      }
      return await response.json()
    } catch (e) {
      return null
    }
  }

  async loadProjectsFromRemote () {
    this.projects = await this.getProjectsFromRemote()
    this.app.requestUpdate()
  }
}