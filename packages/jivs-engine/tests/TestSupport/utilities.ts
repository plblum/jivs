import { CultureIdFallback } from "../../src/Interfaces/DataTypeFormatterService";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { registerDataTypeIdentifiers, registerDataTypeFormatters } from "./createValidationServices";


export function populateServicesWithManyCultures(services: IValidationServices, activeCultureId: string, registerFormatters: boolean = false): void {
    services.activeCultureId = activeCultureId;

    let dtis = new DataTypeIdentifierService();
    services.dataTypeIdentifierService = dtis;

    registerDataTypeIdentifiers(dtis);   // always
    if (registerFormatters) {
        let ccs = createCultureIdFallbacksForEn();
        let dtfs = new DataTypeFormatterService(ccs);
        services.dataTypeFormatterService = dtfs;
        dtfs.services = services;
        registerDataTypeFormatters(dtfs);
    }

}


export function createCultureIdFallbacksForEn(): Array<CultureIdFallback> {
    return [
        {
            cultureId: 'en',
            fallbackCultureId: null
        },
        {
            cultureId: 'fr',
            fallbackCultureId: 'en'
        },
        {
            cultureId: 'fr-FR',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'en-US',
            fallbackCultureId: 'en'
        },
        {
            cultureId: 'en-GB',
            fallbackCultureId: 'en-US'
        },
    ];
}
export function createCultureIdFallbacksForFR(): Array<CultureIdFallback> {
    return [
        {
            cultureId: 'fr',
            fallbackCultureId: null
        },
        {
            cultureId: 'en',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'fr-FR',
            fallbackCultureId: 'fr'
        },
        {
            cultureId: 'en-US',
            fallbackCultureId: 'en'
        },

    ];
}