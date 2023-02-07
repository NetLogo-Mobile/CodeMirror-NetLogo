import { syntaxTree } from '@codemirror/language';
import { Tooltip, hoverTooltip, EditorView } from '@codemirror/view';
import { Localized } from '../i18n/localized';
import { Dictionary } from '../i18n/dictionary';
import { stateExtension } from './extension-state-netlogo';

export const hoverExtension = hoverTooltip((view: EditorView, pos, side) => {
  let node = syntaxTree(view.state).cursorAt(pos).node;
  let closestTerm = '';
  let parents: string[] = [];
  let temp_node = node;
  let term = view.state.sliceDoc(node.from, node.to);
  var secondTerm: string | null = null;

  while (temp_node.parent) {
    parents.push(temp_node.parent.name);
    temp_node = temp_node.parent;
  }
  if (Localized.Get(`~${node.name}`) || Dictionary.Check(`~${node.name}`)) {
    closestTerm = `~${node.name}`;
  } else if (
    node.parent &&
    (Localized.Get(`~${node.parent.name}/${node.name}`) ||
      Dictionary.Check(`~${node.parent.name}/${node.name}`))
  ) {
    closestTerm = `~${node.parent.name}/${node.name}`;
  } else if (parents.includes('BreedSingular')) {
    closestTerm = '~BreedSingular';
  } else if (parents.includes('Arguments')) {
    closestTerm = '~Arguments';
  } else if (parents.includes('ProcedureName')) {
    closestTerm = '~ProcedureName';
  } else if (view.state.field(stateExtension).Globals.includes(term)) {
    closestTerm = '~Globals/Identifier';
  } else if (view.state.field(stateExtension).WidgetGlobals.includes(term)) {
    closestTerm = '~WidgetGlobal';
  } else if (
    node.name.indexOf('Reporter') != -1 &&
    node.name.indexOf('Args') != -1
  ) {
    closestTerm = '~Reporter';
  } else if (
    node.name.indexOf('Command') != -1 &&
    node.name.indexOf('Args') != -1
  ) {
    closestTerm = '~Command';
  } else if (view.state.field(stateExtension).GetBreedNames().includes(term)) {
    let breeds = view.state.field(stateExtension).GetBreeds();
    let plurals: string[] = [];
    let singular: string[] = [];
    for (let b of breeds) {
      plurals.push(b.Plural);
      singular.push(b.Singular);
    }
    if (plurals.includes(term)) {
      closestTerm = '~BreedPlural';
    } else {
      closestTerm = '~BreedSingular';
    }
  } else {
    secondTerm = view.state.field(stateExtension).GetBreedFromVariable(term);
    if (secondTerm != null) {
      closestTerm = '~BreedVariable';
    } else {
      if (
        closestTerm == '~VariableName' ||
        node.name == 'Identifier' ||
        (parents.includes('Identifier') && closestTerm == '')
      ) {
        secondTerm = view.state
          .field(stateExtension)
          .GetProcedureFromVariable(term, node.from, node.to);
        if (secondTerm != null) closestTerm = '~LocalVariable';
      }
    }
  }
  // console.log(term,node.name,closestTerm,parents)
  if (closestTerm == '') return getEmptyTooltip();

  return {
    pos: node.from,
    end: node.to,
    above: false,
    arrow: true,
    strictSide: true,
    create(view) {
      let dom = document.createElement('div');
      dom.classList.add('cm-tooltip-explain');
      dom.innerText = Localized.Get(closestTerm, secondTerm ?? '');
      return { dom };
    },
  };
});

/** getEmptyTooltip: Get an empty tooltip. */
function getEmptyTooltip() {
  return {
    pos: 0,
    above: false,
    strictSide: true,
    arrow: false,
    create: (view: EditorView) => {
      const dom = document.createElement('div');
      return { dom };
    },
  };
}
