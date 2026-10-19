import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import {
    defaultAriaPopupShowsValidationErrors,
    PopupErrorMessageDisplayStaticUpdater
} from '../../src/Aria/PopupErrorMessageDisplayStaticUpdater';
import { ElementRole } from '../../src/Interfaces/Types';
import { setupFieldValueHostForTesting } from '../TestSupport/FieldValueHostTestFunctions';
import { FieldValueHost } from '@plblum/jivs-engine/build/ValueHosts/FieldValueHost';

/**
 * Creates a value-host fake whose localization service records requests and returns a configured result.
 * @param localizedText - Result returned by the fake localization service.
 */
function createValueHost(localizedText: string | null = 'Localized label'): {
    valueHost: IFieldValueHost,
    localizeCalls: Array<{ cultureId: string, l10nKey: string | null, fallback: string | null }>
}
{
    let localizeCalls: Array<{ cultureId: string, l10nKey: string | null, fallback: string | null }> = [];
    let valueHost = {
        valueHostsManager: {
            behaviors: { activeCultureId: 'fr-CA' },
            services: {
                errorMessagesService: {
                    localize: (cultureId: string, l10nKey: string | null, fallback: string | null): string | null => {
                        localizeCalls.push({ cultureId: cultureId, l10nKey: l10nKey, fallback: fallback });
                        return localizedText;
                    }
                }
            }
        }
    } as unknown as IFieldValueHost;
    return { valueHost: valueHost, localizeCalls: localizeCalls };
}

/**
 * Creates a DOM element and an updater configured with optional accessible-name text and localization key.
 * @param ariaLabel - Fallback text; defaults to the standard popup message.
 * @param ariaLabelL10n - Optional localization key.
 */
function setup(ariaLabel?: string | null, ariaLabelL10n?: string): {
    element: IJivsElement,
    testItem: PopupErrorMessageDisplayStaticUpdater
}
{
    return {
        element: document.createElement('div') as IJivsElement,
        testItem: new PopupErrorMessageDisplayStaticUpdater(ariaLabel ?? undefined, ariaLabelL10n)
    };
}

// PopupErrorMessageDisplayStaticUpdater establishes button semantics and uses the default localized accessible name.
describe('PopupErrorMessageDisplayStaticUpdater defaults', () => {
    test('Uses the default fallback and no localization key when constructed without options', () => {
        let { element, testItem } = setup();
        let { valueHost, localizeCalls } = createValueHost();

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(element.getAttribute('role')).toBe('button');
        expect(element.getAttribute('aria-label')).toBe('Localized label');
        expect(localizeCalls).toEqual([{
            cultureId: 'fr-CA',
            l10nKey: null,
            fallback: defaultAriaPopupShowsValidationErrors
        }]);
    });
    test('Uses the default accessible-name fallback when the constructor label is null', () => {
        let { element, testItem } = setup(null);
        let { valueHost, localizeCalls } = createValueHost();

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(localizeCalls[0].fallback).toBe(defaultAriaPopupShowsValidationErrors);
        expect(element.getAttribute('aria-label')).toBe('Localized label');
    });
});

// Popup labels may be customized and localized through the value host's active culture and error-message service.
describe('PopupErrorMessageDisplayStaticUpdater localization', () => {
    test('Passes the custom fallback and localization key to the localization service', () => {
        let { element, testItem } = setup('Display field issues', 'Popup.ShowIssues');
        let { valueHost, localizeCalls } = createValueHost('Afficher les erreurs');

        testItem.applyStaticAttributes(element, ElementRole.editor, valueHost);

        expect(localizeCalls).toEqual([{
            cultureId: 'fr-CA',
            l10nKey: 'Popup.ShowIssues',
            fallback: 'Display field issues'
        }]);
        expect(element.getAttribute('aria-label')).toBe('Afficher les erreurs');
    });
    test('Does not set aria-label when localization returns null', () => {
        let { element, testItem } = setup('Display field issues');
        let { valueHost } = createValueHost(null);

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(element.hasAttribute('aria-label')).toBe(false);
    });
    test('Does not set aria-label when localization returns an empty string', () => {
        let { element, testItem } = setup('Display field issues');
        let { valueHost } = createValueHost('');

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(element.hasAttribute('aria-label')).toBe(false);
    });
});

