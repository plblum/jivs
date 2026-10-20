import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { FormDispatcherBase } from '../../src/Dispatchers/FormDispatcherBase';
import { RecordingLoggingService } from '../TestSupport/mocks';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

/**
 * Makes FormDispatcherBase's protected enumeration helper available to tests and controls
 * the elements returned by its subclass extension point.
 */
class TestFormDispatcher extends FormDispatcherBase
{
    public rootsSeen: Array<HTMLElement> = [];
    public managersSeen: Array<IValueHostsManager> = [];
    public elementsToFind: Array<IJivsElement> = [];

    public dispatchElements(valueHostsManager: IValueHostsManager,
        operation: (element: IJivsElement) => void): HTMLElement | null
    {
        return this.forEachElement(valueHostsManager, operation);
    }

    protected override findElements(root: HTMLElement,
        valueHostsManager: IValueHostsManager): Iterable<IJivsElement>
    {
        this.rootsSeen.push(root);
        this.managersSeen.push(valueHostsManager);
        return this.elementsToFind;
    }
}

/**
 * Exposes FormDispatcherBase's default implementation of the subclass element lookup hook.
 */
class TestFormDispatcherWithoutFinder extends FormDispatcherBase
{
    public findElementsWithDefaultImplementation(root: HTMLElement,
        valueHostsManager: IValueHostsManager): Iterable<IJivsElement>
    {
        return this.findElements(root, valueHostsManager);
    }
}

/**
 * Creates a dispatcher with a container resolver and recording logger.
 */
function setup(): {
    domServices: IJivsDomServices,
    logger: RecordingLoggingService,
    dispatcher: TestFormDispatcher,
    manager: IValueHostsManager,
    root: HTMLElement,
    resolvedManagers: Array<IValueHostsManager>
}
{
    let logger = new RecordingLoggingService();
    let root = document.createElement('form');
    let resolvedManagers: Array<IValueHostsManager> = [];
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices,
        resolveContainerElement: (valueHostsManager: IValueHostsManager): HTMLElement => {
            resolvedManagers.push(valueHostsManager);
            return root;
        }
    });
    let dispatcher = new TestFormDispatcher(domServices);
    let manager = {} as IValueHostsManager;
    return {
        domServices: domServices,
        logger: logger,
        dispatcher: dispatcher,
        manager: manager,
        root: root,
        resolvedManagers: resolvedManagers
    };
}

// FormDispatcherBase resolves one form's DOM root and applies the operation to subclass-selected form elements.
describe('FormDispatcherBase.forEachElement enumeration', () => {
    test('Passes the resolved root and manager to findElements, then processes each result in order', () => {
        let { dispatcher, manager, resolvedManagers, root } = setup();
        let first = document.createElement('div') as IJivsElement;
        let second = document.createElement('button') as IJivsElement;
        dispatcher.elementsToFind = [first, second];
        let processed: Array<IJivsElement> = [];

        let result = dispatcher.dispatchElements(manager, (element) => processed.push(element));

        expect(resolvedManagers).toEqual([manager]);
        expect(dispatcher.rootsSeen).toEqual([root]);
        expect(dispatcher.managersSeen).toEqual([manager]);
        expect(processed).toEqual([first, second]);
        expect(result).toBe(root);
    });
    test('Returns the resolved root without invoking the operation when no elements are found', () => {
        let { dispatcher, manager, resolvedManagers, root } = setup();
        let operationCalls = 0;

        let result = dispatcher.dispatchElements(manager, () => operationCalls++);

        expect(result).toBe(root);
        expect(operationCalls).toBe(0);
        expect(resolvedManagers).toEqual([manager]);
        expect(dispatcher.rootsSeen).toEqual([root]);
    });
    test('The default findElements hook reports that subclasses must implement element lookup', () => {
        let { domServices, manager, root } = setup();
        let dispatcher = new TestFormDispatcherWithoutFinder(domServices);

        expect(() => dispatcher.findElementsWithDefaultImplementation(root, manager))
            .toThrow(new Error('Not implemented'));
    });
});

// A failing operation is logged with the element identity but no field-host context, and later elements still run.
describe('FormDispatcherBase.forEachElement operation failures', () => {
    test('Logs a thrown error with form element context and continues processing', () => {
        let { dispatcher, logger, manager, root } = setup();
        let failingElement = document.createElement('div') as IJivsElement;
        failingElement.id = 'validation-summary';
        let nextElement = document.createElement('button') as IJivsElement;
        let processed: Array<IJivsElement> = [];
        dispatcher.elementsToFind = [failingElement, nextElement];

        let result = dispatcher.dispatchElements(manager, (element) => {
            processed.push(element);
            if (element === failingElement)
                throw new Error('Summary update failed');
        });

        expect(result).toBe(root);
        expect(processed).toEqual([failingElement, nextElement]);
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe(LoggingLevel.Error);
        expect(logger.calls[0].details).toMatchObject({
            message: "Error processing element 'validation-summary': Summary update failed",
            feature: 'Dom',
            data: {
                idAttribute: 'validation-summary'
            }
        });
        expect(logger.calls[0].details?.data).not.toHaveProperty('valueHostName');
    });
    test('Logs each failed element separately and still processes the final element', () => {
        let { dispatcher, logger, manager } = setup();
        let first = document.createElement('div') as IJivsElement;
        first.id = 'summary';
        let second = document.createElement('button') as IJivsElement;
        second.id = 'submit';
        let last = document.createElement('span') as IJivsElement;
        let processed: Array<IJivsElement> = [];
        dispatcher.elementsToFind = [first, second, last];

        dispatcher.dispatchElements(manager, (element) => {
            processed.push(element);
            if (element === first)
                throw new Error('First failed');
            if (element === second)
                throw new Error('Second failed');
        });

        expect(processed).toEqual([first, second, last]);
        expect(logger.calls).toHaveLength(2);
        expect(logger.calls[0].details?.message).toBe("Error processing element 'summary': First failed");
        expect(logger.calls[1].details?.message).toBe("Error processing element 'submit': Second failed");
        expect(logger.calls.map(call => call.details?.data)).toEqual([
            { idAttribute: 'summary' },
            { idAttribute: 'submit' }
        ]);
    });
});
