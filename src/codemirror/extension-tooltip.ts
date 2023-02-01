import { Tooltip, showTooltip } from '@codemirror/view';
import { StateField, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Dictionary } from '../i18n/dictionary';
import { SyntaxNode } from '@lezer/common';
import { stateExtension } from './extension-state-netlogo';
import { Localized } from '../i18n/localized';

/** TooltipExtension: Extension for displaying language-specific tooltips. */
export const tooltipExtension = StateField.define<readonly Tooltip[]>({
  create: getCursorTooltips,

  update(tooltips, tr) {
    if (!tr.docChanged && !tr.selection) return tooltips;
    return getCursorTooltips(tr.state);
  },

  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});

function getCursorTooltips(state: EditorState): readonly Tooltip[] {
  var State = state.field(stateExtension);
  return state.selection.ranges
    .filter(
      (range) =>
        !range.empty &&
        state.doc.lineAt(range.from).number == state.doc.lineAt(range.to).number
    )
    .map((range) => {
      // Check what to display & if the selected range covers more than one token
      var multipleTokens = false;
      var lastFrom = 0,
        lastTo = 0;
      var closestTerm = '';
      var parentName = '';
      var secondTerm: string | null = null;
      // Iterate inside the tree
      syntaxTree(state).iterate({
        enter: (ref) => {
          if (ref.from == ref.to || ref.to == range.from) return true;
          lastFrom = ref.from;
          lastTo = ref.to;
          if (ref.to < range.to) {
            multipleTokens = true;
            return false;
          }
          // Reporters & Commands are very special
          var name = ref.name;
          if (name.indexOf('Reporter') != -1 && name.indexOf('Args') != -1)
            name = 'Reporter';
          if (name.indexOf('Command') != -1 && name.indexOf('Args') != -1)
            name = 'Command';
          // Check the category name
          if (
            closestTerm == '~BreedSingular' ||
            closestTerm == '~Arguments' ||
            closestTerm == '~ProcedureName'
          ) {
          } else if (
            Dictionary.Check(`~${name}`) ||
            Localized.Get(`~${name}`)
          ) {
            closestTerm = `~${name}`;
          } else if (
            Dictionary.Check(`~${parentName}/${name}`) ||
            Localized.Get(`~${parentName}/${name}`)
          )
            closestTerm = `~${parentName}/${name}`;

          parentName = name;
        },
        from: range.from,
        to: range.to,
      });

      // If so, we won't display tips - that's unnecessary.
      if (lastFrom == lastTo || multipleTokens) return getEmptyTooltip();

      // Check if we can directly recognize the youngest children's full-word
      const term = state.sliceDoc(lastFrom, lastTo);
      if (Dictionary.Check(term)) {
        closestTerm = term;
      } else if (state.field(stateExtension).Globals.includes(term)) {
        closestTerm = '~Globals/Identifier';
      } else if (state.field(stateExtension).WidgetGlobals.includes(term)) {
        closestTerm = '~WidgetGlobal';
      } else {
        secondTerm = State.GetBreedFromVariable(term);
        if (secondTerm != null) {
          closestTerm = '~BreedVariable';
        } else {
          if (
            closestTerm == '~VariableName' ||
            (parentName == 'Identifier' && closestTerm == '')
          ) {
            secondTerm = State.GetProcedureFromVariable(term, lastFrom, lastTo);
            if (secondTerm != null) closestTerm = '~LocalVariable';
          }
        }
      }
      if (closestTerm == '') return getEmptyTooltip();
      console.log('Term: ' + term, closestTerm, parentName);
      // Return the tooltip
      return {
        pos: range.from,
        above: false,
        strictSide: true,
        arrow: true,
        create: (view: EditorView) => {
          const dom = document.createElement('div');
          var message = Localized.Get(closestTerm, secondTerm ?? '');
          if (Dictionary.ClickHandler != null && !closestTerm.startsWith('~')) {
            message += '➤';
            dom.addEventListener('click', () => Dictionary.ClickHandler!(term));
            dom.classList.add('cm-tooltip-extendable');
          }
          dom.classList.add('cm-tooltip-explain');
          dom.innerText = message;
          return { dom };
        },
      };
    });
}

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
