import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter, getDiagnostic } from './linter-builder';
import { BreedType } from '../classes/structures';
import { LintContext } from '../classes/contexts';
import { getLocalVars } from './utils/check-identifier';
import { PrimitiveManager } from '../primitives/primitives';
import { turtleVars, patchVars, linkVars } from '../keywords';
import { SyntaxNode, SyntaxNodeRef } from '@lezer/common';

let primitives = PrimitiveManager;

// NamingLinter: Ensures no duplicate breed names
export const NamingLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  let all: string[] = [];
  // Reserved keywords
  let reserved = ['turtles', 'turtle', 'patches', 'patch', 'links', 'link'];
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
  // Seen variables
  let seen: string[] = [];
  let link_vars: string[] = [];
  let turtle_vars: string[] = [];
  let patch_vars: string[] = [];
  let other_vars: string[] = [];
  // Used & reserved
  var NameCheck = (node: SyntaxNode | SyntaxNodeRef, type: string, extra?: string[]) => {
    const value = view.state.sliceDoc(node.from, node.to).toLowerCase();
    if (all.includes(value) || extra?.includes(value)) {
      diagnostics.push(getDiagnostic(view, node, 'Term _ already used', 'error', value, type));
    } else if (
      reserved.includes(value) ||
      primitives.GetNamedPrimitive(value)
    ) {
      diagnostics.push(getDiagnostic(view, node, 'Term _ reserved', 'error', value, type));
    }
    if (extra) extra.push(value);
    else {
      all.push(value);
      seen.push(value);
    }
  }
  // Go through the syntax tree
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name == 'BreedSingular' || noderef.name == 'BreedPlural') {
        NameCheck(noderef, 'Breed');
      } else if (
        noderef.name == 'Identifier' &&
        noderef.node.parent?.name == 'Globals'
      ) {
        NameCheck(noderef, 'Global variable');
      } else if (noderef.name == 'ProcedureName') {
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        if (noderef.node.parent?.getChildren('To').length == 0) {
          diagnostics.push(getDiagnostic(view, noderef, 'Unrecognized global statement _', 'error'));
        } else {
          NameCheck(noderef, 'Procedure name');
        }
      } else if (noderef.name == 'BreedsOwn') {
        let own = noderef.node.getChild('Own');
        let internal_vars: string[] = [];
        if (!own) return;
        let breedName = view.state.sliceDoc(own.from, own.to).toLowerCase();
        breedName = breedName.substring(0, breedName.length - 4);
        if (
          breedName == 'turtles' ||
          isLinkBreed(breedName, lintContext) == false
        ) {
          noderef.node.getChildren('Identifier').map((child) => {
            let name = view.state.sliceDoc(child.from, child.to);
            if (
              turtle_vars.includes(name) ||
              seen.includes(name) ||
              internal_vars.includes(name)
            ) {
              diagnostics.push({
                from: child.from,
                to: child.to,
                severity: 'error',
                message: Localized.Get(
                  'Term _ already used',
                  name,
                  'breed variable'
                ),
              });
            } else if (
              reserved.includes(name) ||
              primitives.GetNamedPrimitive(name) ||
              turtleVars.includes(name)
            ) {
              diagnostics.push({
                from: child.from,
                to: child.to,
                severity: 'error',
                message: Localized.Get(
                  'Term _ reserved',
                  name,
                  'breed variable'
                ),
              });
            }
            internal_vars.push(name);
            all.push(name);
            if (breedName == 'turtles') {
              turtle_vars.push(name);
            } else {
              other_vars.push(name);
            }
          });
        } else if (
          breedName == 'links' ||
          isLinkBreed(breedName, lintContext) == true
        ) {
          noderef.node.getChildren('Identifier').map((child) => {
            let name = view.state.sliceDoc(child.from, child.to);
            if (
              link_vars.includes(name) ||
              seen.includes(name) ||
              internal_vars.includes(name)
            ) {
              diagnostics.push({
                from: child.from,
                to: child.to,
                severity: 'error',
                message: Localized.Get(
                  'Term _ already used',
                  name,
                  'breed variable'
                ),
              });
            } else if (
              reserved.includes(name) ||
              primitives.GetNamedPrimitive(name) ||
              linkVars.includes(name)
            ) {
              diagnostics.push({
                from: child.from,
                to: child.to,
                severity: 'error',
                message: Localized.Get(
                  'Term _ reserved',
                  name,
                  'breed variable'
                ),
              });
            }
            internal_vars.push(name);
            all.push(name);
            if (breedName == 'links') {
              link_vars.push(name);
            } else {
              other_vars.push(name);
            }
          });
        } else if (breedName == 'patches') {
          noderef.node.getChildren('Identifier').map((child) => {
            let name = view.state.sliceDoc(child.from, child.to);
            if (
              patch_vars.includes(name) ||
              seen.includes(name) ||
              internal_vars.includes(name)
            ) {
              diagnostics.push({
                from: child.from,
                to: child.to,
                severity: 'error',
                message: Localized.Get(
                  'Term _ already used',
                  name,
                  'breed variable'
                ),
              });
            } else if (
              reserved.includes(name) ||
              primitives.GetNamedPrimitive(name) ||
              patchVars.includes(name)
            ) {
              diagnostics.push({
                from: child.from,
                to: child.to,
                severity: 'error',
                message: Localized.Get(
                  'Term _ reserved',
                  name,
                  'breed variable'
                ),
              });
            }
            all.push(name);
            internal_vars.push(name);
            patch_vars.push(name);
          });
        }
      } else if (noderef.name == 'NewVariableDeclaration') {
        let child =
          noderef.node.getChild('Identifier') ??
          noderef.node.getChild('UnsupportedPrim');
        if (!child) return;
        let local_vars = getLocalVars(child, view.state, lintContext);
        NameCheck(noderef, 'Local variable', local_vars);
      } else if (noderef.name == 'Arguments') {
        let current: string[] = [];
        for (var key of ['Identifier', 'UnsupportedPrim']) {
          noderef.node.getChildren(key).map((child) => {
            NameCheck(child, 'Argument', current);
          });
        }
      }
    });
  return diagnostics;
};

const isLinkBreed = (breedName: string, lintContext: LintContext) => {
  for (var [name, breed] of lintContext.Breeds) {
    if (breed.Plural.toLowerCase() == breedName.toLowerCase()) {
      return (
        breed.BreedType == BreedType.DirectedLink ||
        breed.BreedType == BreedType.UndirectedLink
      );
    }
  }
  return null;
};