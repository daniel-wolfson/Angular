import { Pipe, PipeTransform, Injectable } from '@angular/core';

@Pipe({name: 'trim'})
export class TrimPipe implements PipeTransform {
  transform(value: any) {
    if (!value) {
      return '';
    }
    return value.trim().replace(/ /g, '');;
  }
}