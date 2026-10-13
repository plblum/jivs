import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IErrorMessageDisplayController, IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsDomElement } from '../Interfaces/IJivsDomElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';

export class ErrorMessageDisplayTriggerContext implements IErrorMessageDisplayTriggerContext
{
    constructor(
        anchorElement: IJivsDomElement,
        domServices: IJivsDomServices,
        valueHost: IFieldValueHost,
        controller: IErrorMessageDisplayController
    ) 
    {
        this._anchorElement = anchorElement;
        this._domServices = domServices;
        this._valueHost = valueHost;
        this._controller = controller;
    }
    public get anchorElement(): IJivsDomElement
    {
        return this._anchorElement!;
    }
    public get domServices(): IJivsDomServices
    {
        return this._domServices!;
    }
    public get valueHost(): IFieldValueHost
    {
        return this._valueHost!;
    }
    public get controller(): IErrorMessageDisplayController
    {
        return this._controller!;
    }
    private _anchorElement?: IJivsDomElement;
    private _domServices?: IJivsDomServices;
    private _valueHost?: IFieldValueHost;
    private _controller?: IErrorMessageDisplayController;

    public get issuesFound(): IssueFound[] | null
    {
        return this._issuesFound;
    }
    public set issuesFound(value: IssueFound[] | null)
    {
        this._issuesFound = value;
    }
    private _issuesFound: IssueFound[] | null = null;

    public dispose(): void
    {
        this._valueHost = undefined;
        this._anchorElement = undefined;
        this._domServices = undefined;
        this._controller = undefined;
        this._issuesFound = null;
    }
}