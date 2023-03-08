import * as File from 'fs';
import Path from 'path';

let modelPath = './src/tests/models';
let parsedModels: [string, string[]][] = [];

// Import model files
const importFiles = function () {
  File.readdirSync(modelPath).forEach((current) => {
    if (!current.endsWith('.nlogo')) return;
    var model = File.readFileSync(Path.join(modelPath, current), 'utf8')
      .toString()
      .split('\n');
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
        if (type == 'INPUTBOX') variables.push(model[i + 7]);
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
