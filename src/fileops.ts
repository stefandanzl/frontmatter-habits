import { App, Notice, parseYaml, TAbstractFile, TFile } from 'obsidian';
import { PLUGIN_NAME } from './settings';

export function loadFiles(app: App, settingsPath: string) {
    return app.vault
        .getMarkdownFiles()
        .filter((file) => {
            // only habits
            if (!file.path.includes(settingsPath)) {
                return false;
            }
            return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFrontmatter(app: App, path: string) {
    const file: TAbstractFile | null = app.vault.getAbstractFileByPath(path);

    if (!file || !(file instanceof TFile)) {
        new Notice(`${PLUGIN_NAME}: No file found for path: ${path}`);
        return {};
    }

    try {
        return await app.vault.read(file).then((result) => {
            const frontmatter = result.split('---')[1];

            if (!frontmatter) return {};

            return parseYaml(frontmatter);
        });
    } catch (error) {
        return {};
    }
}

export async function getHabitEntries(app: App, path: string) {
    const fm = await getFrontmatter(app, path);
    return fm.entries || [];
}

export function writeFile(app: App, file: TAbstractFile, content: string) {
    if (!content) {
        new Notice(
            `${PLUGIN_NAME}: could not save changes due to missing content`,
        );
        return null;
    }

    if (!file || !(file instanceof TFile)) {
        new Notice(
            `${PLUGIN_NAME}: could not save changes due to missing file`,
        );
        return null;
    }

    try {
        return app.vault.modify(file, content);
    } catch (error) {
        new Notice(`${PLUGIN_NAME}: could not save changes`);
        return Promise.reject(error);
    }
}

export async function toggleHabit(app: App, habit: string, date: string, isTicked: string, renderHabitCallback: (path: string, entries: string[]) => void) {
    const file: TAbstractFile | null = app.vault.getAbstractFileByPath(habit);

    if (!file || !(file instanceof TFile)) {
        new Notice(`${PLUGIN_NAME}: file missing while trying to toggle habit`);
        return;
    }

    app.fileManager.processFrontMatter(file, (frontmatter) => {
        let entries = frontmatter['entries'] || [];
        if (isTicked === 'true') {
            entries = entries.filter((e: string) => e !== date);
        } else {
            entries.push(date);
            entries.sort();
        }
        frontmatter['entries'] = entries;
    });

    const updatedEntries = await getHabitEntries(app, file.path);
    renderHabitCallback(file.path, updatedEntries);
}
