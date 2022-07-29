import { LitElement, html, css, nothing, PropertyValueMap } from 'lit'
import { customElement, query, queryAll, state } from 'lit/decorators.js'
import { ItemStrip } from './item-strip';
import { ProjectsManager } from './project-manager';
import { InterfaceType, Item, Project } from './types';
import { playJapaneseAudio } from './util';

@customElement('app-container')
export class AppContainer extends LitElement {
  @state() interface: InterfaceType = 'main';
  @state() highlightIndex = -1

  public projectsManager: ProjectsManager;

  @queryAll('item-strip') itemStrips!: ItemStrip[];

  @query('item-strip[highlight]') highlightedStrip?: ItemStrip;


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
    overflow-y: scroll;
    border-top: 1px solid #bdbdbd;
  }
  item-strip {
    margin: 0px;
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
  }

  render () {
    return html`
    <mwc-top-app-bar style="">
      ${this.interface == 'project' ? html`<mwc-icon-button icon="arrow_back" slot="navigationIcon" @click=${()=>{this.removeHashFromUrl()}}></mwc-icon-button>` : nothing}
      <div slot="title">${this.projectsManager.currentProject?.name || 'Choose a project'}</div>
      ${this.interface == 'project' && this.projectsManager.currentProject && this.projectsManager.currentActiveItems!.length > 0 || (this.interface == 'main' && this.projectsManager.isPlaying) ? this.projectsManager : nothing}
      <settings-dialog slot="actionItems"></settings-dialog>
      <div style="max-width:800px;margin: 0 auto;display:flex;flex-direction: column;height:calc(100vh - 64px)">
        ${this.interface == 'main' ? this.mainInterface() : nothing }
        ${this.interface == 'project' ? this.projectInterface() : nothing }
      </div>
    </mwc-top-app-bar>
    `
  }

  mainInterface () {
    return html`
    <mwc-button outlined icon="add" style="margin:12px 0 0 12px;" @click=${()=>{this.projectsManager.addNewProject()}}>new project</mwc-button>
    ${this.projectsManager.projects.map((project, i) => {
      return html`
      <div class="project" @click=${()=>{this.navigateTo(project.name)}}>
        <div style="display:flex;align-items: center;flex:1">
          <mwc-icon>folder</mwc-icon>
          <span>${project.name}</span>
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
          <mwc-icon-button icon=volume_up @click=${()=>{this.onVolumeUpButtonClick()}}></mwc-icon-button>
          ` : nothing}
        </div>
        <mwc-button @click=${()=>{this.onCasinoButtonClick()}}><mwc-icon>casino</mwc-icon></mwc-button>
        <mwc-button outlined slot="actionItems" icon="add" @click=${()=>{this.addNewItem()}}>item</mwc-button>
      </div>
      <div id="items">
      ${project.items.map((item, i) => {
        return html`
        <item-strip .item=${item}
            @change=${()=>{
              if (this.projectsManager.currentActiveItems?.length == 0) {
                this.projectsManager.stop()
              }
              this.requestUpdate();
              this.projectsManager.saveProjectsToLocalStorage()}}
            @delete=${()=>{this.deleteItem(item)}} ?highlight=${i == this.highlightIndex}></item-strip>
        `
      })}
      </div>
    `
  }

  onVolumeUpButtonClick () {
    if (this.highlightedStrip) {
      this.highlightedStrip.playAudio()
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
      this.shadowRoot!.querySelector('#items')!.scrollTop = this.highlightedStrip.offsetTop - 150
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

  addNewItem () {
    const input = prompt('new item value')
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
