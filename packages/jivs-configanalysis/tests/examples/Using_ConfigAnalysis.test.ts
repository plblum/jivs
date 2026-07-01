import { UTCDateOnlyConverter } from '@plblum/jivs-engine/build/DataTypes/DataTypeConverters';
import { ShortDatePatternParser } from '@plblum/jivs-engine/build/DataTypes/DataTypeParsers';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { LessThanOrEqualConditionConfig, LessThanConditionConfig } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { LessThanOrEqualCondition, LessThanCondition, RequireTextCondition, RequireTextConditionConfig } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { LessThanOrEqualValueConditionConfig, LessThanOrEqualValueCondition } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { ModelRulesBase } from '@plblum/jivs-engine/build/Validation/ModelRules';
import { RulesConfigOptions } from '@plblum/jivs-engine/build/Interfaces/ModelRules';
import { IValidationManagerConfigBuilder } from '@plblum/jivs-engine/build/Interfaces/ManagerConfigBuilder';
import {
    DateRangeFormRules,
    example_hasErrors_report_to_log, example_throwOnErrors,
    example_throwOnErrors_And_Write_To_Console, example_throwOnErrors_And_Write_To_Log, reportToConsole
} from '../../examples/Using_ConfigAnalysis';
import { createMinimalValidationServices } from '../../examples/support';
import { JsonConsoleConfigAnalysisOutputter } from '../../src/Explorer/Outputters/ConfigAnalysisOutputterClasses';
import { installConfigAnalysisService } from '../../src/ConfigAnalysisService';
import { CAIssueSeverity, CAFeature } from '../../src/Types/Results';


/**
 * ValidationServices without anything registered,
 * so we can trigger configuration errors.
 * @returns 
 */
