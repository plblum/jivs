import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { onlyReplacedEditors } from '../../src/Editors/ReaderAssistance';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ISetup
{
    valueHost: IFieldValueHost;
    editorsByIdentifier: Record<string, IJivsElement[]>;
    registryRequests: IValueHostsManager[];
    counterRequests: IValueHostsManager[];
    manager: IValueHostsManager;
}

/**
 * Hand-written fakes: a registry that returns the editors we assign for an element identifier,
 * and DOM services that report the manager's current install counter.
 */
function setup(currentCounter: number, editors: IJivsElement[]): ISetup
{
    const editorsByIdentifier: Record<string, IJivsElement[]> = { 'field-one': editors };
    const registryRequests: IValueHostsManager[] = [];
    const counterRequests: IValueHostsManager[] = [];
    const registry = {
        getTextValueAdapterElements: (identifier: string) => editorsByIdentifier[identifier] ?? []
    } as unknown as IElementRegistry;
    const domServices = createMockJivsDomServices({
        getElementRegistry: (manager) => { registryRequests.push(manager); return registry; },
        getInstallCounter: (manager) => { counterRequests.push(manager); return currentCounter; }
    });
    const manager = { services: { domServices } as unknown as IJivsServices } as IValueHostsManager;
    const valueHost = {
        valueHostsManager: manager,
        getElementIdentifier: () => 'field-one'
    } as unknown as IFieldValueHost;
    return { valueHost, editorsByIdentifier, registryRequests, counterRequests, manager };
}

function createEditor(counter?: number): IJivsElement
{
    const editor = document.createElement('input') as IJivsElement;
    editor.jivsInstallCounter = counter;
    return editor;
}

// onlyReplacedEditors is a ReaderOptions.readerFilter: true when the field has no editor or an editor stamped with the current counter.
describe('onlyReplacedEditors', () => {
    test('Returns true when the editor carries the current install counter', () => {
        const { valueHost } = setup(3, [createEditor(3)]);

        expect(onlyReplacedEditors(valueHost)).toBe(true);
    });

    test('Returns false when the editor was installed in an earlier run', () => {
        const { valueHost } = setup(3, [createEditor(2)]);

        expect(onlyReplacedEditors(valueHost)).toBe(false);
    });

    test('Returns false when the editor was never stamped', () => {
        const { valueHost } = setup(3, [createEditor(undefined)]);

        expect(onlyReplacedEditors(valueHost)).toBe(false);
    });

    test('Returns true when the field has no editor, so the Reader can align enabled state', () => {
        const { valueHost, counterRequests } = setup(3, []);

        expect(onlyReplacedEditors(valueHost)).toBe(true);
        expect(counterRequests).toHaveLength(0);
    });

    test('Returns true when any one of several editors is current', () => {
        const { valueHost } = setup(3, [createEditor(1), createEditor(3)]);

        expect(onlyReplacedEditors(valueHost)).toBe(true);
    });

    test('Returns false when none of several editors is current', () => {
        const { valueHost } = setup(3, [createEditor(1), createEditor(2)]);

        expect(onlyReplacedEditors(valueHost)).toBe(false);
    });

    test('Reads the registry and counter of the field\'s own manager each time it runs', () => {
        const { valueHost, manager, registryRequests, counterRequests } = setup(3, [createEditor(3)]);

        onlyReplacedEditors(valueHost);
        onlyReplacedEditors(valueHost);

        expect(registryRequests).toEqual([manager, manager]);
        expect(counterRequests).toEqual([manager, manager]);
    });
});
