/** @jest-environment jsdom */

import { LoggingLevel, LogDetails } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import type { IJivsDomServices } from '@plblum/jivs-dom/build/Interfaces/JivsDomServices';
import type { IErrorMessageDisplayController, IErrorMessageDisplayTriggerContext } from '@plblum/jivs-dom/build/Interfaces/ErrorMessageDisplayPresentation';
import type { IPopupContext } from '@plblum/jivs-dom/build/Interfaces/PopupErrorMessageDisplays';
import type { DomLoggingFacade } from '@plblum/jivs-dom/build/Utilities/DomLoggingFacade';
import type { Instance, ReferenceElement } from 'tippy.js';
import { TippyPopupMechanism } from '../src/TippyPopupMechanism';

class RecordingController implements IErrorMessageDisplayController
{
    public closedCalls: number = 0;

    public open(_context: IErrorMessageDisplayTriggerContext, _delay: number): void
    {
    }

    public opened(): void
    {
    }

    public close(_context: IErrorMessageDisplayTriggerContext, _delay: number): void
    {
    }

    public closed(): void
    {
        this.closedCalls++;
    }

    public toggle(_context: IErrorMessageDisplayTriggerContext, _openDelay: number, _closeDelay: number): void
    {
    }

    public cancelDelayedClose(): void
    {
    }
}

interface RecordedLog
{
    level: LoggingLevel;
    message: string;
}

function attachLogSink(context: IPopupContext, records: RecordedLog[]): void
{
    let loggingFacade = {
        log: (level: LoggingLevel, gatherFn: (facade: DomLoggingFacade) => LogDetails): void =>
        {
            let facade = {
                prepareLogDetails: (message: string): LogDetails => ({ message: message })
            } as unknown as DomLoggingFacade;
            records.push({ level: level, message: gatherFn(facade).message });
        }
    };
    context.domServices = { loggingFacade: loggingFacade } as unknown as IJivsDomServices;
}

function setPopupElements(context: IPopupContext, anchor: HTMLElement, message: HTMLElement): void
{
    context.anchorElement = anchor;
    context.messageFrameContent = message;
    context.controller = new RecordingController();
}

