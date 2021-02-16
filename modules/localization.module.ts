import { NgModule, Pipe, PipeTransform, Injectable, Inject, LOCALE_ID, Injector } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  MissingTranslationHandlerParams, MissingTranslationHandler,
  TranslateLoader, TranslateService
} from '@ngx-translate/core';

import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { take } from 'rxjs/operators';
import { AppConfigService } from 'app/_service/app-config.service';

interface Localization {
  language: string;
  position: string;
  direction: string;
  locales: string[];
}

export function AppHttpLoaderFactory(http: HttpClient): TranslateLoader {
  return new TranslateHttpLoader(http, '/assets/locale/');
}

/** missing translate handler */
export class LocalizerMissingHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams) {
    console.warn(`WARN: '${params.key}' is missing in '${params.translateService.currentLang}' locale`);
    return "...";
  }
}

/** localizer(translator) manager class */
@Injectable({ providedIn: 'root' })
export class LocalizerManager {

  public get settings(): Localization {
    return this.getLocalizationSettings();
  }

  public get culture(): string {
    switch (this.language) {
      case 'he':
        return 'he-IL';
      case 'en':
      default:
        return 'en-US';
    }
  }

  private _languages: any = undefined;
  public get languages(): any {

    if (!this._languages) {
      this._languages = this.settings.locales.map(x => {
        return {
          id: x,
          title: this.translateService.translations[`Languages.${x}`],
        };
      });
    }

    return this._languages;
  }
  public get language(): string {
    return this.translateService.currentLang;
  }
  public get languageCssClass(): string {
    return ` page-locale-${this.language} `;
  }

  public get dateFormat(): string {
    return this.language === "en" ? "mm/dd/yy" : "dd/mm/yy";
  }

  public get direction(): string {
    return this.language === "en" ? "ltr" : "rtl";
  }

  public get position(): string {
    return this.language === "en" ? "left" : "right";
  }

  constructor(
    public translateService: TranslateService, 
    public appConfigService: AppConfigService) { }

  public init = async () => {
    this.translateService.use(this.settings.language);
    await this.translateService.get(this.settings.locales.map(x => `Languages.${x}`)).pipe(take(1)).toPromise();

    if (this.translateService.currentLang) {
      const translationCount = Object.keys(this.translateService.translations[this.translateService.currentLang]).length;
      const msg = `[Localizer] '${this.translateService.currentLang}' language translations ${translationCount > 0 ? '' : 'not '}loaded`;
      console.info(msg);
    }
  }

  public get = (categoryKey: string, ...args: any[]) => {

    let value: string = this.translateService.getParsedResult(
      this.translateService.translations[this.translateService.currentLang], categoryKey
    );

    if (args.length) {
      for (let index = 0; index < args.length; index++) {
        value = value.replace(`{${index}}`, args[index])
      }
    }

    return value;
  }

  convertDate(value: any): string {
    let result: string;
    try {
      const locale = 'en-US'; //Localizer.language == 'he' ? 'he-IL' : 
      const format = Localizer.language == 'he' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';

      var datePipe = new DatePipe(locale);
      let date: Date;

      if (value instanceof Date) {
        var options = { year: "numeric", month: "2-digit", day: "2-digit" };
        let dat: string;
        dat = value.toLocaleString(locale, options).split('/').join('');
        date = new Date(Date.UTC(
          Number(dat.slice(4, 8)), //year
          Number(dat.slice(0, 2)) - 1, //month [0..11]
          Number(dat.slice(2, 4)), //day
          0, 0, 0));
      }
      else if (value.toString().length == 14 || value.toString().length == 15) {
        date = new Date(Date.UTC(
          Number(value.slice(0, 4)), //year
          Number(value.slice(4, 6)) - 1, //month [0..11]
          Number(value.slice(6, 8)), //day
          0, 0, 0));
      }
      else if (value.toString().length == 16) {
        const dat = value.slice(6, 16).split('/').join('');
        date = new Date(Date.UTC(
          Number(dat.slice(0, 4)), //year
          Number(dat.slice(4, 6)) - 1, //month [0..11]
          Number(dat.slice(6, 8)), //day
          0, 0, 0));
      }
      else if (value.toString().length == 19 && value.indexOf('T') > 0) {
        date = new Date(value);
      }

      if (date) {
        result = datePipe.transform(date, format);
      } else {
        throw "[CustomDatePipe] unknown date format";
      }

    } catch (error) {
      console.log(`${error}: ${value}`);
    }
    return result;
  }

  /** get global localization */
  getLocalizationSettings(): Localization {
    let language = localStorage.getItem("language") 
      || this.appConfigService?.config?.defaultLocale || "en";

    if (language === '1') language = "he";
    if (language === '2') language = "en";

    return {
      language: language,
      position: language === "he" ? "right" : "left",
      direction: language === "he" ? "rtl" : "ltr",
      locales: environment.locales
    }
  }
}

/** localizer(translator) manager instance */
export let Localizer: LocalizerManager;

@Pipe({ name: 'date' })
export class DatePipeProxy implements PipeTransform {
  constructor(private _translateService: TranslateService) {
  }
  public transform(value: any, pattern: string = 'mediumDate'): any {
    let ngPipe = new DatePipe(this._translateService.currentLang);
    return ngPipe.transform(value, pattern);
  }
}

/** app localization module */
@NgModule({
  declarations: [DatePipeProxy],
  imports: [CommonModule],
  exports: [],
  providers: [
    { provide: MissingTranslationHandler, useClass: LocalizerMissingHandler },
    { provide: LOCALE_ID, useValue: window.navigator.language }
  ],
})
export class AppLocalizationModule {
  constructor(localizer: LocalizerManager) {
    Localizer = localizer;
  }
}
