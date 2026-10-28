/** @jest-environment jsdom */
import { EmulatedPopupMechanism, EmulatedPopupContext } from './EmulatedPopupMechanism';
import { installPopupForm } from './FieldFeedbackExpectations';
import { useCleanDocument } from './TestFileSupport';
import type { IErrorMessageDisplayController } from '../../../src/Interfaces/ErrorMessageDisplayPresentation';

useCleanDocument();

/** Stands in for the PopupErrorMessageDisplayPresentation. Counts the notifications it receives. */
class RecordingController implements IErrorMessageDisplayController
{
    public closedCalls: number = 0;
    public open(): void { }
    public opened(): void { }
    public close(): void { }
    public closed(): void { this.closedCalls++; }
    public toggle(): void { }
    public cancelDelayedClose(): void { }
}

function openPopup(mechanism: EmulatedPopupMechanism, text: string, controller = new RecordingController()):
    { context: EmulatedPopupContext, controller: RecordingController }
{
    let context = mechanism.createContext() as EmulatedPopupContext;
    context.controller = controller;
    context.anchorElement = document.body;
    context.messageFrameContent = document.createElement('div');
    context.messageFrameContent.textContent = text;
    expect(mechanism.open(context)).toBe(true);
    return { context, controller };
}

// open() builds the visible popup from what the presentation supplies and fails cleanly when it is incomplete.
describe('EmulatedPopupMechanism open', () =>
{
    test('Puts the message frame content in a wrapper on the document, and tracks it as open', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        let { context } = openPopup(mechanism, 'MSG-1');

        expect(context.wrapper!.parentElement).toBe(document.body);
        expect(context.wrapper!.classList.contains('emulated-popup')).toBe(true);
        expect(context.wrapper!.firstElementChild).toBe(context.messageFrameContent);
        expect(mechanism.popupTextFor(context)).toBe('MSG-1');
        expect(mechanism.openPopups).toEqual([context]);
        expect(mechanism.openCount).toBe(1);
    });

    test('Returns false and adds nothing to the document when the anchor is missing', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        let context = mechanism.createContext() as EmulatedPopupContext;
        context.messageFrameContent = document.createElement('div');

        expect(mechanism.open(context)).toBe(false);
        expect(document.querySelector('.emulated-popup')).toBeNull();
        expect(mechanism.openCount).toBe(0);
    });

    test('Returns false when the message frame content is missing', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        let context = mechanism.createContext() as EmulatedPopupContext;
        context.anchorElement = document.body;

        expect(mechanism.open(context)).toBe(false);
        expect(document.querySelector('.emulated-popup')).toBeNull();
    });

    test('Each createContext returns a fresh context', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        let first = mechanism.createContext();
        let second = mechanism.createContext();
        expect(first).not.toBe(second);
        expect(mechanism.createdContexts.length).toBe(2);
    });
});

// close() is the presentation's request. The mechanism removes the popup and, by default, stays silent
// because a request is not a vendor dismissal. notifyClosedDuringClose emulates a library that is not silent.
describe('EmulatedPopupMechanism close', () =>
{
    test('Removes the popup and does not notify the controller by default', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        let { context, controller } = openPopup(mechanism, 'MSG');

        expect(mechanism.close(context)).toBe(true);

        expect(document.querySelector('.emulated-popup')).toBeNull();
        expect(mechanism.openPopups).toEqual([]);
        expect(mechanism.closeCount).toBe(1);
        expect(controller.closedCalls).toBe(0);
    });

    test('With notifyClosedDuringClose, notifies the controller once before returning', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        mechanism.notifyClosedDuringClose = true;
        let { context, controller } = openPopup(mechanism, 'MSG');

        mechanism.close(context);

        expect(controller.closedCalls).toBe(1);
        expect(mechanism.openPopups).toEqual([]);
    });
});

// closeFromMechanism is the test's way to make the library dismiss its own popup.
describe('EmulatedPopupMechanism closeFromMechanism', () =>
{
    test('Removes the most recent popup and notifies its controller once', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        let first = openPopup(mechanism, 'A');
        let second = openPopup(mechanism, 'B');

        mechanism.closeFromMechanism();

        expect(mechanism.openPopups).toEqual([first.context]);
        expect(second.controller.closedCalls).toBe(1);
        expect(first.controller.closedCalls).toBe(0);
    });

    test('A given context is closed instead of the most recent', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        let first = openPopup(mechanism, 'A');
        let second = openPopup(mechanism, 'B');

        mechanism.closeFromMechanism(first.context);

        expect(mechanism.openPopups).toEqual([second.context]);
        expect(first.controller.closedCalls).toBe(1);
    });

    test('Throws when no popup is open', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        expect(() => mechanism.closeFromMechanism()).toThrow('no popup is open');
    });
});

// Disposal is how the presentation and the service clean up what the mechanism created.
describe('EmulatedPopupMechanism disposal', () =>
{
    test('Context dispose removes its popup and clears the shared references', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        let { context } = openPopup(mechanism, 'MSG');

        context.dispose();

        expect(document.querySelector('.emulated-popup')).toBeNull();
        expect(context.wrapper).toBeNull();
        expect(context.controller).toBeNull();
        expect(context.anchorElement).toBeNull();
        expect(context.messageFrameContent).toBeNull();
        expect(context.disposeCalls).toBe(1);
    });

    test('Mechanism dispose removes popups left behind', () =>
    {
        let mechanism = new EmulatedPopupMechanism();
        openPopup(mechanism, 'A');
        openPopup(mechanism, 'B');

        mechanism.dispose();

        expect(document.querySelectorAll('.emulated-popup').length).toBe(0);
        expect(mechanism.openPopups).toEqual([]);
    });
});

// installPopupForm wires the emulator and a popup error display into a form installed like a live page.
describe('installPopupForm', () =>
{
    test('Assigns the emulator to the services and installs a popup error display on the field', () =>
    {
        let { t, popup } = installPopupForm({ fields: ['Text_Required'] });

        expect(t.services.domServices.popupMechanism).toBe(popup);
        let error = t.element('error', 'Text_Required');
        expect(error.classList.contains('jivs-popuperrormessagedisplay')).toBe(true);
        expect(popup.openPopups).toEqual([]);
        expect(t.services.loggingService.entryCount).toBe(0);
    });
});
