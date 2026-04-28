import * as assert from 'assert';
import * as vscode from 'vscode';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { DiagnosticResolver } from '../../powerbuilder/resolution/diagnosticResolver';

function makeDoc(text: string, uri = 'file:///test/diag.sru'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse(uri),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
    } as unknown as vscode.TextDocument;
}

suite('DiagnosticResolver', () => {
    const resolver = new DiagnosticResolver();

    test('should report unclosed IF block', () => {
        const doc = makeDoc([
            'if x > 0 then',
            '    y = 1',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const ifDiag = diags.find(d => d.code === 'pb-unclosed-if');
        assert.ok(ifDiag, 'Should detect unclosed IF');
        assert.strictEqual(ifDiag.range.start.line, 0);
    });

    test('should not report closed IF block', () => {
        const doc = makeDoc([
            'if x > 0 then',
            '    y = 1',
            'end if',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const ifDiag = diags.find(d => d.code === 'pb-unclosed-if');
        assert.strictEqual(ifDiag, undefined);
    });

    test('should report unclosed FOR block', () => {
        const doc = makeDoc([
            'for i = 1 to 10',
            '    x = x + 1',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const forDiag = diags.find(d => d.code === 'pb-unclosed-for');
        assert.ok(forDiag, 'Should detect unclosed FOR');
    });

    test('should not report closed FOR block', () => {
        const doc = makeDoc([
            'for i = 1 to 10',
            '    x = x + 1',
            'next',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const forDiag = diags.find(d => d.code === 'pb-unclosed-for');
        assert.strictEqual(forDiag, undefined);
    });

    test('should report unclosed DO block', () => {
        const doc = makeDoc([
            'do while x > 0',
            '    x = x - 1',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const doDiag = diags.find(d => d.code === 'pb-unclosed-do');
        assert.ok(doDiag, 'Should detect unclosed DO');
    });

    test('should report unclosed CHOOSE CASE', () => {
        const doc = makeDoc([
            'choose case ls_action',
            '    case "save"',
            '        of_save()',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const ccDiag = diags.find(d => d.code === 'pb-unclosed-choose-case');
        assert.ok(ccDiag, 'Should detect unclosed CHOOSE CASE');
    });

    test('should report unclosed TRY', () => {
        const doc = makeDoc([
            'try',
            '    of_risky()',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const tryDiag = diags.find(d => d.code === 'pb-unclosed-try');
        assert.ok(tryDiag, 'Should detect unclosed TRY');
    });

    test('should report multiple unclosed blocks', () => {
        const doc = makeDoc([
            'if x > 0 then',
            '    for i = 1 to 10',
            '        y = y + 1',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        assert.ok(diags.length >= 2, 'Should have at least 2 diagnostics');
    });

    test('should report SQL missing semicolon', () => {
        const doc = makeDoc([
            'select name',
            'into :ls_name',
            'from employee',
            'where id = :ll_id',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const sqlDiag = diags.find(d => d.code === 'pb-sql-missing-semicolon');
        assert.ok(sqlDiag, 'Should detect SQL missing semicolon');
    });

    test('should not report SQL with semicolon', () => {
        const doc = makeDoc([
            'select name',
            'into :ls_name',
            'from employee',
            'where id = :ll_id;',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const sqlDiag = diags.find(d => d.code === 'pb-sql-missing-semicolon');
        assert.strictEqual(sqlDiag, undefined);
    });

    test('should return empty for clean code', () => {
        const doc = makeDoc([
            'if x > 0 then',
            '    y = 1',
            'end if',
            'for i = 1 to 10',
            '    z = z + 1',
            'next',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        assert.strictEqual(diags.length, 0);
    });

    test('should skip comment lines', () => {
        const doc = makeDoc([
            '// if x > 0 then',
            'string ls_test',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const ifDiag = diags.find(d => d.code === 'pb-unclosed-if');
        assert.strictEqual(ifDiag, undefined);
    });

    test('should not report single-line IF (inline THEN)', () => {
        const doc = makeDoc([
            'IF Not IsDate(ls_Test) THEN Return False',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const ifDiag = diags.find(d => d.code === 'pb-unclosed-if');
        assert.strictEqual(ifDiag, undefined, 'Single-line IF should not be flagged');
    });

    test('should not report single-line IF with & continuation', () => {
        const doc = makeDoc([
            'IF Right(ls_val, 1) <> " " AND Right(ls_val, 1) <> "+" &',
            '        AND Right(ls_val, 1) <> "-" THEN ls_result = "ok"',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const ifDiag = diags.find(d => d.code === 'pb-unclosed-if');
        assert.strictEqual(ifDiag, undefined, 'Single-line IF with & continuation should not be flagged');
    });

    test('should report block IF with & continuation as unclosed', () => {
        const doc = makeDoc([
            'IF Right(ls_val, 1) <> " " &',
            '        AND Right(ls_val, 1) <> "-" THEN',
            '    ls_result = "ok"',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const ifDiag = diags.find(d => d.code === 'pb-unclosed-if');
        assert.ok(ifDiag, 'Block IF with & continuation (no END IF) should be flagged');
        assert.strictEqual(ifDiag.range.start.line, 0, 'Diagnostic should point to the first physical line');
    });

    test('should not report closed block IF with & continuation', () => {
        const doc = makeDoc([
            'IF Right(ls_val, 1) <> " " &',
            '        AND Right(ls_val, 1) <> "-" THEN',
            '    ls_result = "ok"',
            'END IF',
        ].join('\n'));
        const diags = resolver.analyze(doc);
        const ifDiag = diags.find(d => d.code === 'pb-unclosed-if');
        assert.strictEqual(ifDiag, undefined, 'Closed block IF with & continuation should not be flagged');
    });

    test('should not confuse Close(...) with SQL cursor CLOSE inside a closed IF', () => {
        const doc = makeDoc([
            'event open;',
            'CONNECT USING SQLCA ;',
            'IF SQLCA.SQLCode <> 0 THEN',
            '    MessageBox("Connection Error", SQLCA.SQLErrText)',
            '    Close(This)',
            'END IF',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const ifDiag = diags.find(d => d.code === 'pb-unclosed-if');

        assert.strictEqual(ifDiag, undefined, 'Close(...) should not hide END IF as if it were SQL');
    });

    test('should still treat CLOSE cursor as SQL starter', () => {
        const doc = makeDoc([
            'CLOSE cur_customer',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const sqlDiag = diags.find(d => d.code === 'pb-sql-missing-semicolon');

        assert.ok(sqlDiag, 'CLOSE cursor should still be analyzed as SQL');
        assert.strictEqual(sqlDiag!.range.start.line, 0);
    });

    test('should report unused local variable', () => {
        const doc = makeDoc([
            'event open;',
            'long ll_total',
            'MessageBox("Hola", "Mundo")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unusedDiag = diags.find(d => d.code === 'pb-unused-local-variable');

        assert.ok(unusedDiag, 'Should detect unused local variable');
        assert.strictEqual(unusedDiag!.range.start.line, 1);
        assert.strictEqual(unusedDiag!.range.start.character, 5);
    });

    test('should not report used local variable', () => {
        const doc = makeDoc([
            'event open;',
            'long ll_total',
            'll_total = 1',
            'MessageBox("Hola", string(ll_total))',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unusedDiag = diags.find(d => d.code === 'pb-unused-local-variable');

        assert.strictEqual(unusedDiag, undefined);
    });

    test('should report unreachable statement after top-level return in the callable body', () => {
        const doc = makeDoc([
            'event open;',
            'return',
            'MessageBox("Hola", "Mundo")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unreachableDiag = diags.find(d => d.code === 'pb-unreachable-statement');

        assert.ok(unreachableDiag, 'Should detect unreachable statement after RETURN');
        assert.strictEqual(unreachableDiag!.range.start.line, 2);
        assert.strictEqual(unreachableDiag!.range.start.character, 0);
    });

    test('should keep ELSE branch reachable after return inside IF', () => {
        const doc = makeDoc([
            'event open;',
            'if ll_flag = 1 then',
            '    return',
            'elseif ll_flag = 2 then',
            '    MessageBox("demo", "ok")',
            'end if',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unreachableDiags = diags.filter(d => d.code === 'pb-unreachable-statement');

        assert.strictEqual(unreachableDiags.length, 0, 'ELSEIF should reset the unreachable segment conservatively');
    });

    test('should report only the first unreachable statement inside the same linear branch', () => {
        const doc = makeDoc([
            'event open;',
            'if ll_flag = 1 then',
            '    return',
            '    ll_total = 1',
            '    MessageBox("demo", string(ll_total))',
            'end if',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unreachableDiags = diags.filter(d => d.code === 'pb-unreachable-statement');

        assert.strictEqual(unreachableDiags.length, 1, 'The first unreachable statement is enough for a conservative v1');
        assert.strictEqual(unreachableDiags[0].range.start.line, 3);
    });

    test('should report unreachable statement after IF when all branches terminate and ELSE exists', () => {
        const doc = makeDoc([
            'event open;',
            'if ll_flag = 1 then',
            '    return',
            'else',
            '    throw runtimeerror',
            'end if',
            'MessageBox("demo", "after if")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unreachableDiag = diags.find(d => d.code === 'pb-unreachable-statement');

        assert.ok(unreachableDiag, 'Should detect unreachable statement after IF with fully terminating branches');
        assert.strictEqual(unreachableDiag!.range.start.line, 6);
    });

    test('should keep statement reachable after IF without ELSE even if visible branch returns', () => {
        const doc = makeDoc([
            'event open;',
            'if ll_flag = 1 then',
            '    return',
            'end if',
            'MessageBox("demo", "still reachable")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unreachableDiags = diags.filter(d => d.code === 'pb-unreachable-statement');

        assert.strictEqual(unreachableDiags.length, 0, 'IF without ELSE should stay conservative and not terminate the outer flow');
    });

    test('should report write-only local variable', () => {
        const doc = makeDoc([
            'event open;',
            'long ll_total',
            'll_total = 1',
            'MessageBox("Hola", "Mundo")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const writeOnlyDiag = diags.find(d => d.code === 'pb-write-only-local-variable');

        assert.ok(writeOnlyDiag, 'Should detect write-only local variable');
        assert.strictEqual(writeOnlyDiag!.range.start.line, 1);
        assert.strictEqual(diags.find(d => d.code === 'pb-unused-local-variable'), undefined);
    });

    test('should report unassigned local variable when it is read but never written', () => {
        const doc = makeDoc([
            'event open;',
            'long ll_total',
            'return ll_total',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unassignedDiag = diags.find(d => d.code === 'pb-unassigned-local-variable');

        assert.ok(unassignedDiag, 'Should detect unassigned local variable');
        assert.strictEqual(unassignedDiag!.range.start.line, 1);
        assert.strictEqual(unassignedDiag!.range.start.character, 5);
        assert.strictEqual(diags.find(d => d.code === 'pb-unused-local-variable'), undefined);
    });

    test('should report unused parameter when only mentioned in strings or comments', () => {
        const doc = makeDoc([
            'public function integer of_total (long al_value);',
            '// al_value',
            'MessageBox("al_value", "demo")',
            'return 1',
            'end function',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unusedDiag = diags.find(d => d.code === 'pb-unused-parameter');

        assert.ok(unusedDiag, 'Should detect unused parameter');
        assert.strictEqual(unusedDiag!.range.start.line, 0);
        assert.strictEqual(unusedDiag!.range.start.character, 39);
    });

    test('should not report used parameter', () => {
        const doc = makeDoc([
            'public function integer of_total (long al_value);',
            'return al_value',
            'end function',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unusedDiag = diags.find(d => d.code === 'pb-unused-parameter');

        assert.strictEqual(unusedDiag, undefined);
    });

    test('should degrade Message carriers and PostEvent payloads to indirect usage', () => {
        const doc = makeDoc([
            'public function integer of_dispatch (string as_event, long al_payload, powerobject apo_target, long al_employee_id);',
            'long ll_total',
            'if IsValid(this) then',
            '    Message.PowerObjectParm = apo_target',
            '    Message.LongParm = al_payload',
            '    PostEvent(this, as_event)',
            'end if',
            'select salary',
            'into :ll_total',
            'from employee',
            'where emp_id = :al_employee_id;',
            'return ll_total',
            'end function',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const indirectDiags = diags.filter(d => d.code === 'pb-potentially-indirect-variable-usage');

        assert.strictEqual(indirectDiags.length, 3);
        assert.ok(indirectDiags.every(d => d.severity === vscode.DiagnosticSeverity.Hint));
        assert.strictEqual(diags.find(d => d.code === 'pb-unused-parameter'), undefined);
        assert.strictEqual(diags.find(d => d.code === 'pb-unused-local-variable'), undefined);
    });

    test('should degrade TriggerEvent payloads without escalating to unused parameter', () => {
        const doc = makeDoc([
            'public function integer of_signal (string as_event, long al_payload);',
            'if IsValid(this) then',
            '    TriggerEvent(this, as_event, al_payload)',
            'end if',
            'return 1',
            'end function',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const indirectDiags = diags.filter(d => d.code === 'pb-potentially-indirect-variable-usage');

        assert.strictEqual(indirectDiags.length, 2);
        assert.strictEqual(diags.find(d => d.code === 'pb-unused-parameter'), undefined);
    });

    test('should keep dynamic selector locals out of diagnostics by default', () => {
        const doc = makeDoc([
            'event open;',
            'string ls_dynamic',
            'ls_dynamic = "of_worker"',
            'if IsValid(ParentWindow) then',
            '    ParentWindow.DYNAMIC ls_dynamic()',
            'end if',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);

        assert.strictEqual(
            diags.find(d => d.code === 'pb-potentially-indirect-variable-usage'),
            undefined,
            'DYNAMIC sigue siendo demasiado ambiguo para elevarse como hint por defecto',
        );
        assert.strictEqual(
            diags.find(d => d.code === 'pb-unused-local-variable'),
            undefined,
            'El selector DYNAMIC no debe escalar a unused mientras mantengamos una politica conservadora',
        );
    });

    test('should report an ambiguous call only when signature resolution keeps multiple candidates', () => {
        const index = SymbolIndex.getInstance();
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_run (string as_name);',
            'return len(as_name)',
            'end function',
        ].join('\n'), 'file:///test/diag-ambiguous-base.srw');
        const document = makeDoc([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'public function long of_run (string as_name);',
            'return len(as_name) + 1',
            'end function',
            '',
            'event open;',
            'this.of_run("demo")',
            'end event',
        ].join('\n'), 'file:///test/diag-ambiguous-child.srw');

        index.indexDocument(baseDocument, { silent: true });

        const diags = resolver.analyze(document);
        const ambiguityDiag = diags.find(d => d.code === 'pb-ambiguous-call');

        assert.ok(ambiguityDiag, 'Should detect ambiguous call with multiple signature candidates');
        assert.strictEqual(ambiguityDiag!.range.start.line, 9);
        assert.ok(ambiguityDiag!.message.includes('of_run'));
    });

    test('should skip ambiguous call diagnostics for DYNAMIC dispatch', () => {
        const doc = makeDoc([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'nonvisualobject inv_base',
            '',
            'event open;',
            'inv_base.DYNAMIC of_dynamic_only("demo")',
            'end event',
        ].join('\n'), 'file:///test/diag-ambiguous-dynamic.sru');

        const diags = resolver.analyze(doc);

        assert.strictEqual(diags.find(d => d.code === 'pb-ambiguous-call'), undefined);
    });

    test('should keep SQL bind parameters and read-after-into locals out of unused diagnostics', () => {
        const doc = makeDoc([
            'public function integer of_load (long al_employee_id);',
            'long ll_total',
            'select salary',
            'into :ll_total',
            'from employee',
            'where emp_id = :al_employee_id;',
            'if ll_total > 0 then',
            '    return ll_total',
            'end if',
            'return 0',
            'end function',
        ].join('\n'));

        const diags = resolver.analyze(doc);

        assert.strictEqual(diags.find(d => d.code === 'pb-unused-parameter'), undefined);
        assert.strictEqual(diags.find(d => d.code === 'pb-unused-local-variable'), undefined);
        assert.strictEqual(diags.find(d => d.code === 'pb-potentially-indirect-variable-usage'), undefined);
    });

    test('should keep locals assigned via SQL INTO out of unassigned diagnostics', () => {
        const doc = makeDoc([
            'public function integer of_load ();',
            'long ll_total',
            'select salary',
            'into :ll_total',
            'from employee;',
            'return ll_total',
            'end function',
        ].join('\n'));

        const diags = resolver.analyze(doc);

        assert.strictEqual(diags.find(d => d.code === 'pb-unassigned-local-variable'), undefined);
    });

    test('should report local shadowing against a clear instance member', () => {
        const doc = makeDoc([
            'global type n_shadow from nonvisualobject',
            'end type',
            'global n_shadow n_shadow',
            'string is_state',
            '',
            'event open;',
            'string is_state',
            'MessageBox("demo", is_state)',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const shadowDiag = diags.find(d => d.code === 'pb-local-shadows-member');

        assert.ok(shadowDiag, 'Should detect local shadowing over an instance member');
        assert.strictEqual(shadowDiag!.range.start.line, 6);
        assert.strictEqual(shadowDiag!.severity, vscode.DiagnosticSeverity.Hint);
    });

    test('should report parameter shadowing against a clear instance member', () => {
        const doc = makeDoc([
            'global type n_shadow from nonvisualobject',
            'end type',
            'global n_shadow n_shadow',
            'string is_state',
            '',
            'public function string of_calc (string is_state);',
            'return is_state',
            'end function',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const shadowDiag = diags.find(d => d.code === 'pb-parameter-shadows-member');

        assert.ok(shadowDiag, 'Should detect parameter shadowing over an instance member');
        assert.strictEqual(shadowDiag!.range.start.line, 5);
        assert.strictEqual(shadowDiag!.severity, vscode.DiagnosticSeverity.Hint);
    });

    test('should skip shadowing when the member family is ambiguous', () => {
        const doc = makeDoc([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            'shared string is_state',
            'global string is_state',
            'private string is_state',
            '',
            'public function string of_calc (string is_state);',
            'return is_state',
            'end function',
        ].join('\n'));

        const diags = resolver.analyze(doc);

        assert.strictEqual(diags.find(d => d.code === 'pb-parameter-shadows-member'), undefined);
        assert.strictEqual(diags.find(d => d.code === 'pb-local-shadows-member'), undefined);
    });

    test('should prefer unused diagnostics over shadowing noise when the local is never read', () => {
        const doc = makeDoc([
            'global type n_shadow from nonvisualobject',
            'end type',
            'global n_shadow n_shadow',
            'string is_state',
            '',
            'event open;',
            'string is_state',
            'MessageBox("demo", "ok")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);

        assert.ok(diags.find(d => d.code === 'pb-unused-local-variable'));
        assert.strictEqual(diags.find(d => d.code === 'pb-local-shadows-member'), undefined);
    });

    test('should report an unused private member variable when there is no naming ambiguity', () => {
        const doc = makeDoc([
            'global type n_private_state from nonvisualobject',
            'end type',
            'global n_private_state n_private_state',
            'private string is_cache',
            '',
            'event open;',
            'MessageBox("demo", "ok")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const unusedPrivateMember = diags.find(d => d.code === 'pb-unused-private-member-variable');

        assert.ok(unusedPrivateMember, 'Should detect an unused private member variable');
        assert.strictEqual(unusedPrivateMember!.range.start.line, 3);
        assert.strictEqual(unusedPrivateMember!.severity, vscode.DiagnosticSeverity.Hint);
    });

    test('should report a write-only private member variable when it is only assigned', () => {
        const doc = makeDoc([
            'global type n_private_state from nonvisualobject',
            'end type',
            'global n_private_state n_private_state',
            'private string is_cache',
            '',
            'event open;',
            'is_cache = "demo"',
            'MessageBox("demo", "ok")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const writeOnlyPrivateMember = diags.find(d => d.code === 'pb-write-only-private-member-variable');

        assert.ok(writeOnlyPrivateMember, 'Should detect a write-only private member variable');
        assert.strictEqual(writeOnlyPrivateMember!.range.start.line, 3);
        assert.strictEqual(diags.find(d => d.code === 'pb-unused-private-member-variable'), undefined);
    });

    test('should skip unused private member diagnostics when a local declaration makes the name ambiguous', () => {
        const doc = makeDoc([
            'global type n_private_state from nonvisualobject',
            'end type',
            'global n_private_state n_private_state',
            'private string is_cache',
            '',
            'event open;',
            'string is_cache',
            'MessageBox("demo", "ok")',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);

        assert.strictEqual(
            diags.find(d => d.code === 'pb-unused-private-member-variable'),
            undefined,
            'A homonymous local declaration should suppress the private member lint',
        );
    });

    test('should report conservative modernization diagnostics for GOTO, HALT and obsolete runtime functions', () => {
        const doc = makeDoc([
            'event open;',
            'GOTO lbl_exit',
            'HALT CLOSE',
            'string ls_value',
            'ls_value = MidW("demo", 2)',
            'lbl_exit:',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);
        const gotoDiag = diags.find(d => d.code === 'pb-legacy-goto');
        const haltDiag = diags.find(d => d.code === 'pb-legacy-halt');
        const obsoleteDiag = diags.find(d => d.code === 'pb-obsolete-runtime-function');

        assert.ok(gotoDiag, 'Should detect GOTO as legacy syntax');
        assert.strictEqual(gotoDiag!.severity, vscode.DiagnosticSeverity.Warning);
        assert.strictEqual(gotoDiag!.range.start.line, 1);
        assert.strictEqual(gotoDiag!.range.start.character, 0);

        assert.ok(haltDiag, 'Should detect HALT as legacy runtime syntax');
        assert.strictEqual(haltDiag!.severity, vscode.DiagnosticSeverity.Information);
        assert.strictEqual(haltDiag!.range.start.line, 2);
        assert.strictEqual(haltDiag!.range.start.character, 0);

        assert.ok(obsoleteDiag, 'Should detect obsolete runtime functions with replacement');
        assert.strictEqual(obsoleteDiag!.severity, vscode.DiagnosticSeverity.Hint);
        assert.strictEqual(obsoleteDiag!.range.start.line, 4);
        assert.strictEqual(obsoleteDiag!.range.start.character, 11);
        assert.ok(obsoleteDiag!.message.includes('Mid'));
    });

    test('should skip obsolete runtime lint for callable declarations and user-defined conflicts', () => {
        const doc = makeDoc([
            'global type n_shadow from nonvisualobject',
            'end type',
            'global n_shadow n_shadow',
            '',
            'public function string MidW (string as_value, integer ai_start);',
            'return Mid(as_value, ai_start)',
            'end function',
            '',
            'event open;',
            'string ls_value',
            'ls_value = MidW("demo", 2)',
            'end event',
        ].join('\n'));

        const diags = resolver.analyze(doc);

        assert.strictEqual(
            diags.find(d => d.code === 'pb-obsolete-runtime-function'),
            undefined,
            'A user-defined callable with the same name should suppress the modernization lint',
        );
    });
});
