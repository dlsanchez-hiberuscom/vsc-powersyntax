import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

interface PackageJsonShape {
    description?: string;
    homepage?: string;
    bugs?: { url?: string };
    scripts?: Record<string, string>;
    keywords?: string[];
    contributes?: {
        commands?: Array<{ command?: string }>;
        languageModelTools?: Array<{ name?: string }>;
        configuration?: {
            properties?: Record<string, unknown>;
        };
    };
}

function readRepoFile(relativePath: string): string {
    return fs.readFileSync(
        path.resolve(__dirname, '../../../', relativePath),
        'utf8',
    );
}

function readPackageJson(): PackageJsonShape {
    return JSON.parse(readRepoFile('package.json')) as PackageJsonShape;
}

suite('ReleaseHardening', () => {
    test('package.json expone metadata publica minima y scripts repetibles de release', () => {
        const packageJson = readPackageJson();

        assert.ok(packageJson.description?.includes('PowerBuilder'));
        assert.ok(packageJson.description?.includes('DataWindow seguro'));
        assert.strictEqual(packageJson.homepage, 'https://github.com/dlsanchez-hiberuscom/almunia-powersyntax#readme');
        assert.strictEqual(packageJson.bugs?.url, 'https://github.com/dlsanchez-hiberuscom/almunia-powersyntax/issues');
        assert.strictEqual(
            packageJson.scripts?.['validate:release'],
            'node ./scripts/run_release_validation.cjs',
        );
        assert.strictEqual(
            packageJson.scripts?.['validate:release:benchmark'],
            'node ./scripts/run_release_validation.cjs --benchmark',
        );
        assert.ok(packageJson.keywords?.includes('formatter'));
        assert.ok(packageJson.keywords?.includes('diagnostics'));
    });

    test('package.json publica los comandos y settings del build PBAutoBuild', () => {
        const packageJson = readPackageJson();
        const commands = packageJson.contributes?.commands?.map(command => command.command) ?? [];
        const languageModelTools = packageJson.contributes?.languageModelTools?.map(tool => tool.name) ?? [];
        const settings = packageJson.contributes?.configuration?.properties ?? {};

        assert.ok(commands.includes('powerbuilder.buildCurrentProject'));
        assert.ok(commands.includes('powerbuilder.clearBuildProblems'));
        assert.ok(commands.includes('powerbuilder.rebuildLastProject'));
        assert.ok(commands.includes('powerbuilder.showLastBuildOutput'));
        assert.ok(commands.includes('powerbuilder.runSemanticQueryBatch'));
        assert.ok(commands.includes('powerbuilder.runActiveHierarchyInspection'));
        assert.ok(commands.includes('powerbuilder.runAncestorScriptInspection'));
        assert.ok(commands.includes('powerbuilder.runBuildSessionManifest'));
        assert.ok(commands.includes('powerbuilder.runWorkspaceBuildPreference'));
        assert.ok(commands.includes('powerbuilder.exportWorkspaceBuildPreference'));
        assert.ok(commands.includes('powerbuilder.exportPublicContractSchemas'));
        assert.ok(commands.includes('powerbuilder.exportPublicContractCatalog'));
        assert.ok(commands.includes('powerbuilder.exportBuildContractCatalog'));
        assert.ok(commands.includes('powerbuilder.exportHostContributionInventory'));
        assert.ok(commands.includes('powerbuilder.exportAutomationCoverageAudit'));
        assert.ok(commands.includes('powerbuilder.exportPublicContractCatalogDiff'));
        assert.ok(commands.includes('powerbuilder.exportWorkspaceArtifactBundleDiff'));
        assert.ok(commands.includes('powerbuilder.exportCacheInvalidationSnapshot'));
        assert.ok(commands.includes('powerbuilder.exportBuildSessionManifest'));
        assert.ok(commands.includes('powerbuilder.exportWorkspaceManifestDiff'));
        assert.ok(commands.includes('powerbuilder.exportWorkspaceArtifactBundle'));
        assert.ok(languageModelTools.includes('powerbuilder-active-hierarchy-inspection'));
        assert.ok(languageModelTools.includes('powerbuilder-ancestor-script-inspection'));
        assert.ok(languageModelTools.includes('powerbuilder-build-session-manifest'));
        assert.ok(Object.prototype.hasOwnProperty.call(settings, 'powerbuilder.build.pbAutoBuildPath'));
    });

    test('README y checklist de release publican la secuencia repetible actual', () => {
        const readme = readRepoFile('README.md');
        const checklist = readRepoFile('docs/quality/release-checklist.md');

        assert.ok(readme.includes('npm run validate:release'));
        assert.ok(readme.includes('npm run package:vsix'));
        assert.ok(checklist.includes('npm run validate:release'));
        assert.ok(checklist.includes('npm run validate:release:benchmark'));
        assert.ok(checklist.includes('package.json'));
    });
});