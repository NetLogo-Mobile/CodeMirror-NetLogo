import { Tooltip, showTooltip } from '@codemirror/view';
import { StateField, EditorState } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { Dictionary } from '../i18n/dictionary';
import { SyntaxNode } from '@lezer/common';

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
  var Result = state.selection.ranges
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
          if (name.indexOf('Reporter') != -1 && name.endsWith('Args'))
            name = 'Reporter';
          if (name.indexOf('Command') != -1 && name.endsWith('Args'))
            name = 'Command';
          // Check the category name
          if (Dictionary.Check(`~${name}`)) closestTerm = `~${name}`;
          else if (Dictionary.Check(`~${parentName}/${name}`))
            closestTerm = `~${parentName}/${name}`;
          else console.log(name);
          parentName = name;
        },
        from: range.from,
        to: range.to,
      });
      // If so, we won't display tips - that's unnecessary.
      if (lastFrom == lastTo || multipleTokens) return null;
      // Check if we can directly recognize the youngest children's full-word
      const term = state.sliceDoc(lastFrom, lastTo);
      console.log('Term: ' + term);
      if (Dictionary.Check(term)) closestTerm = term;
      if (closestTerm == '') return null;
      // TODO: We can still match more, esp. things defined in the model (StateNetLogo).
      // Return the tooltip
      return {
        pos: range.from,
        above: false,
        strictSide: true,
        arrow: true,
        create: () => {
          const dom = document.createElement('div');
          var message = Dictionary.Get(closestTerm, term);
          if (Dictionary.ClickHandler != null && !closestTerm.startsWith('~')) {
            message += '???';
            dom.addEventListener('click', () => Dictionary.ClickHandler!(term));
            dom.classList.add('cm-tooltip-extendable');
          }
          dom.classList.add('cm-tooltip-explain');
          dom.innerText = message;
          return { dom };
        },
      };
    })
    .filter((tooltip) => tooltip != null);
  return Result as any; // Hacky!
}
