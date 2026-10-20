/** @jest-environment jsdom */
import type { IErrorMessageDisplayController } from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import { IPopupContext } from '../../src/Interfaces/PopupErrorMessageDisplays';
import { PopupContext } from '../../src/FieldPresentations/PopupContext';
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

// Popup contexts begin empty so the presentation can populate them during setup and opening.
describe('PopupContext defaults', () => {
    test('Initializes all popup-owned references to null', () => {
        let context = new PopupContext();

        expect(context.messageFrameContent).toBeNull();
        expect(context.anchorElement).toBeNull();
        expect(context.controller).toBeNull();
        expect(context.domServices).toBeNull();
    });
});

// Popup mechanisms and presentations share mutable references through the common popup context contract.
describe('PopupContext properties', () => {
    test('Retains assigned content, anchor, controller, and DOM services', () => {
        let context: IPopupContext = new PopupContext();
        let messageFrameContent = document.createElement('section');
        let anchorElement = document.createElement('input');
        let controller = createController();
        let domServices: IJivsDomServices = createMockJivsDomServices();

        context.messageFrameContent = messageFrameContent;
        context.anchorElement = anchorElement;
        context.controller = controller;
        context.domServices = domServices;

        expect(context.messageFrameContent).toBe(messageFrameContent);
        expect(context.anchorElement).toBe(anchorElement);
        expect(context.controller).toBe(controller);
        expect(context.domServices).toBe(domServices);
    });
});

// Disposing a popup context releases every reference that could retain UI or presentation state.
describe('PopupContext.dispose', () => {
    test('Clears all assigned references', () => {
        let context = new PopupContext();
        context.messageFrameContent = document.createElement('section');
        context.anchorElement = document.createElement('input');
        context.controller = createController();
        context.domServices = createMockJivsDomServices();

        context.dispose();

        expect(context.messageFrameContent).toBeNull();
        expect(context.anchorElement).toBeNull();
        expect(context.controller).toBeNull();
        expect(context.domServices).toBeNull();
    });

    test('Can be disposed more than once', () => {
        let context = new PopupContext();

        expect(() => {
            context.dispose();
            context.dispose();
        }).not.toThrow();

        expect(context.messageFrameContent).toBeNull();
        expect(context.anchorElement).toBeNull();
        expect(context.controller).toBeNull();
        expect(context.domServices).toBeNull();
    });
});