// Authored accessible names take precedence, and localization is skipped when the value host or a usable name is unavailable.
describe('PopupErrorMessageDisplayStaticUpdater authored accessible names', () => {
    test('Preserves an existing aria-label and does not request localization', () => {
        let { element, testItem } = setup();
        element.setAttribute('aria-label', 'Review details');
        let { valueHost, localizeCalls } = createValueHost();

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(element.getAttribute('aria-label')).toBe('Review details');
        expect(localizeCalls).toHaveLength(0);
    });
    test('Preserves aria-labelledby and does not add aria-label or request localization', () => {
        let { element, testItem } = setup();
        element.setAttribute('aria-labelledby', 'popup-trigger-name');
        let { valueHost, localizeCalls } = createValueHost();

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(element.getAttribute('aria-labelledby')).toBe('popup-trigger-name');
        expect(element.hasAttribute('aria-label')).toBe(false);
        expect(localizeCalls).toHaveLength(0);
    });
    test('Adds button role but no accessible name when the optional value host is absent', () => {
        let { element, testItem } = setup();

        testItem.applyStaticAttributes(element, ElementRole.error);

        expect(element.getAttribute('role')).toBe('button');
        expect(element.hasAttribute('aria-label')).toBe(false);
    });
    test('Preserves an existing empty aria-label and does not request localization', () => {
        let { element, testItem } = setup();
        element.setAttribute('aria-label', '');
        let { valueHost, localizeCalls } = createValueHost();

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(element.hasAttribute('aria-label')).toBe(true);
        expect(element.getAttribute('aria-label')).toBe('');
        expect(localizeCalls).toHaveLength(0);
    });
});

// The popup updater assigns button semantics only when a role is absent and preserves author-supplied roles.
describe('PopupErrorMessageDisplayStaticUpdater role', () => {
    test('Preserves an existing role', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', 'link');

        testItem.applyStaticAttributes(element, ElementRole.error);

        expect(element.getAttribute('role')).toBe('link');
    });
    test('Preserves an existing empty role attribute', () => {
        let { element, testItem } = setup();
        element.setAttribute('role', '');

        testItem.applyStaticAttributes(element, ElementRole.error);

        expect(element.hasAttribute('role')).toBe(true);
        expect(element.getAttribute('role')).toBe('');
    });
});

// The updater works with actual engine services, localization data, ValueHostsManager, and FieldValueHost objects.
describe('PopupErrorMessageDisplayStaticUpdater with real engine objects', () => {
    test('Uses the real ErrorMessagesService fallback for the default accessible name', () => {
        let { valueHostsManager, valueHost, errorMessagesService } = setupFieldValueHostForTesting();
        let element = document.createElement('button') as IJivsElement;
        let testItem = new PopupErrorMessageDisplayStaticUpdater();

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(valueHost).toBeInstanceOf(FieldValueHost);
        expect(valueHostsManager.services).toBe(valueHost.valueHostsManager.services);
        expect(valueHostsManager.services.errorMessagesService).toBe(errorMessagesService);
        expect(element.getAttribute('role')).toBe('button');
        expect(element.getAttribute('aria-label')).toBe(defaultAriaPopupShowsValidationErrors);
    });
    test('Uses a real localization registered for the active culture', () => {
        let { errorMessagesService, valueHost, valueHostsManager } =
            setupFieldValueHostForTesting(null, 'fr');
        errorMessagesService.register('Popup.ShowIssues', {
            en: 'Show validation errors',
            fr: 'Afficher les erreurs de validation'
        });
        let element = document.createElement('button') as IJivsElement;
        let testItem = new PopupErrorMessageDisplayStaticUpdater(
            'Display field issues',
            'Popup.ShowIssues'
        );

        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(valueHostsManager.behaviors.activeCultureId).toBe('fr');
        expect(element.getAttribute('aria-label')).toBe('Afficher les erreurs de validation');
    });
    test('Uses the real ErrorMessagesService fallback when a localization key is not registered', () => {
        let { errorMessagesService, valueHost } = setupFieldValueHostForTesting();
        let element = document.createElement('button') as IJivsElement;
        let testItem = new PopupErrorMessageDisplayStaticUpdater(
            'Custom fallback name',
            'Popup.MissingName'
        );

        expect(errorMessagesService.localize('en', 'Popup.MissingName', 'Custom fallback name'))
            .toBe('Custom fallback name');
        testItem.applyStaticAttributes(element, ElementRole.error, valueHost);

        expect(element.getAttribute('aria-label')).toBe('Custom fallback name');
    });
});
