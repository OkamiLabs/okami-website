import './styles/themes.css';
import './styles/widget.css';

import { createRoot } from 'react-dom/client';
import { WidgetEmbed } from './WidgetEmbed';

const container = document.createElement('div');
container.id = 'okami-widget-container';
document.body.appendChild(container);

const root = createRoot(container);
root.render(<WidgetEmbed />);
