import { getIndentation, indentRange, syntaxTree } from '@codemirror/language';
import { EditorView } from 'codemirror';
import { EditorSelection } from '@codemirror/state';
import { SyntaxNode } from '@lezer/common';

export const prettify = function (view: EditorView) {
  let from = view.state.selection.main.from;
  let to = view.state.selection.main.to;
  let doc = view.state.doc.toString().substring(from, to);

  //eliminate extra spacing
  let new_doc = initialSpaceRemoval(doc);
  view.dispatch(view.state.replaceSelection(new_doc));
  view.dispatch({ selection: { anchor: from, head: from + new_doc.length } });

  //add in new lines based on grammar
  view.dispatch({
    changes: addSpacing(
      view,
      view.state.selection.main.from,
      view.state.selection.main.to
    ),
  });

  //ensure spacing is correct
  from = view.state.selection.main.from;
  to = view.state.selection.main.to;
  new_doc = finalSpacing(view.state.doc.toString().substring(from, to));
  view.dispatch(view.state.replaceSelection(new_doc));
  view.dispatch({ selection: { anchor: from, head: from + new_doc.length } });

  //add indentation
  view.dispatch({
    changes: indentRange(
      view.state,
      view.state.selection.main.from,
      view.state.selection.main.to
    ),
  });
};

export const prettifyAll = function (view: EditorView) {
  let doc = view.state.doc.toString();

  //eliminate extra spacing
  let new_doc = initialSpaceRemoval(doc);
  view.dispatch({ changes: { from: 0, to: doc.length, insert: new_doc } });

  //give certain nodes their own lines
  view.dispatch({
    changes: addSpacing(view, 0, view.state.doc.toString().length),
  });

  //ensure spacing is correct
  doc = view.state.doc.toString();
  new_doc = finalSpacing(doc);
  view.dispatch({ changes: { from: 0, to: doc.length, insert: new_doc } });

  //add indentation
  view.dispatch({
    changes: indentRange(view.state, 0, view.state.doc.toString().length),
  });
};

