/** @jest-environment jsdom */
import type { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { CodingError } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IJivsElement } from '../../src/Interfaces/IJivsElement';
import type { IJivsDomServices } from '../../src/Interfaces/JivsDomServices';
import type { IPresentationFactory } from '../../src/Interfaces/Presentations_common';
import { ElementRole } from '../../src/Interfaces/Types';
import { PresentationFactoryBase } from '../../src/Presentations_common/PresentationFactoryBase';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';
import { RecordingLoggingService } from '../TestSupport/mocks';

class TestPresentationFactory extends PresentationFactoryBase<IJivsElement>
{
    public getDefaultPresentationName(role: ElementRole | string): string | undefined
    {
        return this.defaultPresentations.get(role);
    }

    public setLazyRegistration(
        registrationFunction: (factory: IPresentationFactory<IJivsElement>) => void
    ): void
    {
        this.lazyRegistration(registrationFunction);
    }
}

function setup(): {
    domServices: IJivsDomServices,
    logger: RecordingLoggingService,
    factory: TestPresentationFactory
}
{
    let logger = new RecordingLoggingService();
    let domServices = createMockJivsDomServices({
        services: { loggingService: logger } as unknown as IJivsServices
    });
    return {
        domServices: domServices,
        logger: logger,
        factory: new TestPresentationFactory(domServices)
    };
}

function createElement(): IJivsElement
{
    return document.createElement('div');
}

// Registrations are case-insensitive, replace prior creators, and receive the element being created.
describe('PresentationFactoryBase.register and create', () => {
    test('Creates from a named registration without changing the supplied element', () => {
        let { factory } = setup();
        let element = createElement();
        let createdElement: IJivsElement | undefined;
        factory.register('Compact', candidate => {
            createdElement = candidate;
            return candidate;
        });

        let result = factory.create(element, ElementRole.editor, 'COMPACT');

        expect(result).toBe(element);
        expect(createdElement).toBe(element);
    });

    test('Uses the latest creator registered under a case-insensitive name', () => {
        let { factory } = setup();
        let firstElement = createElement();
        let secondElement = createElement();
        factory.register('compact', () => firstElement);
        factory.register('COMPACT', () => secondElement);

        expect(factory.create(createElement(), ElementRole.editor, 'Compact')).toBe(secondElement);
    });

    test('Rejects null or undefined names and creators', () => {
        let { factory } = setup();
        let creator = (element: IJivsElement) => element;

        expect(() => factory.register(null as unknown as string, creator))
            .toThrow(new CodingError('presentationName required'));
        expect(() => factory.register(undefined as unknown as string, creator))
            .toThrow(new CodingError('presentationName required'));
        expect(() => factory.register('named', null as unknown as typeof creator))
            .toThrow(new CodingError('creator required'));
        expect(() => factory.register('named', undefined as unknown as typeof creator))
            .toThrow(new CodingError('creator required'));
    });
});

// Defaults are resolved by role only when no explicit presentation name is supplied.
describe('PresentationFactoryBase defaults', () => {
    test('Creates using the role default when the presentation name is omitted or null', () => {
        let { factory } = setup();
        let expected = createElement();
        factory.register('default-editor', () => expected);
        factory.setDefaultPresentationName(ElementRole.editor, 'DEFAULT-EDITOR');

        expect(factory.create(createElement(), ElementRole.editor)).toBe(expected);
        expect(factory.create(createElement(), ElementRole.editor, null)).toBe(expected);
    });

    test('Exposes the configured role default to subclasses', () => {
        let { factory } = setup();
        factory.setDefaultPresentationName(ElementRole.editor, 'Default-Editor');

        expect(factory.getDefaultPresentationName(ElementRole.editor)).toBe('default-editor');
    });

    test('Uses an explicit presentation name in preference to the role default', () => {
        let { factory } = setup();
        let defaultElement = createElement();
        let explicitElement = createElement();
        factory.register('default', () => defaultElement);
        factory.register('specific', () => explicitElement);
        factory.setDefaultPresentationName(ElementRole.editor, 'default');

        expect(factory.create(createElement(), ElementRole.editor, 'SPECIFIC')).toBe(explicitElement);
    });

    test('Rejects null or undefined roles and default presentation names', () => {
        let { factory } = setup();

        expect(() => factory.setDefaultPresentationName(null as unknown as ElementRole, 'named'))
            .toThrow(new CodingError('role required'));
        expect(() => factory.setDefaultPresentationName(undefined as unknown as ElementRole, 'named'))
            .toThrow(new CodingError('role required'));
        expect(() => factory.setDefaultPresentationName(ElementRole.editor, null as unknown as string))
            .toThrow(new CodingError('presentationName required'));
        expect(() => factory.setDefaultPresentationName(ElementRole.editor, undefined as unknown as string))
            .toThrow(new CodingError('presentationName required'));
    });
});

// Lazy registration waits for first use and can safely register its own creators and defaults.
describe('PresentationFactoryBase.lazyRegistration', () => {
    test('Runs once on first access and allows registration within the callback', () => {
        let { factory } = setup();
        let calls = 0;
        let expected = createElement();
        factory.setLazyRegistration(registrationFactory => {
            calls++;
            registrationFactory.register('lazy-editor', () => expected);
            registrationFactory.setDefaultPresentationName(ElementRole.editor, 'lazy-editor');
        });

        expect(calls).toBe(0);
        expect(factory.create(createElement(), ElementRole.editor)).toBe(expected);
        expect(factory.create(createElement(), ElementRole.editor)).toBe(expected);
        expect(calls).toBe(1);
    });

    test('The most recently supplied lazy callback is used', () => {
        let { factory } = setup();
        let firstCalls = 0;
        let secondCalls = 0;
        factory.setLazyRegistration(() => firstCalls++);
        factory.setLazyRegistration(() => secondCalls++);

        factory.register('named', element => element);

        expect(firstCalls).toBe(0);
        expect(secondCalls).toBe(1);
    });
});

// Failed lookups log the requested error before throwing an actionable exception.
describe('PresentationFactoryBase failed lookups', () => {
    test('Logs and returns null when no default is configured for the role', () => {
        let { factory, logger } = setup();

        expect(factory.create(createElement(), ElementRole.editor)).toBeNull();

        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0]).toMatchObject({
            level: LoggingLevel.Debug,
            details: {
                message: 'No default presentation registered for role: editor',
                feature: 'Dom',
                identity: 'TestPresentationFactory'
            }
        });
    });

    test('Logs and throws when the selected presentation name is not registered', () => {
        let { factory, logger } = setup();

        expect(() => factory.create(createElement(), ElementRole.editor, 'missing'))
            .toThrow('No field presentation registered for name: missing');

        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0]).toMatchObject({
            level: LoggingLevel.Error,
            details: {
                message: 'No field presentation registered for name: missing',
                feature: 'Dom',
                identity: 'TestPresentationFactory'
            }
        });
    });
});
