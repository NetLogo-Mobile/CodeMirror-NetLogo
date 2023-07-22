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
import { GetAllBreedPrimitives } from '../parsers/breed';
import { getCodeName } from '../utils/code';
import { ParseMode } from '../../editor-config';

let primitives = PrimitiveManager;

// NamingLinter: Ensures no duplicate breed names
export const NamingLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  let defined: string[] = [];
  let breedDefined: string[] = [];
  // Reserved keywords
  let reserved = ['turtles', 'turtle', 'patches', 'patch', 'links', 'link'];
  let reservedVars: string[] = GetAllBreedPrimitives(lintContext);
  reservedVars.push(...turtleVars);
  reservedVars.push(...patchVars);
  reservedVars.push(...linkVars);
  // Used & reserved
  var NameCheck = (node: SyntaxNode | SyntaxNodeRef, type: string, extra?: string[], isBreed: boolean = false) => {
    const value = getCodeName(view.state, node);
    // For breeds, we ignore other breed variables since you can re-define them in NetLogo
    if (defined.includes(value) || extra?.includes(value) || (!isBreed && breedDefined.includes(value))) {
      diagnostics.push(getDiagnostic(view, node, 'Term _ already used', 'error', value, type));
    } else if (reservedVars.includes(value)) {
      if (type.includes('variable')) {
        if (type != 'Local variable')
          diagnostics.push(removeAction(getDiagnostic(view, node, 'Variable _ reserved', 'error', value, type)));
        else diagnostics.push(getDiagnostic(view, node, 'Variable _ reserved', 'error', value, type));
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
  var Mode = view.state.field(stateExtension).Mode;
  if (Mode != ParseMode.Normal && Mode != ParseMode.Generative) {
    defined.push(...lintContext.GetDefined());
    syntaxTree(view.state)
      .cursor()
      .iterate((noderef) => {
        if (noderef.name == 'NewVariableDeclaration') {
          let child = noderef.node.getChild('Identifier') ?? noderef.node.getChild('UnsupportedPrim');
          if (!child) return;
          let localvars = getLocalVariables(child, view.state, lintContext);
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
          if (noderef.node.parent?.getChildren('To').length == 0) {
            diagnostics.push(getDiagnostic(view, noderef, 'Unrecognized global statement _', 'error'));
          } else {
            NameCheck(noderef, 'Procedure');
          }
        } else if (noderef.name == 'BreedsOwn') {
          let own = noderef.node.getChild('Own');
          let breedvars: string[] = [];
          if (!own) return;
          let breedName = getCodeName(view.state, noderef);
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
          let child = noderef.node.firstChild?.nextSibling;
          if (!child) return;
          if (child.name.includes('Reporter') || child.name.includes('Command')) {
            const value = getCodeName(view.state, child);
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

const isLinkBreed = (breedName: string, lintContext: LintContext) => {
  for (var [name, breed] of lintContext.Breeds) {
    if (breed.Plural.toLowerCase() == breedName.toLowerCase()) {
      return breed.BreedType == BreedType.DirectedLink || breed.BreedType == BreedType.UndirectedLink;
    }
  }
  return null;
};
