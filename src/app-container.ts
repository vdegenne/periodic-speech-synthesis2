import { Button } from '@material/mwc-button';
import { LitElement, html, css, nothing, PropertyValueMap } from 'lit'
import { customElement, query, queryAll, state } from 'lit/decorators.js'
import { ItemStrip } from './item-strip';
import { ProjectsManager } from './project-manager';
import { InterfaceType, Item, Project } from './types';
import { googleImageSearch, jisho, playJapaneseAudio } from './util';
import ms from 'ms';

@customElement('app-container')
export class AppContainer extends LitElement {
  @state() interface: InterfaceType = 'main';
  @state() highlightIndex = -1

  public projectsManager: ProjectsManager;

  @query('#items') itemsBox!: HTMLDivElement;
  @queryAll('item-strip') itemStrips!: ItemStrip[];
  @query('item-strip[highlight]') highlightedStrip?: ItemStrip;
  @query('#controls [icon="volume_up"]') volumeUpButton?: Button;
  @query('#controls [icon="images"]') imagesButton?: Button;
  @query('#controls #jishoButton') jishoButton?: Button;


  static styles = css`
  .project {
    display: flex;
    align-items: center;
    padding: 4px;
    margin: 10px;
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
  `

  constructor () {
    super()
    this.bindEventListeners()
    this.projectsManager = new ProjectsManager(this)
    this.projectsManager.setAttribute('slot', 'actionItems')
    this.interpretHash()
  }
  bindEventListeners () {
    window.addEventListener('hashchange', () => this.interpretHash())

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

    window.addEventListener('paste', (e) => {
      const paste = (e as ClipboardEvent).clipboardData!.getData('text')
      this.addNewItem(paste)
    })
  }

  render () {
    return html`
    <mwc-top-app-bar style="">
      ${this.interface == 'project' ? html`<mwc-icon-button icon="arrow_back" slot="navigationIcon" @click=${()=>{this.removeHashFromUrl()}}></mwc-icon-button>` : nothing}
      <div slot="title">${this.interface == 'project' ? `${this.projectsManager.currentProjectName} (${this.projectsManager.currentProject!.items.length})` : 'Choose a project'}</div>
      ${this.interface == 'project' && this.projectsManager.currentProject && this.projectsManager.currentActiveItems!.length > 0 || (this.interface == 'main' && this.projectsManager.isPlaying) ? this.projectsManager : nothing}
      <settings-dialog slot="actionItems"></settings-dialog>
      <mwc-icon-button slot="actionItems" icon="music_note"
        @click=${()=>{window.lofiPlayer.show()}}></mwc-icon-button>
      <div style="max-width:800px;margin: 0 auto;display:flex;flex-direction: column;height:calc(100vh - 64px)">
        ${this.interface == 'main' ? this.mainInterface() : nothing }
        ${this.interface == 'project' ? this.projectInterface() : nothing }
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
        <mwc-icon-button icon="delete" style="--mdc-icon-button-size:24px;" @click=${(e)=>{e.stopPropagation();this.projectsManager.deleteProject(project)}}></mwc-icon-button>
      </div>
      `
    })}
    `
  }

  projectInterface () {
    const project = this.projectsManager.currentProject
    if (!project) return nothing

    return html`
      <div id="controls">
        <div style="flex:1">
          ${this.highlightIndex >= 0 ? html`
          <mwc-icon-button icon=volume_up @click=${()=>{this.highlightedStrip?.playAudio()}}></mwc-icon-button>
          <mwc-icon-button icon=images @click=${()=>{googleImageSearch(this.highlightedStrip!.item.v)}}></mwc-icon-button>
          <mwc-icon-button id=jishoButton @click=${()=>{jisho(this.highlightedStrip!.item.v)}}>
            <img src="./img/jisho.ico" style="width:20px;height:20px">
          </mwc-icon-button>
          ` : nothing}
        </div>
        <mwc-icon-button @click=${()=>{this.onCasinoButtonClick()}}><mwc-icon>casino</mwc-icon></mwc-icon-button>
        <mwc-button outlined slot="actionItems" icon="add" @click=${()=>{this.addNewItem()}}>item</mwc-button>
      </div>
      <div id="items">
      ${project.items.map((item, i) => {
        return html`
        <div class="item-strip-container" style="display:flex;align-items:center;justify-content:stretch">
          <span style="color:grey">${i+1}.</span><item-strip .item=${item}

              @change=${()=>{
                if (this.projectsManager.currentActiveItems?.length == 0) {
                  this.projectsManager.stop()
                }
                this.requestUpdate();
                this.projectsManager.currentProject!.updateDate = Date.now()
                this.projectsManager.saveProjectsToLocalStorage()
              }}

              @delete=${()=>{
                this.deleteItem(item)
              }} ?highlight=${i == this.highlightIndex}></item-strip>
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

  async highlightItemFromValue (value: string) {
    const index = this.projectsManager.currentProject?.items.findIndex(i=>i.v===value)
    if (index !== undefined && index >= 0) {
      this.highlightIndex = index
      await this.updateComplete
      this.scrollToHighlightedStrip()
    }
  }

  scrollToHighlightedStrip () {
    if (this.highlightedStrip) {
      this.itemsBox.scrollTop = this.highlightedStrip.offsetTop - (this.itemsBox.offsetTop + 24)
    }
  }

  async onCasinoButtonClick () {
    this.highlightIndex = ~~(Math.random() * this.projectsManager.currentProject!.items.length)
    await this.updateComplete
    this.scrollToHighlightedStrip()
  }

  navigateTo (projectName: string) {
    window.location.hash = encodeURIComponent(projectName)
  }

  async addNewItem (input?: string|null) {
    if (!input) {
      input = prompt('new item value')
    }
    if (input) {
      if (this.projectsManager.currentProject?.items.find(i=>i.v===input)) {
        window.toast('This item already exists')
        return
      }
      else {
        this.projectsManager.currentProject?.items.push({
          v: input,
          a: true
        })
        this.requestUpdate()
        if (!this.projectsManager.isPlaying) {
          await this.updateComplete
          this.highlightItemFromValue(input)
        }
        this.projectsManager.currentProject!.updateDate = Date.now()
        this.projectsManager.saveProjectsToLocalStorage()
      }
    }
  }

  deleteItem (item: Item) {
    this.projectsManager.currentProject?.items.splice(this.projectsManager.currentProject.items.indexOf(item), 1);
    if (this.projectsManager.currentProject?.items.length == 0) {
      this.projectsManager.stop()
    }
    this.requestUpdate()
    this.projectsManager.currentProject!.updateDate = Date.now()
    this.projectsManager.saveProjectsToLocalStorage()
  }


  /** Hash related */
  interpretHash () {
    const projectName = decodeURIComponent(window.location.hash.slice(1))
    if (this.projectsManager.projectExists(projectName)) {
      this.interface = 'project'
      this.projectsManager.currentProjectName = projectName
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
