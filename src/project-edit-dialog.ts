import { css, html, LitElement, PropertyValueMap } from 'lit'
import { customElement, query, queryAll, state } from 'lit/decorators.js'
import { Dialog } from '@material/mwc-dialog';
import { Project } from './types';
import { TextField } from '@material/mwc-textfield';
import { IconButton } from '@material/mwc-icon-button';
import { AppContainer } from './app-container';

type Type = 'Create'|'Update';
export const icons = [
  {name: 'sports_esports', color: 'orange'},
  {name: 'smart_display', color: 'red'},
  {name: 'music_note', color: 'blue'},
  {name: 'feed', color: 'grey'},
]

@customElement('project-edit-dialog')
export class ProjectEditDialog extends LitElement {
  private app!: AppContainer;
  @state() type: Type = 'Create'
  @state() title: string = '';
  @state() iconName: string = '';
  // private project: Project = { name: '', items: [], creationDate: Date.now(), updateDate: Date.now() };

  @query('mwc-dialog') dialog!: Dialog;
  @query('mwc-textfield') textfield!: TextField;
  @queryAll('mwc-icon-button') iconButtons!: IconButton[];

  // private submitPromise;
  private submitPromiseResolve?: (project: Project) => void;
  private submitPromiseReject;

  render() {
    return html`
    <mwc-dialog heading="${this.type} Project">

      <mwc-textfield label=title @keyup=${()=>{this.requestUpdate()}}
        style="margin-bottom:24px;width:100%;"></mwc-textfield>

      <div id=icons>
        ${icons.map(icon => {
          return html`<mwc-icon-button icon=${icon.name}
              style="color:${icon.color};"
              @pointerup=${(e)=>{
                this.iconName = icon.name;
                this.illuminateIconButton(this.iconName)
              }}></mwc-icon-button>`
        })}
      </div>

      <mwc-button outlined slot="secondaryAction" dialogAction=close>cancel</mwc-button>
      <mwc-button unelevated slot="primaryAction" ?disabled=${this.textfield && this.textfield.value.length == 0} @click=${()=>{this.submit()}}>${this.type}</mwc-button>
    </mwc-dialog>
    `
  }

  illuminateIconButton (iconName?: string) {
    this.iconButtons.forEach(el=>{el.ripple.then(r => { if (r) { r.activated = false }})})
    if (!iconName) { return }
    const iconButton = [...this.iconButtons].find(el=>el.icon == iconName)
    if (iconButton) {
      iconButton.ripple.then(r=>{ if (r) { r.activated = true } })
    }
  }

  submit() {
    const name = this.textfield.value;
    if (!name) {
      window.toast('Title can\'t be empty.')
      return
    }
    const otherProjects = this.app.projectsManager.projects.filter(p => p.name !== this.title)
    if (otherProjects.find(p=>p.name==name)) {
      window.toast('This title is already taken')
      return
    }

    this.submitPromiseResolve!({
      name: this.textfield.value,
      creationDate: Date.now(),
      updateDate: Date.now(),
      items: [],
      icon: this.iconName
    })

    this.dialog.close()
  }

  fill (title?: string, iconName?: string) {
    this.title = this.textfield.value = title || ''
    if (iconName) {
      this.iconName = iconName
    }
    this.illuminateIconButton(iconName)
  }

  open (project?: Project): Promise<Project> {
    this.type = project ? 'Update' : 'Create';


    this.fill(project?.name, project?.icon)

    const promise = new Promise<Project>((resolve, reject) => {
      this.submitPromiseResolve = resolve
      this.submitPromiseReject = reject
    })
    this.dialog.show()

    return promise;
  }

  // onTextFieldKeyUp () {
  //   this.app.requestUpdate()
  //   this.requestUpdate()
  // }
}