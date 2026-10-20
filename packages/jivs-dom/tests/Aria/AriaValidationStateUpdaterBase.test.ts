/** @jest-environment jsdom */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import { AriaValidationStateUpdaterBase } from '../../src/Aria/AriaValidationStateUpdaterBase';

/**
 * Exposes the default ARIA host resolution while providing the required abstract method.
 */
class Publicify_AriaValidationStateUpdaterBase extends AriaValidationStateUpdaterBase
{
    public applyValidationState(
        element: IJivsElement,
        valueHost: IFieldValueHost,
        state: ValueHostValidationState,
        errorMessageId?: string
    ): void
    {
    }

    public publicify_resolvingAriaHostElement(element: IJivsElement): IJivsElement
    {
        return this.resolvingAriaHostElement(element);
    }
}

// The default validation-state ARIA host is the exact element supplied by the caller.
describe('AriaValidationStateUpdaterBase.resolvingAriaHostElement', () => {
    test('Returns the supplied element unchanged', () => {
        let element = document.createElement('input') as IJivsElement;
        let testItem = new Publicify_AriaValidationStateUpdaterBase();

        expect(testItem.publicify_resolvingAriaHostElement(element)).toBe(element);
    });
    test('Returns a containing element unchanged when it is supplied as the ARIA host', () => {
        let container = document.createElement('div') as IJivsElement;
        let testItem = new Publicify_AriaValidationStateUpdaterBase();

        expect(testItem.publicify_resolvingAriaHostElement(container)).toBe(container);
    });
});
