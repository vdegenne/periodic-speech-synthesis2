import { hasJapanese } from 'asian-regexps';
import { getExactSearch } from 'japanese-data-module';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from './styles/sharedStyles';


@customElement('item-formatter')
export class ItemFormatter extends LitElement {
  @property() value!: string;
  @property({type: Boolean, reflect: true}) jp = false;

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