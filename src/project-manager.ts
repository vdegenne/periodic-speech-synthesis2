import { Dialog } from '@material/mwc-dialog';
import { css, html, LitElement, PropertyValueMap } from 'lit'
import { customElement, property, query, state } from 'lit/decorators.js'
import { AppContainer } from './app-container'
import { Item, Project } from './types'
import copyToClipboard from '@vdegenne/clipboard-copy';

export class ProjectsManager {
  private app: AppContainer;
  public projects: Project[] = this.getProjectsFromLocalStorage() || [];


  // @query('mwc-dialog') dialog!: Dialog;

  constructor (app: AppContainer) {
    this.projects = this.getProjectsFromLocalStorage() || []
    // if (this.projects == null) {
    //   this.getProjectsFromRemote().then(data => {
    //     this.projects = data || []
    //   })
    // }
    this.app = app
  }

  projectExists (projectName: string): boolean {
    return this.projects.some(p=> p.name === projectName)
  }

  getProjectFromTitle (title: string) {
    return this.projects.find(p=>p.name==title)
  }

  getProjectFromItem (item: Item) {
    return this.projects.find(p => p.items.indexOf(item) >= 0)
  }

  getProjectsFromItemValue (value: string) {
    return this.projects.filter(p=>p.items.some(i=>i.v==value))
  }


  deleteProject(project: Project) {
    const accept = confirm(`Are you sure to delete "${project.name}" ?`)
    if (accept) {
      // Stop playing if we delete the project that is currently playing
      if (project.name === this.app.itemsPlayer.projectName) {
        this.app.itemsPlayer.stop()
      }
      // Remove the project from the list
      this.projects.splice(this.projects.indexOf(project), 1)
      this.app.requestUpdate()
      this.saveProjectsToLocalStorage()
    }
  }

  renameProject (project: Project) {
    const newName = prompt('New name', project.name)
    if (newName) {
      if (newName == project.name) { return }

      project.name = newName
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
  insertProject (project: Project) {
    this.projects.push(project)
  }

  deleteItem (item: Item) {
    const project = this.getProjectFromItem(item)
    if (project) {
      project.items.splice(project.items.indexOf(item), 1);
      // project.updateDate = Date.now()
      this.saveProjectsToLocalStorage()
    }
  }

  // updateCurrentProjectNameFromHash () {
  //   this.currentProjectName = decodeURIComponent(window.location.hash.slice(1))
  // }
  // get isCurrentViewCurrentProject () {
  //   return this.currentProjectName == decodeURIComponent(window.location.hash.slice(1))
  // }

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


  copyDataToClipboard () {
    copyToClipboard(JSON.stringify(this.projects))
  }
}