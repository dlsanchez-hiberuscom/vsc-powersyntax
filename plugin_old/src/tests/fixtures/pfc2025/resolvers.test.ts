import * as assert from 'assert';
import * as vscode from 'vscode';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import { DefinitionResolver } from '../../../powerbuilder/resolution/definitionResolver';
import { RenameResolver } from '../../../powerbuilder/resolution/renameResolver';
import { PbLibraryGraph } from '../../../powerbuilder/projecting/pbLibraryGraph';
import { PbProjectParser } from '../../../powerbuilder/projecting/pbProjectParser';
import { N_TR_FIXTURE } from '../../fixtures/pfc2025/n_tr.fixture';
import { W_MASTER_FIXTURE } from '../../fixtures/pfc2025/w_master.fixture';
import { PFC_EXAMPLES_PBPROJ_FIXTURE } from '../../fixtures/pfc2025/pfc_examples_pbproj.fixture';

suite('Resolvers project-aware', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
    });

    test('DefinitionResolver prioriza símbolos del proyecto actual', () => {
        const index = SymbolIndex.getInstance();
        const graph = PbLibraryGraph.getInstance();
        const parser = new PbProjectParser();

        const projectUri = vscode.Uri.file('/workspace/pfc examples.pbproj');
        const project = parser.parseProjectText(
            projectUri,
            PFC_EXAMPLES_PBPROJ_FIXTURE,
        );

        assert.ok(project);
        graph.setProject(project!);

        const currentUri = vscode.Uri.file('/workspace/examples/exmmain.pbl/n_tr.sru');
        const otherUri = vscode.Uri.file('/workspace/tutorial/pfctutor.pbl/n_tr.sru');

        index.indexFromUri(currentUri, N_TR_FIXTURE);

        index.indexFromUri(
            otherUri,
            `
forward prototypes
public function long of_begin ()
end prototypes

public function long of_begin ();
return 99
end function
`.trim(),
        );

        const resolver = new DefinitionResolver(index);
        const locations = resolver.resolve('of_begin', currentUri);

        assert.ok(locations.length > 0);
        assert.strictEqual(locations[0].uri.toString(), currentUri.toString());
    });

    test('DefinitionResolver prioriza el proyecto preferido aunque la referencia venga de un tercer archivo', () => {
        const index = SymbolIndex.getInstance();
        const graph = PbLibraryGraph.getInstance();
        const parser = new PbProjectParser();

        const projectA = parser.parseProjectText(
            vscode.Uri.file('/workspace/solutions/examples/pfc examples.pbproj'),
            PFC_EXAMPLES_PBPROJ_FIXTURE,
        );

        const projectB = parser.parseProjectText(
            vscode.Uri.file('/workspace/solutions/tutorial/pfctutor.pbproj'),
            `
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<Project>
    <Type Name="pb"/>
    <Application Name="pfctutor"/>
    <Libraries AppEntry="tutorial\\pfctutor.pbl">
        <Library Path="tutorial\\pfctutor.pbl"/>
    </Libraries>
</Project>
`.trim(),
        );

        assert.ok(projectA);
        assert.ok(projectB);

        graph.setProject(projectA!);
        graph.setProject(projectB!);

        const callerUri = vscode.Uri.file('/workspace/solutions/examples/exmutil.pbl/caller.sru');
        const currentDefinitionUri = vscode.Uri.file('/workspace/solutions/examples/exmmain.pbl/n_tr.sru');
        const otherDefinitionUri = vscode.Uri.file('/workspace/solutions/tutorial/tutorial/pfctutor.pbl/n_tr.sru');

        index.indexFromUri(
            callerUri,
            `
event open;
of_begin()
end event
`.trim(),
        );

        index.indexFromUri(currentDefinitionUri, N_TR_FIXTURE);

        index.indexFromUri(
            otherDefinitionUri,
            `
forward prototypes
public function long of_begin ()
end prototypes

public function long of_begin ();
return 99
end function
`.trim(),
        );

        const resolver = new DefinitionResolver(index);
        const locations = resolver.resolve('of_begin', callerUri);

        assert.ok(locations.length > 0);
        assert.strictEqual(locations[0].uri.toString(), currentDefinitionUri.toString());
    });

    test('RenameResolver permite renombrar si el símbolo es único en el proyecto actual', () => {
        const index = SymbolIndex.getInstance();
        const graph = PbLibraryGraph.getInstance();
        const parser = new PbProjectParser();

        const projectAUri = vscode.Uri.file('/workspace/pfc examples.pbproj');
        const projectBUri = vscode.Uri.file('/workspace/pfctutor.pbproj');

        const projectA = parser.parseProjectText(
            projectAUri,
            PFC_EXAMPLES_PBPROJ_FIXTURE,
        );

        const projectB = parser.parseProjectText(
            projectBUri,
            `
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<Project>
    <Type Name="pb"/>
    <Application Name="pfctutor"/>
    <Libraries AppEntry="tutorial\\pfctutor.pbl">
        <Library Path="tutorial\\pfctutor.pbl"/>
    </Libraries>
</Project>
`.trim(),
        );

        assert.ok(projectA);
        assert.ok(projectB);

        graph.setProject(projectA!);
        graph.setProject(projectB!);

        const currentUri = vscode.Uri.file('/workspace/examples/exmmain.pbl/w_master.srw');
        const otherProjectUri = vscode.Uri.file('/workspace/tutorial/pfctutor.pbl/w_master.srw');

        index.indexFromUri(currentUri, W_MASTER_FIXTURE);

        index.indexFromUri(
            otherProjectUri,
            `
public function string of_getexampletitle (string as_classname);
return as_classname
end function
`.trim(),
        );

        const renameResolver = new RenameResolver(index);

        assert.strictEqual(
            renameResolver.canRename('of_getexampletitle', currentUri),
            true,
        );
    });

    test('RenameResolver bloquea renombrado si hay múltiples implementaciones en el mismo proyecto', () => {
        const index = SymbolIndex.getInstance();
        const graph = PbLibraryGraph.getInstance();
        const parser = new PbProjectParser();

        const projectUri = vscode.Uri.file('/workspace/pfc examples.pbproj');
        const project = parser.parseProjectText(
            projectUri,
            PFC_EXAMPLES_PBPROJ_FIXTURE,
        );

        assert.ok(project);
        graph.setProject(project!);

        const firstUri = vscode.Uri.file('/workspace/examples/exmmain.pbl/a.sru');
        const secondUri = vscode.Uri.file('/workspace/examples/exmutil.pbl/b.sru');

        const duplicateFixture = `
public function long of_duplicate ();
return 1
end function
`.trim();

        index.indexFromUri(firstUri, duplicateFixture);
        index.indexFromUri(secondUri, duplicateFixture);

        const renameResolver = new RenameResolver(index);

        assert.strictEqual(
            renameResolver.canRename('of_duplicate', firstUri),
            false,
        );
    });
});
