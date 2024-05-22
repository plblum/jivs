import { ICultureService } from "../../src/Interfaces/CultureService";
import { CultureIdFallback } from "../../src/Interfaces/DataTypeFormatterService";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { registerDataTypeIdentifiers, registerDataTypeFormatters } from "./createValidationServices";


export function populateServicesWithManyCultures(services: IValidationServices, activeCultureId: string, registerFormatters: boolean = false): void {
    services.cultureService.activeCultureId = activeCultureId;
    registerCultureIdFallbacksForEn(services.cultureService);

    let dtis = new DataTypeIdentifierService();
    services.dataTypeIdentifierService = dtis;

    registerDataTypeIdentifiers(dtis);   // always
    if (registerFormatters) {
        let dtfs = new DataTypeFormatterService();
        services.dataTypeFormatterService = dtfs;
        dtfs.services = services;
        registerDataTypeFormatters(dtfs);
    }

}


export function registerCultureIdFallbacksForEn(service: ICultureService): void {
    service.register(<CultureIdFallback>{
        cultureId: 'en',
        fallbackCultureId: null
    });
    service.register(<CultureIdFallback>{
        cultureId: 'fr',
        fallbackCultureId: 'en'
    });
    service.register(<CultureIdFallback>{
        cultureId: 'fr-FR',
        fallbackCultureId: 'fr'
    });
    service.register(<CultureIdFallback>{
        cultureId: 'en-US',
        fallbackCultureId: 'en'
    });
    service.register(<CultureIdFallback>{
        cultureId: 'en-GB',
        fallbackCultureId: 'en-US'
    });

}
export function registerCultureIdFallbacksForFR(service: ICultureService): void {
    service.register(<CultureIdFallback>{
        cultureId: 'fr',
        fallbackCultureId: null
    });
    service.register(<CultureIdFallback>{
        cultureId: 'en',
        fallbackCultureId: 'fr'
    });
    service.register(<CultureIdFallback>{
        cultureId: 'fr-FR',
        fallbackCultureId: 'fr'
    });
    service.register(<CultureIdFallback>{
        cultureId: 'en-US',
        fallbackCultureId: 'en'
    });
}