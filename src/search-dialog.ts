import { css, html, LitElement, nothing } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import { Dialog } from '@material/mwc-dialog';
import { Item, Project } from './types';
import { AppContainer } from './app-container';
import { hasJapanese } from 'asian-regexps';
import { sharedStyles } from './styles/sharedStyles';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

declare type searchItemResult = { project: Project, items: Item[] }
declare type searchResult = searchItemResult[]

@customElement('search-dialog')
export class SearchDialog extends LitElement {
  private app!: AppContainer;
  @state() query: string = ''
  private result: searchResult = [];

  @query('mwc-dialog') dialog!: Dialog;

  static styles = [sharedStyles, css`
  .project {
    margin-bottom: 24px;
  }
  .item {
    font-size: 1.5em;
    margin: 11px 0;
  }
  [highlight] {
    color: orange
  }
  `]

  render() {
    return html`
    <mwc-dialog heading="Search (${this.query})">

      ${this.result.length == 0 ? html`no result` : nothing }
      ${this.result.map((result) => {
        return html`
        <div class=project>
          <div style="font-weight:bold;font-size:1.3em;margin-bottom:9px;color:black;">${result.project.name}</div>
          <div class=items>
            ${result.items.map((item) => {
              return html`<div class=item ?jp=${hasJapanese(item.v)}>${highlightParts(item.v, this.query)}</div>`
            })}
          </div>
        </div>
        `
      })}

      <mwc-button outlined slot=secondaryAction dialogAction=close>close</mwc-button>
    </mwc-dialog>
    `
  }


  search (input: string) {
    if (input == this.query) { return }
    this.query = input;

    this.result = []
    // let result: searchResult = [];
    this.app.projectsManager.projects.filter((p)=>this.app.activeProject == undefined || p.name !== this.app.activeProject.name).forEach((project) => {
      const items = project.items.filter(i => i.v.includes(input))
      if (items.length == 0) { return }
      this.result.push({
        project,
        items
      })
    })

    this.requestUpdate()
  }

  open (input: string) {
    this.search(input)
    this.show()
  }

  show () { this.dialog.show() }
}



function highlightParts (value: string, highlightValue: string) {
  return unsafeHTML(value.replace(new RegExp(highlightValue, 'gi'), function (part) {
    return `<span highlight>${part}</span>`
  }))
}