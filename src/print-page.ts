import { hasJapanese } from 'asian-regexps';
import { html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ProjectsManager } from './project-manager';
import { sharedStyles } from './styles/sharedStyles';


@customElement('print-page')
export class PrintPage extends LitElement {
  @state() projectName?: string;
  protected projectsManager: ProjectsManager;

  static styles = [sharedStyles]

  constructor () {
    super()
    this.projectsManager = new ProjectsManager();
    if (window.location.hash) {
      this.projectName = decodeURIComponent(window.location.hash.slice(1))
    }
  }

  render () {
    if (!this.projectName) { return 'Nothing to display' }

    const project = this.projectsManager.getProjectFromTitle(this.projectName)
    if (!project) { return 'This project does not exist'}

    return html`${project.items.map((item) => {
      return html`<div ?jp=${hasJapanese(item.v)}>${item.v}</div>`
    })}`
  }
}