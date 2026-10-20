import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type {
    IErrorMessageDisplayController,
    IErrorMessageDisplayTriggerContext
} from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import { PopupService } from '../../src/Services/PopupService';

interface ICloseCall
{
    context: IErrorMessageDisplayTriggerContext;
    delay: number;
}

/**
 * Records the closure requests made by PopupService.
 */
class TestController implements IErrorMessageDisplayController
{
    public closeCalls: ICloseCall[] = [];
    public closeError: Error | null = null;

    public open(_context: IErrorMessageDisplayTriggerContext, _delay: number): void
    {
    }

    public opened(): void
    {
    }

    public close(context: IErrorMessageDisplayTriggerContext, delay: number): void
    {
        this.closeCalls.push({ context: context, delay: delay });
        if (this.closeError)
            throw this.closeError;
    }

    public closed(): void
    {
    }

    public toggle(
        _context: IErrorMessageDisplayTriggerContext,
        _openDelay: number,
        _closeDelay: number
    ): void
    {
    }

    public cancelDelayedClose(): void
    {
    }
}

/**
 * Creates a distinct context referring to its controller.
 */
function createTriggerContext(controller: IErrorMessageDisplayController): IErrorMessageDisplayTriggerContext
{
    return {
        jivsElement: {} as IJivsElement,
        domServices: {} as IJivsDomServices,
        valueHost: {} as IFieldValueHost,
        controller: controller,
        issuesFound: null,
        dispose(): void
        {
        }
    };
}

/**
 * Creates a context factory whose result is unique to each invocation.
 */
function createContextFactory(
    controller: IErrorMessageDisplayController,
    createdContexts: IErrorMessageDisplayTriggerContext[]
): () => IErrorMessageDisplayTriggerContext
{
    return (): IErrorMessageDisplayTriggerContext => {
        let context = createTriggerContext(controller);
        createdContexts.push(context);
        return context;
    };
}

// PopupService registers controllers by identity and replaces a controller's previous context factory.
describe('PopupService.register', () => {
    test('Uses the latest context factory when the same controller is registered more than once', () => {
        let testItem = new PopupService();
        let controller = new TestController();
        let firstContexts: IErrorMessageDisplayTriggerContext[] = [];
        let replacementContexts: IErrorMessageDisplayTriggerContext[] = [];
        let firstFactory = createContextFactory(controller, firstContexts);
        let replacementFactory = createContextFactory(controller, replacementContexts);

        testItem.register(controller, firstFactory);
        testItem.register(controller, replacementFactory);
        testItem.closePopups();

        expect(controller.closeCalls).toHaveLength(1);
        expect(controller.closeCalls[0].context).toBe(replacementContexts[0]);
        expect(firstContexts).toHaveLength(0);
        expect(replacementContexts).toHaveLength(1);
    });
});

// Unregistering a controller prevents future forced closes without affecting other registrations.
describe('PopupService.unregister', () => {
    test('Does not close a registered controller after it is unregistered, including when unregistering an unknown controller', () => {
        let testItem = new PopupService();
        let controller = new TestController();
        let unknownController = new TestController();
        let contexts: IErrorMessageDisplayTriggerContext[] = [];
        testItem.register(controller, createContextFactory(controller, contexts));

        testItem.unregister(unknownController);
        testItem.unregister(controller);
        testItem.closePopups();

        expect(controller.closeCalls).toHaveLength(0);
        expect(contexts).toHaveLength(0);
    });
});

