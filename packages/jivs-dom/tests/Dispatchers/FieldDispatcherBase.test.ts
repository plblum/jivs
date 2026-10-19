import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { DomLoggingFacade } from '../../src/Utilities/DomLoggingFacade';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { FieldDispatcherBase } from '../../src/Dispatchers/FieldDispatcherBase';
import { createStubFieldValueHost, RecordingLoggingService } from '../TestSupport/mocks';

/**
 * Makes FieldDispatcherBase's protected enumeration helper available to tests and controls
 * the elements returned by its subclass extension point.
 */
class TestFieldDispatcher extends FieldDispatcherBase
{
    public rootsSeen: Array<HTMLElement> = [];
    public valueHostsSeen: Array<IFieldValueHost> = [];
    public elementsToFind: Array<IJivsElement> = [];

    public dispatchElements(valueHost: IFieldValueHost,
        operation: (element: IJivsElement) => void): HTMLElement | null
    {
        return this.forEachElement(valueHost, operation);
    }

    protected override findElements(root: HTMLElement, valueHost: IFieldValueHost): Iterable<IJivsElement>
    {
        this.rootsSeen.push(root);
        this.valueHostsSeen.push(valueHost);
        return this.elementsToFind;
    }
}

/**
 * Exposes FieldDispatcherBase's default implementation of the subclass element lookup hook.
 */
class TestFieldDispatcherWithoutFinder extends FieldDispatcherBase
{
    public findElementsWithDefaultImplementation(root: HTMLElement,
        valueHost: IFieldValueHost): Iterable<IJivsElement>
    {
        return this.findElements(root, valueHost);
    }
}

/**
 * Creates a dispatcher with a container resolver and recording logger.
 */
function setup(): {
    domServices: IJivsDomServices,
    logger: RecordingLoggingService,
    dispatcher: TestFieldDispatcher,
    valueHost: IFieldValueHost,
    manager: IValueHostsManager,
    root: HTMLElement
}
{
    let logger = new RecordingLoggingService();
    let jivsServices = { loggingService: logger } as unknown as IJivsServices;
    let root = document.createElement('form');
    let resolvedManagers: Array<IValueHostsManager> = [];
    let domServices = {
        loggingFacade: new DomLoggingFacade(jivsServices),
        resolveContainerElement: (valueHostsManager: IValueHostsManager): HTMLElement => {
            resolvedManagers.push(valueHostsManager);
            return root;
        }
    } as unknown as IJivsDomServices;
    let dispatcher = new TestFieldDispatcher(domServices);
    let manager = {} as IValueHostsManager;
    let valueHost = {
        ...createStubFieldValueHost('Email', 'email'),
        valueHostsManager: manager
    } as IFieldValueHost;
    return {
        domServices: domServices,
        logger: logger,
        dispatcher: dispatcher,
        valueHost: valueHost,
        manager: manager,
        root: root
    };
}

// FieldDispatcherBase resolves one field's DOM root and applies the supplied operation to each subclass-selected element.
describe('FieldDispatcherBase.forEachElement enumeration', () => {
    test('Passes the resolved root and field host to findElements, then processes each result in order', () => {
        let { dispatcher, valueHost, manager, root } = setup();
        let first = document.createElement('input') as IJivsElement;
        let second = document.createElement('span') as IJivsElement;
        dispatcher.elementsToFind = [first, second];
        let processed: Array<IJivsElement> = [];

        let result = dispatcher.dispatchElements(valueHost, (element) => processed.push(element));

        expect(dispatcher.rootsSeen).toEqual([root]);
        expect(dispatcher.valueHostsSeen).toEqual([valueHost]);
        expect(processed).toEqual([first, second]);
        expect(result).toBe(root);
        expect(manager).toBe(valueHost.valueHostsManager);
    });
    test('Returns the resolved root without invoking the operation when no elements are found', () => {
        let { dispatcher, valueHost, root } = setup();
        let operationCalls = 0;

        let result = dispatcher.dispatchElements(valueHost, () => operationCalls++);

        expect(result).toBe(root);
        expect(operationCalls).toBe(0);
        expect(dispatcher.rootsSeen).toEqual([root]);
    });
    test('The default findElements hook reports that subclasses must implement element lookup', () => {
        let { domServices, valueHost, root } = setup();
        let dispatcher = new TestFieldDispatcherWithoutFinder(domServices);

        expect(() => dispatcher.findElementsWithDefaultImplementation(root, valueHost))
            .toThrow(new Error('Not implemented'));
    });
});

// A failing operation is logged with element and field context, and does not prevent later elements from being processed.
describe('FieldDispatcherBase.forEachElement operation failures', () => {
    test('Logs a thrown error with the element identity and continues processing', () => {
        let { dispatcher, logger, valueHost, root } = setup();
        let failingElement = document.createElement('input') as IJivsElement;
        failingElement.id = 'email-editor';
        let nextElement = document.createElement('span') as IJivsElement;
        dispatcher.elementsToFind = [failingElement, nextElement];
        let processed: Array<IJivsElement> = [];

        let result = dispatcher.dispatchElements(valueHost, (element) => {
            processed.push(element);
            if (element === failingElement)
                throw new Error('Adapter update failed');
        });

        expect(result).toBe(root);
        expect(processed).toEqual([failingElement, nextElement]);
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toMatchObject({
            message: "Error processing element 'email-editor': Adapter update failed",
            feature: 'Dom',
            data: {
                idAttribute: 'email-editor',
                valueHostName: 'Email'
            }
        });
    });
    test('Logs each failed element separately and continues through the remaining elements', () => {
        let { dispatcher, logger, valueHost } = setup();
        let first = document.createElement('input') as IJivsElement;
        first.id = 'first';
        let second = document.createElement('input') as IJivsElement;
        second.id = 'second';
        let last = document.createElement('input') as IJivsElement;
        dispatcher.elementsToFind = [first, second, last];
        let processed: Array<IJivsElement> = [];

        dispatcher.dispatchElements(valueHost, (element) => {
            processed.push(element);
            if (element === first)
                throw new Error('First failed');
            if (element === second)
                throw new Error('Second failed');
        });

        expect(processed).toEqual([first, second, last]);
        expect(logger.calls).toHaveLength(2);
        expect(logger.calls[0].details?.message).toBe("Error processing element 'first': First failed");
        expect(logger.calls[1].details?.message).toBe("Error processing element 'second': Second failed");
    });
});