function createBasicServices(): IValidationServices {
    let services = createMinimalValidationServices('en');
    return services;
}
describe('Demonstrate the results from various use cases', () => {
    describe('With error-free configuration and services, generate a report to explore it', () => {
        test('Report with all valueHostConfig results', () => {
            let services = createBasicServices();    // start with no populated services.
            // Our prepareBuilder function expects these service configurations to be registered:
            services.conditionFactory.register<LessThanOrEqualConditionConfig>(
                ConditionType.LessThanOrEqual,
                (config) => new LessThanOrEqualCondition(config));
            services.conditionFactory.register<LessThanConditionConfig>(
                ConditionType.LessThan,
                (config) => new LessThanCondition(config));
            
            let rules = new DateRangeFormRules(services);
            let config = rules.configure();

            let configAnalysisService = installConfigAnalysisService(services);
            let explorer = configAnalysisService.analyze(config, {});

            expect(() => explorer.throwOnErrors()).not.toThrow();

            const includeValueHostResults = true;
            const includeLookupKeyResults = false;
            const includeCompleteResults = false;
            explorer.reportToConsole(
                includeValueHostResults,
                includeLookupKeyResults,
                includeCompleteResults, 2);
            /* -> THIS ONE IS LONG!
      {
        "valueHostQueryResults": [
          {
            "path": {
              "ValueHost": "StartDate"
            },
            "result": {
              "feature": "ValueHost",
              "valueHostName": "StartDate",
              "properties": [],
              "config": {
                "label": "Start date",
                "name": "StartDate",
                "valueHostType": "Field",
                "dataType": "Date",
                "validatorConfigs": [
                  {
                    "conditionConfig": {
                      "secondValueHostName": "EndDate",
                      "conditionType": "LessThan"
                    }
                  },
                  {
                    "errorCode": "NumOfDays",
                    "errorMessage": "Less than {compareTo} days apart",
                    "conditionConfig": {
                      "valueHostName": "DiffDays",
                      "secondValueHostName": "NumOfDays",
                      "conditionType": "LessThanOrEqual"
                    }
                  }
                ]
              },
              "validatorResults": [
                {
                  "feature": "Validator",
                  "errorCode": "LessThan",
                  "config": {
                    "conditionConfig": {
                      "secondValueHostName": "EndDate",
                      "conditionType": "LessThan"
                    }
                  },
                  "properties": [
                    {
                      "feature": "Property",
                      "propertyName": "errorCode",
                      "severity": "info",
                      "message": "Using the conditionType \"LessThan\""
                    }
                  ],
                  "conditionResult": {
                    "feature": "Condition",
                    "conditionType": "LessThan",
                    "config": {
                      "secondValueHostName": "EndDate",
                      "conditionType": "LessThan"
                    },
                    "properties": [],
                    "severity": "warning",
                    "message": "Comparison configuration: Cannot check the comparer used with Lookup Key Date in condition LessThan. Be sure to either supply one in DataTypeComparerService or setup the conversionLookupKey property to convert to a supported Lookup Key."
                  }
                },
                {
                  "feature": "Validator",
                  "errorCode": "NumOfDays",
                  "config": {
                    "errorCode": "NumOfDays",
                    "errorMessage": "Less than {compareTo} days apart",
                    "conditionConfig": {
                      "valueHostName": "DiffDays",
                      "secondValueHostName": "NumOfDays",
                      "conditionType": "LessThanOrEqual"
                    }
                  },
                  "properties": [],
                  "conditionResult": {
                    "feature": "Condition",
                    "conditionType": "LessThanOrEqual",
                    "config": {
                      "valueHostName": "DiffDays",
                      "secondValueHostName": "NumOfDays",
                      "conditionType": "LessThanOrEqual"
                    },
                    "properties": [],
                    "severity": "warning",
                    "message": "Comparison configuration: Cannot check the comparer used with Lookup Key Date in condition LessThan. Be sure to either supply one in DataTypeComparerService or setup the conversionLookupKey property to convert to a supported Lookup Key."
                  }
                }
              ]
            }
          },
          {
            "path": {
              "ValueHost": "StartDate",
              "Validator": "LessThan"
            },
            "result": {
              "feature": "Validator",
              "errorCode": "LessThan",
              "config": {
                "conditionConfig": {
                  "secondValueHostName": "EndDate",
                  "conditionType": "LessThan"
                }
              },
              "properties": [
                {
                  "feature": "Property",
                  "propertyName": "errorCode",
                  "severity": "info",
                  "message": "Using the conditionType \"LessThan\""
                }
              ],
              "conditionResult": {
                "feature": "Condition",
                "conditionType": "LessThan",
                "config": {
                  "secondValueHostName": "EndDate",
                  "conditionType": "LessThan"
                },
                "properties": [],
                "severity": "warning",
                "message": "Comparison configuration: Cannot check the comparer used with Lookup Key Date in condition LessThan. Be sure to either supply one in DataTypeComparerService or setup the conversionLookupKey property to convert to a supported Lookup Key."
              }
            }
          },
          {
            "path": {
              "ValueHost": "StartDate",
              "Validator": "LessThan",
              "Property": "errorCode"
            },
            "result": {
              "feature": "Property",
              "propertyName": "errorCode",
              "severity": "info",
              "message": "Using the conditionType \"LessThan\""
            }
          },
          {
            "path": {
              "ValueHost": "StartDate",
              "Validator": "LessThan",
              "Condition": "LessThan"
            },
            "result": {
              "feature": "Condition",
              "conditionType": "LessThan",
              "config": {
                "secondValueHostName": "EndDate",
                "conditionType": "LessThan"
              },
              "properties": [],
              "severity": "warning",
              "message": "Comparison configuration: Cannot check the comparer used with Lookup Key Date in condition LessThan. Be sure to either supply one in DataTypeComparerService or setup the conversionLookupKey property to convert to a supported Lookup Key."
            }
          },
          {
            "path": {
              "ValueHost": "StartDate",
              "Validator": "NumOfDays"
            },
            "result": {
              "feature": "Validator",
              "errorCode": "NumOfDays",
              "config": {
                "errorCode": "NumOfDays",
                "errorMessage": "Less than {compareTo} days apart",
                "conditionConfig": {
                  "valueHostName": "DiffDays",
                  "secondValueHostName": "NumOfDays",
                  "conditionType": "LessThanOrEqual"
                }
              },
              "properties": [],
              "conditionResult": {
                "feature": "Condition",
                "conditionType": "LessThanOrEqual",
                "config": {
                  "valueHostName": "DiffDays",
                  "secondValueHostName": "NumOfDays",
                  "conditionType": "LessThanOrEqual"
                },
                "properties": [],
                "severity": "warning",
                "message": "Comparison configuration: Cannot check the comparer used with Lookup Key Date in condition LessThan. Be sure to either supply one in DataTypeComparerService or setup the conversionLookupKey property to convert to a supported Lookup Key."
              }
            }
          },
          {
            "path": {
              "ValueHost": "StartDate",
              "Validator": "NumOfDays",
              "Condition": "LessThanOrEqual"
            },
            "result": {
              "feature": "Condition",
              "conditionType": "LessThanOrEqual",
              "config": {
                "valueHostName": "DiffDays",
                "secondValueHostName": "NumOfDays",
                "conditionType": "LessThanOrEqual"
              },
              "properties": [],
              "severity": "warning",
              "message": "Comparison configuration: Cannot check the comparer used with Lookup Key Date in condition LessThan. Be sure to either supply one in DataTypeComparerService or setup the conversionLookupKey property to convert to a supported Lookup Key."
            }
          },
          {
            "path": {
              "ValueHost": "EndDate"
            },
            "result": {
              "feature": "ValueHost",
              "valueHostName": "EndDate",
              "properties": [],
              "config": {
                "label": "End date",
                "name": "EndDate",
                "valueHostType": "Field",
                "dataType": "Date",
                "validatorConfigs": []
              },
              "validatorResults": []
            }
          },
          {
            "path": {
              "ValueHost": "NumOfDays"
            },
            "result": {
              "feature": "ValueHost",
              "valueHostName": "NumOfDays",
              "properties": [],
              "config": {
                "initialValue": 10,
                "name": "NumOfDays",
                "valueHostType": "Static",
                "dataType": "Integer"
              }
            }
          },
          {
            "path": {
              "ValueHost": "DiffDays"
            },
            "result": {
              "feature": "ValueHost",
              "valueHostName": "DiffDays",
              "properties": [],
              "config": {
                "valueHostType": "Calc",
                "name": "DiffDays",
                "calcFn": "[Function differenceBetweenDates]",
                "dataType": "Integer"
              }
            }
          }
        ]
      }
            */
        });

        class JustADateModelRules extends ModelRulesBase {
            constructor(services: IValidationServices) {
                super(services);
            }
            protected override configureRules(builder: IValidationManagerConfigBuilder, options?: RulesConfigOptions | undefined): void {
                builder.field('BirthDate', LookupKey.Date, {
                    parserLookupKey: LookupKey.Date
                }).lessThanOrEqualValue(new Date(), {
                    conversionLookupKey: LookupKey.Number   // from LookupKey.Date to LookupKey.Number
                });
            }
        }
        test('Report with all Lookup Key results', () => {
            // We're using a different ModelRules subclass, JustADateModelRules.
            // It has a single valueHost of data Type Date,
            // with a LessThanOrEqualValue condition. It uses a parser.
            // There should be one Lookup Key, "Date", with an identifier, converter, comparer, and parser.

            // Setup Services 
            let services = createBasicServices();    // start with no populated services.

            services.conditionFactory.register<LessThanOrEqualValueConditionConfig>(
                ConditionType.LessThanOrEqualValue,
                (config) => new LessThanOrEqualValueCondition(config));
            services.dataTypeConverterService.register(new UTCDateOnlyConverter());
            // no comparer supplied because with UTCDateOnlyConverter, the defaultComparer is used.
            services.dataTypeParserService.register(
                new ShortDatePatternParser(LookupKey.Date, ['en'], {
                    order: 'mdy',
                    shortDateSeparator: '/',
                    twoDigitYearBreak: 29
                }));
            // Create the configuration
            let rules = new JustADateModelRules(services);
            let config = rules.configure();

            // Analyze the configuration
            let configAnalysisService = installConfigAnalysisService(services);
            let explorer = configAnalysisService.analyze(config, {});

            expect(() => explorer.throwOnErrors()).not.toThrow();

            const includeValueHostResults = false;
            const includeLookupKeyResults = true;
            const includeCompleteResults = false;
            explorer.reportToConsole(
                includeValueHostResults,
                includeLookupKeyResults,
                includeCompleteResults, 2);

            /* Console output:
            {
                "lookupKeyQueryResults": [
                  {
                    "path": {
                      "LookupKey": "Date"
                    },
                    "result": {
                      "feature": "LookupKey",
                      "lookupKey": "Date",
                      "usedAsDataType": true,
                      "serviceResults": [
                        {
                          "feature": "Parser",
                          "results": [
                            {
                              "feature": "ParsersByCulture",
                              "cultureId": "en",
                              "parserResults": [
                                {
                                  "classFound": "ShortDatePatternParser",
                                  "feature": "ParserFound"
                                }
                              ]
                            }
                          ],
                          "tryFallback": false
                        },
                        {
                          "feature": "Identifier",
                          "classFound": "DateDataTypeIdentifier"
                        }
                      ]
                    }
                  },
                  {
                    "path": {
                      "LookupKey": "Date",
                      "Parser": null
                    },
                    "result": {
                      "feature": "Parser",
                      "results": [
                        {
                          "feature": "ParsersByCulture",
                          "cultureId": "en",
                          "parserResults": [
                            {
                              "classFound": "ShortDatePatternParser",
                              "feature": "ParserFound"
                            }
                          ]
                        }
                      ],
                      "tryFallback": false
                    }
                  },
                  {
                    "path": {
                      "LookupKey": "Date",
                      "Parser": null,
                      "ParsersByCulture": "en"
                    },
                    "result": {
                      "feature": "ParsersByCulture",
                      "cultureId": "en",
                      "parserResults": [
                        {
                          "classFound": "ShortDatePatternParser",
                          "feature": "ParserFound"
                        }
                      ]
                    }
                  },
                  {
                    "path": {
                      "LookupKey": "Date",
                      "Parser": null,
                      "ParsersByCulture": "en",
                      "ParserFound": "ShortDatePatternParser"
                    },
                    "result": {
                      "classFound": "ShortDatePatternParser",
                      "feature": "ParserFound"
                    }
                  },
                  {
                    "path": {
                      "LookupKey": "Date",
                      "Identifier": null
                    },
                    "result": {
                      "feature": "Identifier",
                      "classFound": "DateDataTypeIdentifier"
                    }
                  },
                  {
                    "path": {
                      "LookupKey": "Number"
                    },
                    "result": {
                      "feature": "LookupKey",
                      "lookupKey": "Number",
                      "usedAsDataType": true,
                      "serviceResults": [
                        {
                          "feature": "Converter",
                          "dataExamples": [
                            "2000-02-15T05:00:00.000Z"
                          ],
                          "classFound": "UTCDateOnlyConverter"
                        },
                        {
                          "feature": "Comparer",
                          "classFound": "defaultComparer",
                          "dataExamples": [
                            1
                          ]
                        },
                        {
                          "feature": "Identifier",
                          "classFound": "NumberDataTypeIdentifier"
                        }
                      ]
                    }
                  },
                  {
                    "path": {
                      "LookupKey": "Number",
                      "Converter": null
                    },
                    "result": {
                      "feature": "Converter",
                      "dataExamples": [
                        "2000-02-15T05:00:00.000Z"
                      ],
                      "classFound": "UTCDateOnlyConverter"
                    }
                  },
                  {
                    "path": {
                      "LookupKey": "Number",
                      "Comparer": null
                    },
                    "result": {
                      "feature": "Comparer",
                      "classFound": "defaultComparer",
                      "dataExamples": [
                        1
                      ]
                    }
                  },
                  {
                    "path": {
                      "LookupKey": "Number",
                      "Identifier": null
                    },
                    "result": {
                      "feature": "Identifier",
                      "classFound": "NumberDataTypeIdentifier"
                    }
                  }
                ]
              }      
            */
        });

        class WarningsAndInfoModelRules extends ModelRulesBase {
            constructor(services: IValidationServices) {
                super(services);
            }
            protected override configureRules(builder: IValidationManagerConfigBuilder, options?: RulesConfigOptions | undefined): void {
                // this lacks a data type, which results in a warning.
                builder.field('StartDate', null)
            }
        }
        test('Report with any warnings and info messages', () => {
            // Using WarningsAndInfoModelRules

            // Setup Services
            let services = createBasicServices();    // start with no populated services.

            // Create the configuration
            let rules = new WarningsAndInfoModelRules(services);
            let config = rules.configure();

            // Analyze the configuration
            let configAnalysisService = installConfigAnalysisService(services);
            let explorer = configAnalysisService.analyze(config, {});
            expect(() => explorer.throwOnErrors()).not.toThrow();

            const includeValueHostResults = { severities: [CAIssueSeverity.warning, CAIssueSeverity.info] };
            const includeLookupKeyResults = { severities: [CAIssueSeverity.warning, CAIssueSeverity.info] };
            const includeCompleteResults = false;
            explorer.reportToConsole(
                includeValueHostResults,
                includeLookupKeyResults,
                includeCompleteResults, 2);
            /* Console output:
      {
        "valueHostQueryResults": [
          {
            "path": {
              "ValueHost": "StartDate",
              "Property": "dataType"
            },
            "result": {
              "feature": "Property",
              "propertyName": "dataType",
              "severity": "info",
              "message": "No dataType assigned. LookupKeys that depend on dataType will not be checked. Otherwise this is a valid configuration, where the actual runtime value will be used to determine the lookup key."
            }
          }
        ],
        "lookupKeyQueryResults": []
      }
            */
        });
    });

    test('throwOnErrors finds an error in ValueHostConfigs', () => {
        // We're using DateRangeFormRules.
        // It requires support around LookupKey.Date and ConditionType.LessThanOrEqualValue. 
        // We will not register those services, so the configuration will have errors.

        // setup Services
        let services = createBasicServices();    // start with no populated services. That should create errors
        // Create the configuration
        let rules = new DateRangeFormRules(services);
        let config = rules.configure();

        // Analyze the configuration
        let configAnalysisService = installConfigAnalysisService(services);
        let explorer = configAnalysisService.analyze(config, {});
        expect(() => explorer.throwOnErrors()).toThrow();

    });

    test('throwOnErrors and write to console finds an error in ValueHostConfigs', () => {
        // Using DateRangeFormRules.
        // It requires support around LookupKey.Date and ConditionType.LessThanOrEqualValue. 
        // We will not register those services, so the configuration will have errors.
        // setup Services
        let services = createBasicServices();    // start with no populated services. That should create errors

        // Create the configuration
        let rules = new DateRangeFormRules(services);
        let config = rules.configure();

        // Analyze the configuration
        let configAnalysisService = installConfigAnalysisService(services);
        let explorer = configAnalysisService.analyze(config, {});

        expect(() => explorer.throwOnErrors(false,
            new JsonConsoleConfigAnalysisOutputter())).toThrow();
        /* Console output:        
      {
          "valueHostQueryResults": [
              {
                  "path": {
                      "ValueHost": "StartDate",
                      "Validator": "LessThan",
                      "Condition": "LessThan"
                  },
                  "result": {
                      "feature": "Condition",
                      "conditionType": "LessThan",
                      "config": {
                          "secondValueHostName": "EndDate",
                          "conditionType": "LessThan"
                      },
                      "properties": [],
                      "severity": "error",
                      "message": "ConditionType not registered: LessThan"
                  }
              },
              {
                  "path": {
                      "ValueHost": "StartDate",
                      "Validator": "NumOfDays",
                      "Condition": "LessThanOrEqual"
                  },
                  "result": {
                      "feature": "Condition",
                      "conditionType": "LessThanOrEqual",
                      "config": {
                          "valueHostName": "DiffDays",
                          "secondValueHostName": "NumOfDays",
                          "conditionType": "LessThanOrEqual"
                      },
                      "properties": [],
                      "severity": "error",
                      "message": "ConditionType not registered: LessThanOrEqual"
                  }
              }
          ],
          "lookupKeyQueryResults": []
      }
        */
    });

    class LackParserModelRules extends ModelRulesBase {
        constructor(services: IValidationServices) {
            super(services);
        }
        protected override configureRules(builder: IValidationManagerConfigBuilder, options?: RulesConfigOptions | undefined): void {
            builder.field('NewField', LookupKey.Date,
                {
                    parserLookupKey: LookupKey.Date,    // wants a parser, which should be ShortDatePatternParser 
                }
            )
        }
    }
    test('Services lack a needed parser, report as an error', () => {
        // Uses LackParserModelRules

        // Setup Services
        let services = createBasicServices();    // start with no populated services. That should create errors

        // we need these conditions
        services.conditionFactory.register<LessThanOrEqualConditionConfig>(
            ConditionType.LessThanOrEqual,
            (config) => new LessThanOrEqualCondition(config));
        services.conditionFactory.register<LessThanConditionConfig>(
            ConditionType.LessThan,
            (config) => new LessThanCondition(config));
        
        // LackParserModelRules expects a parser for the ShortDatePatternParser, which is not registered.
        // This is what it might look like:
        // services.dataTypeParserService.register(new ShortDatePatternParser(LookupKey.Date, ['en-US'], {
        //     order: 'mdy',
        //     shortDateSeparator: '/',
        //     twoDigitYearBreak: 29
        // }));

        // Create the configuration
        let rules = new LackParserModelRules(services);
        let config = rules.configure();

        // Analyze the configuration
        let configAnalysisService = installConfigAnalysisService(services);
        let explorer = configAnalysisService.analyze(config, {});

        // explorer.reportToConsole({ severities: [CAIssueSeverity.error] }, 
        //     { severities: [CAIssueSeverity.error]}, false, 2);

        expect(() => explorer.throwOnErrors(false,
            new JsonConsoleConfigAnalysisOutputter())).toThrow();
        /* Console output: 
        {
        "valueHostQueryResults": [
            {
              "path": {
                "ValueHost": "NewField",
                "Property": "parserLookupKey"
              },
              "result": {
                "feature": "Property",
                "propertyName": "parserLookupKey",
                "severity": "error",
                "message": "Not found. Please register a DataTypeParser to dataTypeParserService."
              }
            }
          ],
          "lookupKeyQueryResults": [
            {
              "path": {
                "LookupKey": "Date",
                "Parser": null,
                "ParsersByCulture": "en"
              },
              "result": {
                "feature": "ParsersByCulture",
                "cultureId": "en",
                "parserResults": [],
                "notFound": true,
                "severity": "error",
                "message": "No DataTypeParser for LookupKey \"Date\" with culture \"en\""
              }
            }
          ]
        }
        */
    });

    class CaseInsensitiveLookupKeyModelRules extends ModelRulesBase {
        constructor(services: IValidationServices) {
            super(services);
        }
        protected override configureRules(builder: IValidationManagerConfigBuilder, options?: RulesConfigOptions | undefined): void {
            builder.static('Field1', 'date');// should be 'Date' or LookupKey.Date
        }
    }

    test('Lookup Key has a case insensitive match is an error on the property', () => {
        // uses CaseInsensitiveLookupKeyModelRules, which has a field with a dataType of 'date' (lowercase)

        // Setup Services
        let services = createBasicServices(); //   start with no populated services. That should create errors

        // Create the configuration
        let rules = new CaseInsensitiveLookupKeyModelRules(services);
        let config = rules.configure();

        // Analyze the configuration
        let configAnalysisService = installConfigAnalysisService(services);
        let explorer = configAnalysisService.analyze(config, {});

        expect(() => explorer.throwOnErrors(false,
            new JsonConsoleConfigAnalysisOutputter())).toThrow();
        /* Console output:
        {
            "valueHostQueryResults": [
                {
                    "path": {
                        "ValueHost": "Field1",
                        "Property": "dataType"
                    },
                    "result": {
                        "feature": "Property",
                        "propertyName": "dataType",
                        "severity": "error",
                        "message": "Value is not an exact match to the expected value of \"Date\". Fix it."
                    }
                }
            ],
            "lookupKeyQueryResults": []
        }
        */
    });
    // Using TextLocalizerService for a validator error message has no error when correctly setup
    // The report shows the validatorConfig.errorMessagel10n property and its
    // available text for each culture.
    // We'll support 'en' and 'es' for this test.
    class DateOnlyForTextLocalizerModelRules extends ModelRulesBase {
        constructor(services: IValidationServices) {
            super(services);
        }
        protected override configureRules(builder: IValidationManagerConfigBuilder, options?: RulesConfigOptions | undefined): void {
            builder.field('Field1', 'Date').requireText(null, null, { errorMessagel10n: 'RequiredEM' });
        }
    }
    test('TextLocalizerService is used for a validator error message', () => {
        // uses DateOnlyForTextLocalizerModelRules

        // Setup Services
        let services = createBasicServices();    // start with no populated services. That should create errors
        services.cultureService.register({ cultureId: 'en' });
        services.cultureService.register({ cultureId: 'es' });
        // this condition is used for the validator that has the error message we are testing
        services.conditionFactory.register<RequireTextConditionConfig>(
            ConditionType.RequireText,
            (config) => new RequireTextCondition(config));

        services.textLocalizerService.register('RequiredEM',
            {
                en: 'This field is required.',
                es: 'Este campo es obligatorio.'
            });

        // Create the configuration
        let rules = new DateOnlyForTextLocalizerModelRules(services);
        let config = rules.configure();

        // Analyze the configuration
        let configAnalysisService = installConfigAnalysisService(services);
        let explorer = configAnalysisService.analyze(config, {});

        expect(() => explorer.throwOnErrors(false)).not.toThrow();

        explorer.reportToConsole({ features: [CAFeature.l10nProperty] }, false, false, 2);
        /* ->
        {
            "valueHostQueryResults": [
              {
                "path": {
                  "ValueHost": "Field1",
                  "Validator": "RequireText",
                  "l10nProperty": "errorMessagel10n"
                },
                "result": {
                  "feature": "l10nProperty",
                  "propertyName": "errorMessage",
                  "l10nPropertyName": "errorMessagel10n",
                  "l10nKey": "RequiredEM",
                  "cultureText": {
                    "en": {
                      "text": "This field is required.",
                      "severity": "info"
                    },
                    "es": {
                      "text": "Este campo es obligatorio.",
                      "severity": "info"
                    }
                  }
                }
              }
            ]
          }
        */
    });

    // Now we'll see an localization error when the text is not found in the TextLocalizerService
    // We want text for both 'en' and 'es' but only have 'en' registered.    
    test('TextLocalizerService is used for a validator error message, but missing a culture', () => {
        // Uses DateOnlyForTextLocalizerModelRules

        // Setup Services
        let services = createBasicServices();    // start with no populated services. That should create errors
        services.cultureService.register({ cultureId: 'en' });
        services.cultureService.register({ cultureId: 'es' });
        // this condition is used for the validator that has the error message we are testing
        services.conditionFactory.register<RequireTextConditionConfig>(
            ConditionType.RequireText,
            (config) => new RequireTextCondition(config));

        services.textLocalizerService.register('RequiredEM',
            {
                en: 'This field is required.',
            });

        // Create the configuration
        let rules = new DateOnlyForTextLocalizerModelRules(services);
        let config = rules.configure();

        // Analyze the configuration
        let configAnalysisService = installConfigAnalysisService(services);
        let explorer = configAnalysisService.analyze(config, {});

        // this will throw an error because 'es' is not registered in the TextLocalizerService
        // explorer.reportToConsole({ features: [CAFeature.l10nProperty] }, false, false, 2);
        expect(() => explorer.throwOnErrors(false, new JsonConsoleConfigAnalysisOutputter())).toThrow();

        /* ->
        {
            "valueHostQueryResults": [
                {
                    "path": {
                        "ValueHost": "Field1",
                        "Validator": "RequireText",
                        "l10nProperty": "errorMessagel10n"
                    },
                    "result": {
                        "feature": "l10nProperty",
                        "propertyName": "errorMessage",
                        "l10nPropertyName": "errorMessagel10n",
                        "l10nKey": "RequiredEM",
                        "cultureText": {
                            "en": {
                                "text": "This field is required.",
                                "severity": "info"
                            },
                            "es": {
                                "message": "errorMessage localization not declared in TextLocalizerService for culture \"es\". No text will be used because the errorMessage property is unassigned.",
                                "severity": "error"
                            }
                        }
                    }
                }
            ],
            "lookupKeyQueryResults": []
        }  
        */
    });
});


describe('These tests demonstrate that the functions in the src folder compile and execute', () => {
    test('example_throwOnErrors', () => {
        // sample data has no errors...
        expect(() => example_throwOnErrors()).not.toThrow();
    });
    test('example_throwOnErrors_And_Write_To_Console', () => {
        // sample data has no errors...
        expect(() => example_throwOnErrors_And_Write_To_Console()).not.toThrow();
    });
    test('example_throwOnErrors_And_Write_To_Log', () => {
        // sample data has no errors...
        expect(() => example_throwOnErrors_And_Write_To_Log()).not.toThrow();
    });
    test('reportToConsole', () => {
        // sample data has nothing to report...
        expect(() => reportToConsole()).not.toThrow();
        // but notice the console has this:
        // > { valueHostQueryResults: [], lookupKeyQueryResults: [] }
    });
    test('example_hasErrors_report_to_log', () => {
        // sample data has no errors...
        expect(() => example_hasErrors_report_to_log()).not.toThrow();
    });
});