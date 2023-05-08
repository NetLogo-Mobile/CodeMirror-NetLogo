import { GalapagosEditor } from '../editor';
import {
  BuildSnapshot,
  CodeSnapshot,
  IntegrateSnapshot,
} from '../lang/services/code-snapshot';
import { getSingularName } from './utils/breed-utils';

/** FixGeneratedCode: Try to fix and prettify the generated code. */
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
    } else if (Line.startsWith('globals [')) {
      // If the line is a globals declaration, keep the position only when it is outside procedures
      if (!InProcedure) NewLines.push('globals []');
      else if (LastIsComment) NewLines.pop();
    } else if (Line.startsWith('extensions [')) {
      // If the line is a extensions declaration, keep the position only when it is outside procedures
      if (!InProcedure) NewLines.push('extensions []');
      else if (LastIsComment) NewLines.pop();
    } else if (Line.startsWith('breed [')) {
      // If the line is a breed declaration, try to get the name and fix the singular issue
      var Match = Line.matchAll(/breed\s*\[\s*([^\s]+)\s+([^\s]+)\s*\]/g).next()
        .value;
      if (Match) {
        var Plural = Match[1];
        var Singular = Match[2];
        if (Plural == Singular) Singular = getSingularName(Plural);
        if (!InProcedure) NewLines.push(`breed [ ${Plural} ${Singular}] `);
        else if (LastIsComment) NewLines.pop();
      } else if (LastIsComment) NewLines.pop();
    } else {
      // If the line is a breeds-own declaration, remove the contents
      var Match = Line.matchAll(/([^\s]+)-own\s*\[([^\]]+)/g).next().value;
      if (Match) {
        var Name = Match[1];
        if (!InProcedure) NewLines.push(`${Name}-own []`);
        else if (LastIsComment) NewLines.pop();
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
