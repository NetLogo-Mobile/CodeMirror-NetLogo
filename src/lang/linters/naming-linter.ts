import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Linter, getDiagnostic } from './linter-builder';
import { BreedType } from '../classes/structures';
import { LintContext } from '../classes/contexts';
import { getLocalVariables } from '../utils/check-identifier';
import { PrimitiveManager } from '../primitives/primitives';
import { turtleVars, patchVars, linkVars } from '../keywords';
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common';
import { removeAction } from '../utils/actions';
import { stateExtension } from 'src/codemirror/extension-state-netlogo';
import { EditorView } from 'codemirror';

let primitives = PrimitiveManager;

// NamingLinter: Ensures no duplicate breed names
export const NamingLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  let defined: string[] = [];
  let breedDefined: string[] = [];
  // Reserved keywords
  let reserved = ['turtles', 'turtle', 'patches', 'patch', 'links', 'link'];
  let reservedVars: string[] = [];
  reservedVars.push(...turtleVars);
  reservedVars.push(...patchVars);
  reservedVars.push(...linkVars);
  for (let b of lintContext.Breeds.values()) {
    if (b.BreedType == BreedType.Turtle) {
      reserved.push('hatch-' + b.Plural);
      reserved.push('sprout-' + b.Plural);
      reserved.push('create-' + b.Plural);
      reserved.push('create-ordered-' + b.Plural);
      reserved.push(b.Plural + '-at');
      reserved.push(b.Plural + '-here');
      reserved.push(b.Plural + '-on');
      reserved.push('is-' + b.Singular + '?');
    } else {
      reserved.push('create-' + b.Plural + '-to');
      reserved.push('create-' + b.Singular + '-to');
      reserved.push('create-' + b.Plural + '-from');
      reserved.push('create-' + b.Singular + '-from');
      reserved.push('create-' + b.Plural + '-with');
      reserved.push('create-' + b.Singular + '-with');
      reserved.push('out-' + b.Singular + '-to');
      reserved.push('out-' + b.Singular + '-neighbors');
      reserved.push('out-' + b.Singular + '-neighbor?');
      reserved.push('in-' + b.Singular + '-from');
      reserved.push('in-' + b.Singular + '-neighbors');
      reserved.push('in-' + b.Singular + '-neighbor?');
      reserved.push('my-' + b.Plural);
      reserved.push('my-in-' + b.Plural);
      reserved.push('my-out-' + b.Plural);
      reserved.push(b.Singular + '-neighbor?');
      reserved.push(b.Singular + '-neighbors');
      reserved.push(b.Singular + '-with');
      reserved.push('is-' + b.Singular + '?');
    }
  }
  // Used & reserved
  var NameCheck = (node: SyntaxNode | SyntaxNodeRef, type: string, extra?: string[], isBreed: boolean = false) => {
    const value = view.state.sliceDoc(node.from, node.to).toLowerCase();
    // For breeds, we ignore other breed variables since you can re-define them in NetLogo
    if (defined.includes(value) || extra?.includes(value) || (!isBreed && breedDefined.includes(value))) {
      diagnostics.push(getDiagnostic(view, node, 'Term _ already used', 'error', value, type));
    } else if (reservedVars.includes(value)) {
      if (type.includes('variable')) {
        diagnostics.push(removeAction(getDiagnostic(view, node, 'Variable _ reserved', 'error', value, type)));
      } else {
        diagnostics.push(getDiagnostic(view, node, 'Term _ reserved', 'error', value, type));
      }
    } else if (reserved.includes(value) || primitives.GetNamedPrimitive(value)) {
      diagnostics.push(getDiagnostic(view, node, 'Term _ reserved', 'error', value, type));
    } else {
      if (extra) extra.push(value);
      else {
        defined.push(value);
      }
    }
  };
  if (view.state.field(stateExtension).EditorID != 0) {
    syntaxTree(view.state)
      .cursor()
      .iterate((noderef) => {
        if (noderef.name == 'NewVariableDeclaration') {
          // TODO: Optimize it so that whenever we see a procedure, we check the local variables
          // Now, for each new variable declaration, we look back again
          // It would also solve the issue of arguments & local variables using the same name
          // Since the new variable definition is typically few, not a high priority
          let child = noderef.node.getChild('Identifier') ?? noderef.node.getChild('UnsupportedPrim');
          if (!child) return;
          let localvars = [
            ...lintContext.Globals.keys(),
            ...lintContext.WidgetGlobals.keys(),
            ...lintContext.Procedures.keys(),
            ...lintContext.Breeds.keys(),
            ...lintContext.Extensions.keys(),
            ...getLocalVariables(child, view.state, lintContext),
          ];
          NameCheck(child, 'Local variable', localvars);
        }
      });
  } else {
    // Go through the syntax tree
    syntaxTree(view.state)
      .cursor()
      .iterate((noderef) => {
        if (noderef.name == 'BreedSingular' || noderef.name == 'BreedPlural') {
          NameCheck(noderef, 'Breed');
        } else if (noderef.name == 'Identifier' && noderef.node.parent?.name == 'Globals') {
          NameCheck(noderef, 'Global variable');
        } else if (noderef.name == 'ProcedureName') {
          const value = view.state.sliceDoc(noderef.from, noderef.to).toLowerCase();
          if (noderef.node.parent?.getChildren('To').length == 0) {
            diagnostics.push(getDiagnostic(view, noderef, 'Unrecognized global statement _', 'error'));
          } else {
            NameCheck(noderef, 'Procedure');
          }
        } else if (noderef.name == 'BreedsOwn') {
          let own = noderef.node.getChild('Own');
          let breedvars: string[] = [];
          if (!own) return;
          let breedName = view.state.sliceDoc(own.from, own.to).toLowerCase();
          breedName = breedName.substring(0, breedName.length - 4);
          noderef.node.getChildren('Identifier').map((child) => {
            if (breedName == 'turtles') {
              NameCheck(child, 'Turtle variable');
            } else if (breedName == 'links') {
              NameCheck(child, 'Link variable');
            } else if (breedName == 'patches') {
              NameCheck(child, 'Patch variable');
            } else if (isLinkBreed(breedName, lintContext)) {
              NameCheck(child, 'Link variable', breedvars, true);
            } else {
              NameCheck(child, 'Turtle variable', breedvars, true);
            }
          });
          breedDefined.push(...breedvars);
        } else if (noderef.name == 'NewVariableDeclaration' || noderef.name == 'SetVariable') {
          // TODO: Optimize it so that whenever we see a procedure, we check the local variables
          // Now, for each new variable declaration, we look back again
          // It would also solve the issue of arguments & local variables using the same name
          // Since the new variable definition is typically few, not a high priority
          //let child = noderef.node.getChild('Identifier') ?? noderef.node.getChild('UnsupportedPrim');
          // console.log(view.state.sliceDoc(noderef.from,noderef.to),getChildren(noderef.node,view))
          let child = noderef.node.firstChild?.nextSibling;
          if (!child) return;
          if (child.name.includes('Reporter') || child.name.includes('Command')) {
            const value = view.state.sliceDoc(child.from, child.to).toLowerCase();
            diagnostics.push(getDiagnostic(view, child, 'Term _ reserved', 'error', value, 'Local variable'));
          } else if (noderef.name == 'NewVariableDeclaration') {
            let localvars = getLocalVariables(child, view.state, lintContext);
            NameCheck(child, 'Local variable', localvars);
          }
        } else if (noderef.name == 'Arguments') {
          let current: string[] = [];
          if (noderef.node.parent?.name == 'AnonArguments') {
            let parent = noderef.node.parent.parent;
            if (parent) {
              let prev_node = parent?.cursor().moveTo(parent.from - 2).node;
              current = getLocalVariables(prev_node, view.state, lintContext);
            }
          }
          for (var key of ['Identifier', 'UnsupportedPrim']) {
            noderef.node.getChildren(key).map((child) => {
              NameCheck(child, 'Argument', current);
            });
          }
        }
      });
  }
  return diagnostics;
};

const getChildren = (node: SyntaxNode, view: EditorView) => {
  let children: string[] = [];
  let values: string[] = [];
  let cursor = node.cursor();
  if (cursor.firstChild()) {
    children.push(cursor.node.name);
    values.push(view.state.sliceDoc(cursor.from, cursor.to));
    while (cursor.nextSibling()) {
      children.push(cursor.node.name);
      values.push(view.state.sliceDoc(cursor.from, cursor.to));
    }
  }
  return [children, values];
};

const isLinkBreed = (breedName: string, lintContext: LintContext) => {
  for (var [name, breed] of lintContext.Breeds) {
    if (breed.Plural.toLowerCase() == breedName.toLowerCase()) {
      return breed.BreedType == BreedType.DirectedLink || breed.BreedType == BreedType.UndirectedLink;
    }
  }
  return null;
};
