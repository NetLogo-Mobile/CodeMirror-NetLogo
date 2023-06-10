import { SyntaxNode } from '@lezer/common';
import { EditorState } from '@codemirror/state';

/* getCodeName: Gets the lower-case, trimmed text (name) from a node. */
export const getCodeName = function (State: EditorState, Node: SyntaxNode) {
  return State.sliceDoc(Node.from, Node.to).trim().toLowerCase();
};

/* getParentProcedure: Gets the name of the procedure the identifier is in. */
export const getParentProcedure = function (State: EditorState, Node: SyntaxNode) {
  let curr_node = Node;
  while (curr_node.parent) {
    curr_node = curr_node.parent;
    if (curr_node.name == 'Procedure') {
      var children = curr_node.getChildren('ProcedureName');
      if (children.length > 0) return getCodeName(State, children[0]);
    }
  }
  return undefined;
};
