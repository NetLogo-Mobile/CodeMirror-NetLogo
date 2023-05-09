import { GalapagosEditor } from '../editor';
import {
  BuildSnapshot,
  CodeSnapshot,
  IntegrateSnapshot,
} from '../lang/services/code-snapshot';
import { getSingularName } from './utils/breed-utils';
import { syntaxTree } from '@codemirror/language';
import { Log } from './utils/debug-utils';

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
  // Go over the syntax tree
  syntaxTree(state)
    .cursor()
    .iterate((noderef) => {
      Log(noderef.name, comments);
      //check for misplaced non-global statements at the global level
      //Collect them into intoProcedure, and remove them from the code
      if (noderef.name == '⚠' && noderef.node.parent?.name == 'Normal') {
        Log(noderef.name, noderef.from, commentFrom, comments);
        intoProcedure.push(
          AddComments(state.sliceDoc(noderef.from, noderef.to), comments)
        );
        changes.push({
          from: commentsStart ?? noderef.from,
          to: noderef.to + 1,
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
      from: procedureStart ?? 0,
      to: procedureStart ?? 0,
      insert: 'to play\n' + intoProcedure.join('\n') + '\nend\n\n',
    });
  }
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