// Preparing one popup closes every other registered popup, using a fresh context and zero delay for each.
describe('PopupService.prepareToOpen', () => {
    test('Closes all registered controllers except the controller preparing to open', () => {
        let testItem = new PopupService();
        let firstController = new TestController();
        let openingController = new TestController();
        let lastController = new TestController();
        let firstContexts: IErrorMessageDisplayTriggerContext[] = [];
        let openingContexts: IErrorMessageDisplayTriggerContext[] = [];
        let lastContexts: IErrorMessageDisplayTriggerContext[] = [];
        testItem.register(firstController, createContextFactory(firstController, firstContexts));
        testItem.register(openingController, createContextFactory(openingController, openingContexts));
        testItem.register(lastController, createContextFactory(lastController, lastContexts));

        testItem.prepareToOpen(openingController);

        expect(firstController.closeCalls).toHaveLength(1);
        expect(firstController.closeCalls[0]).toEqual({ context: firstContexts[0], delay: 0 });
        expect(openingController.closeCalls).toHaveLength(0);
        expect(lastController.closeCalls).toHaveLength(1);
        expect(lastController.closeCalls[0]).toEqual({ context: lastContexts[0], delay: 0 });
        expect(openingContexts).toHaveLength(0);
    });

    test('Closes every registration when the controller preparing to open is not registered', () => {
        let testItem = new PopupService();
        let registeredController = new TestController();
        let unregisteredController = new TestController();
        let contexts: IErrorMessageDisplayTriggerContext[] = [];
        testItem.register(registeredController, createContextFactory(registeredController, contexts));

        testItem.prepareToOpen(unregisteredController);

        expect(registeredController.closeCalls).toHaveLength(1);
        expect(registeredController.closeCalls[0]).toEqual({ context: contexts[0], delay: 0 });
    });

    test('Creates a fresh context for each forced close request', () => {
        let testItem = new PopupService();
        let openingController = new TestController();
        let otherController = new TestController();
        let contexts: IErrorMessageDisplayTriggerContext[] = [];
        testItem.register(otherController, createContextFactory(otherController, contexts));

        testItem.prepareToOpen(openingController);
        testItem.prepareToOpen(openingController);

        expect(otherController.closeCalls).toHaveLength(2);
        expect(otherController.closeCalls[0].context).toBe(contexts[0]);
        expect(otherController.closeCalls[1].context).toBe(contexts[1]);
        expect(otherController.closeCalls[0].context).not.toBe(otherController.closeCalls[1].context);
    });

    test('Does nothing when no controllers are registered', () => {
        let testItem = new PopupService();

        expect(() => testItem.prepareToOpen(new TestController())).not.toThrow();
    });
});

// closePopups requests an immediate close from every registration, while an empty service is a safe no-op.
describe('PopupService.closePopups', () => {
    test('Closes every registered controller with its own fresh context and zero delay', () => {
        let testItem = new PopupService();
        let firstController = new TestController();
        let secondController = new TestController();
        let firstContexts: IErrorMessageDisplayTriggerContext[] = [];
        let secondContexts: IErrorMessageDisplayTriggerContext[] = [];
        testItem.register(firstController, createContextFactory(firstController, firstContexts));
        testItem.register(secondController, createContextFactory(secondController, secondContexts));

        testItem.closePopups();

        expect(firstController.closeCalls).toEqual([{ context: firstContexts[0], delay: 0 }]);
        expect(secondController.closeCalls).toEqual([{ context: secondContexts[0], delay: 0 }]);
    });

    test('Does nothing when no controllers are registered', () => {
        let testItem = new PopupService();

        expect(() => testItem.closePopups()).not.toThrow();
    });
});

// Disposing closes registrations before releasing them, even if a controller's close request throws.
describe('PopupService.dispose', () => {
    test('Closes registered controllers and releases them from later close operations', () => {
        let testItem = new PopupService();
        let controller = new TestController();
        let contexts: IErrorMessageDisplayTriggerContext[] = [];
        testItem.register(controller, createContextFactory(controller, contexts));

        testItem.dispose();
        testItem.closePopups();

        expect(controller.closeCalls).toHaveLength(1);
        expect(controller.closeCalls[0]).toEqual({ context: contexts[0], delay: 0 });
    });

    test('Releases all registrations when a controller throws during disposal', () => {
        let testItem = new PopupService();
        let controller = new TestController();
        let closeError = new Error('Unable to close popup');
        controller.closeError = closeError;
        testItem.register(controller, createContextFactory(controller, []));

        expect(() => testItem.dispose()).toThrow(closeError);

        controller.closeError = null;
        testItem.closePopups();
        expect(controller.closeCalls).toHaveLength(1);
    });

    test('Does nothing when no controllers are registered', () => {
        let testItem = new PopupService();

        expect(() => testItem.dispose()).not.toThrow();
    });
});
