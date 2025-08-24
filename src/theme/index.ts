// src/theme/index.ts
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      accent: string;
    };
    success: string;
    warning: string;
    error: string;
    gradient: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
}

export const lightTheme: Theme = {
  colors: {
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FF6B35',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: {
      primary: '#1A1A1A',
      secondary: '#6C757D',
      accent: '#FFD700'
    },
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    gradient: {
      primary: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      secondary: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04)'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  }
};

export const darkTheme: Theme = {
  colors: {
    primary: '#FFD700',
    secondary: '#FFA500',
    accent: '#FF6B35',
    background: '#0A0A0A',
    surface: '#1A1A1A',
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
      accent: '#FFD700'
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    gradient: {
      primary: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      secondary: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  },
  shadows: {
    sm: '0 1px 3px rgba(255, 215, 0, 0.12), 0 1px 2px rgba(255, 215, 0, 0.24)',
    md: '0 4px 6px rgba(255, 215, 0, 0.07), 0 1px 3px rgba(255, 215, 0, 0.1)',
    lg: '0 10px 15px rgba(255, 215, 0, 0.1), 0 4px 6px rgba(255, 215, 0, 0.05)',
    xl: '0 20px 25px rgba(255, 215, 0, 0.15), 0 10px 10px rgba(255, 215, 0, 0.04)'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  }
};

export type ThemeMode = 'light' | 'dark';

export type { Theme };