// These tests verify Tippy lifecycle integration and cleanup at the IPopupMechanism boundary.
describe('TippyPopupMechanism', () =>
{
    beforeEach(() =>
    {
        document.body.innerHTML = '';
    });

    afterEach(() =>
    {
        document.body.innerHTML = '';
    });

    // The adapter must present Jivs-DOM's content at its anchor without taking over opening triggers.
    test('open uses the supplied content and anchor and reserves Tippy trigger properties', () =>
    {
        let mechanism = new TippyPopupMechanism();
        let anchor = document.createElement('button');
        let message = document.createElement('div');
        message.textContent = 'Enter a valid value';
        document.body.append(anchor);
        let context = mechanism.createContext({
            placement: 'right',
            trigger: 'mouseenter',
            triggerTarget: document.body,
            content: 'not the Jivs message',
            showOnCreate: false
        });
        setPopupElements(context, anchor, message);

        expect(mechanism.open(context)).toBe(true);

        let instance = (anchor as ReferenceElement)._tippy;
        expect(instance).toBeDefined();
        expect(instance?.props.trigger).toBe('manual');
        expect(instance?.props.showOnCreate).toBe(true);
        expect(instance?.props.triggerTarget).toBeNull();
        expect(instance?.props.placement).toBe('right');
        expect(instance?.popper.querySelector('.tippy-content')?.firstElementChild).toBe(message);
        expect(instance?.state.isVisible).toBe(true);

        expect(mechanism.close(context)).toBe(true);
        context.dispose();
        expect(instance?.state.isDestroyed).toBe(true);
        expect(instance && document.body.contains(instance.popper)).toBe(false);
    });

    // Tippy-initiated closure must update Jivs-DOM once while retaining any consumer onHidden callback.
    test('composes onHidden and notifies the controller only once', () =>
    {
        let mechanism = new TippyPopupMechanism();
        let anchor = document.createElement('button');
        let message = document.createElement('div');
        document.body.append(anchor);
        let userHiddenCalls = 0;
        let context = mechanism.createContext({
            duration: 0,
            onHidden: () => userHiddenCalls++
        });
        setPopupElements(context, anchor, message);
        let controller = context.controller as RecordingController;
        expect(mechanism.open(context)).toBe(true);

        let instance = (anchor as ReferenceElement)._tippy as Instance;
        instance.props.onHidden(instance);
        instance.props.onHidden(instance);

        expect(userHiddenCalls).toBe(2);
        expect(controller.closedCalls).toBe(1);
        instance.props.onHidden(instance);
        expect(userHiddenCalls).toBe(3);
        expect(controller.closedCalls).toBe(1);
        context.dispose();
    });

    // Bad context data and Tippy initialization errors must fail explicitly and be logged when services exist.
    test('returns false and logs missing elements and Tippy initialization errors', () =>
    {
        let mechanism = new TippyPopupMechanism();
        let logs: RecordedLog[] = [];
        let missingElementsContext = mechanism.createContext();
        attachLogSink(missingElementsContext, logs);

        expect(mechanism.open(missingElementsContext)).toBe(false);
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe(LoggingLevel.Error);
        expect(logs[0].message).toContain('without an anchor element and message content');
        missingElementsContext.dispose();

        let contextWithoutServices = mechanism.createContext();
        expect(mechanism.open(contextWithoutServices)).toBe(false);
        contextWithoutServices.dispose();

        let anchor = document.createElement('button');
        let message = document.createElement('div');
        document.body.append(anchor);
        let partialInstance: { value: Instance | null } = { value: null };
        let failingContext = mechanism.createContext({
            onCreate: (instance: Instance) =>
            {
                partialInstance.value = instance;
                throw new Error('test initialization failure');
            }
        });
        setPopupElements(failingContext, anchor, message);
        attachLogSink(failingContext, logs);

        expect(mechanism.open(failingContext)).toBe(false);
        expect(partialInstance.value).not.toBeNull();
        expect(partialInstance.value?.state.isDestroyed).toBe(true);
        expect(logs).toHaveLength(2);
        expect(logs[1].level).toBe(LoggingLevel.Error);
        expect(logs[1].message).toContain('test initialization failure');
    });

    // Close failures must be logged and reported so Jivs-DOM can retain the popup for another attempt.
    test('returns false and logs when Tippy hide fails', () =>
    {
        let mechanism = new TippyPopupMechanism();
        let anchor = document.createElement('button');
        document.body.append(anchor);
        let context = mechanism.createContext();
        setPopupElements(context, anchor, document.createElement('div'));
        let logs: RecordedLog[] = [];
        attachLogSink(context, logs);
        expect(mechanism.open(context)).toBe(true);

        let instance = (anchor as ReferenceElement)._tippy as Instance;
        instance.hide = () =>
        {
            throw new Error('test close failure');
        };

        expect(mechanism.close(context)).toBe(false);
        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe(LoggingLevel.Error);
        expect(logs[0].message).toContain('test close failure');
        context.dispose();
    });

    // Invalid and repeated lifecycle calls should not create or close unrelated Tippy instances.
    test('rejects foreign and already-opened contexts and treats an unopened context as closed', () =>
    {
        let mechanism = new TippyPopupMechanism();
        let foreignContext = {
            anchorElement: null,
            messageFrameContent: null,
            controller: null,
            domServices: null,
            dispose: () => undefined
        } as unknown as IPopupContext;
        let foreignLogs: RecordedLog[] = [];
        attachLogSink(foreignContext, foreignLogs);
        expect(mechanism.open(foreignContext)).toBe(false);
        expect(mechanism.close(foreignContext)).toBe(false);
        expect(foreignLogs).toHaveLength(2);
        expect(foreignLogs.every((log) => log.level === LoggingLevel.Error)).toBe(true);

        let anchor = document.createElement('button');
        document.body.append(anchor);
        let context = mechanism.createContext();
        setPopupElements(context, anchor, document.createElement('div'));
        let logs: RecordedLog[] = [];
        attachLogSink(context, logs);
        expect(mechanism.open(context)).toBe(true);
        expect(mechanism.open(context)).toBe(false);
        expect(logs).toHaveLength(1);
        expect(logs[0].message).toContain('more than once');
        context.dispose();

        let unopenedContext = mechanism.createContext();
        expect(mechanism.close(unopenedContext)).toBe(true);
        unopenedContext.dispose();
    });

    // Context disposal should release its Tippy instance and references even if Tippy destruction fails.
    test('logs Tippy destroy failures and still disposes its popup context', () =>
    {
        let mechanism = new TippyPopupMechanism();
        let anchor = document.createElement('button');
        document.body.append(anchor);
        let context = mechanism.createContext();
        setPopupElements(context, anchor, document.createElement('div'));
        let logs: RecordedLog[] = [];
        attachLogSink(context, logs);
        expect(mechanism.open(context)).toBe(true);

        let instance = (anchor as ReferenceElement)._tippy as Instance;
        instance.destroy = () =>
        {
            throw new Error('test destroy failure');
        };

        context.dispose();

        expect(logs).toHaveLength(1);
        expect(logs[0].level).toBe(LoggingLevel.Error);
        expect(logs[0].message).toContain('test destroy failure');
        expect(context.anchorElement).toBeNull();
        context.dispose();
    });

    // Reentrant disposal during Tippy initialization must destroy the instance once creation returns.
    test('destroys a Tippy instance when its context is disposed during creation', () =>
    {
        let mechanism = new TippyPopupMechanism();
        let anchor = document.createElement('button');
        document.body.append(anchor);
        let context: IPopupContext;
        let createdInstance: { value: Instance | null } = { value: null };
        context = mechanism.createContext({
            onCreate: (instance: Instance) =>
            {
                createdInstance.value = instance;
                context.dispose();
            }
        });
        setPopupElements(context, anchor, document.createElement('div'));

        expect(mechanism.open(context)).toBe(false);
        expect(createdInstance.value).not.toBeNull();
        expect(createdInstance.value?.state.isDestroyed).toBe(true);
    });

    // The presentation owns contexts, so mechanism disposal must not destroy their Tippy instances.
    test('mechanism disposal leaves popup contexts to their presentation owner', () =>
    {
        let mechanism = new TippyPopupMechanism();
        let anchors = [document.createElement('button'), document.createElement('button')];
        let contexts = anchors.map((anchor) =>
        {
            document.body.append(anchor);
            let context = mechanism.createContext();
            setPopupElements(context, anchor, document.createElement('div'));
            expect(mechanism.open(context)).toBe(true);
            return context;
        });
        let instances = anchors.map((anchor) => (anchor as ReferenceElement)._tippy as Instance);

        mechanism.dispose();

        expect(instances.every((instance) => !instance.state.isDestroyed)).toBe(true);
        expect(contexts.every((context) => context.anchorElement !== null)).toBe(true);
        contexts.forEach((context) => context.dispose());
        expect(instances.every((instance) => instance.state.isDestroyed)).toBe(true);
        expect(contexts.every((context) => context.anchorElement === null)).toBe(true);
    });
});