const initialSpaceRemoval = function (doc: string) {
  let new_doc = doc.replace(/(\[|\])/g, ' $1 ');
  new_doc = new_doc.replace(/[ ]*\)[ ]*/g, ') ');
  new_doc = new_doc.replace(/[ ]*\([ ]*/g, ' (');
  new_doc = new_doc.replace(/\n[ ]+/g, '\n');
  new_doc = new_doc.replace(/(\n[^;\n]+)(\n\s*\[)/g, '$1 [');
  new_doc = new_doc.replace(/(\n[^;\n]+)(\n\s*\])/g, '$1 ]');
  new_doc = new_doc.replace(/(\[\n\s*)([\w\(])/g, '[ $2');
  new_doc = new_doc.replace(/(\n)( +)(to[ -])/g, '$1$3');
  new_doc = new_doc.replace(/ +/g, ' ');
  new_doc = new_doc.replace(/[ ]+\n/g, '\n');
  new_doc = new_doc.replace(/\n\n+/g, '\n\n');
  return new_doc;
};

const finalSpacing = function (doc: string) {
  let new_doc = doc.replace(/\n[ ]+/g, '\n');
  new_doc = new_doc.replace(/[ ]+\n/g, '\n');
  new_doc = new_doc.replace(/\n\n+/g, '\n\n');
  new_doc = new_doc.replace(/(\n+)(\n\nto[ -])/g, '$2');
  new_doc = new_doc.replace(/(\n+)(\n\n[\w-]+-own)/g, '$2');
  return new_doc;
};

const addSpacing = function (view: EditorView, from: number, to: number) {
  let changes: { from: number; insert: string; to?: number }[] = [];
  let doc = view.state.doc.toString();
  //give certain nodes their own lines
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.from >= from && node.to <= to) {
        if (
          ((node.node.parent?.name == 'Program' &&
            node.name != 'LineComment') ||
            node.name == 'To' ||
            node.name == 'End' ||
            (node.name == 'ProcedureContent' &&
              node.node.parent?.name != 'CodeBlock')) &&
          node.from > 0 &&
          doc[node.from - 1] != '\n'
        ) {
          changes.push({ from: node.from, to: node.from, insert: '\n' });
        } else if (
          node.name == 'CodeBlock' &&
          checkBlock(node.node, 'ProcedureContent', doc)
        ) {
          node.node.getChildren('ProcedureContent').map((child) => {
            if (doc[child.from - 1] != '\n') {
              changes.push({ from: child.from, to: child.from, insert: '\n' });
            }
          });
          node.node.getChildren('CloseBracket').map((child) => {
            if (doc[child.from - 1] != '\n') {
              changes.push({ from: child.from, to: child.from, insert: '\n' });
            }
          });
        } else if (
          node.name == 'ReporterBlock' &&
          checkBlock(node.node, 'ReporterContent', doc)
        ) {
          node.node.getChildren('ReporterContent').map((child) => {
            if (doc[child.from - 1] != '\n') {
              changes.push({ from: child.from, to: child.from, insert: '\n' });
            }
          });
          node.node.getChildren('CloseBracket').map((child) => {
            if (doc[child.from - 1] != '\n') {
              changes.push({ from: child.from, to: child.from, insert: '\n' });
            }
          });
        } else if (
          node.name == 'AnonymousProcedure' &&
          (checkBlock(node.node, 'ReporterContent', doc) ||
            checkBlock(node.node, 'ProcedureContent', doc))
        ) {
          // console.log(changes.length);
          node.node.getChildren('ProcedureContent').map((child) => {
            if (doc[child.from - 1] != '\n') {
              changes.push({ from: child.from, to: child.from, insert: '\n' });
            }
          });
          node.node.getChildren('ReporterContent').map((child) => {
            if (doc[child.from - 1] != '\n') {
              changes.push({ from: child.from, to: child.from, insert: '\n' });
            }
          });
          node.node.getChildren('CloseBracket').map((child) => {
            if (doc[child.from - 1] != '\n') {
              changes.push({ from: child.from, to: child.from, insert: '\n' });
            }
          });
          // console.log(changes.length);
        }
        // else if(node.name=='CommandStatement' && view.state.sliceDoc(node.from,node.to).startsWith('ifelse')){
        //   node.node.getChildren('Arg').map((subnode)=>{
        //     subnode.node.getChildren('CodeBlock').map(child=>{
        //       if(doc[child.from-1]!='\n'){
        //   changes.push({ from: child.from, to: child.from, insert: '\n' });
        // }
        //     })
        //   })
        // }
        if (['Extensions', 'Globals', 'BreedsOwn'].includes(node.name)) {
          if (doc.substring(node.from, node.to).includes('\n')) {
            node.node.getChildren('CloseBracket').map((child) => {
              // console.log(doc.substring(node.from, node.to));
              if (doc[child.from - 1] != '\n') {
                changes.push({
                  from: child.from,
                  to: child.from,
                  insert: '\n',
                });
              }
            });
            node.node.getChildren('Extension').map((child) => {
              if (doc[child.from - 1] != '\n') {
                changes.push({
                  from: child.from,
                  to: child.from,
                  insert: '\n',
                });
              }
            });
            node.node.getChildren('Identifier').map((child) => {
              if (doc[child.from - 1] != '\n') {
                changes.push({
                  from: child.from,
                  to: child.from,
                  insert: '\n',
                });
              }
            });
          }
        }
        if (node.name.includes('Args') && !node.name.includes('Special')) {
          let prim = doc.substring(node.from, node.to).toLowerCase();
          changes.push({ from: node.from, to: node.to, insert: prim });
        }
      }
    });
  return changes;
};

//checks if code block needs to be multiline
const checkBlock = function (node: SyntaxNode, childName: string, doc: string) {
  let count = 0;
  let multiline = false;
  let multilineChildren = false;
  node.node.getChildren(childName).map((child) => {
    count += 1;
    multiline = doc.substring(child.from, child.to).includes('\n');

    child.getChildren('CommandStatement').map((node) => {
      node.getChildren('Arg').map((subnode) => {
        if (subnode.getChildren('CodeBlock').length > 0) {
          multilineChildren = true;
        } else if (subnode.getChildren('AnonymousProcedure').length > 0) {
          multilineChildren = true;
        }
      });
    });
  });
  return ((multiline || multilineChildren) && count == 1) || count > 1;
};