import { html, LitElement } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import { Dialog } from '@material/mwc-dialog';
import { Project } from './types';
import { TextArea } from '@material/mwc-textarea';

@customElement('project-description-dialog')
export class ProjectDescriptionDialog extends LitElement {
  @state() project!: Project;
  @state() viewMode = true;

  @query('mwc-dialog') dialog!: Dialog;
  @query('mwc-textarea') textarea!: TextArea;

  render() {
    return html`
    <mwc-dialog heading="Description" style="--mdc-dialog-min-width:calc(100vh - 48px)">

      <mwc-textarea ?disabled=${this.viewMode} style="width:100%" rows=12></mwc-textarea>

      <mwc-button unelevated slot="secondaryAction" icon="${this.viewMode ? 'edit' : 'lock'}" @click=${()=>{this.toggleEdit()}}>${this.viewMode ? 'edit' : 'save'}</mwc-button>
      <mwc-button outlined slot="primaryAction" dialogAction=close>close</mwc-button>
    </mwc-dialog>
    `
  }

  toggleEdit () {
    if (this.viewMode) {
      this.viewMode = false
    }
    else {
      this.viewMode = true
      this.project.description = this.textarea.value
      window.app.requestUpdate()
      window.app.projectsManager.saveProjectsToLocalStorage()
    }
  }

  open (project: Project) {
    this.project = project
    this.textarea.value = project.description || ''
    this.dialog.show()
  }
}