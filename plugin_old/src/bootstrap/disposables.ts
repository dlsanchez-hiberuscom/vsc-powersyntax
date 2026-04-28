import * as vscode from 'vscode';

const managedDisposables: vscode.Disposable[] = [];

export function trackDisposable(d: vscode.Disposable): void {
    managedDisposables.push(d);
}

export function disposeAll(extras: vscode.Disposable[] = []): void {
    for (const d of [...managedDisposables, ...extras]) {
        d.dispose();
    }
    managedDisposables.length = 0;
}
