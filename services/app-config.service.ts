import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { error } from '@angular/compiler/src/util';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { AppConfig } from 'app/modules/config.module';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private appConfig;
  private modelsConfig;
  private jsonFileName: string = `/assets/appsettings.json`; //`/assets/appsettings${environment.production ? '' : '.dev'}.json`;;

  constructor(private httpClient: HttpClient,private injector: Injector) { }

  async loadAppConfigAsync(): Promise<AppConfig> {
    try {
      const response = await fetch(this.jsonFileName);
      const response1 = await fetch('/assets/models3D.json');

      if (response.ok) {
        const config = await response.json();
        this.appConfig = config.AppSettings;
      } else {
        console.log(`Error response for url ${this.jsonFileName}: ${response.status}`);
        this.appConfig = {};
      }
      // if (response1.ok) {
      //   const config = await response.json();
      //   this.modelsConfig = config.data;
      // } else {
      //   console.log(`Error response for url ${this.jsonFileName}: ${response.status}`);
      //   this.modelsConfig = {};
      // }
    }
    catch (error) {
      console.log(`Error loading ${this.jsonFileName}`);
    }

    return <AppConfig>this.appConfig;
  }

  loadAppConfig() {
    let http = this.injector.get(HttpClient);
    return http.get(this.jsonFileName)
      .toPromise()
      .then(data => {
        this.appConfig = data;
      }).catch(error => {
        console.log("Error loading app-config.json");
      })
  }

  async LoadAppConfigModels3D():Promise<any>{
   await this.httpClient.get('/assets/models3D.json')
  .toPromise()
  .then(data => {
    this.modelsConfig = data;
  }).catch(error => {
    console.log("Error loading models3D.json");
  })
  return this.modelsConfig;
}

  get config() {
    return this.appConfig;
    // return this.configSubject.value;
  }
  models3DConfig() {
    return this.modelsConfig;    
  }
}
