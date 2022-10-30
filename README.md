# NetLogo Language Support for CodeMirror 6

- Work in progress by Ruth Bagley (@rbagley), Haylie Wu (@wubbalubbadu), and John Chen (@CIVITAS-John).
- To set up the environment, use `npm install`.
- You might need to install `rollup` and `lezer-generator` globally.
  - `npm install @lezer/generator --global`
  - `npm install rollup --global`
- To build the language, use `lezer-generator ./src/lang/lang.grammar -o ./src/lang/lang.js`.
- To build the project, use `rollup -c`.
- Funded by Northwestern SESP Venture Research Fund.
