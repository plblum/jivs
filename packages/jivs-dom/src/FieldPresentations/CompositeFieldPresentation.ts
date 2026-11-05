/**
 * CompositeFieldPresentation delegates one field presentation to named child presentations.
 * @module jivs-dom/FieldPresentations/ConcreteClasses/CompositeFieldPresentation
 */
import type { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import type { ValueHostValidationState } from '@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase';
import type { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import type { IAriaStaticUpdater, IAriaValidationStateUpdater } from '../Interfaces/AriaUpdaters';
import type { IFieldPresentation } from '../Interfaces/FieldPresentations';
import type { IJivsElement } from '../Interfaces/IJivsElement';
import type { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { ElementRole } from '../Interfaces/Types';

interface IChildPresentation
{
    name: string;
    presentation: IFieldPresentation;
    initialized: boolean;
}

/**
 * Combines presentations on one element while remaining its sole installed field presentation.
 * 
 * Use case:
 * Both InlineErrorMessageDisplayPresentation and TargetErrorMessageDisplayPresentation
 * can be used together on the same element. Inline shows the error messages within the element itself
 * while Target displays them in a separate target element like a status bar or notification window.
 *
 * Register a configured composite under an application-specific name:
 * ```ts
 * factory.register('InlineAndTargetErrors', element =>
 *     new CompositeFieldPresentation(element, ['inlineErrorMessageDisplay', 'targetErrorMessageDisplay']));
 * ```
 *
 * Children share the same element. Use at most one child that writes message content into it;
 * other children should add independent behavior, such as publishing target events.
 * For each ARIA updater type, the first child that returns an updater wins, so child order matters.
 */
export class CompositeFieldPresentation implements IFieldPresentation
{
    constructor(element: IJivsElement, childPresentationNames: string[])
    {
        assertNotNull(element, 'element');
        assertNotNull(childPresentationNames, 'childPresentationNames');
        this._element = element;
        this._childPresentationNames = [...childPresentationNames];
    }

    private _element?: IJivsElement;
    private readonly _childPresentationNames: string[];
    private _children?: IChildPresentation[];
    private _domServices?: IJivsDomServices;

    /**
     * Resolves all named children through the field presentation factory, then initializes them.
     * A child initialization failure is logged and that child is skipped for apply and ARIA updates.
     */
    public init(valueHostsManager: IValueHostsManager): void
    {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        if (this._children)
            return;

        let element = this.element;
        let domServices = valueHostsManager.services.domServices;
        assertNotNull(domServices, 'domServices');
        this._domServices = domServices;

        if (this._childPresentationNames.length === 0)
            throw new Error('CompositeFieldPresentation requires at least one child presentation name.');

        let children: IChildPresentation[] = [];
        try
        {
            for (const name of this._childPresentationNames)
            {
                if (!name || name.trim().length === 0)
                    throw new Error('CompositeFieldPresentation child presentation names must not be empty.');

                let presentation = domServices.fieldPresentationFactory.create(
                    element,
                    element.jivsElementRole ?? ElementRole.error,
                    name);
                if (!presentation)
                    throw new Error(`No field presentation was created for child name "${ name }".`);

                children.push({
                    name: name,
                    presentation: presentation,
                    initialized: false
                });
            }
        }
        catch (error)
        {
            this.disposeChildren(children);
            throw error;
        }

        this._children = children;
        for (const child of children)
        {
            try
            {
                child.presentation.init(valueHostsManager);
                child.initialized = true;
            }
            catch (error)
            {
                this.logChildFailure('init', child.name, error);
            }
        }
    }

    public apply(valueHost: IFieldValueHost, state: ValueHostValidationState): void
    {
        assertNotNull(valueHost, 'valueHost');
        let children = this.requireChildren();
        for (const child of children)
        {
            if (!child.initialized)
                continue;

            try
            {
                child.presentation.apply(valueHost, state);
            }
            catch (error)
            {
                this.logChildFailure('apply', child.name, error, valueHost);
            }
        }
    }

    /**
     * Returns the first static ARIA updater supplied by an initialized child.
     */
    public getStaticAriaUpdater(): IAriaStaticUpdater | null
    {
        for (const child of this._children ?? [])
        {
            if (!child.initialized)
                continue;

            try
            {
                let updater = child.presentation.getStaticAriaUpdater();
                if (updater)
                    return updater;
            }
            catch (error)
            {
                this.logChildFailure('getStaticAriaUpdater', child.name, error);
            }
        }
        return null;
    }

    /**
     * Returns the first validation-state ARIA updater supplied by an initialized child.
     */
    public getAriaValidationStateUpdater(): IAriaValidationStateUpdater | null
    {
        for (const child of this._children ?? [])
        {
            if (!child.initialized)
                continue;

            try
            {
                let updater = child.presentation.getAriaValidationStateUpdater();
                if (updater)
                    return updater;
            }
            catch (error)
            {
                this.logChildFailure('getAriaValidationStateUpdater', child.name, error);
            }
        }
        return null;
    }

    public dispose(): void
    {
        this.disposeChildren(this._children ?? []);
        this._children = undefined;
        this._domServices = undefined;
        this._element = undefined;
    }

    private get element(): IJivsElement
    {
        if (!this._element)
            throw new Error('CompositeFieldPresentation is disposed.');
        return this._element;
    }

    private requireChildren(): IChildPresentation[]
    {
        if (!this._children)
            throw new Error('CompositeFieldPresentation must be initialized before use.');
        return this._children;
    }

    private disposeChildren(children: IChildPresentation[]): void
    {
        for (const child of children)
        {
            try
            {
                child.presentation.dispose();
            }
            catch (error)
            {
                this.logChildFailure('dispose', child.name, error);
            }
        }
    }

    private logChildFailure(
        operation: string,
        childName: string,
        error: unknown,
        valueHost?: IFieldValueHost
    ): void
    {
        this._domServices?.loggingFacade.log(LoggingLevel.Error, facade =>
            facade.prepareLogDetails(
                `CompositeFieldPresentation could not ${ operation } child "${ childName }": ${ errorMessage(error) }`,
                this._element ?? null,
                valueHost,
                'CompositeFieldPresentation',
                childName));
    }
}

function errorMessage(error: unknown): string
{
    return error instanceof Error ? error.message : String(error);
}
