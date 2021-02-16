import { Injectable, Renderer2, Injector, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Message } from 'primeng/api';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/delay';
import { AppConfig } from 'app/modules/config.module';
import { AppConfigService } from './app-config.service';
import { Localizer } from 'app/modules/localization.module';


enum HttpMethod {
  Get = "Get",
  Post = "Post",
  Delete = "Delete",
  Patch = "Patch",
  Put = "Put"
}

@Injectable()
export class BaseService {
  //static deps = [SampleService];
  static injector: Injector;
  static getRenderer: () => Renderer2;

  protected _defaultHttpHeaders = { headers: 
    new HttpHeaders({ 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE'
    }) 
  };

  private config: AppConfig;
  public http: HttpClient;
  public data: any;
  public treeData = new Subject();
  public MessagetreeData = new BehaviorSubject('tree');
  public timeout : 7200000;

  currentMessage = this.MessagetreeData.asObservable();

  constructor() {
    const appConfigService = BaseService.injector.get(AppConfigService); //@Inject(APP_CONFIG) private config: AppConfig
    this.config = appConfigService.config;
    this.http = BaseService.injector.get(HttpClient);
  }

  Post(url: string, _data: any) {
    try {
      this.data = this.http.post<any>(url, { _data }, this._defaultHttpHeaders).timeout(this.timeout)
        .toPromise()
        .then(res => {
          res = <any[]>res;
          return res;
        })
      return this.data;
    }
    catch (err) {
      console.log(err)
    }

  }

  PostAsBlob(url: string, _data: any) {
    try {
      this.data = this.http.post(url, _data, { responseType: 'blob' }).timeout(this.timeout).toPromise()
      return this.data;
    }
    catch (err) {

    }

  }

  Get(url: string) {
    this.data = this.http.get<any>(url).timeout(7200000)
      .toPromise()
      .then(res => {
        res = <any[]>res;
        return res;
      })

    return this.data;
  }

  async getAsync<TResult>(path: string) {
    return await this.http.get<TResult>(path).timeout(7200000).toPromise()
  }

  async getResultAsync<TResult>(path: string) {
    var cacheKey = this.getCacheKey<TResult>(path);

    if (this._cacheResults.has(cacheKey))
      return this.getResult(cacheKey)

    const results = await this.getAsync<TResult>(path);
    this.putResult(cacheKey, results);
    return results;
  }

  async postAsync<TResult>(path: string, data: any) {
    const results = await this.http.post<TResult>(path, data, this._defaultHttpHeaders).timeout(7200000).toPromise()
    return results;
  }

  async postAsync2Core<TResult>(path: string, _data: any) {
    const results = await this.http.post<TResult>(path, { _data }, this._defaultHttpHeaders).timeout(7200000).toPromise()
    return results;
  }

  // ***************** cache begin *******************
  private static _cacheResults: Map<string, any> = new Map<string, any>();
  private _cacheMaxEntries: number = 100;

  // cache
  public get _cacheResults(): Map<string, any> {
    return BaseService._cacheResults;
  }

  // get result to cache
  public getResult<TResult>(path: string): any {
    let entry: any;
    const key = this.getCacheKey<TResult>(path);
    if (this._cacheResults.has(key)) {
      // peek the entry, re-insert
      entry = this._cacheResults.get(key);
      this._cacheResults.delete(key);
      this._cacheResults.set(key, entry);
    }
    return entry;
  }

  // put result to cache
  public putResult<TResult>(path: string, value: any) {
    const key = this.getCacheKey<TResult>(path);
    if (this._cacheResults.size >= this._cacheMaxEntries) {
      // least-recently used cache eviction strategy
      const keyToDelete = this._cacheResults.keys().next().value;
      this._cacheResults.delete(keyToDelete);
    }
    this._cacheResults.set(key, value);
  }

  // clear result cache by path
  public cacheClear<TResult>(path: string): void {
    const cacheKey = this.getCacheKey<TResult>(path);

    if (cacheKey && this._cacheResults.has(cacheKey)) {
      this._cacheResults.delete(cacheKey);
    }
  }

  // clear result cache contains path
  public cacheClearContains<TResult>(partialPath: string): void {
    let keys = Array.from(this._cacheResults.keys());

    const cacheKeys = keys.filter(x =>
      (x.toLowerCase()).indexOf(partialPath.toLowerCase()) >= 0
    );

    if (cacheKeys && cacheKeys.length) {
      cacheKeys.map(key => {
        const cacheKey = this.getCacheKey<TResult>(key);
        this._cacheResults.delete(cacheKey);
      });
    }
  }

  // clear cache All
  public cacheClearAll(): void {
    this._cacheResults.clear();
  }

  public cacheKeyContains<TResult>(path: string) {
    var cacheKey = this.getCacheKey(path);
    return this._cacheResults.has(cacheKey);
  }

  private getCacheKey<TResult>(path: string): string {
    // const obj: TResult = <TResult>(Object.create({}));
    // const typeName = obj.constructor.name;
    var arr = new Array(path);
    return arr.join('_');
  }
  // ***************** cache end *******************

  // ************* notifications begin *************
  notifySuccess(key: any, message: string = undefined): Message {
    return this.createNotifyMessage(key, true, 'success', message);
  }
  notifyError(key: any, message: string = undefined): Message {
    return this.createNotifyMessage(key, false, 'error', message);
  }
  notifyInfo(key: any, message: string): Message {
    return this.createNotifyMessage(key, 'info', message);
  }
  createNotifyMessage(key: any, result: any): Message;
  createNotifyMessage(key: any, result: any, message: string): Message;
  createNotifyMessage(key: any, severity: string, message: string): Message;
  createNotifyMessage(key: any, result: any, severity: string, message: string): Message;
  createNotifyMessage(key: any, result: any | undefined = undefined, severity: string = undefined, message: string = undefined): Message {

    if (result !== undefined && result !== null && result && !severity) {
      severity = this.validateResult(result) ? 'success' : 'error';
    }

    if (severity === 'success' && !message) message = Localizer.get("ToastMessage.ActionSuccess");
    if (severity === 'error' && !message) message = Localizer.get("ToastMessage.ActionFailed");
    if (severity === 'info' && !message) message = Localizer.get("ToastMessage.PleaseWait");

    const _message = <Message>{ key: key, severity: severity, summary: '', detail: `${message}` };
    return _message;
    //this.messageService.add(_message);
  }
  // ************* notifications end *************

  // ************* helpers begin *************
  validateResult(result: any): boolean {
    const isValid = ((typeof result === "boolean" && result === true)
      || (result !== undefined && result !== null && result.length));
    return isValid;
  }

  toggleCssClass = (event: any, className: string) => {
    if (!event || !event.target) return;

    const hasClass = event.target.classList.contains(className);
    if (hasClass) {
      BaseService.getRenderer().removeClass(event.target, className);
    } else {
      BaseService.getRenderer().addClass(event.target, className);
    }
  }

  getRenderer = () => BaseService.getRenderer();

  // ************* helpers end ***************
}

