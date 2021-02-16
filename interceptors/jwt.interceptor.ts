import { Injectable, Inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpClient } from '@angular/common/http';
import { from, of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticationService } from 'app/_service/Authentication/authentication.service';
import { AppConfigService } from 'app/_service/app-config.service';
import { tap, mergeMap, catchError } from 'rxjs/operators';
import { User } from 'entities/user';
import { APP_CONFIG, AppConfig } from 'app/modules/config.module';
import { Localizer } from 'app/modules/localization.module';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private configService: AppConfigService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler) {

    // if(request.url.indexOf("ConvertOrgTree") >=0){
    //   var req = request.clone({ url: `${this.configService.config.InterFaceEndpoint}${request.url}` });
    //   return from(this.InterFacehandleApi(req, next));

    // }
     if (request.url.indexOf("api/") >= 0) {
      return from(this.handleApi(request, next));
    }

    else {
      return from(this.handleResource(request, next));
    }
  }

  async InterFacehandleApi(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).timeout(7200000).toPromise();
  }

  async handleResource(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).timeout(7200000).toPromise();
  }

  async handleApi(req: HttpRequest<any>, next: HttpHandler) {
    
    let user = this.authService.currentUserValue;
    const config = this.configService.config;
    const token = req.url.toLowerCase().indexOf(config.SagApiRoute.toLowerCase()) > 0 ?this.authService.getSagToken() :this.authService.getToken()
    const protocol = window.location.protocol;
    const apiEndpoint = protocol === 'https:' ? config.apiEndpointHttps : config.apiEndpointHttp;

    // verify token if route not Login
    if (req.url.indexOf("api/AdminApi/Login") < 0 && !this.authService.validateToken(token)) {
      this.authService.currentUserSubject.next(null);
      user = this.authService.currentUserValue;
    }

    if(req.url.toLowerCase().includes(config.SagApiRoute.toLowerCase()) ){
      req = req.clone({
        url: `${req.url}`,
        setHeaders: {   Authorization: `Bearer ${token}` ,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'}
      });
    }
    else {
      // request for user with token
      if (user && token) {
        req = req.clone({
          url: `${apiEndpoint}${req.url}`,
          setHeaders: { Authorization: `Bearer ${token}` }
        });
      }
      // request to api contains 'login'
      else if (user || req.url.indexOf("api/AdminApi/Login") >= 0) {
        req = req.clone({ url: `${apiEndpoint}${req.url}` });
      }
      // request navigate to form for annonous
      else if (req.url.indexOf("Login") < 0 && location.href.indexOf("/form/") > -1 && location.href.indexOf("?roleId=9") > -1) {
        this.router.navigate([location.pathname], { queryParams: { roleId: 9 } });
      }
      // any request
      else {
        this.router.navigate(['/Login'], { queryParams: {} });
      }
    }


    //req.headers.append('AcceptLanguage', Localizer.language);
    req = req.clone({headers: req.headers.set('Accept-Language', `${Localizer.culture},${Localizer.language};q=0.8`)});

    // pass relevant request
    return next.handle(req).timeout(7200000).toPromise()  // Important: Note the .toPromise()
  }
}
