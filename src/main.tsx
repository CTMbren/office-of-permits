import { render } from 'preact';
import { App } from './ui/App';
import './ui/theme.css';
import './ui/desk.css';
import './ui/sheet.css';
import './ui/case.css';
import './ui/report.css';

const root = document.getElementById('app');
if (root) render(<App />, root);
