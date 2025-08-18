import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export function fileTypeValidators(allowedTypes: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value as File;
    if (!file || !(file instanceof File)) { return null; }
    if (allowedTypes.includes(file.type)) { return null; }
    return { invalidFileType: true };
  };
}
