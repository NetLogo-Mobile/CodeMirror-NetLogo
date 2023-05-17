import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter } from './linter-builder';
import { BreedType } from '../classes/structures';
import { LintContext } from '../classes/contexts';
import { getLocalVars } from './utils/check-identifier';

// NamingLinter: Ensures no duplicate breed names
export const NamingLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];
  let all: string[] = [
    'turtles',
    'turtle',
    'patches',
    'patch',
    'links',
    'link',
  ];
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
            message: Localized.Get('Term _ already used.', value),
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
            message: Localized.Get('Term _ already used.', value),
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
            message: Localized.Get('Term _ already used.', value),
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
                  message: Localized.Get('Term _ already used.', name),
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
                  message: Localized.Get('Term _ already used.', name),
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
                  message: Localized.Get('Term _ already used.', name),
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
              message: Localized.Get('Term _ already used.', name),
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
                message: Localized.Get('Term _ already used.', name),
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
