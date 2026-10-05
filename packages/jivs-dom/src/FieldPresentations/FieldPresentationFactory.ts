/**
 * FieldPresentationFactory is responsible for managing the registration and creation of field presentations.
 * It allows for the registration of field presentation creators, setting default presentations for element roles,
 * and creating field presentations based on the role and presentation name.
 * 
 * @module jivs-dom/FieldPresentations/ConcreteClasses/FieldPresentationFactory
 */

import { IFieldPresentation } from '../Interfaces/FieldPresentations';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { IPresentationFactory } from '../Interfaces/Presentations_common'
import { PresentationFactoryBase } from '../Presentations_common/PresentationFactoryBase';
import { defaultTextInputPresentationName, TextInputPresentation } from './TextInputPresentation';
import { defaultCheckboxPresentationName, CheckboxPresentation } from './CheckboxPresentation';
import { defaultSelectPresentationName, SelectPresentation } from './SelectPresentation';
import { defaultRadioButtonsPresentationName, RadioButtonsPresentation } from './RadioButtonsPresentation';
import { defaultTextAreaPresentationName, TextAreaPresentation } from './TextAreaPresentation';
import { defaultFileInputPresentationName, FileInputPresentation } from './FileInputPresentation';
import { ContainerRadioButtonsPresentation, defaultContainerRadioButtonsPresentationName } from './ContainerRadioButtonsPresentation';
import { ContainerCheckboxPresentation, defaultContainerCheckboxPresentationName } from './ContainerCheckboxPresentation';
import { ContainerSelectPresentation, defaultContainerSelectPresentationName } from './ContainerSelectPresentation';
import { ContainerTextAreaPresentation, defaultContainerTextAreaPresentationName } from './ContainerTextAreaPresentation';
import { ContainerTextInputPresentation, defaultContainerTextInputPresentationName } from './ContainerTextInputPresentation';
import { ContainerFileInputPresentation, defaultContainerFileInputPresentationName } from './ContainerFileInputPresentation';
import { defaultLabelPresentationName, LabelPresentation } from './LabelPresentation';
import { ElementRole } from '../Interfaces/Types';
import { defaultRequiredIndicatorPresentationName, RequiredIndicatorPresentation } from './RequiredIndicatorPresentation';

/**
 * Factory class for creating field presentations (implementations of IFieldPresentation)
 * All FieldPresentations are associated with a presentation name.
 * The factory handles registration and creation of field presentations based on their presentation names.
 * It also manages default presentation names for different element roles.
 * 
 * It is consumed by the FieldPresentationInstaller.
 */
export class FieldPresentationFactory extends PresentationFactoryBase<IFieldPresentation>
{
    constructor(domServices: IJivsDomServices)
    {
        super(domServices);
        this.lazyRegistration(factory => this.defaultFactoryRegistrations(factory));
    }

    /**
     * The default factory registrations for field presentations.
     * To expand or replace, use lazyRegistration().
     * 
     * If you want these to be installed and offer replacements by name, do this:
     * ```ts
     * factory.lazyRegistration(factory => {
     * // order is important: default registrations first, then custom ones
     *     factory.defaultFactoryRegistrations(factory);
     *     factory.register(PresentationName, (element) => new PresentationType(element));
     * });
     * ```
     * @param factory 
     */
    public defaultFactoryRegistrations(factory: IPresentationFactory<IFieldPresentation>): void
    {
        // Register default field presentations here
        factory.register(defaultTextInputPresentationName, (element) => new TextInputPresentation(element));
        factory.register(defaultCheckboxPresentationName, (element) => new CheckboxPresentation(element));
        factory.register(defaultRadioButtonsPresentationName, (element) => new RadioButtonsPresentation(element));
        factory.register(defaultSelectPresentationName, (element) => new SelectPresentation(element));
        factory.register(defaultTextAreaPresentationName, (element) => new TextAreaPresentation(element));
        factory.register(defaultFileInputPresentationName, (element) => new FileInputPresentation(element));
        factory.register(defaultContainerTextInputPresentationName, (element) => new ContainerTextInputPresentation(element));
        factory.register(defaultContainerCheckboxPresentationName, (element) => new ContainerCheckboxPresentation(element));
        factory.register(defaultContainerRadioButtonsPresentationName, (element) => new ContainerRadioButtonsPresentation(element));
        factory.register(defaultContainerSelectPresentationName, (element) => new ContainerSelectPresentation(element));
        factory.register(defaultContainerTextAreaPresentationName, (element) => new ContainerTextAreaPresentation(element));
        factory.register(defaultContainerFileInputPresentationName, (element) => new ContainerFileInputPresentation(element));

        factory.register(defaultLabelPresentationName, (element) => new LabelPresentation(element));
        factory.register(defaultRequiredIndicatorPresentationName, (element) => new RequiredIndicatorPresentation(element));

        // fallbacks for when no specific presentation is registered for an element role
        factory.setDefaultPresentationName(ElementRole.editor, defaultTextInputPresentationName);
        factory.setDefaultPresentationName(ElementRole.label, defaultLabelPresentationName);
        factory.setDefaultPresentationName(ElementRole.required, defaultRequiredIndicatorPresentationName);

    }
}