import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { getDiagnostic, Linter } from './linter-builder';
import { SyntaxNode } from '@lezer/common';
import { ParseMode } from '../../editor-config';

/** ModeLinter: Checks if mode matches grammar. */
export const ModeLinter: Linter = (view, preprocessContext, lintContext, state) => {
  var mode = state!.Mode;
  const diagnostics: Diagnostic[] = [];
  // Check if the document is empty
  if (view.state.doc.length == 0 || mode == ParseMode.Generative) return diagnostics;
  // Get the root node
  var node = syntaxTree(view.state).cursor().node;
  if (node.name != 'Program') return diagnostics;
  // Check if the recognized mode matches the expected one
  var unexpected: SyntaxNode | null = null;
  unexpected = unexpected ?? CheckMode(node, 'OnelineReporter', mode);
  unexpected = unexpected ?? CheckMode(node, 'Embedded', mode);
  unexpected = unexpected ?? CheckMode(node, 'Normal', mode);
  if (unexpected != null) {
    diagnostics.push(getDiagnostic(view, unexpected, `Invalid for ${mode} mode _`));
    return diagnostics;
  }
  // The global statements are not allowed in oneline/embedded modes
  if (mode != ParseMode.Normal) {
    for (let name of ['Unrecognized', 'Procedure', 'Extensions', 'Globals', 'Breed', 'BreedsOwn']) {
      node.getChildren(name).map((child) => {
        diagnostics.push(getDiagnostic(view, child, `Invalid for ${mode} mode _`));
      });
    }
  }
  return diagnostics;
};

// GetMode: Get the mode node.
const GetMode = function (Node: SyntaxNode, Mode: string) {
  return Node.getChild(Mode);
};

// CheckMode: Check if the mode node matches the expected one.
const CheckMode = function (Node: SyntaxNode, Mode: string, Expected: ParseMode) {
  var Current = GetMode(Node, Mode);
  if (Current == null) return null;
  if (Expected == Mode) return null;
  if (Expected == ParseMode.Oneline && (Mode == 'OnelineReporter' || Mode == 'Embedded')) return null;
  return Current;
};
