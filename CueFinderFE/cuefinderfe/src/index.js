import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { Grommet } from 'grommet';
import { grommet } from 'grommet/themes';
import { deepMerge } from 'grommet/utils';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Custom dark theme with billiard/cue aesthetic
const darkTheme = deepMerge(grommet, {
  global: {
    colors: {
      brand: {
        dark: '#3b82f6',
        light: '#2563eb',
      },
      'accent-1': {
        dark: '#34d399',
        light: '#10b981',
      },
      'accent-2': {
        dark: '#fbbf24',
        light: '#f59e0b',
      },
      background: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      'background-back': {
        dark: '#1e293b',
        light: '#f9fafb',
      },
      'background-front': {
        dark: '#1e293b',
        light: '#ffffff',
      },
      'background-contrast': {
        dark: '#0f172a',
        light: '#11181c',
      },
      text: {
        dark: '#f1f5f9',
        light: '#1e293b',
      },
      'text-strong': {
        dark: '#ffffff',
        light: '#000000',
      },
      'text-weak': {
        dark: '#94a3b8',
        light: '#64748b',
      },
      border: {
        dark: '#334155',
        light: '#e2e8f0',
      },
      control: 'brand',
      'active-background': 'background-contrast',
      'active-text': 'text-strong',
      'selected-background': 'brand',
      'selected-text': 'text-strong',
      'status-critical': {
        dark: '#ef4444',
        light: '#dc2626',
      },
      'status-error': '#ef4444',
      'status-warning': '#f59e0b',
      'status-ok': '#10b981',
      'status-unknown': '#64748b',
      'status-disabled': '#64748b',
      focus: {
        dark: '#3b82f6',
        light: '#2563eb',
      },
    },
    font: {
      family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      size: '16px',
      height: '24px',
    },
    active: {
      background: 'active-background',
      color: 'active-text',
    },
    hover: {
      background: 'active-background',
      color: 'active-text',
    },
    selected: {
      background: 'selected-background',
      color: 'selected-text',
    },
    control: {
      border: {
        radius: '8px',
      },
    },
    drop: {
      border: {
        radius: '8px',
      },
    },
    borderSize: {
      xsmall: '1px',
      small: '2px',
      medium: '4px',
      large: '12px',
      xlarge: '24px',
    },
    breakpoints: {
      small: {
        value: 768,
        borderSize: {
          xsmall: '1px',
          small: '2px',
          medium: '4px',
          large: '6px',
          xlarge: '12px',
        },
        edgeSize: {
          none: '0px',
          hair: '1px',
          xxsmall: '2px',
          xsmall: '3px',
          small: '6px',
          medium: '12px',
          large: '24px',
          xlarge: '48px',
        },
        size: {
          xxsmall: '24px',
          xsmall: '48px',
          small: '96px',
          medium: '192px',
          large: '384px',
          xlarge: '768px',
          full: '100%',
        },
      },
      medium: {
        value: 1536,
      },
      large: {},
    },
    edgeSize: {
      none: '0px',
      hair: '1px',
      xxsmall: '3px',
      xsmall: '6px',
      small: '12px',
      medium: '24px',
      large: '48px',
      xlarge: '96px',
      responsiveBreakpoint: 'small',
    },
    input: {
      padding: '12px',
      weight: 400,
    },
    spacing: '24px',
    size: {
      xxsmall: '48px',
      xsmall: '96px',
      small: '192px',
      medium: '384px',
      large: '768px',
      xlarge: '1152px',
      xxlarge: '1536px',
      full: '100%',
    },
  },
  button: {
    default: {
      background: {
        color: 'background-front',
      },
      border: {
        color: 'border',
        width: '1px',
      },
      color: 'text',
      padding: {
        horizontal: '16px',
        vertical: '8px',
      },
    },
    primary: {
      background: {
        color: 'brand',
      },
      border: {
        color: 'brand',
      },
      color: 'white',
      padding: {
        horizontal: '20px',
        vertical: '10px',
      },
    },
    secondary: {
      background: {
        color: 'transparent',
      },
      border: {
        color: 'brand',
        width: '2px',
      },
      color: 'brand',
    },
    border: {
      radius: '8px',
      width: '1px',
    },
    padding: {
      vertical: '10px',
      horizontal: '20px',
    },
    extend: (props) => `
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      ${props.primary && `
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        &:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
      `}
    `,
  },
  card: {
    container: {
      round: '12px',
      elevation: 'medium',
      background: 'background-front',
    },
    hover: {
      container: {
        elevation: 'large',
      },
    },
    body: {
      pad: 'medium',
    },
    footer: {
      pad: { horizontal: 'medium', vertical: 'small' },
      background: 'background-back',
    },
    header: {
      pad: 'medium',
      background: 'background-back',
    },
  },
  formField: {
    border: {
      color: 'border',
      error: {
        color: 'status-critical',
      },
      position: 'inner',
      side: 'all',
      style: 'solid',
      size: 'xsmall',
    },
    content: {
      pad: 'small',
    },
    disabled: {
      background: {
        color: 'background-contrast',
      },
    },
    error: {
      color: 'status-critical',
      margin: { vertical: 'xsmall', horizontal: 'small' },
    },
    help: {
      color: 'text-weak',
      margin: { start: 'small' },
    },
    info: {
      color: 'text-weak',
      margin: { vertical: 'xsmall', horizontal: 'small' },
    },
    label: {
      margin: { vertical: 'xsmall', horizontal: 'small' },
      color: 'text',
      weight: 500,
    },
    margin: { bottom: 'small' },
    round: '8px',
  },
  textInput: {
    extend: () => `
      font-size: 14px;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #f1f5f9;
      transition: all 0.2s ease;
      
      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      &::placeholder {
        color: #64748b;
      }
    `,
  },
  select: {
    control: {
      extend: () => `
        border-radius: 8px;
        border: 1px solid #334155;
        background: #1e293b;
        padding: 4px;
        
        &:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `,
    },
  },
  heading: {
    font: {
      family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    level: {
      1: {
        font: {
          weight: 700,
        },
        small: {
          size: '28px',
          height: '34px',
        },
        medium: {
          size: '36px',
          height: '42px',
        },
        large: {
          size: '52px',
          height: '58px',
        },
        xlarge: {
          size: '68px',
          height: '74px',
        },
      },
      2: {
        font: {
          weight: 600,
        },
        small: {
          size: '24px',
          height: '30px',
        },
        medium: {
          size: '28px',
          height: '34px',
        },
        large: {
          size: '36px',
          height: '42px',
        },
        xlarge: {
          size: '44px',
          height: '50px',
        },
      },
      3: {
        font: {
          weight: 600,
        },
        small: {
          size: '20px',
          height: '26px',
        },
        medium: {
          size: '24px',
          height: '30px',
        },
        large: {
          size: '28px',
          height: '34px',
        },
        xlarge: {
          size: '32px',
          height: '38px',
        },
      },
      4: {
        font: {
          weight: 600,
        },
        small: {
          size: '18px',
          height: '24px',
        },
        medium: {
          size: '20px',
          height: '26px',
        },
        large: {
          size: '22px',
          height: '28px',
        },
        xlarge: {
          size: '24px',
          height: '30px',
        },
      },
    },
    weight: 600,
  },
  text: {
    xsmall: {
      size: '12px',
      height: '18px',
    },
    small: {
      size: '14px',
      height: '20px',
    },
    medium: {
      size: '16px',
      height: '24px',
    },
    large: {
      size: '18px',
      height: '26px',
    },
    xlarge: {
      size: '20px',
      height: '28px',
    },
    xxlarge: {
      size: '24px',
      height: '32px',
    },
  },
  layer: {
    background: 'background-front',
    border: {
      radius: '12px',
    },
    overlay: {
      background: 'rgba(0, 0, 0, 0.75)',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Grommet theme={darkTheme} themeMode="dark" full>
      <HashRouter>
        <App />
      </HashRouter>
    </Grommet>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
