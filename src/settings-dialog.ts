import { html, LitElement } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import '@material/mwc-dialog'
import '@material/mwc-icon-button'
import { Dialog } from '@material/mwc-dialog';

@customElement('settings-dialog')
export class SettingsDialog extends LitElement {
  @query('mwc-dialog') dialog!: Dialog;

  render() {
    return html`
    <mwc-icon-button icon=settings @click=${()=>{this.dialog.show()}}></mwc-icon-button>

    <mwc-dialog heading=Settings>
      <mwc-button outlined @click=${()=>{window.app.projectsManager.loadProjectsFromRemote()}}>fetch data from remote</mwc-button>
      <mwc-button outlined slot=secondaryAction dialogAction=close>close</mwc-button>
    </mwc-dialog>
    `
  }

  show () {
    this.dialog.show()
  }
}