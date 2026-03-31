import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { InventoryItem } from './models';

export function nameExistsValidator(names: InventoryItem[], currentName?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;

        // Return error if value is in the list (case-insensitive check)
        if (!currentName && value && names.map(n => n.name.toLowerCase()).includes(value.toLowerCase())) {
            return { nameExists: { actualValue: value } };
        }

        return null; // Valid
    };
}
