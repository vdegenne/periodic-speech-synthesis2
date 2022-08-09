import { Button } from '@material/mwc-button';
import { LitElement, html, css, nothing, PropertyValueMap, PropertyDeclaration } from 'lit'
import { customElement, query, queryAll, state } from 'lit/decorators.js'
import { ItemStrip } from './item-strip';
import { ProjectsManager } from './project-manager';
import { InterfaceType, Item, Project } from './types';
import { googleImageSearch, jisho, playJapaneseAudio, playWord, urlRegexp } from './util';
import ms from 'ms';
import { ItemBottomBar } from './item-bottom-bar';
import { ItemsPlayer } from './items-player';
import { icons, ProjectEditDialog } from './project-edit-dialog';
import { ProjectDescriptionDialog } from './project-description-dialog';
import { SearchDialog } from './search-dialog';

@customElement('app-container')
export class AppContainer extends LitElement {
  @state() interface: InterfaceType = 'main';
  @state() activeProject?: Project;
  // @state() highlightIndex = -1
  public projectsManager: ProjectsManager = new ProjectsManager(this);
  @state() private activeItemStrip?: ItemStrip;

  @query('#items') itemsBox!: HTMLDivElement;
  @queryAll('item-strip') itemStrips!: ItemStrip[];
  @query('item-strip[highlight]') highlightedStrip?: ItemStrip;
  @query('item-bottom-bar') itemBottomBar!: ItemBottomBar;
  @query('items-player') itemsPlayer!: ItemsPlayer;
  @query('project-edit-dialog') projectEditDialog!: ProjectEditDialog;
  @query('project-description-dialog') projectDescriptionDialog!: ProjectDescriptionDialog;
  @query('search-dialog') searchDialog!: SearchDialog;

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
    background-color: #fff59d;
  }
  #controls {
    margin: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  item-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    font-size: 1.5em;
  }
  mwc-top-app-bar > items-player {
    margin: 0 4px 0 0;
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
      if (e.composedPath()[0] instanceof HTMLTextAreaElement) { e.stopImmediatePropagation(); return }
      const paste = (e as ClipboardEvent).clipboardData!.getData('text').trim()
      this.addNewItem(paste)
    })

    window.addEventListener('keydown', (e) => {
      // Open the search dialog on Alt + 2
      if (e.code == 'Digit2' && e.altKey) {
        e.stopPropagation()
        e.preventDefault()
        const selection = window.getSelection()?.toString()
        if (selection) {
          this.searchDialog.open(selection, this.activeItemStrip?.item)
        }
      }

      // Move item down in the list on Arrow Down
      if (e.code == 'ArrowDown' && this.activeItemStrip) {
        e.preventDefault()
        const item = this.activeItemStrip.item
        this.projectsManager.moveItemDown(item)
        this.requestUpdate()
        this.updateComplete.then(() => {
          const newStrip = this.getItemStripFromItem(item)
          this.activeItemStrip = newStrip
        })
      }
      // Move item up in the list on Arrow Up
      if (e.code == 'ArrowUp' && this.activeItemStrip) {
        e.preventDefault()
        const item = this.activeItemStrip.item
        this.projectsManager.moveItemUp(item)
        this.requestUpdate()
        this.updateComplete.then(() => {
          const newStrip = this.getItemStripFromItem(item)
          this.activeItemStrip = newStrip
        })
      }

      if (e.code == 'Escape') {
        this.activeItemStrip = undefined
      }


      const value = this.activeItemStrip?.item.v || this.itemBottomBar?.item.v
      if (value) {
        if (e.code == 'KeyA') {
          googleImageSearch(value)
        }
        if (e.code == 'KeyG') {
          jisho(value)
        }
        if (e.code == 'KeyS') {
          playWord(value)
        }
      }
    })
  }

  render () {
    return html`
    <mwc-top-app-bar>
      <mwc-icon-button slot="navigationIcon" ?disabled=${this.interface == 'main'} @click=${()=>{this.removeHashFromUrl()}}><img src="./favicon.ico" width=24></mwc-icon-button>
      <!-- ${this.interface == 'project' ? html`<mwc-icon-button icon="arrow_back" slot="navigationIcon" @click=${()=>{this.removeHashFromUrl()}}></mwc-icon-button>` : nothing} -->
      <div slot="title">${this.interface == 'project' ? this.projectTitleTemplate() : 'Choose a project'}</div>
      <items-player slot="actionItems" .app=${this} @initiate-start=${()=>{this.onItemsPlayerInitiateStart()}} @start=${() => {this.onItemsPlayerStart()}}></items-player>
      ${this.interface == 'project' ? html`<mwc-icon-button slot="actionItems" icon="description" @click=${() => { this.projectDescriptionDialog.open(this.activeProject!) }} style="${this.activeProject!.description ? 'color:#fff59d' : ''}"></mwc-icon-button>` : nothing}
      <settings-dialog slot="actionItems"></settings-dialog>
      <!-- <mwc-icon-button slot="actionItems" icon="music_note" @click=${()=>{window.lofiPlayer.show()}}></mwc-icon-button> -->
      <div style="max-width:800px;margin: 0 auto;display:flex;flex-direction: column;padding-bottom:100px; /*height:calc(100vh - 64px - 50px);*/">
        ${this.interface == 'main' ? this.mainInterface() : nothing }
        ${this.interface == 'project' ? this.projectInterface() : nothing }
        <item-bottom-bar .app=${this} @click=${(e)=>{ this.onItemBottomBarClick(e) }}></item-bottom-bar>
        <project-edit-dialog .app=${this}></project-edit-dialog>
        <project-description-dialog></project-description-dialog>
        <search-dialog .app=${this}></search-dialog>
      </div>
    </mwc-top-app-bar>
    `
  }

  private onItemBottomBarClick (e) {
    const strip = this.getItemStripFromItem(e.detail.item)
    if (!strip) { return }
    this.activeItemStrip = strip
    this.updateComplete.then(() => {
      this.scrollToHighlightedStrip()
    })
  }

  mainInterface () {
    const sortedProjects = this.projectsManager.projects.sort((p1, p2) => p1.updateDate - p2.updateDate).reverse()

    return html`
    <mwc-button outlined icon="add" style="margin:12px 0 0 12px;" @click=${()=>{this.projectsManager.addNewProject()}}>new project</mwc-button>
    ${sortedProjects.map((project, i) => {
      return html`
      <div class="project" @click=${()=>{this.navigateTo(project.name)}}>
        <div style="display:flex;align-items: center;flex:1;color:${project.icon ? icons.find(i=>i.name==project.icon)?.color : 'black'};">
          <mwc-icon>${project.icon || 'folder'}</mwc-icon>
          <span>${project.name} <span style="color:#bdbdbd">(${ms(Date.now() - project.updateDate)} ago)</span></span>
        </div>
        <mwc-icon-button icon="edit" style="--mdc-icon-button-size:36px;" @click=${async (e)=>{
          e.stopPropagation()
          try {
            const madeProject = await this.projectEditDialog.open(project)
            project.name = madeProject.name
            project.icon = madeProject.icon
            this.requestUpdate()
            this.projectsManager.saveProjectsToLocalStorage()
          } catch (e) {
            // cancel
          }
          }}></mwc-icon-button>
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
        <span style="color:#9e9e9e">${project.items.length} items</span>
        <mwc-icon-button icon="print" @click=${()=>{window.open(`./print#${this.activeProject?.name}`, '_blank')}}></mwc-icon-button>
      </div>
      <div id="items">
      ${project.items.map((item, i) => {
        return html`
        <div class="item-strip-container" style="display:flex;align-items:center;justify-content:stretch">
          <!--<span style="color:grey">${i+1}.</span>--><item-strip .item=${item}
              ?highlight=${this.activeItemStrip && this.activeItemStrip.item === item}

              @click=${(e)=>{
                this.activeItemStrip = e.target;
              }}

              @activeToggle=${()=>{
                // this.requestUpdate();
                // this.activeProject!.updateDate = Date.now()
                this.projectsManager.saveProjectsToLocalStorage()
              }}

              @delete=${()=>{
                this.projectsManager.deleteItem(item)
                this.requestUpdate()
              }}

              @edit=${()=>{
                const newValue = prompt('new value', item.v)
                if (newValue) {
                  item.v = newValue
                  this.requestUpdate()
                  this.projectsManager.saveProjectsToLocalStorage()
                }
              }}

              ></item-strip>
        </div>
        `
      })}
      </div>
    `
  }

  projectTitleTemplate () {
    if (!this.activeProject) { return }
    let urlMatch
    if (this.activeProject.description && (urlMatch = this.activeProject.description.match(urlRegexp))) {
      return html`<a href="${urlMatch[0]}" target="_blank" style="color:inherit">${this.activeProject.name}</a>`
    }
    else {
      return html`${this.activeProject.name}`
    }
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

  private onItemsPlayerStart () {
    if (this.activeProject == undefined) { return }
    this.activeProject.updateDate = Date.now()
    this.projectsManager.saveProjectsToLocalStorage()
  }

  // async highlightItemFromValue (value: string) {
  //   const index = this.projectsManager.currentProject?.items.findIndex(i=>i.v===value)
  //   if (index !== undefined && index >= 0) {
  //     this.highlightIndex = index
  //     await this.updateComplete
  //     this.scrollToHighlightedStrip()
  //   }
  // }

  getItemStripFromItem (item: Item) {
    return [...this.itemStrips].find((strip) => strip.item === item)
  }

  scrollToHighlightedStrip () {
    if (this.highlightedStrip) {
      window.scrollTo(0, this.highlightedStrip.offsetTop - 100)
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
        const relatedProjects = this.projectsManager.getProjectsFromItemValue(input)
        if (relatedProjects.length) {
          window.toast(`also in : ${relatedProjects.map(p=>p.name).join(', ')}`, 6000)
        }
        this.activeProject!.items.push({
          v: input,
          a: true
        })
        this.requestUpdate()

        // if (!this.itemsPlayer.isPlaying) {
        //   await this.updateComplete
        //   this.highlightItemFromValue(input)
        // }
        // this.activeProject!.updateDate = Date.now()
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
