import { GalapagosEditor } from '../../editor';
import { BuildSnapshot, CodeSnapshot, IntegrateSnapshot } from './code-snapshot';
import { getSingularName, getPluralName } from '../../utils/breed-utils';
import { syntaxTree } from '@codemirror/language';
import { Log } from '../../utils/debug-utils';
import { LintContext } from 'src/lang/classes/contexts';
import { BreedType } from 'src/lang/classes/structures';
import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';
import { constants, linkVars, patchVars, turtleVars } from '../keywords';
import { stat } from 'fs';

/** FixGeneratedCode: Try to fix and prettify the generated code. */
export function FixGeneratedCodeRegex(Editor: GalapagosEditor, Source: string, Parent?: CodeSnapshot): string {
  Source = Source.trim();
  if (Source == '') return Source;
  // First pass: prettify the code
  Editor.SetCode(Source);
  Editor.Semantics.PrettifyAll();
  // Second pass: clean up global statements
  // TODO: Now I am using a rudimentry method to scan by lines, but it would be better to deal at a grammar level.
  var Snapshot = BuildSnapshot(Editor);
  var Lines = Editor.GetCode().split('\n');
  var LastIsComment: boolean = false;
  var InProcedure: boolean = false;
  var NewLines: string[] = [];
  for (var I = 0; I < Lines.length; I++) {
    var Line = Lines[I].trim();
    // If the line is a comment, keep it for now
    if (Line.startsWith(';')) {
      LastIsComment = true;
      NewLines.push(Line);
      continue;
    }
    // For other kind of lines
    if (Line == '') {
      // If the line is empty, keep it
      NewLines.push(Line);
    } else if (Line.startsWith('to ' || Line.startsWith('to-report '))) {
      InProcedure = true;
      NewLines.push(Line);
    } else if (Line == 'end') {
      InProcedure = false;
      NewLines.push(Line);
    } else if (Line.startsWith('globals [') && Line.endsWith(']')) {
      // If the line is a globals declaration, keep the position only when it is outside procedures
      if (!InProcedure) NewLines.push('globals []');
      else if (LastIsComment) {
        NewLines.pop();
      }
    } else if (Line.startsWith('extensions [') && Line.endsWith(']')) {
      // If the line is a extensions declaration, keep the position only when it is outside procedures
      if (!InProcedure) NewLines.push('extensions []');
      else if (LastIsComment) {
        NewLines.pop();
      }
    } else if (
      (Line.startsWith('breed [') ||
        Line.startsWith('directed-link-breed [') ||
        Line.startsWith('undirected-link-breed [')) &&
      Line.endsWith(']')
    ) {
      // If the line is a breed declaration, try to get the name and fix the singular issue
      var Match = Line.matchAll(/([^\s]*)breed\s*\[\s*([^\s]+)\s+([^\s]+)\s*\]/g).next().value;
      if (Match) {
        var Plural = Match[2];
        var Singular = Match[3];
        if (Plural == Singular) Singular = getSingularName(Plural);
        var Statement = `${Match[1]}breed [ ${Plural} ${Singular} ]`;
        if (!InProcedure) NewLines.push(Statement);
        else {
          NewLines.unshift(Statement);
          if (LastIsComment) NewLines.unshift(NewLines.pop()!);
        }
      } else if (LastIsComment) NewLines.pop();
    } else {
      // If the line is a breeds-own declaration, remove the contents
      var Match = Line.matchAll(/([^\s]+)-own\s*\[([^\]]+)/g).next().value;
      if (Match) {
        var Name = Match[1];
        if (!InProcedure) NewLines.push(`${Name}-own []`);
        else {
          if (LastIsComment) NewLines.pop();
        }
      } else {
        NewLines.push(Line);
      }
    }
    LastIsComment = false;
  }
  Editor.SetCode(NewLines.join('\n'));
  // Third pass: re-introduce the snapshot
  IntegrateSnapshot(Editor, Snapshot);
  if (Parent) IntegrateSnapshot(Editor, Parent);
  // Final pass: prettify the code once again
  Editor.Semantics.PrettifyAll();
  return Editor.GetCode().trim();
}

