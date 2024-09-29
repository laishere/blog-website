import path from 'path';

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-url': {
      url: 'inline',
      basePath: path.resolve(import.meta.dirname, 'app/assets'),
    }
  },
};
