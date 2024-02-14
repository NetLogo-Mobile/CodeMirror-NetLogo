import { indentRange, syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { IterMode, SyntaxNode, Tree } from '@lezer/common';
import { GalapagosEditor } from 'src/editor';
import { Log } from '../utils/debug-utils';
import { getCodeName } from 'src/lang/utils/code';

/** prettify: Change selection to fit formatting standards. */
export const prettify = function (view: EditorView, from: number | null = null, to: number | null = null) {
  if (from && to) {
    view.dispatch({ selection: { anchor: from, head: to } });
  }

  from = view.state.selection.main.from;
  to = view.state.selection.main.to;
  let doc = view.state.doc.toString().substring(from, to);

  // eliminate extra spacing
  let new_doc = removeSpacingRegex(doc);
  view.dispatch(view.state.replaceSelection(new_doc));
  view.dispatch({ selection: { anchor: from, head: from + new_doc.length } });

  // add in new lines based on grammar
  view.dispatch({
    changes: addSpacing(view, view.state.selection.main.from, view.state.selection.main.to, 100),
  });

  // ensure spacing is correct
  from = view.state.selection.main.from;
  to = view.state.selection.main.to;
  new_doc = finalSpacing(view.state.doc.toString().substring(from, to));
  view.dispatch(view.state.replaceSelection(new_doc));
  view.dispatch({ selection: { anchor: from, head: from + new_doc.length } });

  // add indentation
  view.dispatch({
    changes: indentRange(view.state, view.state.selection.main.from, view.state.selection.main.to),
  });
  return view.state.selection.main.to;
};

/** prettifyAll: Make whole code file follow formatting standards. */
export const prettifyAll = function (view: EditorView, Editor: GalapagosEditor) {
  let doc = view.state.doc.toString();
  // eliminate extra spacing
  Editor.ForceParse();
  // console.log('1', doc);
  let new_doc = removeSpacing(syntaxTree(view.state), doc);
  // console.log('2', new_doc);
  view.dispatch({ changes: { from: 0, to: doc.length, insert: new_doc } });
  // parse it again
  Editor.ForceParse();
  //addTooMuchSpacing(view)
  // give certain nodes their own lines
  view.dispatch({
    changes: addSpacing(view, 0, new_doc.length, Editor.LineWidth),
  });
  // console.log('3', view.state.doc.toString());
  new_doc = finalSpacing(view.state.doc.toString());
  // console.log('4', new_doc);
  view.dispatch({ changes: { from: 0, to: view.state.doc.toString().length, insert: new_doc } });
  // doc = view.state.doc.toString();
  Editor.ForceParse();
  // add indentation
  view.dispatch({
    changes: indentRange(view.state, 0, view.state.doc.toString().length), //indent(view.state.doc.toString(),view.state)
  });
  if (doc != view.state.doc.toString()) Log('Prettifier made changes');
};

const doubleLineBreaks = [
  // 'LineComment',
  'GlobalStr',
  'ExtensionStr',
  'BreedStr',
  'Own',
  'To',
];

/** removeSpacing: Make initial spacing adjustments. */
function removeSpacing(tree: Tree, doc: string): string {
  // initialize
  var result = '';
  var previous = '';
  var lastPosition = 0;
  // iterate through nodes
  tree.iterate({
    enter: (noderef) => {
      if (noderef.node.firstChild != null) return;
      var content = doc.substring(noderef.from, noderef.to);
      // do minimum spacing
      if (previous !== '(' && content !== ')' && noderef.from > 0) {
        var spacing = doc.substring(lastPosition, noderef.from);
        if (doubleLineBreaks.indexOf(noderef.node.name) !== -1) {
          if (spacing.indexOf('\n\n') != -1) result += '\n\n';
          else if (spacing.indexOf('\n') != -1) result += '\n';
          else result += ' ';
        } else if (noderef.name == 'LineComment') {
          spacing = spacing.replace(/\n\n+/g, '\n\n');
          result += spacing;
        } else {
          if (spacing.indexOf('\n') != -1) result += '\n';
          else result += ' ';
        }
      }
      // add content
      result += content;
      previous = content;
      lastPosition = noderef.to;
    },
    mode: IterMode.IncludeAnonymous,
  });
  //console.log(result);
  return result;
}

/** removeSpacing: Make initial spacing adjustments. */
function removeSpacingRegex(doc: string): string {
  // let new_doc = doc.replace(/(\[|\])/g, ' $1 ');
  // new_doc = new_doc.replace(/[ ]*\)[ ]*/g, ') ');
  // new_doc = new_doc.replace(/[ ]*\([ ]*/g, ' (');
  let new_doc = doc.replace(/\n[ ]+/g, '\n');
  new_doc = new_doc.replace(/(\n[^;\n]+)(\n\s*\[)/g, '$1 [');
  new_doc = new_doc.replace(/(\n[^;\n]+)(\n\s*\])/g, '$1 ]');
  new_doc = new_doc.replace(/(\[\n\s*)([\w\(])/g, '[ $2');
  new_doc = new_doc.replace(/(\n)( +)(to[ -])/g, '$1$3');
  new_doc = new_doc.replace(/ +/g, ' ');
  new_doc = new_doc.replace(/[ ]+\n/g, '\n');
  new_doc = new_doc.replace(/\n\n+/g, '\n\n');
  return new_doc;
}

/** finalSpacing: Make final spacing adjustments. */
const finalSpacing = function (doc: string) {
  let new_doc = doc.replace(/\n[ ]+/g, '\n');
  new_doc = new_doc.replace(/[ ]+\n/g, '\n');
  new_doc = new_doc.replace(/\n\n+/g, '\n\n');
  new_doc = new_doc.replace(/ +/g, ' ');
  new_doc = new_doc.replace(/^\s+/g, '');
  // console.log(new_doc);
  new_doc = new_doc.replace(/(\n[^;\n]+)\n[ ]*\[[ ]*\n/g, '$1 [\n');
  // console.log(new_doc);
  new_doc = new_doc.replace(/(\n+)(\n\nto[ -])/g, '$2');
  new_doc = new_doc.replace(/(\n+)(\n\n[\w-]+-own)/g, '$2');
  new_doc = new_doc.replace(/[ ]+$/, '');
  return new_doc;
};

/** addSpacing: Give certain types of nodes their own lines. */
const addSpacing = function (view: EditorView, from: number, to: number, lineWidth: number) {
  let changes: { from: number; insert: string; to?: number }[] = [];
  let doc = view.state.doc.toString();
  let lastInsertedSpace = 0;
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      // console.log(node.name, "'" + getCodeName(view.state, node.node) + "'");
      if (node.from >= from && node.to <= to) {
        if (
          ((node.node.parent?.name == 'Program' && node.name != 'LineComment') ||
            node.name == 'To' ||
            node.name == 'End' ||
            (node.name == 'ProcedureContent' && node.node.parent?.name != 'CodeBlock')) &&
          node.from > 0 &&
          doc[node.from - 1] != '\n'
        ) {
          // console.log("A")
          changes.push({ from: node.from, to: node.from, insert: '\n' });
        } else if (node.name == 'CodeBlock') {
          // console.log("CODEBLOCK",doc.substring(node.from,node.to),doc.substring(node.from, node.to).match(/^\s*\[\s*[^\s]+\s*\]/g))
          if (doc.substring(node.from, node.to).match(/^\s*\[\s*[^\s]+\s*\]/g)) {
            let replacement =
              '[ ' +
              doc
                .substring(node.from, node.to)
                .replace(/(\[|\]|\n)/g, '')
                .trim() +
              ' ]';
            if (doc.substring(0, node.from).match(/\n[ ]*$/)) {
              changes.push({
                from: node.from,
                to: node.to,
                insert: replacement,
              });
            } else {
              // console.log("B")
              changes.push({
                from: node.from,
                to: node.to,
                insert: '\n' + replacement,
              });
            }
            return false;
          } else if (checkBlock(node.node, 'ProcedureContent', doc, lineWidth)) {
            // console.log(getCodeName(view.state,node.node))
            for (var name of ['ProcedureContent', 'CloseBracket']) {
              node.node.getChildren(name).map((child) => {
                // console.log(getCodeName(view.state,child),doc.substring(child.from-15,child.from).replace(/[ ]/g, ''))
                if (
                  !doc
                    .substring(Math.max(0, child.from - 15), child.from)
                    .replace(/[ ]/g, '')
                    .endsWith('\n')
                ) {
                  // console.log("C","'"+doc.substring(child.from-15,child.from).replace(/[ ]/g, '')+"'",doc.substring(child.from-15,child.from).replace(/[ ]/g, '').endsWith('\n'))
                  changes.push({
                    from: child.from,
                    to: child.from,
                    insert: '\n',
                  });
                }
              });
            }
          }
        } else if (node.name == 'ReporterBlock' && checkBlock(node.node, 'ReporterStatement', doc, lineWidth)) {
          for (var name of ['ReporterStatement', 'CloseBracket']) {
            node.node.getChildren(name).map((child) => {
              if (doc[child.from - 1] != '\n') {
                // console.log("D")
                changes.push({
                  from: child.from,
                  to: child.from,
                  insert: '\n',
                });
              }
            });
          }
        } else if (node.name == 'CommandStatement' || node.name == 'ReporterStatement') {
          let cursor = node.node.cursor();
          if (cursor.firstChild()) {
            while (cursor.node.name == 'LineComment') {
              cursor.nextSibling();
            }
            let startPos = doc.substring(0, cursor.from).lastIndexOf('\n');
            let startingSpaces = doc.substring(startPos, cursor.to).match(/^\s+/);
            if (startingSpaces) {
              startPos = startPos + startingSpaces[0].length;
            }
            startPos = Math.max(startPos, lastInsertedSpace);
            let lastPos = cursor.to;
            let removeFrom = cursor.to;
            //if(cursor.node.name!='Arg'){ console.log("\'"+doc.substring(cursor.from, cursor.to)+"\'")}
            if (
              cursor.node.name != 'Arg' &&
              cursor.node.nextSibling?.name == 'Arg' &&
              doc.substring(cursor.from, cursor.to).length < lineWidth &&
              doc.substring(cursor.to, cursor.to + 1) == '\n'
            ) {
              // console.log("1",cursor.node.name,cursor.node.nextSibling?.name)
              // console.log(doc.substring(cursor.from, cursor.to))
              changes.push({
                from: cursor.to,
                to: cursor.to + 1,
                insert: ' ',
              });
              removeFrom = cursor.to + 1;
            }
            while (cursor.nextSibling()) {
              // if(cursor.node.prevSibling?.name!='Arg'){
              //   console.log(startPos,lastPos,cursor.from,cursor.to)
              // }
              if (cursor.node.name == 'LineComment') {
                removeFrom = cursor.to + 1;
                continue;
              }
              if (removeFrom > cursor.from) {
                removeFrom = cursor.from;
              }
              if (cursor.node.name == 'Arg') {
                // console.log(
                //   doc.substring(lastPos, cursor.from),
                //   doc.substring(node.from, cursor.to),
                //   doc.substring(node.from, cursor.to).length,
                //   lineWidth
                // );
                if (
                  doc.substring(lastPos, cursor.from).includes('\n') &&
                  doc.substring(startPos, cursor.to).replace(/\s+/g, ' ').length < lineWidth
                ) {
                  // console.log('here', doc.substring(cursor.from, cursor.to));
                  changes.push({
                    from: removeFrom,
                    to: cursor.from,
                    insert: ' ',
                  });
                } else if (
                  doc.substring(startPos, cursor.to).length > lineWidth &&
                  !doc.substring(lastPos, cursor.to).includes('\n') &&
                  cursor.node.nextSibling
                ) {
                  // console.log("#@$#@$#@!$#!@$#!")
                  changes.push({
                    from: removeFrom,
                    to: cursor.from,
                    insert: '\n',
                  });
                  lastInsertedSpace = cursor.from;
                }
                lastPos = cursor.to;
              }
              removeFrom = cursor.to;
            }
          }
          // node.node.getChildren('Arg').map((child) => {
          //   console.log(
          //     doc.substring(lastPos, child.from),
          //     doc.substring(node.from, child.to),
          //     doc.substring(node.from, child.to).length,
          //     lineWidth
          //   );
          //   if (
          //     doc.substring(lastPos, child.from).includes('\n') &&
          //     doc.substring(node.from, child.to).split('\n')[0].length < lineWidth
          //   ) {
          //     changes.push({
          //       from: lastPos,
          //       to: child.from,
          //       insert: ' ',
          //     });
          //   } else if (
          //     doc.substring(startPos, child.to).length > lineWidth &&
          //     !doc.substring(lastPos, child.to).includes('\n')
          //   ) {
          //     changes.push({
          //       from: child.from,
          //       to: child.from,
          //       insert: '\n',
          //     });
          //   }
          //   lastPos = child.to;
          // });
        } else if (
          node.name == 'AnonymousProcedure' &&
          (checkBlock(node.node, 'ReporterStatement', doc, lineWidth) ||
            checkBlock(node.node, 'ProcedureContent', doc, lineWidth))
        ) {
          for (var name of ['ProcedureContent', 'ReporterStatement', 'CloseBracket']) {
            node.node.getChildren(name).map((child) => {
              // console.log("E")
              if (doc[child.from - 1] != '\n') {
                changes.push({
                  from: child.from,
                  to: child.from,
                  insert: '\n',
                });
              }
            });
          }
        } else if (
          node.name == 'OpenParen' &&
          ![' ', '(', '\n'].includes(view.state.sliceDoc(node.from - 1, node.from))
        ) {
          changes.push({ from: node.from, to: node.to, insert: ' (' });
        } else if (node.name == 'CloseParen' && ![' ', '\n', ')'].includes(view.state.sliceDoc(node.to, node.to + 1))) {
          changes.push({ from: node.from, to: node.to, insert: ') ' });
        } else if (node.name == 'OpenBracket') {
          let bracket = '';
          if (view.state.sliceDoc(node.from - 1, node.from) != ' ') {
            bracket += ' ';
          }
          bracket += '[';
          if (![' ', '\n'].includes(view.state.sliceDoc(node.to, node.to + 1))) {
            bracket += ' ';
          }
          changes.push({ from: node.from, to: node.to, insert: bracket });
        } else if (node.name == 'CloseBracket') {
          let bracket = '';
          if (view.state.sliceDoc(node.from - 1, node.from) != ' ') {
            bracket += ' ';
          }
          bracket += ']';
          if (![' ', '\n'].includes(view.state.sliceDoc(node.to, node.to + 1))) {
            bracket += ' ';
          }
          changes.push({ from: node.from, to: node.to, insert: bracket });
        }
        if (['Extensions', 'Globals', 'BreedsOwn'].includes(node.name)) {
          if (doc.substring(node.from, node.to).includes('\n')) {
            for (var name of ['CloseBracket', 'Extension', 'Identifier']) {
              node.node.getChildren(name).map((child) => {
                if (doc[child.from - 1] != '\n' && child.from > 0) {
                  // console.log("F")
                  changes.push({
                    from: child.from,
                    to: child.from,
                    insert: '\n',
                  });
                }
              });
            }
          }
        }
        if (node.name.includes('Args') && !node.name.includes('Special')) {
          let prim = doc.substring(node.from, node.to).toLowerCase();
          changes.push({ from: node.from, to: node.to, insert: prim });
        }
      }
    });
  // console.log(changes)
  return changes;
};

/** checkBlock: checks if code block needs to be multiline. */
const checkBlock = function (node: SyntaxNode, childName: string, doc: string, lineWidth: number) {
  let count = 0;
  let multiline = doc.substring(node.from, node.to).includes('[\n');
  let multilineChildren = false;
  node.node.getChildren(childName).map((child) => {
    count += 1;
    multiline =
      doc.substring(child.from, child.to).includes('\n') ||
      doc.substring(child.from, child.to).length > lineWidth ||
      multiline;
    // console.log(multiline+" "+child.name+" "+doc.substring(child.from, child.to).length+" "+lineWidth)
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
  // console.log(((multiline || multilineChildren) && count == 1) || count > 1)
  return ((multiline || multilineChildren) && count == 1) || count > 1;
};
