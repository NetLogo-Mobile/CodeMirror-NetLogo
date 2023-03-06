import * as File from 'fs';
import path from 'path';

let texts: string[] = [];

const importFiles = function () {
  File.readdirSync('./src/test_files').forEach((Path) => {
    texts.push(
      File.readFileSync(path.join('./src/test_files', Path), 'utf8').toString()
    );
  });

  // File.readdir('../test_files',(error,files)=>{
  //     if(error){console.log(error)}
  //     files.forEach(file=>{
  //         texts.push(file)
  //     })
  // })
};

const exportFiles = function () {
  File.writeFileSync(
    './src/codemirror/test_files.ts',
    `export const test_files:string[]=[\`${texts.join('`,`')}\`]`
  );
};

importFiles();
exportFiles();
console.log('done', texts.length);