export function FixGeneratedCode(Editor: GalapagosEditor, Source: string, Parent?: CodeSnapshot): string {
  Source = Source.trim();
  if (Source == '') return Source;
  // Remove the trailing semicolon
  if (Source.endsWith(';')) Source = Source.slice(0, -1);
  // First pass: prettify the code
  Editor.SetCode(Source);
  Editor.Semantics.PrettifyAll();
  // Second pass: clean up global statements
  var Snapshot = BuildSnapshot(Editor);
  var intoProcedure: string[] = [];
  let changes: { from: number; insert: string; to?: number }[] = [];
  let state = Editor.CodeMirror.state;
  let comments: string[] = [];
  let commentsStart: null | number = null;
  let commentFrom: null | number = null;
  let procedureStart: null | number = null;
  let first: { Globals: null | number; Extensions: null | number } = { Globals: null, Extensions: null };
  let reserved = GetReserved(Editor.LintContext);
  let breeds: string[] = [];
  let globals: string[] = [];
  let extensions: string[] = [];
  let reservedVars = [...turtleVars, ...patchVars, ...linkVars, ...constants];

  var checkForMisplaced = (node: SyntaxNode) => {
    if (node.name == 'Procedure' && procedureStart == null) {
      procedureStart = node.from;
    } else if (node.name == 'Globals' || node.name == 'Extensions') {
      if (first[node.name] == null) {
        if (procedureStart != null && procedureStart < node.from) {
          // console.log('Moving ' + node.name + ' to ' + procedureStart);
          changes.push({
            from: 0,
            to: 0,
            insert: AddComments(state.sliceDoc(node.from, node.to), comments) + '\n\n',
          });
          changes.push({
            from: commentsStart ?? node.from,
            to: node.to,
            insert: '',
          });
          first[node.name] = AddComments(state.sliceDoc(node.from, node.to), comments).length - 1;
          comments = [];
          commentFrom = null;
          commentsStart = null;
          return;
        } else {
          first[node.name] = node.to - 1;
        }
      } else {
        let to_add = state
          .sliceDoc(node.from, node.to)
          .replace(/globals\s*\[/i, '')
          .replace(/extensions\s*\[/i, '')
          .replace(/\]/, '');
        let index = first[node.name];
        // console.log('combining statements');
        if (index) {
          changes.push({
            from: index,
            to: index,
            insert: ' ' + to_add,
          });
          changes.push({
            from: commentsStart ?? node.from,
            to: node.to,
            insert: '',
          });
          comments = [];
          commentFrom = null;
          commentsStart = null;
          return;
        }
      }
    } else if (
      procedureStart != null &&
      (node.name == 'BreedsOwn' ||
        (node.name == 'Misplaced' && node.node.resolveInner(node.from, 1).name == 'BreedToken'))
    ) {
      // console.log('Moving ' + node.name + ' to ' + procedureStart);
      changes.push({
        from: 0,
        to: 0,
        insert: AddComments(state.sliceDoc(node.from, node.to), comments) + '\n\n',
      });
      changes.push({
        from: commentsStart ?? node.from,
        to: node.to,
        insert: '',
      });
      comments = [];
      commentFrom = null;
      commentsStart = null;
      return;
    }
    if (node.name == 'LineComment') {
      // take only the one preceding comment
      comments = [state.sliceDoc(node.from, node.to)];
      commentsStart = node.from;
      // take all immediately preceding comments
      // comments.push(state.sliceDoc(node.from, node.to));
      // commentsStart = commentsStart ?? node.from;
    } else if (comments.length > 0 && !commentFrom) {
      // Record the position of what comes immediately after the comments
      // (this is in case of nesting, so we don't lose the comments)
      commentFrom = node.from;
    } else if (comments.length > 0 && commentFrom && node.from > commentFrom) {
      // Discard the comment info when we move on to the next statement
      comments = [];
      commentFrom = null;
      commentsStart = null;
    }
  };

  //do some re-ordering at the top level
  let cursor = syntaxTree(state).cursor();
  cursor.firstChild();
  if (cursor.node.name == 'Normal') {
    if (cursor.firstChild()) {
      checkForMisplaced(cursor.node);
      // console.log(cursor.node.name, changes);
      while (cursor.nextSibling()) {
        checkForMisplaced(cursor.node);
        // console.log(cursor.node.name, changes);
      }
    }
  }

  Editor.Operations.ChangeCode(changes);
  Editor.ForceParse();
  state = Editor.CodeMirror.state;
  changes = [];
  procedureStart = null;
  comments = [];
  commentFrom = null;
  commentsStart = null;

  // Go over the syntax tree
  syntaxTree(state)
    .cursor()
    .iterate((noderef) => {
      // Log(noderef.name, comments);
      // check for misplaced non-global statements at the global level
      // Collect them into intoProcedure, and remove them from the code
      // I don't understand why the parser does not recognize `to test end test` as rouge statements.
      if (noderef.name == 'Misplaced' || (noderef.name == 'Procedure' && noderef.node.getChildren('To').length == 0)) {
        let skip = false;
        Log(noderef.name, noderef.from, commentFrom, comments);
        if (noderef.name == 'Misplaced') {
          let grandchild = noderef.node.firstChild?.firstChild;
          if (grandchild && grandchild.name.includes('0Args')) {
            skip = true;
          }
        }
        if (!skip) {
          intoProcedure.push(AddComments(state.sliceDoc(noderef.from, noderef.to), comments));
        }
        changes.push({
          from: commentsStart ?? noderef.from,
          to: Math.min(noderef.to + 1, state.doc.toString().length),
          insert: '',
        });
        return false;
      }
      // check for misplaced global statements
      // Move them to the top of the program
      if (noderef.name == 'Error') {
        Log(noderef.name, comments);
        changes.push({
          from: commentsStart ?? noderef.from,
          to: noderef.to + 1,
          insert: '',
        });
        changes.push({
          from: 0,
          to: 0,
          insert: AddComments(state.sliceDoc(noderef.from, noderef.to), comments) + '\n',
        });
        return false;
      } else if (noderef.name == 'Globals') {
        let len = noderef.node.getChildren('Identifier').length;
        let deleted = 0;
        let temp_changes: { from: number; insert: string; to?: number }[] = [];
        noderef.node.getChildren('Identifier').map((child) => {
          let value = state.sliceDoc(child.from, child.to);
          if (globals.includes(value.toLowerCase()) || reservedVars.includes(value.toLowerCase())) {
            temp_changes.push({
              from: child.from,
              to: child.to,
              insert: '',
            });
            deleted += 1;
          }
          globals.push(value.toLowerCase());
        });
        if (deleted == len || len == 0) {
          changes.push({
            from: commentsStart ?? noderef.from,
            to: noderef.to + 1,
            insert: '',
          });
        } else {
          changes = changes.concat(temp_changes);
        }
      } else if (noderef.name == 'BreedsOwn') {
        let vars: string[] = [];
        let len = noderef.node.getChildren('Identifier').length;
        let deleted = 0;
        let temp_changes: { from: number; insert: string; to?: number }[] = [];
        noderef.node.getChildren('Identifier').map((child) => {
          let value = state.sliceDoc(child.from, child.to);
          if (vars.includes(value.toLowerCase()) || reservedVars.includes(value.toLowerCase())) {
            temp_changes.push({
              from: child.from,
              to: child.to,
              insert: '',
            });
            deleted += 1;
          }
          vars.push(value.toLowerCase());
        });
        if (deleted == len || len == 0) {
          changes.push({
            from: commentsStart ?? noderef.from,
            to: noderef.to + 1,
            insert: '',
          });
        } else {
          changes = changes.concat(temp_changes);
        }
      } else if (noderef.name == 'Breed') {
        let change = FixBreed(noderef.node, state, breeds);
        if (change != null) {
          changes.push({
            from: change.from,
            to: change.to,
            insert: change.insert,
          });
        }
        let plural = noderef.node.getChild('BreedPlural');
        let singular = noderef.node.getChild('BreedSingular');
        if (plural && singular) {
          breeds.push(state.sliceDoc(plural.from, plural.to).toLowerCase());
          breeds.push(state.sliceDoc(singular.from, singular.to).toLowerCase());
        }
      } else if (noderef.name == 'Extensions') {
        let len = noderef.node.getChildren('Identifier').length;
        let deleted = 0;
        let temp_changes: { from: number; insert: string; to?: number }[] = [];
        noderef.node.getChildren('Identifier').map((child) => {
          let value = state.sliceDoc(child.from, child.to);
          if (
            state.doc
              .toString()
              .toLowerCase()
              .includes('(' + value.toLowerCase() + ':') ||
            state.doc
              .toString()
              .toLowerCase()
              .includes(' ' + value.toLowerCase() + ':') ||
            state.doc
              .toString()
              .toLowerCase()
              .includes('\n' + value.toLowerCase() + ':') ||
            extensions.includes(value.toLowerCase())
          ) {
            temp_changes.push({
              from: child.from,
              to: child.to,
              insert: '',
            });
            deleted += 1;
          }
          extensions.push(value.toLowerCase());
        });
        if (deleted == len || len == 0) {
          changes.push({
            from: commentsStart ?? noderef.from,
            to: noderef.to + 1,
            insert: '',
          });
        } else {
          changes = changes.concat(temp_changes);
        }
      } else if (
        noderef.name == 'SpecialCommand0Args' &&
        state.sliceDoc(noderef.from, noderef.to).toLowerCase() == 'setup'
      ) {
        let procedure = noderef.node.parent?.parent?.parent;
        let name = procedure?.getChild('ProcedureName');
        if (procedure?.name == 'Procedure' && state.sliceDoc(name?.from, name?.to).toLowerCase() == 'go') {
          changes.push({
            from: commentsStart ?? noderef.from,
            to: noderef.to + 1,
            insert: '',
          });
        }
      }
      if (noderef.name == 'Procedure' && noderef.node.getChildren('ProcedureContent').length == 1) {
        let child = noderef.node
          .getChild('ProcedureContent')
          ?.getChild('CommandStatement')
          ?.getChild('SpecialCommand0Args');
        if (
          child &&
          state.doc
            .toString()
            .toLowerCase()
            .includes('to ' + state.sliceDoc(child.from, child.to))
        ) {
          changes.push({
            from: noderef.from,
            to: noderef.to,
            insert: '',
          });
        }
      } else if (noderef.name == 'Procedure' && noderef.node.getChildren('ProcedureContent').length == 0) {
        let child = noderef.node.getChild('ProcedureName');
        let name = state.sliceDoc(child?.from, child?.to).toLowerCase();
        let matches = state.doc.toString().match(new RegExp(name, 'gi'));
        if (matches && matches.length == 1) {
          changes.push({ from: noderef.from, to: noderef.to, insert: '' });
        }
      } else if (noderef.name == 'ProcedureName') {
        let name = state.sliceDoc(noderef.from, noderef.to).toLowerCase();
        if (reserved.includes(name)) {
          let pieces = name.split('-');
          pieces[0] = 'setup';
          changes.push({
            from: noderef.from,
            to: noderef.to,
            insert: pieces.join('-'),
          });
        }
      }
      // Record the position of the first procedure to know where to add 'play'
      if (!procedureStart && noderef.name == 'Procedure') procedureStart = noderef.from;
      // Record the position of the comments
      if (noderef.name == 'LineComment') {
        // take only the one preceding comment
        comments = [state.sliceDoc(noderef.from, noderef.to)];
        commentsStart = noderef.from;
        // take all immediately preceding comments
        // comments.push(state.sliceDoc(noderef.from, noderef.to));
        // commentsStart = commentsStart ?? noderef.from;
      } else if (comments.length > 0 && !commentFrom) {
        // Record the position of what comes immediately after the comments
        // (this is in case of nesting, so we don't lose the comments)
        commentFrom = noderef.from;
      } else if (comments.length > 0 && commentFrom && noderef.from > commentFrom) {
        // Discard the comment info when we move on to the next statement
        comments = [];
        commentFrom = null;
        commentsStart = null;
      }
    });
  // If there are rogue statements, wrap them into a procedure
  if (intoProcedure.length != 0) {
    changes.push({
      from: procedureStart ?? state.doc.toString().length,
      to: procedureStart ?? state.doc.toString().length,
      insert: '\nto play\n' + intoProcedure.join('\n') + '\nend\n\n',
    });
  }
  // Log("CHANGES",changes)
  // Send in the changes
  Editor.Operations.ChangeCode(changes);
  // Third pass: re-introduce the snapshot
  IntegrateSnapshot(Editor, Snapshot);
  if (Parent) IntegrateSnapshot(Editor, Parent);
  // Final pass: prettify the code once again
  Editor.Semantics.PrettifyAll();
  return Editor.GetCode().trim();
}

function FixBreed(node: SyntaxNode, state: EditorState, breeds: string[]) {
  let singular = node.getChild('BreedSingular');
  let plural = node.getChild('BreedPlural');
  let invalid_sing =
    ['turtle', 'link', 'patch', ...breeds].includes(state.sliceDoc(singular?.from, singular?.to).toLowerCase()) ||
    state.sliceDoc(singular?.from, singular?.to).toLowerCase() ==
      state.sliceDoc(plural?.from, plural?.to).toLowerCase();
  let invalid_plur = ['turtles', 'links', 'patches', ...breeds].includes(
    state.sliceDoc(plural?.from, plural?.to).toLowerCase()
  );
  // console.log("BREED FIXING",singular, plural, invalid_sing, invalid_plur);
  if (singular && plural && invalid_sing && invalid_plur) {
    return {
      from: node.from,
      to: node.to,
      insert: '',
    };
  } else if (singular && invalid_sing) {
    return {
      from: singular?.from,
      to: singular?.to,
      insert: getSingularName(state.sliceDoc(plural?.from, plural?.to)),
    };
  } else if (plural && invalid_plur) {
    return {
      from: plural?.from,
      to: plural?.to,
      insert: getPluralName(state.sliceDoc(singular?.from, singular?.to)),
    };
  } else {
    return null;
  }
}

/** AddComments: Add comments to the beginning of the string.*/
function AddComments(str: string, comments: string[]) {
  if (comments.length == 0) return str;
  else return comments.join('\n') + '\n' + str;
}

/** GetReserved: Get the list of reserved words. */
function GetReserved(lintContext: LintContext): string[] {
  let all = [];
  for (let b of lintContext.Breeds.values()) {
    if (b.BreedType == BreedType.Turtle || b.BreedType == BreedType.Patch) {
      all.push('hatch-' + b.Plural);
      all.push('sprout-' + b.Plural);
      all.push('create-' + b.Plural);
      all.push('create-ordered-' + b.Plural);
      all.push(b.Plural + '-at');
      all.push(b.Plural + '-here');
      all.push(b.Plural + '-on');
      all.push('is-' + b.Singular + '?');
    } else {
      all.push('create-' + b.Plural + '-to');
      all.push('create-' + b.Singular + '-to');
      all.push('create-' + b.Plural + '-from');
      all.push('create-' + b.Singular + '-from');
      all.push('create-' + b.Plural + '-with');
      all.push('create-' + b.Singular + '-with');
      all.push('out-' + b.Singular + '-to');
      all.push('out-' + b.Singular + '-neighbors');
      all.push('out-' + b.Singular + '-neighbor?');
      all.push('in-' + b.Singular + '-from');
      all.push('in-' + b.Singular + '-neighbors');
      all.push('in-' + b.Singular + '-neighbor?');
      all.push('my-' + b.Plural);
      all.push('my-in-' + b.Plural);
      all.push('my-out-' + b.Plural);
      all.push(b.Singular + '-neighbor?');
      all.push(b.Singular + '-neighbors');
      all.push(b.Singular + '-with');
      all.push('is-' + b.Singular + '?');
    }
  }
  return all;
}
