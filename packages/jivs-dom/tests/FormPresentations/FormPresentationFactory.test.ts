/** @jest-environment jsdom */
import type { IFormPresentation } from '../../src/Interfaces/FormPresentations';
import { ElementRole } from '../../src/Interfaces/Types';
import { FormPresentationFactory } from '../../src/FormPresentations/FormPresentationFactory';
import { ValidationSummaryPresentation } from '../../src/FormPresentations/ValidationSummaryPresentation';
import { MessageFrame } from '../../src/Presentations_common/MessageFrame';
import { createMockJivsDomServices } from '../TestSupport/MockJivsDomServices';

interface ISetup
{
    factory: FormPresentationFactory;
}

function setup(): ISetup
{
    let domServices = createMockJivsDomServices();
    return {
        factory: new FormPresentationFactory(domServices)
    };
}

// FormPresentationFactory specializes the common factory to create form-level presentations.
describe('FormPresentationFactory', () => {
    test('Creates a registered form presentation with the supplied element', () => {
        let { factory } = setup();
        let element = document.createElement('section');
        let messageFrame = new MessageFrame();
        let creatorElement: HTMLElement | undefined;
        factory.register('summary', candidate => {
            creatorElement = candidate;
            return new ValidationSummaryPresentation(candidate, messageFrame, {});
        });

        let result = factory.create(element, ElementRole.summary, 'SUMMARY');

        expect(result).toBeInstanceOf(ValidationSummaryPresentation);
        expect(creatorElement).toBe(element);
    });

    test('Uses a role default when the presentation name is omitted', () => {
        let { factory } = setup();
        let element = document.createElement('section');
        let messageFrame = new MessageFrame();
        let createdPresentation: IFormPresentation | undefined;
        let creatorElement: HTMLElement | undefined;
        factory.register('summary', candidate => {
            creatorElement = candidate;
            createdPresentation = new ValidationSummaryPresentation(candidate, messageFrame, {});
            return createdPresentation;
        });
        factory.setDefaultPresentationName(ElementRole.summary, 'summary');

        let result = factory.create(element, ElementRole.summary);

        expect(result).toBe(createdPresentation);
        expect(creatorElement).toBe(element);
    });
});
