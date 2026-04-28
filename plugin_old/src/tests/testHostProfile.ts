import * as fs from 'fs/promises';
import * as path from 'path';

export async function createIsolatedLaunchArgs(
    profileName: string,
    workspacePath: string,
): Promise<string[]> {
    const profileRoot = path.resolve(
        __dirname,
        '../../.vscode-test',
        'profiles',
        profileName,
    );
    const userDataDir = path.join(profileRoot, 'user-data');
    const userSettingsDir = path.join(userDataDir, 'User');
    const userSettingsPath = path.join(userSettingsDir, 'settings.json');
    const extensionsDir = path.join(profileRoot, 'extensions');

    await fs.rm(profileRoot, { recursive: true, force: true });
    await fs.mkdir(userSettingsDir, { recursive: true });
    await fs.mkdir(extensionsDir, { recursive: true });
    await fs.writeFile(
        userSettingsPath,
        JSON.stringify(
            {
                'chat.agent.enabled': false,
                'extensions.autoCheckUpdates': false,
                'extensions.autoUpdate': false,
                'terminal.integrated.initialHint': false,
                'update.mode': 'none',
                'workbench.enableExperiments': false,
            },
            null,
            2,
        ),
        'utf8',
    );

    return [
        workspacePath,
        '--disable-extensions',
        `--user-data-dir=${userDataDir}`,
        `--extensions-dir=${extensionsDir}`,
    ];
}