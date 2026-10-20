import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { ITextValueAdapter } from '../../src/Interfaces/Adapters';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import { TextValueDispatcher } from '../../src/Dispatchers/TextValueDispatcher';
import { ElementRole } from '../../src/Interfaces/Types';
import { RecordingLoggingService } from '../TestSupport/mocks';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Creates a dispatcher and real ElementRegistry associated with a real FieldValueHost manager.
 */
function setup(): {
    dispatcher: TextValueDispatcher,
    valueHost: IFieldValueHost,
    registry: ElementRegistry,
    logger: RecordingLoggingService,
    registryManagers: Array<object>,
    resolvedManagers: Array<object>
}
{
    let { valueHost } = setupFieldValueHostForTesting();
    let registry = new ElementRegistry(valueHost.valueHostsManager);
    let logger = new RecordingLoggingService();
    let registryManagers: Array<object> = [];
    let resolvedManagers: Array<object> = [];
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices,
        resolveContainerElement: (manager: object): HTMLElement => {
            resolvedManagers.push(manager);
            return document.createElement('form');
        },
        getElementRegistry: (manager: object): IElementRegistry => {
            registryManagers.push(manager);
            return registry;
        }
    });

    return {
        dispatcher: new TextValueDispatcher(domServices),
        valueHost: valueHost,
        registry: registry,
        logger: logger,
        registryManagers: registryManagers,
        resolvedManagers: resolvedManagers
    };
}

/**
 * Adds a field record to the real registry.
 * @param registry - Registry populated for dispatch.
 * @param elementIdentifier - Identifier used to associate the element with a field host.
 * @param role - Role registered for the element.
 */
function addFieldElement(
    registry: ElementRegistry,
    elementIdentifier: string,
    role: ElementRole | string = ElementRole.editor
): IJivsElement
{
    let element = document.createElement('input') as IJivsElement;
    element.jivsElementRole = role;
    if (role === ElementRole.editor)
        registry.addEditor(element, elementIdentifier);
    else
        registry.addField(element, elementIdentifier, role);
    return element;
}

/**
 * Creates a text adapter fake that records values written to it.
 * @param onWrite - Optional callback invoked for each written value.
 */
function createTextAdapter(onWrite: (textValue: string | undefined) => void): ITextValueAdapter
{
    return {
        readTextValue: () => undefined,
        writeTextValue: onWrite
    };
}

// TextValueDispatcher queries the real ElementRegistry for the changed field and sends its current text to matching adapters.
describe('TextValueDispatcher.dispatch with the real ElementRegistry', () => {
    test('Writes the current field text to matching adapters in registry order, ignoring the callback old value', () => {
        let { dispatcher, valueHost, registry, registryManagers, resolvedManagers } = setup();
        let identifier = valueHost.getElementIdentifier();
        let firstEditor = addFieldElement(registry, identifier);
        let editorWithoutAdapter = addFieldElement(registry, identifier);
        let editorNotUsingAdapter = addFieldElement(registry, identifier);
        let secondEditor = addFieldElement(registry, identifier);
        let unrelatedEditor = addFieldElement(registry, 'OtherField');
        let writes: Array<{ element: IJivsElement, value: string | undefined }> = [];
        for (let element of [firstEditor, secondEditor, unrelatedEditor]) {
            element.jivsTextValueAdapter = createTextAdapter(value =>
                writes.push({ element: element, value: value }));
        }
        editorNotUsingAdapter.jivsTextValueAdapter = null;
        valueHost.setTextValue('current field text');

        dispatcher.dispatch(valueHost, 'obsolete callback text');

        expect(resolvedManagers).toEqual([valueHost.valueHostsManager]);
        expect(registryManagers).toEqual([valueHost.valueHostsManager]);
        expect(writes).toEqual([
            { element: firstEditor, value: 'current field text' },
            { element: secondEditor, value: 'current field text' }
        ]);
        expect(editorWithoutAdapter.jivsTextValueAdapter).toBeUndefined();
        expect(unrelatedEditor.jivsTextValueAdapter).toBeDefined();
    });

    test('Passes undefined when the field currently has no text value', () => {
        let { dispatcher, valueHost, registry } = setup();
        let editor = addFieldElement(registry, valueHost.getElementIdentifier());
        let writes: Array<string | undefined> = [];
        editor.jivsTextValueAdapter = createTextAdapter(value => writes.push(value));

        dispatcher.dispatch(valueHost, 'old value');

        expect(valueHost.getTextValue()).toBeUndefined();
        expect(writes).toEqual([undefined]);
    });

    test('Does nothing when there are no registered text adapters for the field', () => {
        let { dispatcher, valueHost, registry, logger } = setup();
        addFieldElement(registry, valueHost.getElementIdentifier());

        expect(() => dispatcher.dispatch(valueHost, undefined)).not.toThrow();
        expect(logger.calls).toHaveLength(0);
    });
});

// Adapter failures are logged with field and element context while later adapters still receive the current text.
describe('TextValueDispatcher.dispatch adapter failures', () => {
    test('Logs a failed adapter write and continues dispatching to subsequent registered adapters', () => {
        let { dispatcher, valueHost, registry, logger } = setup();
        let failingEditor = addFieldElement(registry, valueHost.getElementIdentifier());
        failingEditor.id = 'first-editor';
        let nextEditor = addFieldElement(registry, valueHost.getElementIdentifier());
        let writes: Array<string | undefined> = [];
        failingEditor.jivsTextValueAdapter = createTextAdapter(() => {
            throw new Error('Text update failed');
        });
        nextEditor.jivsTextValueAdapter = createTextAdapter(value => writes.push(value));
        valueHost.setTextValue('new value');

        dispatcher.dispatch(valueHost, 'previous value');

        expect(writes).toEqual(['new value']);
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toMatchObject({
            message: "Error processing element 'first-editor': Text update failed",
            feature: 'Dom',
            data: {
                idAttribute: 'first-editor',
                valueHostName: 'Field1'
            }
        });
    });
});
