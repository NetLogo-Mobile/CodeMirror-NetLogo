import { matchBrackets, syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { Localized } from '../../editor';
import { Linter, getDiagnostic } from './linter-builder';
import { getCodeName } from '../utils/code';
import { AddReplaceAction } from '../utils/actions';

// ReporterLinter: checks if all (and only) reporter procedures use 'report'
export const ReporterLinter: Linter = (view, preprocessContext, lintContext) => {
  const diagnostics: Diagnostic[] = [];

  syntaxTree(view.state)
    .topNode?.firstChild?.getChildren('Procedure')
    .map((proc) => {
      let to_node = proc.node.getChild('To');
      let is_reporter = getCodeName(view.state, to_node ?? proc.node) == 'to-report';
      let found_report = false;
      let reporter_node = null;
      proc.cursor().iterate((node) => {
        if (node.name == 'Command1Args' && getCodeName(view.state, node.node) == 'report') {
          found_report = true;
          reporter_node = node.node;
          // console.log(node.from,node.to)
        }
      });
      if (is_reporter && !found_report && to_node) {
        let diagnostic = getDiagnostic(view, to_node, 'Invalid to-report _', 'error', 'to-report');
        AddReplaceAction(diagnostic, 'to');
        diagnostics.push(diagnostic);
      } else if (!is_reporter && found_report && reporter_node && to_node) {
        // console.log(reporter_node)
        diagnostics.push(getDiagnostic(view, reporter_node, 'Invalid report _', 'error', 'report'));
        let diagnostic = getDiagnostic(view, to_node, 'Invalid report warning _', 'warning', 'report');
        AddReplaceAction(diagnostic, 'to-report');
        diagnostics.push(diagnostic);
      }
    });
  return diagnostics;
};
