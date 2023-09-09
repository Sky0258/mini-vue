import prettier from '../node_modules/prettier/esm/standalone.mjs';
import babel from '../node_modules/prettier/esm/parser-babel.mjs';

window.format = function (code) {
  return prettier.format(code, {
    plugins: [babel],
  });
};