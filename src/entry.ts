import '@material/mwc-top-app-bar'
import '@material/mwc-snackbar'
import '@material/mwc-button'
import '@material/mwc-icon-button'
import '@material/mwc-dialog'
import '@material/mwc-textfield'
import '@material/mwc-formfield'
import '@material/mwc-checkbox'
import '@material/mwc-slider'

import './app-container'
import './project-manager'
import './item-strip'
import './settings-dialog'
import './lofi-player'
import './item-formatter'
import './item-bottom-bar'
import './items-player'
import './project-edit-dialog'
import { AppContainer } from './app-container';
import { LofiPlayer } from './lofi-player'

declare global {
  interface Window {
    app: AppContainer;
    toast: (labelText: string, timeoutMs?: number) => void;
    lofiPlayer: LofiPlayer;
  }
}