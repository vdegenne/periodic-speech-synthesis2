import { Button } from '@material/mwc-button';
import { LitElement, html, css, nothing, PropertyValueMap, PropertyDeclaration } from 'lit'
import { customElement, query, queryAll, state } from 'lit/decorators.js'
import { ItemStrip } from './item-strip';
import { ProjectsManager } from './project-manager';
import { InterfaceType, Item, Project } from './types';
import { googleImageSearch, jisho, playJapaneseAudio } from './util';
import ms from 'ms';
import { ItemBottomBar } from './item-bottom-bar';
import { ItemsPlayer } from './items-player';

@customElement('app-container')
export class AppContainer extends LitElement {
  @state() interface: InterfaceType = 'main';
  @state() activeProject?: Project;
  @state() highlightIndex = -1

  public projectsManager: ProjectsManager = new ProjectsManager(this);

  @query('#items') itemsBox!: HTMLDivElement;
  @queryAll('item-strip') itemStrips!: ItemStrip[];
  @query('item-strip[highlight]') highlightedStrip?: ItemStrip;
  @query('item-bottom-bar') itemBottomBar!: ItemBottomBar;
  @query('items-player') itemsPlayer!: ItemsPlayer;

  getProjectNameFromHash() { return decodeURIComponent(window.location.hash.slice(1)) }
  // get currentProject () {
  //   const title = decodeURIComponent(window.location.hash.slice(1))
  //   if (title) {
  //     return this.projectsManager.getProjectFromTitle(title)
  //   }
  //   else { return undefined }
  // }


  static styles = css`
  .project {
    display: flex;
    align-items: center;
    padding: 4px;
    margin: 4px;
    cursor: pointer;
  }
  .project > div > mwc-icon {
    margin-right: 6px;
  }
  #items {
    display: flex;
    flex-direction: column-reverse;
    overflow-y: auto;
    border-top: 1px solid #bdbdbd;
  }
  item-strip {
    margin: 0px;
    flex:1;
  }
  item-strip[highlight] {
    background-color: #ffeb3b;
  }
  #controls {
    margin: 12px;
    display: flex;
    align-items: center;
  }
  item-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    font-size: 1.5em;
  }
  mwc-top-app-bar > :not(items-player)[slot=actionItems] {
    margin: 0 0 0 4px;
  }
  `

  constructor () {
    super()
    this.bindEventListeners()
    // this.projectsManager.setAttribute('slot', 'actionItems')
    this.interpretHash()
  }
  bindEventListeners () {
    window.addEventListener('hashchange', () => this.interpretHash())

    window.addEventListener('paste', (e) => {
      const paste = (e as ClipboardEvent).clipboardData!.getData('text')
      this.addNewItem(paste)
    })
  }

  render () {
    return html`
    <mwc-top-app-bar>
      ${this.interface == 'project' ? html`<mwc-icon-button icon="arrow_back" slot="navigationIcon" @click=${()=>{this.removeHashFromUrl()}}></mwc-icon-button>` : nothing}
      <div slot="title">${this.interface == 'project' ? `${this.activeProject!.name} (${this.activeProject!.items.length})` : 'Choose a project'}</div>
      <items-player slot="actionItems" .app=${this} @initiate-start=${()=>{this.onItemsPlayerInitiateStart()}}></items-player>
      <settings-dialog slot="actionItems"></settings-dialog>
      <!-- <mwc-icon-button slot="actionItems" icon="music_note" @click=${()=>{window.lofiPlayer.show()}}></mwc-icon-button> -->
      <div style="max-width:800px;margin: 0 auto;display:flex;flex-direction: column;padding-bottom:100px; /*height:calc(100vh - 64px - 50px);*/">
        ${this.interface == 'main' ? this.mainInterface() : nothing }
        ${this.interface == 'project' ? this.projectInterface() : nothing }
        <item-bottom-bar .app=${this}></item-bottom-bar>
      </div>
    </mwc-top-app-bar>
    `
  }

  mainInterface () {
    const sortedProjects = this.projectsManager.projects.sort((p1, p2) => p1.updateDate - p2.updateDate).reverse()

    return html`
    <mwc-button outlined icon="add" style="margin:12px 0 0 12px;" @click=${()=>{this.projectsManager.addNewProject()}}>new project</mwc-button>
    ${sortedProjects.map((project, i) => {
      return html`
      <div class="project" @click=${()=>{this.navigateTo(project.name)}}>
        <div style="display:flex;align-items: center;flex:1">
          <mwc-icon>folder</mwc-icon>
          <span>${project.name} <span style="color:#bdbdbd">(${ms(Date.now() - project.updateDate)} ago)</span></span>
        </div>
        <mwc-icon-button icon="edit" style="--mdc-icon-button-size:36px;" @click=${(e)=>{e.stopPropagation();this.projectsManager.renameProject(project)}}></mwc-icon-button>
        <mwc-icon-button icon="delete" style="--mdc-icon-button-size:36px;" @click=${(e)=>{e.stopPropagation();this.projectsManager.deleteProject(project)}}></mwc-icon-button>
      </div>
      `
    })}
    `
  }

