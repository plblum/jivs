import { ConditionType } from "@plblum/jivs-engine/src/Conditions/ConditionTypes";
import { UIPhase_Customize } from "../src/Config example";
import { ICalcValueHost } from "@plblum/jivs-engine/src/Interfaces/CalcValueHost";
import { IInputValueHost } from "@plblum/jivs-engine/src/Interfaces/InputValueHost";
import { INonInputValueHost } from "@plblum/jivs-engine/src/Interfaces/NonInputValueHost";
import { CalcValueHost } from "@plblum/jivs-engine/src/ValueHosts/CalcValueHost";
import { InputValueHost } from "@plblum/jivs-engine/src/ValueHosts/InputValueHost";
import { NonInputValueHost } from "@plblum/jivs-engine/src/ValueHosts/NonInputValueHost";
import { InputValidator } from "@plblum/jivs-engine/src/ValueHosts/InputValidator";
import { IValidationManager } from "@plblum/jivs-engine/src/Interfaces/ValidationManager";

function testVM(vm: IValidationManager): void
{
    expect(vm).not.toBeNull();
    let startDateVH: IInputValueHost | null = vm.getInputValueHost('StartDate');
    let endDateVH: IInputValueHost | null = vm.getInputValueHost('EndDate');
    let numOfDaysVH: INonInputValueHost | null = vm.getValueHost('NumOfDays');
    let diffDaysVH: ICalcValueHost | null = vm.getValueHost('DiffDays') as ICalcValueHost;

    expect(startDateVH).toBeInstanceOf(InputValueHost);
    expect(endDateVH).toBeInstanceOf(InputValueHost);
    expect(numOfDaysVH).toBeInstanceOf(NonInputValueHost);
    expect(diffDaysVH).toBeInstanceOf(CalcValueHost);

    let startLessThanEnd = startDateVH!.getValidator(ConditionType.LessThan);
    let dateDiffLessThanNumOfDays = startDateVH!.getValidator('NumOfDays');
    expect(startLessThanEnd).toBeInstanceOf(InputValidator);
    expect(startLessThanEnd?.errorCode).toBe(ConditionType.LessThan);
    expect(startLessThanEnd?.conditionType).toBe(ConditionType.LessThan);
    expect(dateDiffLessThanNumOfDays).toBeInstanceOf(InputValidator);
    expect(dateDiffLessThanNumOfDays?.errorCode).toBe('NumOfDays');
    expect(dateDiffLessThanNumOfDays?.conditionType).toBe(ConditionType.LessThan);
}
describe('Using Config objects', () => {

    test('Confirm expecting ValueHosts and InputValidators exist', () => {
        let vm = UIPhase_Customize('objects');
        testVM(vm);
    });
});
describe('Using Fluent Syntax', () => {

    test('Confirm expecting ValueHosts and InputValidators exist', () => {
        let vm = UIPhase_Customize('fluent');
        testVM(vm);
    });
});