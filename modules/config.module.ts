import { NgModule, InjectionToken, ModuleWithProviders, APP_INITIALIZER, Injector } from '@angular/core';
import { environment } from 'environments/environment';
import { CommonModule } from '@angular/common';
import { AppConfigService } from 'app/_service/app-config.service';

export let APP_CONFIG = new InjectionToken<AppConfig>('app.config');
export let APP_DI_CONFIG: AppConfig = <AppConfig>{
  locale: environment.defaultLocale,
  baseUrl: document.getElementsByTagName('base')[0].href
};

const loadAppConfigFn = (appConfigService: AppConfigService) => {
  return async () => {
    const appConfig = await appConfigService.loadAppConfigAsync();
    return appConfig;
  }
};
export class AppConfig {
  baseUrl: string;
  locale: string;
  apiEndpointHttp: string;
  apiEndpointHttps: string;
  InterFaceEndpoint: string;
  SagApi: string;
  apiTimeout: number;
  defaultLocale: string;
  CRPMVersion: string
}

@NgModule({
  providers: [
        { provide: APP_CONFIG, useValue: APP_DI_CONFIG },
  ],
  imports: [CommonModule]
})
export class AppConfigModule {
  static forRoot(config?: any): ModuleWithProviders {
    return {
      ngModule: AppConfigModule,
      providers: [
        { provide: APP_INITIALIZER, useFactory: loadAppConfigFn, deps: [AppConfigService], multi: true },
      ]
    }
  }
}
