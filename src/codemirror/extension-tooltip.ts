import { DecorationSet, hoverTooltip } from '@codemirror/view';
import { Diagnostic, Action } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { GalapagosEditor } from '../editor';
import { getLintState } from '../lang/linters/linter-builder';
import elt from 'crelt';
import { getTooltip } from '../lang/tooltip';
import { explainAction } from '../lang/utils/actions';

/** buildToolTips: Extension for displaying language-specific & linting tooltips. */
export const buildToolTips = (Editor: GalapagosEditor) => {
  return hoverTooltip((view, pos, side) => {
    return getTooltips(view, pos, side, Editor);
  });
};

/** getTooltips: Build the tooltip for both linting and language tips.  */
function getTooltips(view: EditorView, pos: number, side: -1 | 1, editor: GalapagosEditor) {
  var diagnostics = getLintState(view.state).diagnostics as DecorationSet;
  let found: Diagnostic[] = [],
    stackStart = 2e8,
    stackEnd = 0;
  // Find all diagnostics that touch this point
  diagnostics.between(pos - (side < 0 ? 1 : 0), pos + (side > 0 ? 1 : 0), (from, to, { spec }) => {
    if (pos >= from && pos <= to && (from == to || ((pos > from || side > 0) && (pos < to || side < 0)))) {
      var diagnostic = spec.diagnostic as Diagnostic;
      diagnostic.actions = diagnostic.actions ?? [];
      if (diagnostic.actions.length === 0 && editor.Options.OnExplain)
        explainAction(diagnostic, editor.Options.OnExplain);
      found.push(diagnostic);
      stackStart = Math.min(from, stackStart);
      stackEnd = Math.max(to, stackEnd);
    }
  });
  // If there are none, try to find a proper tooltip
  if (found.length == 0) {
    var tooltip = getTooltip(view, pos, pos, editor);
    if (!tooltip) return null;
    stackStart = tooltip.from;
    stackEnd = tooltip.to;
    found.push(tooltip);
  }
  // Build up the tooltip DOM element
  return {
    pos: stackStart,
    end: stackEnd,
    above: view.state.doc.lineAt(stackStart).to < stackEnd,
    create() {
      return { dom: diagnosticsTooltip(view, found) };
    },
  };
}

// The following code is copied from CodeMirror, as they do not allow us to go deeper into diagnostics generation.
function diagnosticsTooltip(view: EditorView, diagnostics: readonly Diagnostic[]) {
  return elt(
    'ul',
    { class: 'cm-tooltip-lint' },
    diagnostics.map((d) => renderDiagnostic(view, d, false))
  );
}

function assignKeys(actions: readonly Action[] | undefined) {
  let assigned: string[] = [];
  if (actions)
    actions: for (let { name } of actions) {
      for (let i = 0; i < name.length; i++) {
        let ch = name[i];
        if (/[a-zA-Z]/.test(ch) && !assigned.some((c) => c.toLowerCase() == ch.toLowerCase())) {
          assigned.push(ch);
          continue actions;
        }
      }
      assigned.push('');
    }
  return assigned;
}

function renderDiagnostic(view: EditorView, diagnostic: Diagnostic, inPanel: boolean) {
  let keys = inPanel ? assignKeys(diagnostic.actions) : [];
  return elt(
    'li',
    { class: 'cm-diagnostic cm-diagnostic-' + diagnostic.severity },
    elt(
      'span',
      { class: 'cm-diagnosticText' },
      diagnostic.renderMessage ? diagnostic.renderMessage() : diagnostic.message
    ),
    diagnostic.actions?.map((action, i) => {
      let fired = false,
        click = (e: Event) => {
          e.preventDefault();
          if (fired) return;
          fired = true;
          let found = findDiagnostic(getLintState(view.state).diagnostics, diagnostic);
          if (found) action.apply(view, found.from, found.to);
        };
      let { name } = action,
        keyIndex = keys[i] ? name.indexOf(keys[i]) : -1;
      let nameElt =
        keyIndex < 0
          ? name
          : [name.slice(0, keyIndex), elt('u', name.slice(keyIndex, keyIndex + 1)), name.slice(keyIndex + 1)];
      return elt(
        'button',
        {
          type: 'button',
          class: 'cm-diagnosticAction',
          onclick: click,
          onmousedown: click,
          'aria-label': ` Action: ${name}${keyIndex < 0 ? '' : ` (access key "${keys[i]})"`}.`,
        },
        nameElt
      );
    }),
    diagnostic.source && elt('div', { class: 'cm-diagnosticSource' }, diagnostic.source)
  );
}

function findDiagnostic(
  diagnostics: DecorationSet,
  diagnostic: Diagnostic | null = null,
  after = 0
): SelectedDiagnostic | null {
  let found: SelectedDiagnostic | null = null;
  diagnostics.between(after, 1e9, (from, to, { spec }) => {
    if (diagnostic && spec.diagnostic != diagnostic) return;
    found = new SelectedDiagnostic(from, to, spec.diagnostic);
    return false;
  });
  return found;
}

class SelectedDiagnostic {
  constructor(
    readonly from: number,
    readonly to: number,
    readonly diagnostic: Diagnostic
  ) {}
}
