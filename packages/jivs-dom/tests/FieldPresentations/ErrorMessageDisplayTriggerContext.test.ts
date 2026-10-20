/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';
import type {
    IErrorMessageDisplayController
} from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { ErrorMessageDisplayTriggerContext } from '../../src/FieldPresentations/ErrorMessageDisplayTriggerContext';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

function createController(): IErrorMessageDisplayController
{
    return {
        open: (_context, _delay) => undefined,
        opened: () => undefined,
        close: (_context, _delay) => undefined,
        closed: () => undefined,
        toggle: (_context, _openDelay, _closeDelay) => undefined,
        cancelDelayedClose: () => undefined
    };
}

function createContext(): {
    context: ErrorMessageDisplayTriggerContext;
    jivsElement: IJivsElement;
    domServices: IJivsDomServices;
    valueHost: IFieldValueHost;
    controller: IErrorMessageDisplayController;
}
{
    let jivsElement = document.createElement('div') as IJivsElement;
    let domServices = createMockJivsDomServices();
    let valueHost = {} as IFieldValueHost;
    let controller = createController();

    return {
        context: new ErrorMessageDisplayTriggerContext(
            jivsElement,
            domServices,
            valueHost,
            controller
        ),
        jivsElement: jivsElement,
        domServices: domServices,
        valueHost: valueHost,
        controller: controller
    };
}

// Trigger contexts expose the same element, services, host, and controller references supplied at construction.
describe('ErrorMessageDisplayTriggerContext references', () => {
    test('Retains its constructor dependencies and starts without issues', () => {
        let testData = createContext();

        expect(testData.context.jivsElement).toBe(testData.jivsElement);
        expect(testData.context.domServices).toBe(testData.domServices);
        expect(testData.context.valueHost).toBe(testData.valueHost);
        expect(testData.context.controller).toBe(testData.controller);
        expect(testData.context.issuesFound).toBeNull();
    });
});

// The issue list is mutable context data that triggers and presentations share by reference.
describe('ErrorMessageDisplayTriggerContext.issuesFound', () => {
    test('Stores the supplied issue list and allows it to be cleared', () => {
        let testData = createContext();
        let issuesFound = [
            { errorMessage: 'First issue' },
            { errorMessage: 'Second issue' }
        ] as IssueFound[];

        testData.context.issuesFound = issuesFound;

        expect(testData.context.issuesFound).toBe(issuesFound);

        testData.context.issuesFound = null;

        expect(testData.context.issuesFound).toBeNull();
    });
});

// Disposal releases retained references and clears the issues so the context cannot keep presentation state alive.
describe('ErrorMessageDisplayTriggerContext.dispose', () => {
    test('Clears all dependencies and issue data', () => {
        let testData = createContext();
        testData.context.issuesFound = [{ errorMessage: 'Invalid' }] as IssueFound[];

        testData.context.dispose();

        expect(testData.context.jivsElement).toBeUndefined();
        expect(testData.context.domServices).toBeUndefined();
        expect(testData.context.valueHost).toBeUndefined();
        expect(testData.context.controller).toBeUndefined();
        expect(testData.context.issuesFound).toBeNull();
    });

    test('Can be disposed more than once', () => {
        let testData = createContext();

        expect(() => {
            testData.context.dispose();
            testData.context.dispose();
        }).not.toThrow();

        expect(testData.context.issuesFound).toBeNull();
    });
});
