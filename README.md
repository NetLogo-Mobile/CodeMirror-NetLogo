## NetLogo Language Support for CodeMirror 6

This repository contains work in progress by Ruth Bagley (@rbagley), Haylie Wu (@wubbalubbadu), and John Chen (@CIVITAS-John), aimed at providing NetLogo language support for CodeMirror 6.

### Prerequisites

To set up the environment, use `npm install`. You might also need to install `rollup` and `lezer-generator` globally by running the following commands:

```
npm install @lezer/generator --global
npm install rollup --global
npx husky init
```

### Building the Project

To build the project, run `npm run build` or `npm run release`. The second command creates an uglified and compressed bundle.

### Commiting to the Repository

After you finish your work, please first build and run the project; then, run `npm run precommit` for automatic check and prettifying.

### Acknowledgment

This project is funded by Northwestern SESP Venture Research Fund.

### Contributing

Contributions to this project are welcome.
