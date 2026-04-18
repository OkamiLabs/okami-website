import { useState } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { WidgetButton } from './WidgetButton';
import { WidgetChat } from './WidgetChat';
import { DEFAULT_CONFIG } from './types/widget';
import type { WidgetConfig } from './types/widget';

interface WidgetEmbedProps {
  config?: Partial<WidgetConfig>;
}

export const WidgetEmbed: React.FC<WidgetEmbedProps> = ({ config: configOverrides }) => {
  const [isOpen, setIsOpen] = useState(false);

  const config: WidgetConfig = {
    ...DEFAULT_CONFIG,
    ...configOverrides,
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...configOverrides?.theme,
    },
  };

  const positionClass = `okami-widget--${config.position}`;

  return (
    <ThemeProvider theme={config.theme}>
      <div className={`okami-widget ${positionClass}`}>
        {isOpen && (
          <WidgetChat
            config={config}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}

        <WidgetButton
          isOpen={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        />
      </div>
    </ThemeProvider>
  );
};
