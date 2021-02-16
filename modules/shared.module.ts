 import { PermissionTypeDirective } from "app/Components/Permissions/permitted-element/permissionType.directive";
import { NgModule, Injectable } from "@angular/core";
import { UnitsTreeComponent } from "app/Components/units-tree/units-tree.component";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { AppMaterialModule } from "app/modules/material.module";
import { AppNgPrimeModule } from "app/modules/ngprime.module";
import { TranslateModule } from "@ngx-translate/core";
import { AppLocalizationModule, Localizer } from "app/modules/localization.module";
import { BehaviorSubject, Observable } from "rxjs";
import { Message } from "primeng/api";
import { TreeModule } from "primeng/tree";

export let Messager: MessageManager;

@NgModule({
    imports: [
        CommonModule, FormsModule, ReactiveFormsModule,
        AppMaterialModule, AppNgPrimeModule, 
        TranslateModule, AppLocalizationModule,TreeModule
    ],
    declarations: [UnitsTreeComponent, PermissionTypeDirective],
    exports: [
        UnitsTreeComponent, PermissionTypeDirective, TranslateModule, 
        AppLocalizationModule
    ]
})
export class AppSharedModule { 
    constructor(messager: MessageManager) {
        Messager = messager;
      }
}

/** localizer(translator) manager class */
@Injectable({ providedIn: 'root' })
export class MessageManager {
  messageData$: BehaviorSubject<Message>;
  public notifications: Observable<Message>;

  constructor() {
    this.messageData$ = new BehaviorSubject<Message>(null);
    this.notifications = this.messageData$.asObservable();
  }

  notifySuccess(key: any, message: string = undefined): void {
    const msg = this.createMessage(key, true, 'success', message);
    this.messageData$.next(msg);
  }
  notifyResult(key: any, result: any): void {
    const msg = this.createMessage(key, result);
    this.messageData$.next(msg);
    // this.ngZone.run(() => {
    //   this._messageService.add({
    //     severity: "success",
    //     summary: "Success Message",
    //     detail: "Order submitted"
    //   });
    // });
  }
  notifyError(key: any, message: string = undefined): void {
    const msg = this.createMessage(key, false, 'error', message);
    this.messageData$.next(msg);
  }
  notifyInfo(key: any, message: string): void {
    const msg = this.createMessage(key, 'info', message);
    this.messageData$.next(msg);
  }
  createMessage(key: any, result: any): Message;
  createMessage(key: any, result: any, message: string): Message;
  createMessage(key: any, severity: string, message: string): Message;
  createMessage(key: any, result: any, severity: string, message: string): Message;
  createMessage(key: any, result: any | undefined = undefined, severity: string = undefined, message: string = undefined): Message {

    if (result !== undefined && result !== null && result && !severity) {
      severity = this.validateResult(result) ? 'success' : 'error';
    }

    if (!message) {
      switch (severity) {
        case 'success':
          message = Localizer.get("ToastMessage.ActionSuccess");
          break;
        case 'error':
          message = Localizer.get("ToastMessage.ActionFailed");
          break;
        case 'info':
          message = Localizer.get("ToastMessage.PleaseWait");
          break;
      }
    }

    const _message = <Message>{ key: key, severity: severity, summary: '', detail: `${message}` };
    return _message;
  }

  validateResult(result: any): boolean {
    const isValid = ((typeof result === "boolean" && result === true)
      || (result !== undefined && result !== null && result.length));
    return isValid;
  }
}