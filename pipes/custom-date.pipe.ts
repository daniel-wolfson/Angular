import { Pipe, PipeTransform, Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Localizer } from 'app/modules/localization.module';


@Pipe({ name: 'customDate' })
@Injectable({
    providedIn: 'root',
})
export class CustomDatePipe implements PipeTransform {
    transform(value: any): string {
        return Localizer.convertDate(value);
    }
}