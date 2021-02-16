import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomDatePipe } from 'app/Pipes/custom-date.pipe';
import { TrimPipe } from 'app/Pipes/trim.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ 
    CustomDatePipe, TrimPipe
  ],
  exports: [
    CustomDatePipe, TrimPipe
  ]
})
export class AppPipeModule { }
