import { GalapagosEditor } from '../editor';
import {
  BuildSnapshot,
  CodeSnapshot,
  IntegrateSnapshot,
} from '../lang/services/code-snapshot';
import { getSingularName } from './utils/breed-utils';
import { syntaxTree } from '@codemirror/language';
import { Log } from './utils/debug-utils';
import { LintContext } from 'src/lang/classes/contexts';
import { BreedType } from 'src/lang/classes/structures';

/** FixGeneratedCode: Try to fix and prettify the generated code. */
export function FixGeneratedCodeRegex(
  Editor: GalapagosEditor,
  Source: string,
  Parent?: CodeSnapshot
): string {
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
      var Match = Line.matchAll(
        /([^\s]*)breed\s*\[\s*([^\s]+)\s+([^\s]+)\s*\]/g
      ).next().value;
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

export function FixGeneratedCode(
  Editor: GalapagosEditor,
  Source: string,
  Parent?: CodeSnapshot
): string {
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
  let reserved = getReserved(Editor.LintContext);
  // Go over the syntax tree
  syntaxTree(state)
    .cursor()
    .iterate((noderef) => {
      //Log(noderef.name, comments);
      //check for misplaced non-global statements at the global level
      //Collect them into intoProcedure, and remove them from the code
      if (
        noderef.name == 'Misplaced' ||
        (noderef.name == 'Procedure' &&
          noderef.node.getChildren('To').length == 0)
      ) {
        Log(noderef.name, noderef.from, commentFrom, comments);
        intoProcedure.push(
          AddComments(state.sliceDoc(noderef.from, noderef.to), comments)
        );
        changes.push({
          from: commentsStart ?? noderef.from,
          to: Math.min(noderef.to + 1, state.doc.toString().length),
          insert: '',
        });
        return false;
      }
      //check for misplaced global statements
      //Move them to the top of the program
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
          insert:
            AddComments(state.sliceDoc(noderef.from, noderef.to), comments) +
            '\n',
        });
        return false;
      }
      if (noderef.name == 'Breed') {
        // Log("Breed")
        let child = noderef.node.getChild('BreedPlural');
        // Log(state.sliceDoc(child?.from??0,child?.to??0))
        if (
          child &&
          state.sliceDoc(child.from, child.to).toLowerCase() == 'turtles'
        ) {
          changes.push({
            from: commentsStart ?? noderef.from,
            to: noderef.to,
            insert: '',
          });
        }
      }
      if (noderef.name == 'Extensions') {
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
              .includes('\n' + value.toLowerCase() + ':')
          ) {
            changes.push({
              from: child.from,
              to: child.to,
              insert: '',
            });
          }
        });
      }
      if (
        noderef.name == 'SpecialCommand0Args' &&
        state.sliceDoc(noderef.from, noderef.to).toLowerCase() == 'setup'
      ) {
        let procedure = noderef.node.parent?.parent?.parent;
        let name = procedure?.getChild('ProcedureName');
        if (
          procedure?.name == 'Procedure' &&
          state.sliceDoc(name?.from, name?.to).toLowerCase() == 'go'
        ) {
          changes.push({
            from: commentsStart ?? noderef.from,
            to: noderef.to + 1,
            insert: '',
          });
        }
      }
      if (
        noderef.name == 'Procedure' &&
        noderef.node.getChildren('ProcedureContent').length == 1
      ) {
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
      } else if (
        noderef.name == 'Procedure' &&
        noderef.node.getChildren('ProcedureContent').length == 0
      ) {
        changes.push({ from: noderef.from, to: noderef.to, insert: '' });
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
      if (!procedureStart && noderef.name == 'Procedure')
        procedureStart = noderef.from;
      // Record the position of the comments
      if (noderef.name == 'LineComment') {
        //take only the one preceding comment
        comments = [state.sliceDoc(noderef.from, noderef.to)];
        commentsStart = noderef.from;
        //take all immediately preceding comments
        // comments.push(state.sliceDoc(noderef.from, noderef.to));
        // commentsStart = commentsStart ?? noderef.from;
      } else if (comments.length > 0 && !commentFrom) {
        // Record the position of what comes immediately after the comments
        // (this is in case of nesting, so we don't lose the comments)
        commentFrom = noderef.from;
      } else if (
        comments.length > 0 &&
        commentFrom &&
        noderef.from > commentFrom
      ) {
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
      insert: 'to play\n' + intoProcedure.join('\n') + '\nend\n\n',
    });
  }
  // Log("CHANGES",changes)
  // Send in the changes
  Editor.Operations.InsertCode(changes);
  // Third pass: re-introduce the snapshot
  IntegrateSnapshot(Editor, Snapshot);
  if (Parent) IntegrateSnapshot(Editor, Parent);
  // Final pass: prettify the code once again
  Editor.Semantics.PrettifyAll();
  return Editor.GetCode().trim();
}

/** AddComments: Add comments to the beginning of the string.*/
function AddComments(str: string, comments: string[]) {
  if (comments.length == 0) return str;
  else return comments.join('\n') + '\n' + str;
}

function getReserved(lintContext: LintContext) {
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
