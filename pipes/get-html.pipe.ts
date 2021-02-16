import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'getHtml', pure: false
})
export class GetHtmlPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {
  }

  transform(content:string): any {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}
