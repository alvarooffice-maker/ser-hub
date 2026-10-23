/* Entrada do SER Hub: carrega os módulos na ordem original e roda a inicialização. */
import * as app01 from './app01.js';
import * as app02 from './app02.js';
import * as app03 from './app03.js';
import * as app04 from './app04.js';
import * as app05 from './app05.js';
import * as app06 from './app06.js';
import * as app07 from './app07.js';
import * as app08 from './app08.js';

// Com <script> clássico toda função de topo ficava no window; os templates ainda usam
// onclick="agendaMarcar(...)", window.renderFinanceiro etc., então mantemos isso.
for (const mod of [app01, app02, app03, app04, app05, app06, app07, app08]) {
  for (const [nome, valor] of Object.entries(mod)) {
    if (typeof valor === 'function') window[nome] = valor;
  }
}

app02.initApp02();
app06.initApp06();
app07.initApp07();
app08.initApp08();
