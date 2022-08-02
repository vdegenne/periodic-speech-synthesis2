import { hasJapanese } from 'asian-regexps';
import { getExactSearch } from 'japanese-data-module';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';


@customElement('item-formatter')
export class ItemFormatter extends LitElement {
  @property() value!: string;
  @property({type: Boolean, reflect: true}) jp = false;

  static styles = css`
  :host { position: relative; top: -5px }
  `

  render () {
    this.jp = hasJapanese(this.value)
    return html`${this.format(this.value)}`
  }

  format (input: string) {
    if (/\((.+)\)/.test(input)) {
      return input; // as is
    }
    const search = getExactSearch(input)
    if (search && search[4] && search[4] !== input) {
      return `${input}(${search[4]})`
    }
    else {
      return input;
    }
  }
}