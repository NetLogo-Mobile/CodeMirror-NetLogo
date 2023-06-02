import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
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
  let seen: string[] = [];
  let link_vars: string[] = [];
  let turtle_vars: string[] = [];
  let patch_vars: string[] = [];
  let other_vars: string[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((noderef) => {
      if (noderef.name == 'BreedSingular' || noderef.name == 'BreedPlural') {
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        if (all.includes(value)) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Term _ already used.', value, 'breed name'),
          });
        } else if (
          reserved.includes(value) ||
          primitives.GetNamedPrimitive(value)
        ) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Term _ reserved.', value, 'breed name'),
          });
        }
        seen.push(value);
        all.push(value);
      } else if (
        noderef.name == 'Identifier' &&
        noderef.node.parent?.name == 'Globals'
      ) {
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        if (all.includes(value)) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Term _ already used.', value, 'global'),
          });
        } else if (
          reserved.includes(value) ||
          primitives.GetNamedPrimitive(value)
        ) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Term _ reserved.', value, 'global'),
          });
        }
        seen.push(value);
        all.push(value);
      } else if (noderef.name == 'ProcedureName') {
        const value = view.state
          .sliceDoc(noderef.from, noderef.to)
          .toLowerCase();
        if (noderef.node.parent?.getChildren('To').length == 0) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Unrecognized global statement _', value),
          });
        } else if (all.includes(value)) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get(
              'Term _ already used.',
              value,
              'procedure name'
            ),
          });
        } else if (
          reserved.includes(value) ||
          primitives.GetNamedPrimitive(value)
        ) {
          diagnostics.push({
            from: noderef.from,
            to: noderef.to,
            severity: 'error',
            message: Localized.Get('Term _ reserved.', value, 'procedure name'),
          });
        }
        seen.push(value);
        all.push(value);
      } else if (noderef.name == 'BreedsOwn') {
        let own = noderef.node.getChild('Own');
        let internal_vars: string[] = [];
        if (own) {
          let breedName = view.state.sliceDoc(own.from, own.to).toLowerCase();
          breedName = breedName.substring(0, breedName.length - 4);
          if (
            breedName == 'turtles' ||
            getBreedType(breedName, lintContext) == false
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
                    'Term _ already used.',
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
                    'Term _ reserved.',
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
            getBreedType(breedName, lintContext) == true
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
                    'Term _ already used.',
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
                    'Term _ reserved.',
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
                    'Term _ already used.',
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
                    'Term _ reserved.',
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
        }
      } else if (noderef.name == 'NewVariableDeclaration') {
        let child =
          noderef.node.getChild('Identifier') ??
          noderef.node.getChild('UnsupportedPrim');
        if (child) {
          let local_vars = getLocalVars(child, view.state, lintContext);
          let name = view.state.sliceDoc(child.from, child.to);
          if (all.includes(name) || local_vars.includes(name)) {
            diagnostics.push({
              from: child.from,
              to: child.to,
              severity: 'error',
              message: Localized.Get(
                'Term _ already used.',
                name,
                'local variable'
              ),
            });
          } else if (
            reserved.includes(name) ||
            primitives.GetNamedPrimitive(name)
          ) {
            diagnostics.push({
              from: child.from,
              to: child.to,
              severity: 'error',
              message: Localized.Get(
                'Term _ reserved.',
                name,
                'local variable'
              ),
            });
          }
        }
      } else if (noderef.name == 'Arguments') {
        let current: string[] = [];
        for (var key of ['Identifier', 'UnsupportedPrim']) {
          noderef.node.getChildren(key).map((child) => {
            let name = view.state.sliceDoc(child.from, child.to);
            if (current.includes(name) || all.includes(name)) {
              diagnostics.push({
                from: child.from,
                to: child.to,
                severity: 'error',
                message: Localized.Get(
                  'Term _ already used.',
                  name,
                  'argument'
                ),
              });
            } else if (
              reserved.includes(name) ||
              primitives.GetNamedPrimitive(name)
            ) {
              diagnostics.push({
                from: child.from,
                to: child.to,
                severity: 'error',
                message: Localized.Get('Term _ reserved.', name, 'argument'),
              });
            }
            current.push(name);
          });
        }
      }
    });
  return diagnostics;
};

const getBreedType = (breedName: string, lintContext: LintContext) => {
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

const getErrorMsg = (
  value: string,
  node: SyntaxNode | SyntaxNodeRef,
  type: string,
  custom: boolean
) => {
  let msg = null;
  if (custom) {
    msg = Localized.Get('Term _ already used.', value, type);
  } else {
    msg = Localized.Get('Term _ is reserved.', value, type);
  }
  return {
    from: node.from,
    to: node.to,
    severity: 'error',
    message: msg,
  };
};
