import * as File from 'fs';
import Path from 'path';

let modelPath = './src/tests/models/builtin';
let parsedModels: [string, string[]][] = [];

// Find all models
let models: string[] = [];
const getFilesRecursively = (directory: string) => {
  const filesInDirectory = File.readdirSync(directory);
  for (const file of filesInDirectory) {
    const absolute = Path.join(directory, file);
    if (File.statSync(absolute).isDirectory()) {
      getFilesRecursively(absolute);
    } else {
      models.push(absolute);
    }
  }
};

// Import model files
const importFiles = function () {
  getFilesRecursively(modelPath);
  models.forEach((current) => {
    if (!current.endsWith('.nlogo')) return;
    var model = File.readFileSync(current, 'utf8').toString().split('\n');
    model = model.map((line) => line.trimEnd());
    var content = '';
    var i = 0;
    var variables: string[] = [];
    // this parser is very rough. it may break with irregular models!
    for (i = 0; i < model.length; i++) {
      var line = model[i];
      if (line == '@#$#@#$#@') break;
      content += line + '\n';
    }
    for (i++; i < model.length; i++) {
      var line = model[i];
      if (line == '@#$#@#$#@') break;
      if (line == '') {
        var type = model[i + 1];
        if (type == 'SLIDER') variables.push(model[i + 7]);
        if (type == 'SWITCH') variables.push(model[i + 7]);
        if (type == 'CHOOSER') variables.push(model[i + 7]);
        if (type == 'INPUTBOX') variables.push(model[i + 6]);
      }
    }
    console.log(variables);
    parsedModels.push([content, variables]);
  });
};

// Export into Tests.js under the dist folder
const exportFiles = function () {
  File.writeFileSync(
    './dist/editor.tests.js',
    `const GalapagoTests = ${JSON.stringify(parsedModels)}`
  );
};

importFiles();
exportFiles();

console.log('Successfully exported: ', parsedModels.length);
