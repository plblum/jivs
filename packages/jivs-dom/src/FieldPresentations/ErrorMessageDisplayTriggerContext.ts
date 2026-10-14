import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { IErrorMessageDisplayController, IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IJivsElement } from '../Interfaces/IJivsElement';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';
import { IssueFound } from '@plblum/jivs-engine/build/Interfaces/Validation';

export class ErrorMessageDisplayTriggerContext implements IErrorMessageDisplayTriggerContext
{
    constructor(
        jivsElement: IJivsElement,
        domServices: IJivsDomServices,
        valueHost: IFieldValueHost,
        controller: IErrorMessageDisplayController
    ) 
    {
        this._jivsElement = jivsElement;
        this._domServices = domServices;
        this._valueHost = valueHost;
        this._controller = controller;
    }
    public get jivsElement(): IJivsElement
    {
        return this._jivsElement!;
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
    private _jivsElement?: IJivsElement;
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
        this._jivsElement = undefined;
        this._domServices = undefined;
        this._controller = undefined;
        this._issuesFound = null;
    }
}