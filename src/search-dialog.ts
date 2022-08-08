import { css, html, LitElement, nothing } from 'lit'
import { customElement, query, state } from 'lit/decorators.js'
import { Dialog } from '@material/mwc-dialog';
import { Item, Project } from './types';
import { AppContainer } from './app-container';
import { hasJapanese } from 'asian-regexps';
import { sharedStyles } from './styles/sharedStyles';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { styleMap } from 'lit/directives/style-map.js';

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
    margin: 24px 0;
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
        const isCurrentProject = this.app.activeProject && this.app.activeProject == result.project
        return html`
        <div class=project>
          <div style="font-size:1em;font-weight:500;margin-bottom:9px;color:${isCurrentProject ? 'orange' : 'black'};">${result.project.name}${isCurrentProject ? ' (current)' : ''}</div>
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


  search (input: string, ignoreItem?: Item) {
    if (input == this.query) { return }
    this.query = input;

    this.result = []
    // let result: searchResult = [];
    this.app.projectsManager.projects.forEach((project) => {
      const items = project.items.filter((item) => {
        return item.v.includes(input) && item !== ignoreItem
      })
      if (items.length == 0) { return }
      this.result.push({
        project,
        items
      })
    })

    this.requestUpdate()
  }

  open (input: string, ignoreItem?: Item) {
    this.search(input, ignoreItem)
    if (this.result.length == 0) {
      window.toast('no result')
      return
    }
    else {
      this.show()
    }
  }

  show () { this.dialog.show() }
}



function highlightParts (value: string, highlightValue: string) {
  return unsafeHTML(value.replace(new RegExp(highlightValue, 'gi'), function (part) {
    return `<span highlight>${part}</span>`
  }))
}