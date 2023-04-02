import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { buildLinter } from './linter-builder';
import { SyntaxNode } from '@lezer/common';
import { ParseMode } from '../../editor-config';

/** ModeLinter: Checks if mode matches grammar. */
export const ModeLinter = buildLinter((view, parseState) => {
  const diagnostics: Diagnostic[] = [];
  if (view.state.doc.length == 0) return diagnostics;
  var node = syntaxTree(view.state).cursor().node;
  if (node.name != 'Program') return diagnostics;
  // Check the oneline/embedded modes
  var Unexpected = CheckMode(node, 'OnelineReporter', parseState.Mode);
  Unexpected = Unexpected ?? CheckMode(node, 'Embedded', parseState.Mode);
  Unexpected = Unexpected ?? CheckMode(node, 'Normal', parseState.Mode);
  if (Unexpected != null) {
    let value = view.state.sliceDoc(Unexpected.from, Unexpected.to);
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: 'error',
      message: Localized.Get(`Invalid for ${parseState.Mode} mode _`, value),
    });
    return diagnostics;
  }
  // Check the normal mode
  if (
    node.getChildren('Unrecognized').length > 0 ||
    node.getChildren('Procedure').length > 0 ||
    node.getChildren('Extensions').length > 0 ||
    node.getChildren('Globals').length > 0 ||
    node.getChildren('Breed').length > 0 ||
    node.getChildren('BreedsOwn').length > 0
  ) {
    if (parseState.Mode != 'Normal') {
      for (let name of [
        'Unrecognized',
        'Procedure',
        'Extensions',
        'Globals',
        'Breed',
        'BreedsOwn',
      ]) {
        node.getChildren(name).map((child) => {
          let value = view.state.sliceDoc(child.from, child.to);
          diagnostics.push({
            from: node.from,
            to: node.to,
            severity: 'error',
            message: Localized.Get('Unrecognized global statement _', value),
          });
        });
      }
    }
  }
  return diagnostics;
});

// GetMode: Get the mode node.
const GetMode = function (Node: SyntaxNode, Mode: string) {
  return Node.getChild(Mode);
};

// CheckMode: Check if the mode node matches the expected one.
const CheckMode = function (
  Node: SyntaxNode,
  Mode: string,
  Expected: ParseMode
) {
  var Current = GetMode(Node, Mode);
  if (Current == null) return null;
  if (Expected == Mode) return null;
  if (
    Expected == 'Oneline' &&
    (Mode == 'OnelineReporter' || Mode == 'Embedded')
  )
    return null;
  return Current;
};
