import { AppManager } from './core/AppManager';
import './main.css';
import './reset.css';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[Main]: DOMContentLoaded');
  const appManager = AppManager.instance;
  appManager.init();
});

