import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { IValueAdapter } from '../../src/Interfaces/Adapters';
import type { IElementRegistry } from '../../src/Interfaces/ElementRegistry';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { ElementRegistry } from '../../src/FormInstaller/ElementRegistry';
import { ValueDispatcher } from '../../src/Dispatchers/ValueDispatcher';
import { ElementRole } from '../../src/Interfaces/Types';
import { RecordingLoggingService } from '../TestSupport/mocks';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Creates a dispatcher and real ElementRegistry associated with a real FieldValueHost manager.
 */
function setup(): {
    dispatcher: ValueDispatcher,
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
        dispatcher: new ValueDispatcher(domServices),
        valueHost: valueHost,
        registry: registry,
        logger: logger,
        registryManagers: registryManagers,
        resolvedManagers: resolvedManagers
    };
}

/**
 * Adds an editor record to the real registry.
 * @param registry - Registry populated for dispatch.
 * @param elementIdentifier - Identifier used to associate the element with a field host.
 * @param role - Editor role stored on the element.
 */
function addEditor(
    registry: ElementRegistry,
    elementIdentifier: string,
    role: ElementRole | string = ElementRole.editor
): IJivsElement
{
    let element = document.createElement('input') as IJivsElement;
    element.jivsElementRole = role;
    registry.addEditor(element, elementIdentifier);
    return element;
}

/**
 * Creates a native-value adapter fake that records values written to it.
 * @param onWrite - Callback invoked for each written value.
 */
function createValueAdapter(onWrite: (value: unknown) => void): IValueAdapter
{
    return {
        readValue: () => undefined,
        writeValue: onWrite
    };
}

// ValueDispatcher queries the real ElementRegistry for the changed field and writes its current native value to matching adapters.
describe('ValueDispatcher.dispatch with the real ElementRegistry', () => {
    test('Writes the current native value to matching adapters in registry order, ignoring the callback old value', () => {
        let { dispatcher, valueHost, registry, registryManagers, resolvedManagers } = setup();
        let identifier = valueHost.getElementIdentifier();
        let firstEditor = addEditor(registry, identifier);
        let editorWithoutAdapter = addEditor(registry, identifier);
        let editorNotUsingAdapter = addEditor(registry, identifier);
        let secondEditor = addEditor(registry, identifier);
        let unrelatedEditor = addEditor(registry, 'OtherField');
        let payload = { id: 7, enabled: true };
        let writes: Array<{ element: IJivsElement, value: unknown }> = [];
        for (let element of [firstEditor, secondEditor, unrelatedEditor]) {
            element.jivsValueAdapter = createValueAdapter(value =>
                writes.push({ element: element, value: value }));
        }
        editorNotUsingAdapter.jivsValueAdapter = null;
        valueHost.setValue(payload);

        dispatcher.dispatch(valueHost, { id: 1, enabled: false });

        expect(resolvedManagers).toEqual([valueHost.valueHostsManager]);
        expect(registryManagers).toEqual([valueHost.valueHostsManager]);
        expect(writes).toEqual([
            { element: firstEditor, value: payload },
            { element: secondEditor, value: payload }
        ]);
        expect(writes[0].value).toBe(payload);
        expect(editorWithoutAdapter.jivsValueAdapter).toBeUndefined();
        expect(unrelatedEditor.jivsValueAdapter).toBeDefined();
    });

    test('Passes undefined when the field currently has no native value', () => {
        let { dispatcher, valueHost, registry } = setup();
        let editor = addEditor(registry, valueHost.getElementIdentifier());
        let writes: Array<unknown> = [];
        editor.jivsValueAdapter = createValueAdapter(value => writes.push(value));

        dispatcher.dispatch(valueHost, 'old native value');

        expect(valueHost.getValue()).toBeUndefined();
        expect(writes).toEqual([undefined]);
    });

    test('Does nothing when there are no registered native-value adapters for the field', () => {
        let { dispatcher, valueHost, registry, logger } = setup();
        addEditor(registry, valueHost.getElementIdentifier());

        expect(() => dispatcher.dispatch(valueHost, undefined)).not.toThrow();
        expect(logger.calls).toHaveLength(0);
    });
});

// Adapter failures are logged with field and element context while later adapters still receive the current native value.
describe('ValueDispatcher.dispatch adapter failures', () => {
    test('Logs a failed adapter write and continues dispatching to subsequent registered adapters', () => {
        let { dispatcher, valueHost, registry, logger } = setup();
        let failingEditor = addEditor(registry, valueHost.getElementIdentifier());
        failingEditor.id = 'first-editor';
        let nextEditor = addEditor(registry, valueHost.getElementIdentifier());
        let writes: Array<unknown> = [];
        failingEditor.jivsValueAdapter = createValueAdapter(() => {
            throw new Error('Native value update failed');
        });
        nextEditor.jivsValueAdapter = createValueAdapter(value => writes.push(value));
        let currentValue = { status: 'ready' };
        valueHost.setValue(currentValue);

        dispatcher.dispatch(valueHost, { status: 'old' });

        expect(writes).toEqual([currentValue]);
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toMatchObject({
            message: "Error processing element 'first-editor': Native value update failed",
            feature: 'Dom',
            data: {
                idAttribute: 'first-editor',
                valueHostName: 'Field1'
            }
        });
    });
});