  projectInterface () {
    const project = this.projectsManager.projects.find(p => p.name == decodeURIComponent(window.location.hash.slice(1)))
    if (!project) return nothing

    return html`
      <div id="controls">
        <!-- <mwc-icon-button @click=${()=>{this.onCasinoButtonClick()}}><mwc-icon>casino</mwc-icon></mwc-icon-button> -->
        <mwc-button outlined slot="actionItems" icon="add" @click=${()=>{this.addNewItem()}}>item</mwc-button>
      </div>
      <div id="items">
      ${project.items.map((item, i) => {
        return html`
        <div class="item-strip-container" style="display:flex;align-items:center;justify-content:stretch">
          <!--<span style="color:grey">${i+1}.</span>--><item-strip .item=${item}
              ?highlight=${i == this.highlightIndex}

              @activeToggle=${()=>{
                // this.requestUpdate();
                this.activeProject!.updateDate = Date.now()
                this.projectsManager.saveProjectsToLocalStorage()
              }}

              @delete=${()=>{
                this.projectsManager.deleteItem(item)
                this.requestUpdate()
              }}

              ></item-strip>
        </div>
        `
      })}
      </div>
    `
  }

  protected async updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): Promise<void> {
    if (_changedProperties.has('interface') && this.interface == 'project') {
      setTimeout(() => this.itemsBox.scrollTop = -9999999999999999999999, 100)
    }
  }

  requestUpdate(name?: PropertyKey | undefined, oldValue?: unknown, options?: PropertyDeclaration<unknown, unknown> | undefined): void {
    [...this.itemStrips].forEach(el => el.requestUpdate())
    super.requestUpdate(name, oldValue, options)
  }

  private onItemsPlayerInitiateStart () {
    if (!this.itemsPlayer.isPlaying) {
      if (this.interface == 'main') {
        this.itemsPlayer.projectName = 'all projects'
        this.itemsPlayer.refill(this.projectsManager.projects.map(p=>p.items).flat())
      }
      else {
        this.itemsPlayer.projectName = this.activeProject!.name
        this.itemsPlayer.refill(this.activeProject!.items)
      }
    }
  }

  // async highlightItemFromValue (value: string) {
  //   const index = this.projectsManager.currentProject?.items.findIndex(i=>i.v===value)
  //   if (index !== undefined && index >= 0) {
  //     this.highlightIndex = index
  //     await this.updateComplete
  //     this.scrollToHighlightedStrip()
  //   }
  // }

  scrollToHighlightedStrip () {
    if (this.highlightedStrip) {
      this.itemsBox.scrollTop = this.highlightedStrip.offsetTop - (this.itemsBox.offsetTop + 24)
    }
  }

  async onCasinoButtonClick () {
    // this.highlightIndex = ~~(Math.random() * this.projectsManager.currentProject!.items.length)
    // await this.updateComplete
    // this.scrollToHighlightedStrip()
  }

  navigateTo (projectName: string) {
    window.location.hash = encodeURIComponent(projectName)
  }

  async addNewItem (input?: string|null) {
    if (!input) {
      input = prompt('new item value')
    }
    if (input) {
      if (this.activeProject!.items.find(i=>i.v===input)) {
        window.toast('This item already exists')
        return
      }
      else {
        this.activeProject!.items.push({
          v: input,
          a: true
        })
        this.requestUpdate()
        // if (!this.itemsPlayer.isPlaying) {
        //   await this.updateComplete
        //   this.highlightItemFromValue(input)
        // }
        this.activeProject!.updateDate = Date.now()
        this.projectsManager.saveProjectsToLocalStorage()
      }
    }
  }

  /** Hash related */
  interpretHash () {
    const projectName = this.getProjectNameFromHash()
    if (this.projectsManager.projectExists(projectName)) {
      this.interface = 'project'
      this.activeProject = this.projectsManager.getProjectFromTitle(projectName)
      // if (this.projectsManager.currentProjectName == undefined) {
      //   // this.projectsManager.updateCurrentProjectNameFromHash()
      // }
    }
    else {
      this.interface = 'main'
      this.removeHashFromUrl()
    }
  }
  removeHashFromUrl () {
    window.location.hash = ''
  }
}
